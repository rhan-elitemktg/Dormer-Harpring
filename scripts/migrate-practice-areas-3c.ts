// Phase 3c — the 104 imported practice-area pages, into Sanity.
//
//   npx tsx scripts/migrate-practice-areas-3c.ts
//   npx sanity dataset import scratch/practice-areas-3c.ndjson --dataset production
//   npx tsx scripts/migrate-practice-areas-3c.ts --verify
//
// THE BODY THAT UPLOADS IS THE TRIMMED ONE, and that is the one real decision in
// this script. Three chrome sections are dropped from the WordPress body before
// it is written:
//
//   "<City> <Area> Lawyer Near Me"  the office address, phone and
//                                   GeoCoordinates — the footer carries the
//                                   address on every page already.
//   "<City> <Area> Resources"       a bullet list of the firm's own articles —
//                                   the sidebar's Related articles card is that
//                                   list.
//   "Awards and Accolades"          an h2 and the firm's six award badges,
//                                   byte-identical on all 30 pages that carry
//                                   it. `AwardsBar` renders those same six
//                                   under the article, so leaving them in shows
//                                   them twice.
//
// WHY AT MIGRATION RATHER THAN AT RENDER. `content.config.ts`'s rule is that the
// files keep WordPress's shape and the getter coalesces, because a GROQ
// projection is what does the coalescing after a swap. That rule does not reach
// this case: dropping a section means walking from an h2 to the NEXT h2, which
// GROQ cannot express. Leaving it in the getter would keep it there permanently
// and — worse — show an editor three sections that never appear on the page.
// 180 of the 231 body images live inside those sections and never upload.
//
// WRITTEN DOWN, NOT MATCHED BY PATTERN. A pattern on "Near Me" and "Resources"
// catches fourteen headings and one of them is not chrome at all:
// `thornton-bicycle-accident-lawyer`'s "Bicycle Accident Resources in Thornton,
// Colorado" is Bike Thornton and Bicycle Colorado with their addresses and phone
// numbers — unique editorial copy neither reason covers. So every candidate is
// listed explicitly and A CANDIDATE IN NEITHER LIST THROWS, the same guarantee
// `PRACTICE_AREA_PAGES` gives the importer. A declared drop the body no longer
// contains throws too.
//
// THE MANIFEST IS COPIED HERE FROM `data/practiceAreaPages.ts`, DELIBERATELY,
// and then checked against it. `--verify` and the build both re-derive the
// trimmed body through `getPracticeAreaArticles()` and assert it is identical to
// what this script wrote, for all 104 — so the copy cannot silently drift while
// both exist. After the swap the getter's copy is deleted and this becomes the
// record of what was dropped and why.
//
// Re-running means purging first — generated ids, so `--replace` matches nothing:
//
//   npx tsx scripts/sanity-purge.ts practiceArea --yes
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const SOURCE = resolve(process.cwd(), "src/content/practice-areas");
const OUT = resolve(process.cwd(), "scratch/practice-areas-3c.ndjson");
const API_VERSION = "2026-08-01";

/** Counted, not guessed. `denver-car-accident-lawyer` is not among them — the
 *  heavy template serves that slug and the importer excludes it. */
const EXPECTED_PAGES = 104;

type Json = Record<string, unknown>;

interface SourceFaq {
  _key: string;
  question: string;
  answer: Json[];
}

interface SourcePage {
  slug: string;
  title: string;
  label: string;
  city: string;
  topic: string;
  statewide?: boolean;
  resource?: boolean;
  body: Json[];
  faqs?: SourceFaq[];
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  modifiedAt?: string;
  legacyId?: number;
}

// ---------------------------------------------------------------------------
// THE CHROME MANIFEST. Copied from `data/practiceAreaPages.ts` and asserted
// equal to its output below — see the header.
// ---------------------------------------------------------------------------

const DROPPED_SECTIONS: Record<string, string[]> = {
  "denver-bicycle-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
  "denver-brain-injury-lawyer": ["Brain Injury Resources", "Denver Medical Malpractice Lawyer Near Me"],
  "denver-burn-injury-attorney": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-drunk-driving-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
  "denver-medical-malpractice-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-pedestrian-accident-lawyer": ["Denver Personal Injury Lawyer Near Me"],
  "denver-spinal-cord-injury-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-truck-accident-lawyer": ["Denver Truck Accident Lawyer Near Me", "Denver Truck Accident Resources"],
  "thornton-car-accident-attorney": ["Thornton Car Accident Resources"],
  "thornton-personal-injury-attorney": ["Thornton Personal Injury Resources"],
  "thornton-wrongful-death-lawyer": ["Thornton Wrongful Death Resources"],
};

/** Dropped on every page that carries it — an exact whole-heading match on a
 *  string with one meaning, which is what makes a global match safe here where
 *  "Near Me" and "Resources" needed a per-slug list. */
const DROPPED_EVERYWHERE = ["Awards and Accolades"];

/** Headings the pattern flags that are NOT chrome, with the reason. */
const KEPT_SECTIONS: Record<string, string[]> = {
  "thornton-bicycle-accident-lawyer": [
    // Bike Thornton and Bicycle Colorado, with addresses and phone numbers.
    // Third-party civic resources, not the firm's own article list.
    "Bicycle Accident Resources in Thornton, Colorado",
  ],
};

/** What makes a heading a CANDIDATE. Never what makes it droppable. */
const CHROME_HEADING = /\bnear me\b|\bresources\b/i;

function headingText(node: Json): string {
  if (node._type !== "block" || node.style !== "h2") return "";
  const children = (node.children ?? []) as { text?: string }[];
  return children.map((child) => child.text ?? "").join("").trim();
}

/** A section runs from its h2 to the next h2, or to the end of the body. */
function dropChromeSections(slug: string, body: Json[]): Json[] {
  const drop = DROPPED_SECTIONS[slug] ?? [];
  const keep = KEPT_SECTIONS[slug] ?? [];
  const out: Json[] = [];
  const hit = new Set<string>();

  let dropping = false;
  for (const node of body) {
    const heading = headingText(node);
    if (heading) {
      dropping = false;
      if (DROPPED_EVERYWHERE.includes(heading)) {
        dropping = true;
      } else if (CHROME_HEADING.test(heading)) {
        if (drop.includes(heading)) {
          dropping = true;
          hit.add(heading);
        } else if (!keep.includes(heading)) {
          throw new Error(
            `${slug}: body heading "${heading}" looks like the "Near Me" / "Resources" chrome ` +
              `this template drops, but is in neither DROPPED_SECTIONS nor KEPT_SECTIONS. ` +
              `Add it to one — silently keeping it ships chrome, silently dropping it deletes content.`
          );
        }
      }
    }
    if (!dropping) out.push(node);
  }

  const missing = drop.filter((heading) => !hit.has(heading));
  if (missing.length) {
    throw new Error(
      `${slug}: DROPPED_SECTIONS names ${missing.map((m) => `"${m}"`).join(", ")}, which the ` +
        `body no longer contains. Remove the entry, or fix the heading.`
    );
  }
  return out;
}

// ---------------------------------------------------------------------------

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

/** Refuse to run once the source has moved. Checked against the SOURCE, not the
 *  module that reads it — see the note in `migrate-blog-3b.ts`. */
function assertSourcePresent(): void {
  if (existsSync(SOURCE)) return;
  console.error(
    `${SOURCE} does not exist, so there is nothing to seed. The pages are already in Sanity — ` +
      `seeding is one-way. Recover the directory from git if you need to re-run.`
  );
  process.exit(1);
}

/** WordPress's offset-less wall clock, made explicit. See `lib/dates.ts`. */
function asUtc(iso: string): string {
  if (!iso.includes("T")) return `${iso}T00:00:00Z`;
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
}

function assetRef(absolutePath: string): Json {
  assert(existsSync(absolutePath), `Image not found on disk: ${absolutePath}`);
  return { _sanityAsset: `image@file://${absolutePath}` };
}

/** Body image blocks re-pointed at uploads; every `_key` preserved verbatim. */
function convertBody(body: Json[], where: string): Json[] {
  const keys = new Set<string>();
  return body.map((node) => {
    const key = node._key;
    assert(typeof key === "string" && key !== "", `${where}: a body block has no _key.`);
    assert(!keys.has(key), `${where}: duplicate _key "${key}" in body.`);
    keys.add(key);

    if (node._type !== "image") return node;
    const src = node.src;
    assert(typeof src === "string", `${where}: image block ${key} has no src.`);
    const { src: _dropped, ...rest } = node;
    return { ...rest, ...assetRef(resolve(SOURCE, src)) };
  });
}

function readSource(): SourcePage[] {
  const files = readdirSync(SOURCE).filter((name) => name.endsWith(".json")).sort();
  const pages = files.map((name) => JSON.parse(readFileSync(join(SOURCE, name), "utf8")) as SourcePage);

  assert(
    pages.length === EXPECTED_PAGES,
    `Expected ${EXPECTED_PAGES} pages in ${SOURCE}, found ${pages.length}. ` +
      `If that is deliberate, update EXPECTED_PAGES and say why.`
  );

  const slugs = new Set<string>();
  for (const page of pages) {
    assert(!slugs.has(page.slug), `Duplicate page slug: ${page.slug}`);
    slugs.add(page.slug);
    for (const faq of page.faqs ?? []) {
      assert(typeof faq._key === "string" && faq._key !== "", `${page.slug}: an FAQ has no _key.`);
    }
    const faqKeys = (page.faqs ?? []).map((faq) => faq._key);
    assert(
      new Set(faqKeys).size === faqKeys.length,
      `${page.slug}: duplicate _key among its FAQ items — Sanity would drop one silently.`
    );
  }
  return pages;
}

/**
 * The trimmed bodies as the SITE derives them, for cross-checking the copy above.
 *
 * This is the whole reason the manifest may safely live in two places while both
 * exist: if the copy here and the one in `data/practiceAreaPages.ts` ever
 * disagree by one block, the build refuses to write anything.
 */
async function siteBodies(): Promise<Map<string, Json[]>> {
  /* The content collection is SERVED here rather than stubbed out, uniquely in
     this phase: the whole point is to run the site's own trimming code over the
     same input and compare. See the note on `contentSource`. */
  registerDataModuleHooks({
    sanityClient: "live",
    collections: { practiceAreas: "src/content/practice-areas" },
  });
  const module = await import("../src/data/practiceAreaPages.ts");
  const articles = await module.getPracticeAreaArticles();
  return new Map(articles.map((article) => [article.slug, article.body as unknown as Json[]]));
}

/** Compare two Portable Text arrays as the site would render them — by shape,
 *  ignoring nothing. Images are compared on `_key` and `alt` only, since this
 *  side still carries a `src` the uploaded side replaces. */
function sameBody(a: Json[], b: Json[]): boolean {
  if (a.length !== b.length) return false;
  const strip = (node: Json): Json => {
    if (node._type !== "image") return node;
    const { src: _s, _sanityAsset: _a, ...rest } = node;
    return rest;
  };
  return a.every((node, i) => JSON.stringify(strip(node)) === JSON.stringify(strip(b[i])));
}

async function build(): Promise<void> {
  assertSourcePresent();
  const pages = readSource();
  const fromSite = await siteBodies();

  assert(
    fromSite.size === pages.length,
    `getPracticeAreaArticles() returned ${fromSite.size} articles; the source has ${pages.length}.`
  );

  let dropped = 0;
  let images = 0;
  let faqItems = 0;

  const lines = pages.map((page) => {
    const trimmed = dropChromeSections(page.slug, page.body);
    dropped += page.body.length - trimmed.length;

    /* THE CROSS-CHECK. Two implementations of the same walk, over the same
       input, compared block for block on all 104. */
    const theirs = fromSite.get(page.slug);
    assert(theirs !== undefined, `${page.slug}: the site does not build this page.`);
    assert(
      sameBody(trimmed, theirs),
      `${page.slug}: this script's trimmed body (${trimmed.length} blocks) does not match ` +
        `getPracticeAreaArticles()' (${theirs.length}). The two copies of the chrome manifest ` +
        `have drifted — reconcile them before importing anything.`
    );

    const body = convertBody(trimmed, page.slug);
    images += body.filter((node) => node._type === "image").length;
    faqItems += (page.faqs ?? []).length;

    const doc: Json = {
      _type: "practiceArea",
      title: page.title,
      slug: { _type: "slug", current: page.slug },
      label: page.label,
      city: page.city,
      topic: page.topic,
      statewide: page.statewide ?? false,
      resource: page.resource ?? false,
      body,
      seo: { _type: "seo", metaTitle: page.metaTitle, metaDescription: page.metaDescription },
      publishedAt: asUtc(page.publishedAt),
    };

    if (page.faqs?.length) {
      doc.faqs = page.faqs.map((faq) => ({
        _type: "faq",
        _key: faq._key,
        question: faq.question,
        answer: faq.answer,
      }));
    }
    if (page.modifiedAt) doc.modifiedAt = asUtc(page.modifiedAt);
    if (page.legacyId !== undefined) doc.legacyId = page.legacyId;

    return JSON.stringify(doc);
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join("\n") + "\n");

  console.log(
    `${lines.length} practiceArea documents → ${OUT}\n` +
      `  ${dropped} chrome blocks dropped · ${images} body images kept · ${faqItems} FAQ items\n` +
      `  every trimmed body matched getPracticeAreaArticles() block for block\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")}`
  );
}

async function verify(): Promise<void> {
  const pages = readSource();

  const live = await query<
    {
      slug: string;
      title: string;
      label: string;
      city: string;
      topic: string;
      statewide: boolean | null;
      resource: boolean | null;
      publishedAt: string;
      modifiedAt: string | null;
      legacyId: number | null;
      metaTitle: string | null;
      metaDescription: string | null;
      blocks: number;
      images: number;
      faqs: number;
    }[]
  >(`*[_type == "practiceArea"] | order(slug.current asc){
      "slug": slug.current, title, label, city, topic, statewide, resource,
      publishedAt, modifiedAt, legacyId,
      "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription,
      "blocks": count(body),
      "images": count(body[_type == "image"]),
      "faqs": count(coalesce(faqs, []))
    }`);

  assert(
    live.length === pages.length,
    `Sanity holds ${live.length} practiceArea documents; the source has ${pages.length}. ` +
      `A second import ADDS rather than replaces — purge and re-import.`
  );

  const bySlug = new Map(live.map((row) => [row.slug, row]));
  const problems: string[] = [];

  for (const page of pages) {
    const row = bySlug.get(page.slug);
    if (!row) {
      problems.push(`${page.slug}: missing from Sanity`);
      continue;
    }
    const trimmed = dropChromeSections(page.slug, page.body);
    const sourceImages = trimmed.filter((node) => node._type === "image").length;

    const checks: [string, unknown, unknown][] = [
      ["title", row.title, page.title],
      ["label", row.label, page.label],
      ["city", row.city, page.city],
      ["topic", row.topic, page.topic],
      ["statewide", row.statewide ?? false, page.statewide ?? false],
      ["resource", row.resource ?? false, page.resource ?? false],
      ["publishedAt", row.publishedAt, asUtc(page.publishedAt)],
      ["modifiedAt", row.modifiedAt ?? undefined, page.modifiedAt ? asUtc(page.modifiedAt) : undefined],
      ["legacyId", row.legacyId ?? undefined, page.legacyId],
      ["metaTitle", row.metaTitle, page.metaTitle],
      ["metaDescription", row.metaDescription, page.metaDescription],
      ["body blocks", row.blocks, trimmed.length],
      ["body images", row.images, sourceImages],
      ["faq items", row.faqs, (page.faqs ?? []).length],
    ];
    for (const [what, actual, expected] of checks) {
      if (actual !== expected) problems.push(`${page.slug}: ${what} ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`);
    }
  }

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ ${live.length} practiceArea documents match the source.\n` +
      `  ${live.reduce((n, r) => n + r.blocks, 0)} body blocks · ` +
      `${live.reduce((n, r) => n + r.images, 0)} images · ` +
      `${live.reduce((n, r) => n + r.faqs, 0)} FAQ items across ` +
      `${live.filter((r) => r.faqs > 0).length} pages`
  );
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) return verify();
  await build();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
