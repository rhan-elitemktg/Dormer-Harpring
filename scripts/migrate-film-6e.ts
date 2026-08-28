// Phase 6e — the last nested `videoRef` becomes a bare id.
//
//   npx tsx scripts/migrate-film-6e.ts
//   npx sanity dataset import scratch/film-6e.ndjson --dataset production --replace
//   npx tsx scripts/migrate-film-6e.ts --verify   # BEFORE swapping the projection
//
// TWO PANELS ON ONE DOCUMENT, and they are the last of them. The hero, the firm
// intro and both FAQ accordions went in 6a; the six filmed testimonials in 6b.
//
// IT SURVIVED BOTH SWEEPS BECAUSE IT IS CALLED `film`. Every other one was
// `video`, and this sits inside a `videoPanel` object rather than at the top
// level of a document, so neither a field-name sweep nor a read of this page's
// eighteen sections surfaced it — and HANDOFF carried a claim that none was
// left. `git grep videoRef` finds it in one line; the sweep that produced that
// claim was not that.
//
// Same shape as its predecessors: the object carries `{provider, id}` and hides
// the provider, so the Studio drew an accordion around a single input. The
// projection reassembles the pair, so `lib/video.ts` still sees `{provider,
// id}` and the rule that nothing may store a video URL is untouched.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/film-6e.ndjson");
const API_VERSION = "2026-08-01";

/** The two sections whose `video` panel carries a film. */
const PANELS = ["triage", "criteria"] as const;

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
  const docs = await query<Json[]>(`*[_type == "featuredPracticeArea"] | order(_id)`);
  assert(docs.length > 0, "no featured practice areas came back.");

  if (verify) {
    for (const doc of docs) {
      for (const section of PANELS) {
        const panel = (doc[section] as Json | undefined)?.video as Json | undefined;
        assert(!!panel, `${doc._id as string}: ${section}.video is missing.`);
        assert(!("film" in panel), `${doc._id as string}: ${section}.video.film is still nested.`);
        assert(
          typeof panel.videoId === "string" && panel.videoId.length > 0,
          `${doc._id as string}: ${section}.video has no videoId.`
        );
      }
    }
    console.log(`  ✓ ${docs.length} document(s), ${PANELS.length} panel(s) each — bare videoId`);
    console.log("\n6e: the dataset matches the new shape. No nested videoRef is left anywhere.");
    return;
  }

  const out: Json[] = [];
  for (const doc of docs) {
    const { _rev, _createdAt, _updatedAt, ...next } = doc;
    let moved = 0;
    for (const section of PANELS) {
      const band = next[section] as Json | undefined;
      assert(!!band, `${doc._id as string}: no "${section}" section.`);
      const panel = band.video as Json | undefined;
      assert(!!panel, `${doc._id as string}: ${section} has no video panel.`);
      const { film, ...rest } = panel;
      assert(!!film && typeof film === "object", `${doc._id as string}: ${section}.video.film is not an object.`);
      const { provider, id } = film as { provider?: string; id?: string };
      assert(provider === "wistia", `${doc._id as string}: ${section} provider is "${provider}".`);
      assert(typeof id === "string" && id.length > 0, `${doc._id as string}: ${section} has no film id.`);
      band.video = { ...rest, videoId: id };
      moved += 1;
    }
    assert(moved === PANELS.length, `${doc._id as string}: moved ${moved} of ${PANELS.length}.`);
    out.push(next);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out.map((d) => JSON.stringify(d)).join("\n") + "\n");
  console.log(`  ${out.length} document(s), ${PANELS.length * out.length} panel(s) flattened`);
  console.log(`\n→ ${OUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
