// Imports the legacy WordPress blog into the `blog` content collection.
//
//   node scripts/import-blog-posts.mjs                 all 167
//   node scripts/import-blog-posts.mjs --only <slug>   one, for inspection
//   node scripts/import-blog-posts.mjs --dry           convert, write nothing
//
// SOURCE IS THE LIVE REST API, NOT THE SCRAPE. The scrape's post pages have no
// <article> wrapper, so pulling a body out of one means deciding what is
// content and what is theme by reading div soup — the class of mistake that
// looks finished and is wrong. `content.rendered` IS the body WordPress stored.
// The scrape is still used for IMAGES: 106 of the 109 distinct files are
// already downloaded there, so only the stragglers are fetched.
//
// WHAT COMES OUT is Portable Text, the shape `data/portableText.ts` defines and
// `Prose.astro` already renders — not Markdown. See content.config.ts.
//
// THE CONVERTER LIVES IN `lib/wp-portable-text.mjs`, shared with the
// practice-area importer. It is instantiated ONCE, below, and the posts are
// iterated in the order the API returns them — both deliberate. Its `mkKey` is
// a single run-scoped counter, so a second converter or a different iteration
// order rewrites every `_key` in all 167 files for no reason.
import { writeFile, mkdir, copyFile, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { CATEGORY_OVERRIDES, DROPPED_CATEGORY_SLUGS } from "./blog-category-overrides.mjs";
import { createConverter, decode } from "./lib/wp-portable-text.mjs";

const API = "https://www.denvertrial.com/wp-json/wp/v2";
const SCRAPE = join(homedir(), "Downloads/Dormer Harpring/sitesucker/www.denvertrial.com");
const OUT = "src/content/blog";
const IMG_DIR = join(OUT, "images");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const dry = args.includes("--dry");

/* ---------------------------------------------------------------- chrome ---
 * Plugin output that WordPress bakes into `content.rendered`. Every one of
 * these is already a real component on this site, so importing the markup
 * would ship a second, worse copy of something we build properly:
 *
 *   ez-toc          138 posts  → PostContents.astro
 *   contact-shortcode 96 posts → ContactForm.astro (and it is a fake form)
 *   user-shortcode    95 posts → the deferred `attorneyCard` object
 *   client-reviews    90 posts → TestimonialRail.astro
 *
 * Matched on a class PREFIX because the TOC's is version-stamped
 * (`ez-toc-v2_0_86`) and will change under us on a plugin update. */
const CHROME_CLASS_PREFIXES = [
  "ez-toc",
  "contact-shortcode",
  "user-shortcode",
  "client-reviews",
  "rating-img",
  "google-map-link",
  "test-intro",
  "coman-btn-block",
];

const { convertBody, imagesToCopy, warnings, warn } = createConverter({
  chromeClassPrefixes: CHROME_CLASS_PREFIXES,
});

// ------------------------------------------------------------------ main ---
async function fetchAll() {
  const posts = [];
  for (let page = 1; ; page++) {
    const url = `${API}/posts?per_page=100&page=${page}&_fields=id,slug,title,excerpt,content,categories,date,modified,featured_media`;
    const r = await fetch(url);
    if (r.status === 400) break;
    if (!r.ok) throw new Error(`posts page ${page}: HTTP ${r.status}`);
    const batch = await r.json();
    posts.push(...batch);
    if (batch.length < 100) break;
  }
  return posts;
}

/**
 * `featured_media` is an attachment ID, not a URL, so the media records have to
 * be fetched separately. 60 of the 167 posts have one; the other 107 get the
 * branded placeholder — see PostThumb.astro.
 */
async function featuredUrlById(ids) {
  const out = new Map();
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const r = await fetch(
      `${API}/media?include=${batch.join(",")}&per_page=100&_fields=id,source_url`
    );
    if (!r.ok) throw new Error(`media: HTTP ${r.status}`);
    for (const m of await r.json()) out.set(m.id, m.source_url);
  }
  return out;
}

async function categorySlugById() {
  const r = await fetch(`${API}/categories?per_page=100&_fields=id,slug`);
  return new Map((await r.json()).map((c) => [c.id, c.slug]));
}

async function main() {
  const [posts, catById] = await Promise.all([fetchAll(), categorySlugById()]);
  const featuredById = await featuredUrlById(posts.map((p) => p.featured_media));
  const { readdir } = await import("node:fs/promises");
  const validCats = new Set(
    (await readdir("src/content/blog-categories")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
  );

  const chosen = only ? posts.filter((p) => p.slug === only) : posts;
  if (only && !chosen.length) throw new Error(`no post with slug "${only}"`);

  const docs = [];
  for (const p of chosen) {
    const slug = p.slug;
    let cats = (p.categories || []).map((id) => catById.get(id)).filter(Boolean);
    cats = cats.filter((c) => !DROPPED_CATEGORY_SLUGS.has(c));
    if (!cats.length) cats = CATEGORY_OVERRIDES[slug] ?? [];
    if (!cats.length) throw new Error(`${slug}: no category, and no override. Add one to blog-category-overrides.mjs.`);
    for (const c of cats) if (!validCats.has(c)) throw new Error(`${slug}: category "${c}" is not in the collection.`);

    const body = convertBody(p.content.rendered, slug);
    if (!body.length) throw new Error(`${slug}: converted to an empty body.`);

    // The featured image, where there is one. Same queue as body images, so it
    // comes from the scrape when the scrape has it and only otherwise costs a
    // request.
    let image;
    const featuredUrl = featuredById.get(p.featured_media);
    if (featuredUrl) {
      const path = featuredUrl.replace(/^https?:\/\/(www\.)?denvertrial\.com/i, "").split("?")[0];
      if (path.startsWith("/wp-content/")) {
        const local = path.split("/").filter(Boolean).slice(-3).join("-").replace(/[^a-zA-Z0-9._-]/g, "-");
        imagesToCopy.set(local, path);
        image = `./images/${local}`;
      } else {
        warn(slug, `featured image is not on the firm's domain: ${featuredUrl.slice(0, 60)}`);
      }
    }

    docs.push({
      slug,
      title: decode(p.title.rendered).trim(),
      excerpt: decode(p.excerpt.rendered.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(),
      publishedAt: p.date,
      modifiedAt: p.modified,
      categories: cats,
      ...(image ? { image } : {}),
      body,
      factCheck: [],
      author: { name: "Dormer Harpring", href: "/about" },
      reviewer: { name: "K.C. Harpring", href: "/meet-our-attorneys/k-c-harpring" },
      legacyId: p.id,
    });
  }

  if (!dry) {
    await mkdir(OUT, { recursive: true });
    await mkdir(IMG_DIR, { recursive: true });
    for (const d of docs) await writeFile(join(OUT, `${d.slug}.json`), JSON.stringify(d, null, 2) + "\n");
    let copied = 0, fetched = 0;
    for (const [local, path] of imagesToCopy) {
      const dest = join(IMG_DIR, local);
      if (await access(dest).then(() => true, () => false)) continue;
      const fromScrape = join(SCRAPE, path);
      if (await access(fromScrape).then(() => true, () => false)) { await copyFile(fromScrape, dest); copied++; }
      else {
        const r = await fetch(`https://www.denvertrial.com${path}`);
        if (!r.ok) { warnings.push(`image ${path}: HTTP ${r.status}`); continue; }
        await writeFile(dest, Buffer.from(await r.arrayBuffer())); fetched++;
      }
    }
    console.log(`images: ${copied} from the scrape, ${fetched} fetched live`);
  }

  console.log(`${dry ? "converted (not written)" : "wrote"} ${docs.length} posts`);
  const blocks = docs.reduce((n, d) => n + d.body.length, 0);
  console.log(`blocks: ${blocks}`);
  if (warnings.length) {
    console.log(`\nwarnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 40)) console.log(`  ${w}`);
    if (warnings.length > 40) console.log(`  … ${warnings.length - 40} more`);
  }
}

await main();
