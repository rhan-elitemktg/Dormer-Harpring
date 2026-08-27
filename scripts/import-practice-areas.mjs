// Imports the legacy WordPress practice-area pages.
//
// THE CONTENT COLLECTION IT WROTE INTO NO LONGER EXISTS. Phase 3 moved this
// content into Sanity and deleted `src/content/` with `content.config.ts`, so
// re-running this re-creates a directory nothing loads. Its output is an INPUT
// to a migration now, not a live store:
//
//   node scripts/import-practice-areas.mjs
//   npx tsx scripts/migrate-practice-areas-3c.ts
//   npx sanity dataset import scratch/… --dataset production
//   then delete the directory again
//
// It is kept rather than deleted because it is the only record of how to
// re-derive this content from WordPress, and because the manifests it reads
// encode DECISIONS — which live pages were deliberately excluded, which
// WordPress "pages" are really articles — that nobody should have to re-make.
//
//   node scripts/import-practice-areas.mjs                 all 109
//   node scripts/import-practice-areas.mjs --only <slug>   one, for inspection
//   node scripts/import-practice-areas.mjs --dry           convert, write nothing
//   node scripts/import-practice-areas.mjs --report        manifest coverage only
//
// SAME ARCHITECTURE AS THE BLOG IMPORT, and the converter is literally the same
// module. `content.rendered` for a `template-landing` page measures 3,497 words
// against the scrape's 3,637 for the same page, so the REST body IS the body —
// the theme adds chrome around it, not content inside it. One exception, below.
//
// THE SCRAPE IS STALE. The motorcycle page's live `modified` is 2026-08-14 and
// its headings no longer match the scrape's at all. So unlike the blog import,
// the scrape is ONLY an image cache here; anything textual comes from live.
//
// ---------------------------------------------------------------------------
// THE ONE EXCEPTION: the FAQ accordion is real content and is NOT in
// `content.rendered`. It is not in `acf` either (that comes back as an empty
// array), and there is no FAQ post type registered. It exists only in the
// rendered HTML. An importer that reads `content.rendered` alone drops ~570
// words a page and reports a clean run — the exact failure this project has
// already shipped twice. So each page is fetched TWICE: once as JSON for the
// body, once as HTML for the FAQ, and the FAQ gets its own audit.
// ---------------------------------------------------------------------------
import { writeFile, mkdir, copyFile, access, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { parse } from "node-html-parser";
import { createConverter, decode, normalizeHref, DEFAULT_CHROME_TAGS } from "./lib/wp-portable-text.mjs";
import { PRACTICE_AREA_PAGES, EXCLUDED_SLUGS, CITIES, TOPICS } from "./practice-area-pages.mjs";

const API = "https://www.denvertrial.com/wp-json/wp/v2";
const SITE = "https://www.denvertrial.com";
const SCRAPE = join(homedir(), "Downloads/Dormer Harpring/sitesucker/www.denvertrial.com");
const OUT = "src/content/practice-areas";
const IMG_DIR = join(OUT, "images");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const dry = args.includes("--dry");
const reportOnly = args.includes("--report");

/* ---------------------------------------------------------------- chrome ---
 * The blog importer's eight, plus three these pages need. Every one of them is
 * something this site already builds properly, so importing the markup would
 * ship a second, worse copy:
 *
 *   ez-toc            → PostContents.astro
 *   contact-shortcode → ContactForm.astro (and it is a fake form)
 *   user-shortcode    → the attorney card; team.ts owns those bios
 *   client-reviews    → TestimonialRail.astro
 *
 * ADDED HERE:
 *   test-copy   holds a full testimonial paragraph. `test-intro` alone leaves
 *               the quote behind, and it imports as body copy.
 *   coman-btn   widened from `coman-btn-block`; the buttons themselves carry
 *               `coman-btn-one` / `coman-btn-second` without the block wrapper.
 *   eztoc-      `eztoc-hide` does not start with `ez-toc`.
 *
 * DELIBERATELY NOT ADDED: `list-`, `arrow-unsorted-`, `row`, `col-md`,
 * `img-fluid`. Those sit on the ez-toc toggle's own <svg>s and inside
 * `contact-shortcode`, so they are already covered twice over — by CHROME_TAGS
 * and by the ancestor check. A bare `list-` prefix would be a grenade under any
 * future real content.
 *
 * Matched on PREFIX because the TOC's class is version-stamped and has already
 * drifted once (`ez-toc-v2_0_85` → `_86`). */
const CHROME_CLASS_PREFIXES = [
  "ez-toc",
  "eztoc-",
  "contact-shortcode",
  "user-shortcode",
  "client-reviews",
  "test-intro",
  "test-copy",
  "rating-img",
  "google-map-link",
  "coman-btn",
];

/* Roughly 35 per page, ~3,000 site-wide: a "Serving Denver County" block of
 * `maps.app.goo.gl` neighbourhood links, every one `rel="nofollow"`. They are
 * SEO filler pointing off-site, and they would be 35 of this page's 81 links.
 * Same treatment `inlineSpans` already gives `href="#"` — keep the words, drop
 * the anchor — so the neighbourhood names survive as text.
 * TODO(launch): the firm should confirm these are not wanted. */
const isMapSpam = (href) => /(^|\/\/)maps\.app\.goo\.gl/i.test(href) || /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(href);

const converter = createConverter({
  chromeClassPrefixes: CHROME_CLASS_PREFIXES,
  chromeTags: DEFAULT_CHROME_TAGS,
  plainHeadings: true, // ~a third of these headings arrive wrapped in <strong>
  dropLink: (href) => isMapSpam(href),
});
const { convertBody, convertElement, imagesToCopy, warnings, warn, inChrome } = converter;

let mapSpamDropped = 0;

// ------------------------------------------------------------------ fetch ---
async function fetchAllPages() {
  const pages = [];
  for (let page = 1; ; page++) {
    const url = `${API}/pages?per_page=100&page=${page}&_fields=id,slug,title,content,date,modified,template,yoast_head_json`;
    const r = await fetch(url);
    if (r.status === 400) break;
    if (!r.ok) throw new Error(`pages page ${page}: HTTP ${r.status}`);
    const batch = await r.json();
    pages.push(...batch);
    if (batch.length < 100) break;
  }
  return pages;
}

/**
 * THE MANIFEST CHECK. A live page in neither map is an error, not a skip —
 * that is the whole reason the manifest is written down rather than inferred.
 * Reported all at once so adding a batch takes one run, not one per page.
 */
function checkCoverage(pages) {
  const unknown = pages.filter((p) => !(p.slug in PRACTICE_AREA_PAGES) && !(p.slug in EXCLUDED_SLUGS));
  if (unknown.length) {
    const lines = unknown.map((p) => `  "${p.slug}": ${JSON.stringify(decode(p.title.rendered).trim())}`).join("\n");
    throw new Error(
      `${unknown.length} live page(s) are in neither PRACTICE_AREA_PAGES nor EXCLUDED_SLUGS.\n` +
        `Add each to one of them in scripts/practice-area-pages.mjs:\n${lines}`
    );
  }
  const live = new Set(pages.map((p) => p.slug));
  const gone = Object.keys(PRACTICE_AREA_PAGES).filter((s) => !live.has(s));
  if (gone.length) throw new Error(`manifest names ${gone.length} page(s) that are no longer live: ${gone.join(", ")}`);
}

/* NO FEATURED IMAGE, deliberately — unlike the blog import.
 *
 * This template has no hero image (it opens on the title, the way the blog post
 * does), so a featured image would be fetched and committed to render nowhere.
 * And they are not worth keeping against a future need: the motorcycle page's
 * `featured_media` is `att-bio-06-150x150.jpg`, a 150px attorney thumbnail. The
 * images that ARE content come through the body walk like any other. */

/* ------------------------------------------------------------------ FAQ ---
 * `.faq-block` → `.defualt-content-info > h2` (the source's own typo) →
 * `.coman-accordion` → `.accordion-item` × N, each `h4.accordion-header >
 * button` plus `.accordion-body`.
 *
 * SCOPED TO `.faq-block`, NOT `.accordion-item`. A bare query for the latter
 * returns 53 matches on this page — the theme's sidebar practice-area band is
 * built from the same Bootstrap accordion markup. Querying globally imports the
 * sidebar directory into the FAQ, which is the same reaching-through mistake
 * the blog importer has a comment about.
 *
 * The container <h2> is skipped: the component supplies its own heading.
 * Answers hold paragraphs, lists, <b> and <a>, so they are Portable Text
 * through the same converter, not strings. */
function extractFaqs(html, slug) {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  // 28 of the 109 carry one; a page without is normal and not worth a warning.
  // What IS worth one is a block that yields nothing — see below.
  const blocks = root.querySelectorAll(".faq-block");
  if (!blocks.length) return { faqs: [], sourceItems: 0 };

  let sourceItems = 0;
  const faqs = [];
  for (const blockEl of blocks) {
    const items = blockEl.querySelectorAll(".accordion-item");
    sourceItems += items.length;
    for (const item of items) {
      const q = item.querySelector(".accordion-header");
      const a = item.querySelector(".accordion-body");
      if (!q || !a) continue;
      const question = decode(q.structuredText || q.text || "").replace(/\s+/g, " ").trim();
      const answer = convertElement(a, slug);
      if (!question || !answer.length) continue;
      faqs.push({ _key: `q${faqs.length + 1}`, question, answer });
    }
  }
  if (blocks.length && sourceItems === 0) warn(slug, "AUDIT: .faq-block present but it holds no .accordion-item");
  // THE AUDIT. Same shape as the image audit: what the source had, against what
  // came out. A question that loses its answer is silent otherwise.
  if (sourceItems !== faqs.length) {
    throw new Error(
      `${slug}: FAQ AUDIT — ${sourceItems} accordion items in the source, ${faqs.length} emitted. ` +
        `Fix the extractor rather than accepting the loss.`
    );
  }
  return { faqs, sourceItems };
}

/** Body links pointing at the page they are on. The live pages carry a
 *  hand-maintained "Find a Lawyer Near You" city list that includes itself.
 *  Kept — it is real internal linking and stripping it would cost fidelity
 *  points nobody could later reconstruct — but never silently. */
function warnSelfLinks(body, slug) {
  const self = `/${slug}`;
  let n = 0;
  for (const b of body)
    for (const d of b.markDefs ?? [])
      if (d.href?.replace(/\/+$/, "") === self) n++;
  if (n) warn(slug, `TODO(launch): ${n} body link(s) point at this page itself`);
}

function countMapSpam(html) {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  return root.querySelectorAll("a").filter((a) => {
    const h = a.getAttribute("href");
    return h && isMapSpam(normalizeHref(h)) && !inChrome(a);
  }).length;
}

// ------------------------------------------------------------------ main ---
async function main() {
  const pages = await fetchAllPages();
  checkCoverage(pages);

  if (reportOnly) {
    console.log(`live pages: ${pages.length}`);
    console.log(`practice areas: ${Object.keys(PRACTICE_AREA_PAGES).length}`);
    console.log(`excluded: ${Object.keys(EXCLUDED_SLUGS).length}`);
    for (const c of CITIES) {
      const n = Object.values(PRACTICE_AREA_PAGES).filter((v) => v.city === c.key).length;
      const byTopic = TOPICS.map((t) => {
        const k = Object.values(PRACTICE_AREA_PAGES).filter((v) => v.city === c.key && v.topic === t.key).length;
        return k ? `${t.key} ${k}` : null;
      }).filter(Boolean).join(", ");
      console.log(`  ${c.name.padEnd(16)} ${String(n).padStart(3)}   ${byTopic}`);
    }
    return;
  }

  const wanted = pages.filter((p) => p.slug in PRACTICE_AREA_PAGES);
  const chosen = only ? wanted.filter((p) => p.slug === only) : wanted;
  if (only && !chosen.length) throw new Error(`no practice-area page with slug "${only}"`);

  const docs = [];
  let faqTotal = 0;
  for (const p of chosen) {
    const slug = p.slug;
    const meta = PRACTICE_AREA_PAGES[slug];

    const body = convertBody(p.content.rendered, slug);
    if (!body.length) throw new Error(`${slug}: converted to an empty body.`);
    warnSelfLinks(body, slug);

    // The second fetch: the FAQ, which the JSON does not carry. See the header.
    const r = await fetch(`${SITE}/${slug}/`);
    if (!r.ok) throw new Error(`${slug}: page HTML HTTP ${r.status} — cannot check for a FAQ block`);
    const html = await r.text();
    const { faqs } = extractFaqs(html, slug);
    faqTotal += faqs.length;
    mapSpamDropped += countMapSpam(p.content.rendered);

    const y = p.yoast_head_json ?? {};
    docs.push({
      slug,
      title: decode(p.title.rendered).trim(),
      label: meta.label,
      city: meta.city,
      topic: meta.topic,
      statewide: !!meta.statewide,
      resource: !!meta.resource,
      // The live meta, not invented copy. `/new-seo-setup` will make these
      // editable; until then they are what the page already ranks with.
      metaTitle: (y.title ?? "").trim() || decode(p.title.rendered).trim(),
      metaDescription: (y.description ?? "").trim(),
      body,
      faqs,
      publishedAt: p.date,
      modifiedAt: p.modified,
      legacyId: p.id,
    });
  }

  if (!dry) {
    await mkdir(OUT, { recursive: true });
    await mkdir(IMG_DIR, { recursive: true });
    // A full run is authoritative: a page dropped from the manifest should
    // disappear here too. `--only` obviously must not sweep the other 108.
    if (!only) {
      const stale = (await readdir(OUT).catch(() => []))
        .filter((f) => f.endsWith(".json"))
        .filter((f) => !docs.some((d) => `${d.slug}.json` === f));
      for (const f of stale) await rm(join(OUT, f));
      if (stale.length) console.log(`removed ${stale.length} stale file(s)`);
    }
    for (const d of docs) await writeFile(join(OUT, `${d.slug}.json`), JSON.stringify(d, null, 2) + "\n");

    let copied = 0, fetched = 0;
    for (const [local, path] of imagesToCopy) {
      const dest = join(IMG_DIR, local);
      if (await access(dest).then(() => true, () => false)) continue;
      const fromScrape = join(SCRAPE, path);
      if (await access(fromScrape).then(() => true, () => false)) { await copyFile(fromScrape, dest); copied++; }
      else {
        const r = await fetch(`${SITE}${path}`);
        if (!r.ok) { warnings.push(`image ${path}: HTTP ${r.status}`); continue; }
        await writeFile(dest, Buffer.from(await r.arrayBuffer())); fetched++;
      }
    }
    console.log(`images: ${copied} from the scrape, ${fetched} fetched live, ${imagesToCopy.size} distinct`);
  }

  console.log(`${dry ? "converted (not written)" : "wrote"} ${docs.length} pages`);
  console.log(`blocks: ${docs.reduce((n, d) => n + d.body.length, 0)}   FAQ items: ${faqTotal}`);
  console.log(`map-spam links dropped to plain text: ${mapSpamDropped}`);
  if (warnings.length) {
    console.log(`\nwarnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 40)) console.log(`  ${w}`);
    if (warnings.length > 40) console.log(`  … ${warnings.length - 40} more`);
  }
}

await main();
