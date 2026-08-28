// Phase 6b — the last nested `videoRef` becomes a bare id.
//
//   npx tsx scripts/migrate-testimonial-video-6b.ts
//   npx sanity dataset import scratch/testimonial-video-6b.ndjson --dataset production --replace
//   npx tsx scripts/migrate-testimonial-video-6b.ts --verify   # BEFORE swapping the projections
//
// The hero, the firm intro and both FAQ accordions were flattened in 6a;
// testimonials were out of that sweep's scope and are the last one. Same
// reasoning: the object carries `{provider, id}` and hides the provider, so the
// Studio drew an accordion around a single input. The projection reassembles
// the pair, so `lib/video.ts` still sees `{provider, id}` and the rule that
// nothing may store a video URL is untouched.
//
// ONLY SIX OF THE EIGHTEEN CARRY A FILM. `video` is conditional on
// `format == "video"`, so twelve records have no object to flatten and must be
// left exactly as they are — a `videoId: null` written onto a written review is
// a field the schema says should not be there.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/testimonial-video-6b.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

async function query<T>(groq: string): Promise<T> {
  const url =
    `https://${env("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v${API_VERSION}/data/query/` +
    `${env("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity returned ${res.status} for: ${groq}`);
  return (await res.json()).result as T;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const verify = process.argv.includes("--verify");
  const docs = await query<Json[]>(`*[_type == "testimonial"] | order(_id)`);
  assert(docs.length > 0, "no testimonial documents came back.");

  const filmed = docs.filter((d) => d.format === "video");
  assert(filmed.length > 0, "no filmed testimonials — has `format` changed?");

  if (verify) {
    for (const doc of filmed) {
      assert(!("video" in doc), `${doc._id as string}: video is still nested.`);
      assert(typeof doc.videoId === "string", `${doc._id as string}: no videoId.`);
    }
    const written = docs.filter((d) => d.format !== "video");
    for (const doc of written) {
      assert(!("videoId" in doc), `${doc._id as string}: a written review gained a videoId.`);
    }
    console.log(`  ✓ ${filmed.length} filmed testimonials carry a bare videoId`);
    console.log(`  ✓ ${written.length} written testimonials were left alone`);
    console.log("\n6b: the dataset matches the new shape.");
    return;
  }

  const out: Json[] = [];
  for (const doc of filmed) {
    const { _rev, _createdAt, _updatedAt, video, ...rest } = doc;
    assert(!!video && typeof video === "object", `${doc._id as string}: no video to flatten.`);
    const { provider, id } = video as { provider?: string; id?: string };
    assert(provider === "wistia", `${doc._id as string}: provider is "${provider}".`);
    assert(typeof id === "string" && id.length > 0, `${doc._id as string}: no video id.`);
    out.push({ ...rest, videoId: id });
  }

  /*
   * ONLY THE FILMED SIX ARE EMITTED. `--replace` replaces a document whole, so
   * writing the written twelve would be twelve no-op rewrites — and any bug in
   * this script would then touch every record rather than the six it means to.
   */
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out.map((d) => JSON.stringify(d)).join("\n") + "\n");
  console.log(`  ${out.length} filmed testimonials flattened (of ${docs.length} total)`);
  console.log(`  ${docs.length - out.length} written reviews untouched and not in the payload`);
  console.log(`\n→ ${OUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
