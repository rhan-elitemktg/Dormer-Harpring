// Seed for Phase 2c — testimonials, merged into one record per client.
//
// THE MERGE IS THE WHOLE JOB HERE. The codebase holds three lists — the
// homepage rail, the /testimonials video reviews and its written reviews — and
// they overlap by key. This joins them:
//
//   five VIDEO records appear in both, byte-identical (same id, same poster)
//   three WRITTEN records appear in both, the rail carrying a trimmed pull
//     quote and a shorter body
//
// A record therefore carries the full review AND its card form, with two
// booleans for placement. See the note on the `testimonial` schema type for why
// merging rather than duplicating was decided by the data.
//
//   npx tsx scripts/seed-collections-2c.ts
//   npx tsx scripts/sanity-purge.ts testimonial --yes
//   npx sanity dataset import scratch/collections-2c.ndjson --dataset production --replace
import "./lib/stub-vite-modules";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/collections-2c.ndjson");

function asset(image: { src: string }) {
  const path = image.src.startsWith("/") ? image.src : resolve(process.cwd(), image.src);
  readFileSync(path);
  return { _sanityAsset: `image@file://${path}` };
}

/**
 * The live `sharedSections` document, so this slice can add a field to it
 * without dropping the fields earlier slices added.
 *
 * Read over plain HTTP rather than through the CLI: the dataset is public-read,
 * and this needs no credentials of its own.
 */
async function readSharedSections(): Promise<Record<string, unknown>> {
  const read = (name: string) => {
    const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(
      readFileSync(".env", "utf8")
    );
    if (!match) throw new Error(`${name} is not set in .env`);
    return match[1].trim();
  };

  const url =
    `https://${read("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v2026-08-01/data/query/` +
    `${read("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent('*[_id == "sharedSections"][0]')}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity returned ${response.status} reading sharedSections.`);
  const doc = (await response.json()).result;
  if (!doc) return {};

  // System fields must not be written back — _rev in particular would pin the
  // import to a revision that is no longer current.
  const { _id, _type, _rev, _createdAt, _updatedAt, ...fields } = doc;
  return fields;
}

async function main() {
  const t = await import("../src/data/testimonials.ts");

  const rail = await t.getHomeTestimonials();
  const videos = await t.getVideoReviews();
  const written = await t.getWrittenReviews();
  const summary = await t.getReviewSummary();

  /** Every key that appears anywhere, in a stable order: rail first, then page. */
  const keys: string[] = [];
  for (const r of rail) if (!keys.includes(r._key)) keys.push(r._key);
  for (const r of videos) if (!keys.includes(r._key)) keys.push(r._key);
  for (const r of written) if (!keys.includes(r._key)) keys.push(r._key);

  const documents = keys.map((key) => {
    const railEntry = rail.find((r) => r._key === key);
    const videoEntry = videos.find((r) => r._key === key);
    const writtenEntry = written.find((r) => r._key === key);

    const format =
      videoEntry || railEntry?.kind === "video" ? "video" : "written";

    const railIndex = rail.findIndex((r) => r._key === key);
    const reviewIndex = format === "video"
      ? videos.findIndex((r) => r._key === key)
      : written.findIndex((r) => r._key === key);

    // The name is the same in every list a record appears in; take whichever
    // list has it, page first, because the page is the fuller presentation.
    const name = videoEntry?.name ?? writtenEntry?.name ?? railEntry?.name;

    const doc: Record<string, unknown> = {
      _type: "testimonial",
      key: { _type: "slug", current: key },
      name,
      format,
      // The page's pull quote is the full one. A record that is rail-only has
      // no page quote, so the rail's headline stands in — it is the same
      // sentence, trimmed.
      quote:
        videoEntry?.quote ??
        writtenEntry?.quote ??
        (railEntry && railEntry.kind === "quote" ? railEntry.headline : ""),
      onReviewsPage: Boolean(videoEntry || writtenEntry),
      onHomeRail: Boolean(railEntry),
    };

    if (reviewIndex >= 0) doc.reviewOrder = (reviewIndex + 1) * 10;
    if (railIndex >= 0) doc.railOrder = (railIndex + 1) * 10;

    if (format === "video") {
      const video = videoEntry?.video ?? (railEntry?.kind === "video" ? railEntry.video : undefined);
      const poster = videoEntry?.poster ?? (railEntry?.kind === "video" ? railEntry.poster : undefined);
      if (video) doc.video = { _type: "videoRef", provider: video.provider, id: video.id };
      if (poster) doc.poster = asset(poster as unknown as { src: string });
      if (railEntry?.kind === "video") doc.length = railEntry.length;
    } else {
      if (writtenEntry) {
        doc.body = writtenEntry.body;
        doc.source = writtenEntry.source;
      }
      if (railEntry?.kind === "quote") {
        doc.railHeadline = railEntry.headline;
        doc.railBody = railEntry.body;
      }
    }

    return doc;
  });

  /*
   * reviewSummary joins the sharedSections singleton — four pages render it.
   *
   * MERGED WITH WHAT IS ALREADY THERE, NOT WRITTEN FRESH. `--replace` on a
   * fixed id replaces the WHOLE document, so emitting a sharedSections with
   * only this field on it would silently delete the core-values heading that
   * Phase 2a put there — and the build would then throw on a page nobody was
   * looking at. Any singleton that gains fields across slices has this hazard.
   *
   * Reading it back is the fix, and it is also the check: the fields the
   * earlier slice wrote have to still be there to be carried forward.
   */
  const existing = await readSharedSections();
  const shared = {
    ...existing,
    _id: "sharedSections",
    _type: "sharedSections",
    reviewSummary: { count: summary.count, rating: summary.rating, source: summary.source },
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    [...documents, shared].map((d) => JSON.stringify(d)).join("\n") + "\n"
  );

  const video = documents.filter((d) => d.format === "video").length;
  console.log(`Wrote ${documents.length} testimonials to ${OUT}`);
  console.log(`  ${video} filmed · ${documents.length - video} written`);
  console.log(`  ${documents.filter((d) => d.onHomeRail).length} on the rail · ` +
    `${documents.filter((d) => d.onReviewsPage).length} on the Testimonials page`);
  console.log(`  sharedSections carries forward: ${Object.keys(shared).filter((k) => !k.startsWith("_")).join(", ")}`);
}

await main();
