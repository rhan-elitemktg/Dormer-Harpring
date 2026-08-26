// Seed for Phase 2a — awards, core values, and the shared-sections singleton.
//
// THE FIRST SEED THAT CARRIES IMAGES. `_sanityAsset` is the only route that
// uploads a file as part of `sanity dataset import`, which is most of why the
// seeds go through NDJSON rather than `client.create()` calls: the alternative
// is minting a write token and uploading each asset by hand. The value is
// `image@file://` plus an ABSOLUTE path — a relative one resolves against the
// importer's cwd rather than this file and silently finds nothing.
//
// Same one-way door as scripts/seed-settings.ts: seed FIRST, verify, then swap
// the getter. Once a module reads `sanity:client`, plain Node cannot import it.
//
//   npx tsx scripts/seed-collections-2a.ts
//   npx sanity dataset import scratch/collections-2a.ndjson --dataset production --replace
import "./lib/stub-vite-modules";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/collections-2a.ndjson");

/** See scripts/seed-settings.ts for why this reads the file rather than catching the import. */
function assertNotSwapped(...names: string[]) {
  for (const name of names) {
    const file = resolve(process.cwd(), `src/data/${name}.ts`);
    if (!/from ["']sanity:client["']/.test(readFileSync(file, "utf8"))) continue;
    console.error(
      `\nsrc/data/${name}.ts already reads from Sanity, so it holds no literals to seed.\n` +
        `Seeding is one-way: seed FIRST, verify, then swap the getter.\n`
    );
    process.exit(1);
  }
}

/**
 * An image import, as `dataset import` wants it.
 *
 * `_sanityAsset` needs an ABSOLUTE path — a relative one resolves against the
 * importer's working directory rather than this file, and silently finds
 * nothing. The stub hook in lib/stub-assets.ts already hands back an absolute
 * filesystem path (it is a `file://` URL's pathname), so this only has to cope
 * with the case where something hands it a repo-relative one instead.
 *
 * The read is a deliberate early failure: it throws HERE, naming the file, in
 * preference to `dataset import` failing partway through a batch.
 */
function asset(image: { src: string }) {
  const path = image.src.startsWith("/") ? image.src : resolve(process.cwd(), image.src);
  readFileSync(path);
  return { _sanityAsset: `image@file://${path}` };
}

/**
 * Documents get GENERATED `_id`s — only singletons take a fixed one, which is
 * Sanity's own guidance for ordinary content.
 *
 * NO `legacyKey` FIELD. The imported collections in Phase 3 keep a `legacyId`
 * because it traces to WordPress, which still exists and can still be
 * re-queried. These records' "source" is a TypeScript literal that is deleted
 * in the same commit, so the trace would point at nothing. A field that means
 * nothing is worse than no field: someone will try to use it.
 *
 * Identity for a RE-RUN comes from purging the type first — see
 * scripts/sanity-purge.ts — because generated ids give `--replace` nothing to
 * match on, so a second import adds a second set rather than replacing.
 */
function doc(type: string, fields: Record<string, unknown>) {
  return { _type: type, ...fields };
}

async function main() {
  const awardsModule = await import("../src/data/awards.ts");
  const valuesModule = await import("../src/data/coreValues.ts");

  const awards = await awardsModule.getAwards();
  const values = await valuesModule.getCoreValues();
  const valuesSection = await valuesModule.getCoreValuesSection();

  const documents: Record<string, unknown>[] = [
    ...awards.map((a, i) =>
      doc("award", {
        // The EXISTING key, preserved: carAccidents.ts names six of these.
        key: { _type: "slug", current: a._key },
        alt: a.alt,
        image: asset(a.image as unknown as { src: string }),
        height: a.height,
        order: (i + 1) * 10,
      })
    ),
    ...values.map((v, i) =>
      doc("coreValue", {
        title: v.title,
        body: v.body,
        iconKey: v.iconKey,
        order: (i + 1) * 10,
      })
    ),
    {
      _id: "sharedSections",
      _type: "sharedSections",
      coreValues: { eyebrow: valuesSection.eyebrow, title: valuesSection.title },
    },
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, documents.map((d) => JSON.stringify(d)).join("\n") + "\n");

  console.log(`Wrote ${documents.length} documents to ${OUT}`);
  console.log(`  ${awards.length} award · ${values.length} coreValue · 1 sharedSections`);
}

await main();
