// Phase 6d — the Car Accidents singleton becomes a featured practice area.
//
//   npx tsx scripts/migrate-featured-6d.ts
//   npx sanity dataset import scratch/featured-6d.ndjson --dataset production
//   npx tsx scripts/migrate-featured-6d.ts --verify   # BEFORE swapping the getter
//   npx tsx scripts/sanity-purge.ts carAccidentsPage --yes   # AFTER it is green
//
// NOTHING ABOUT THE PAGE CHANGES. Its eighteen sections move verbatim into a
// document of a new type; the page it builds is byte-identical. What changes is
// that it stops being a one-off: `featuredPracticeArea` is a collection filed by
// city, so it sits in the desk beside the 104 imported Denver pages, and a
// second designed page becomes a document rather than a refactor.
//
// NO `--replace`, AND THAT IS DELIBERATE. This writes a NEW document with a
// generated id — a collection member, not a singleton at a fixed id. The old
// `carAccidentsPage` is left in place until the getter has swapped and the
// build is green, then purged. Replacing in place would mean the two states
// could never be compared.
//
// THREE FIELDS ARE ADDED AND NOTHING IS DROPPED, which is what the leaf compare
// below asserts: every value in the singleton must appear in the new document,
// and the only additions are `key`, `label` and `city`. A reshape that silently
// loses a section is invisible to a schema check — the old field simply stops
// being read — so the guard is the same sorted-multiset compare Phase 5 used.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/featured-6d.ndjson");
const API_VERSION = "2026-08-01";

/**
 * WHAT THE NEW DOCUMENT GAINS. `key` is the join `FEATURED` in
 * data/carAccidents.ts maps to a URL — it must equal the `_key` the old getter
 * returned, or the page changes address.
 */
const ADDED = {
  key: { _type: "slug", current: "car-accidents" },
  label: "Car Accidents",
  city: "denver",
} as const;

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

/** Every leaf in a document, sorted — only paths may change, never values. */
function leaves(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((item) => leaves(item, out));
  else if (value && typeof value === "object")
    Object.values(value as Json).forEach((item) => leaves(item, out));
  else out.push(JSON.stringify(value));
  return out.sort();
}

async function main(): Promise<void> {
  const verify = process.argv.includes("--verify");

  if (verify) {
    const docs = await query<Json[]>(`*[_type == "featuredPracticeArea"]`);
    assert(docs.length === 1, `expected 1 featured practice area, found ${docs.length}.`);
    const doc = docs[0];
    assert(
      (doc.key as Json | undefined)?.current === ADDED.key.current,
      `its key is ${JSON.stringify((doc.key as Json | undefined)?.current)}, not "car-accidents".`
    );
    assert(doc.city === ADDED.city, `its city is ${JSON.stringify(doc.city)}, not "denver".`);
    const sections = Object.keys(doc).filter((k) => !k.startsWith("_"));
    assert(
      sections.length === 21,
      `expected 21 fields (18 sections + key, label, city), found ${sections.length}: ` +
        sections.sort().join(", ")
    );
    console.log(`  ✓ featuredPracticeArea "${ADDED.key.current}" — ${sections.length} fields`);
    console.log("\n6d: the dataset matches the new shape.");
    return;
  }

  const old = await query<Json | null>(`*[_id == "carAccidentsPage"][0]`);
  assert(old !== null, "no carAccidentsPage document — has this already run and been purged?");

  const existing = await query<Json[]>(`*[_type == "featuredPracticeArea"]`);
  assert(existing.length === 0, `${existing.length} featured practice area(s) already exist.`);

  const { _id, _type, _rev, _createdAt, _updatedAt, ...sections } = old;
  const count = Object.keys(sections).length;
  assert(count === 18, `expected 18 sections on the singleton, found ${count}.`);

  const next: Json = { _type: "featuredPracticeArea", ...ADDED, ...sections };

  /*
   * THE PAYLOAD'S VALUES ARE THE SOURCE'S PLUS EXACTLY THE THREE DECLARED.
   *
   * Compared as sorted multisets, which catches a dropped section AND an
   * unintended addition in one assertion. `_type` is excluded from both sides —
   * it is a leaf, and it is the one value that legitimately differs.
   */
  const before = leaves(sections);
  const expected = [...before, ...leaves(ADDED)].sort();
  const { _type: _emitted, ...payloadValues } = next;
  assert(
    JSON.stringify(leaves(payloadValues)) === JSON.stringify(expected),
    `the reshape changed the document's values. Source ${before.length} + ` +
      `${leaves(ADDED).length} added = ${expected.length}, payload ` +
      `${leaves(payloadValues).length}. Nothing written.`
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(next) + "\n");
  console.log(`  18 sections + key, label, city → 1 featuredPracticeArea`);
  console.log(`  ${before.length} leaf values intact`);
  console.log(`\n→ ${OUT}`);
  console.log(`\nImport WITHOUT --replace (it is a new document with a generated id):`);
  console.log(`  npx sanity dataset import ${OUT} --dataset production`);
  console.log(`Then --verify, swap the getter, build green, and only then:`);
  console.log(`  npx tsx scripts/sanity-purge.ts carAccidentsPage --yes`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
