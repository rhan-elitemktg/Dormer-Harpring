// Phase 3a — the 23 blog categories, from the interim content store into Sanity.
//
//   npx tsx scripts/migrate-blog-3a.ts
//   npx sanity dataset import scratch/blog-categories-3a.ndjson --dataset production
//   npx tsx scripts/migrate-blog-3a.ts --verify
//
// THE SOURCE IS `src/content/blog-categories/*.json`, NOT A DATA MODULE, and that
// is what makes Phase 3 different from every seed before it. Phase 2 read
// literals out of `src/data/*.ts` and therefore needed `stub-vite-modules.ts` to
// answer the image imports those modules carry. These files are plain JSON with
// no imports at all, so plain Node reads them and there is nothing to stub.
//
// It still refuses to run once the getter is swapped — see `assertNotSwapped`.
// The order is SEED, VERIFY, THEN SWAP, and getting it backwards is a one-way
// door: a data module that imports `sanity:client` cannot be loaded by plain Node
// at all, and the failure is thrown from a synchronous Vite hook where a
// try/catch around the import cannot see it.
//
// NO `--replace` ON THE IMPORT COMMAND ABOVE, deliberately. These get GENERATED
// ids — Sanity's own guidance for ordinary content, with identity living in
// `legacyId` — so `--replace` has nothing to match on and a second import would
// silently ADD 23 more. Re-running means purging first:
//
//   npx tsx scripts/sanity-purge.ts blogCategory --yes
//
// WHAT `--verify` PROVES, and what it does not. It compares the dataset against
// these files field by field, so it catches a dropped record, a mangled slug or
// a lost legacy id. It cannot tell you the SITE is unchanged; that is
// `scripts/compare-builds.py`, run after the getter swap.
//
// `--verify` NO LONGER RUNS, and that is deliberate rather than rot.
// `src/content/blog-categories/` was deleted in the same commit that swapped the
// getter, because a content collection nothing reads is exactly the dead literal
// this project has been bitten by before. It passed first — 23 of 23 matching
// title, slug and legacyId, with all 329 built pages byte-identical afterwards —
// and git holds the source if anything ever needs re-deriving. The file is kept
// for the same reason `migrate-pages-2f.ts` is: its assertion list is the
// template for the next one of these.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SOURCE = resolve(process.cwd(), "src/content/blog-categories");
const OUT = resolve(process.cwd(), "scratch/blog-categories-3a.ndjson");
const API_VERSION = "2026-08-01";

/** Counted, not guessed — and asserted both before the write and at --verify, so
 *  a file that disappears from the source fails rather than importing 22. */
const EXPECTED = 23;

interface SourceCategory {
  title: string;
  slug: string;
  legacyId?: number;
}

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

/** Run a GROQ query against the live dataset. Public-read, so no credentials. */
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

/**
 * REFUSE TO RUN AGAINST AN ALREADY-SWAPPED MODULE.
 *
 * Detected by READING the file rather than by catching the import, because the
 * import failure is not catchable: `sanity:client` is a Vite virtual module and
 * the `ERR_UNSUPPORTED_ESM_URL_SCHEME` comes out of a synchronous load hook,
 * outside the promise chain. `tsx` has been seen exiting 0 from it — which
 * writes nothing, leaves the previous payload on disk, and reads as a
 * successful run.
 */
function assertNotSwapped(...names: string[]): void {
  for (const name of names) {
    const file = resolve(process.cwd(), `src/data/${name}.ts`);
    if (!/from ["']sanity:client["']/.test(readFileSync(file, "utf8"))) continue;
    console.error(
      `src/data/${name}.ts already reads from Sanity — seed FIRST, then swap.\n` +
        `If this content is already in the dataset there is nothing to do; if it is not, ` +
        `revert the swap, run this, import, and swap again.`
    );
    process.exit(1);
  }
}

/** The 23 files, read straight off disk and ordered by slug so the NDJSON is
 *  reproducible between runs. */
function readSource(): SourceCategory[] {
  const files = readdirSync(SOURCE)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const categories = files.map((name) => {
    const raw = JSON.parse(readFileSync(join(SOURCE, name), "utf8")) as SourceCategory;
    assert(
      typeof raw.title === "string" && raw.title.trim() !== "",
      `${name}: no title.`
    );
    assert(typeof raw.slug === "string" && raw.slug.trim() !== "", `${name}: no slug.`);
    return raw;
  });

  assert(
    categories.length === EXPECTED,
    `Expected ${EXPECTED} categories in ${SOURCE}, found ${categories.length}. ` +
      `If that is a deliberate change, update EXPECTED and say why.`
  );

  // A COLLISION HERE IS A LOST TAB, NOT AN ERROR — two categories on one slug
  // means the second overwrites the first in every Map the getters build.
  const seen = new Set<string>();
  for (const category of categories) {
    assert(!seen.has(category.slug), `Duplicate category slug: ${category.slug}`);
    seen.add(category.slug);
  }

  return [...categories].sort((a, b) => a.slug.localeCompare(b.slug));
}

function build(): void {
  assertNotSwapped("blog");

  const categories = readSource();

  const lines = categories.map((category) =>
    JSON.stringify({
      _type: "blogCategory",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      ...(category.legacyId === undefined ? {} : { legacyId: category.legacyId }),
    })
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join("\n") + "\n");

  console.log(`${categories.length} blogCategory documents → ${OUT}`);
  console.log(
    `\nnpx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")}`
  );
}

async function verify(): Promise<void> {
  const source = readSource();
  const live = await query<{ title: string; slug: string; legacyId: number | null }[]>(
    `*[_type == "blogCategory"] | order(slug.current asc){ title, "slug": slug.current, legacyId }`
  );

  assert(
    live.length === source.length,
    `Sanity holds ${live.length} blogCategory documents; the source has ${source.length}. ` +
      `A second import ADDS rather than replaces — purge and re-import.`
  );

  const problems: string[] = [];
  for (const [index, expected] of source.entries()) {
    const actual = live[index];
    if (actual.slug !== expected.slug) {
      problems.push(`slug: expected ${expected.slug}, found ${actual.slug}`);
      continue;
    }
    if (actual.title !== expected.title) {
      problems.push(`${expected.slug}: title "${actual.title}" ≠ "${expected.title}"`);
    }
    if ((actual.legacyId ?? undefined) !== expected.legacyId) {
      problems.push(
        `${expected.slug}: legacyId ${actual.legacyId} ≠ ${expected.legacyId}`
      );
    }
  }

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(`✓ ${live.length} blogCategory documents match the source exactly.`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) return verify();
  build();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
