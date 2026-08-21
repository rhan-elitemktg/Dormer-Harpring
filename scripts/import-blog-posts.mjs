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
import { readFile, writeFile, mkdir, copyFile, access } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { homedir } from "node:os";
import { parse } from "node-html-parser";
import { CATEGORY_OVERRIDES, DROPPED_CATEGORY_SLUGS } from "./blog-category-overrides.mjs";

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
const CHROME_TAGS = ["script", "style", "nav", "svg", "input", "label", "form", "noscript"];

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "figure", "table", "iframe", "img", "hr", "div", "section", "article"]);

/** Heading levels the renderer has a component for. h1 never appears in a body
 *  (the page's own title is the h1); h5/h6 do not occur in these 167. */
const HEADING_STYLE = { h2: "h2", h3: "h3", h4: "h4" };

let warnings = [];
const warn = (slug, msg) => warnings.push(`${slug}: ${msg}`);

// ------------------------------------------------------------------ keys ---
// Portable Text only requires a key to be unique inside its own array. A
// counter is stable across runs given the same input, which keeps re-imports
// from producing a diff of nothing but churned keys.
const mkKey = (() => { let n = 0; return (p = "b") => `${p}${(++n).toString(36)}`; })();

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
   .replace(/&#8217;|&rsquo;/g, "’").replace(/&#8216;|&lsquo;/g, "‘")
   .replace(/&#8220;|&ldquo;/g, "“").replace(/&#8221;|&rdquo;/g, "”")
   .replace(/&#8211;|&ndash;/g, "–").replace(/&#8212;|&mdash;/g, "—")
   .replace(/&nbsp;/g, " ").replace(/&hellip;/g, "…")
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

/* `querySelectorAll` reaches THROUGH a chrome wrapper. The walk checks each
 * element as it descends and never enters one, but lifting media out of a
 * paragraph queries the whole subtree — so a phone icon inside a
 * `coman-btn-block`, or an avatar inside `client-reviews`, comes back as if it
 * were content. Every such query has to re-check ancestors itself. */
const inChrome = (el) => {
  let n = el;
  while (n) {
    if (n.rawTagName && isChrome(n)) return true;
    n = n.parentNode;
  }
  return false;
};

const isChrome = (el) => {
  if (CHROME_TAGS.includes(el.rawTagName?.toLowerCase())) return true;
  const cls = el.getAttribute?.("class") || "";
  const id = el.getAttribute?.("id") || "";
  return CHROME_CLASS_PREFIXES.some(
    (p) => cls.split(/\s+/).some((c) => c.startsWith(p)) || id.startsWith(p)
  );
};

/* ------------------------------------------------------------- inline -----
 * Walks an element's inline descendants into Portable Text spans, carrying
 * marks down. `markDefs` collects link definitions, which Portable Text stores
 * beside the spans rather than on them.
 *
 * `b` and `strong` both become `strong`; `i` and `em` both become `em`. `u` and
 * `sup` are dropped to plain text deliberately — four instances in one post
 * each, and an underline renders as a link that is not one. */
function inlineSpans(node, marks, markDefs, slug) {
  const out = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = decode(child.rawText);
      if (text) out.push({ _type: "span", _key: mkKey("s"), text, marks: [...marks] });
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = child.rawTagName.toLowerCase();
    if (isChrome(child)) continue;

    if (tag === "br") {
      out.push({ _type: "span", _key: mkKey("s"), text: " ", marks: [...marks] });
    } else if (tag === "strong" || tag === "b") {
      out.push(...inlineSpans(child, [...new Set([...marks, "strong"])], markDefs, slug));
    } else if (tag === "em" || tag === "i") {
      out.push(...inlineSpans(child, [...new Set([...marks, "em"])], markDefs, slug));
    } else if (tag === "a") {
      const href = child.getAttribute("href");
      if (!href || href === "#") {
        // Same choice TeamCard.astro records: plain text beats a link to
        // nowhere. A dead href in a body is worse than a missing one.
        out.push(...inlineSpans(child, marks, markDefs, slug));
      } else {
        const key = mkKey("l");
        markDefs.push({ _key: key, _type: "link", href: normalizeHref(href) });
        out.push(...inlineSpans(child, [...marks, key], markDefs, slug));
      }
    } else {
      // u, sup, span, small, code, anything else: keep the words, drop the tag.
      out.push(...inlineSpans(child, marks, markDefs, slug));
    }
  }
  return out;
}

/** Absolute links back to the firm's own domain become site-relative, so they
 *  keep working after cutover and stop pointing at the site being replaced. */
function normalizeHref(href) {
  const h = decode(href.trim());
  return h.replace(/^https?:\/\/(www\.)?denvertrial\.com/i, "") || "/";
}

/** Collapses runs of whitespace and drops spans that became empty. */
function tidy(spans) {
  const kept = [];
  for (const s of spans) {
    const text = s.text.replace(/\s+/g, " ");
    if (!text) continue;
    const last = kept[kept.length - 1];
    // Merge adjacent spans carrying identical marks — otherwise every <span>
    // WordPress emits becomes its own Portable Text span for no reason.
    if (last && JSON.stringify(last.marks) === JSON.stringify(s.marks)) last.text += text;
    else kept.push({ ...s, text });
  }
  if (kept.length) {
    kept[0].text = kept[0].text.replace(/^\s+/, "");
    kept[kept.length - 1].text = kept[kept.length - 1].text.replace(/\s+$/, "");
  }
  return kept.filter((s) => s.text);
}

const block = (style, spans, markDefs, extra = {}) =>
  spans.length ? { _type: "block", _key: mkKey(), style, markDefs, children: spans, ...extra } : null;

function textBlock(el, style, slug) {
  const markDefs = [];
  const spans = tidy(inlineSpans(el, [], markDefs, slug));
  // Only the link defs actually referenced by a surviving span.
  const used = new Set(spans.flatMap((s) => s.marks));
  return block(style, spans, markDefs.filter((d) => used.has(d._key)));
}

function listBlocks(el, listItem, slug) {
  const out = [];
  for (const li of el.querySelectorAll(":scope > li")) {
    const b = textBlock(li, "normal", slug);
    if (b) out.push({ ...b, listItem, level: 1 });
  }
  return out;
}

/* The single table, in colorado-auto-insurance-coverage-overview: 3 rows of 3.
 * Portable Text has no table, and building an object type for one post is not
 * worth it, so at Rhan's direction it becomes a list — first cell as the term
 * in bold, the rest as the definition. */
function tableBlocks(el, slug) {
  const out = [];
  const rows = el.querySelectorAll("tr");
  for (const tr of rows) {
    const cells = tr.querySelectorAll("th, td");
    if (!cells.length) continue;
    const markDefs = [];
    const spans = [];
    cells.forEach((cell, i) => {
      const inner = tidy(inlineSpans(cell, i === 0 ? ["strong"] : [], markDefs, slug));
      if (!inner.length) return;
      if (spans.length) spans.push({ _type: "span", _key: mkKey("s"), text: " — ", marks: [] });
      spans.push(...inner);
    });
    const b = block("normal", tidy(spans), markDefs);
    if (b) out.push({ ...b, listItem: "bullet", level: 1 });
  }
  warn(slug, `table converted to a ${out.length}-item list`);
  return out;
}

// ----------------------------------------------------------------- images ---
const imagesToCopy = new Map(); // localName -> source path or URL

function imageNode(el, slug) {
  const rawSrc = el.getAttribute("src");
  if (!rawSrc) return null;
  const clean = decode(rawSrc).split("?")[0];
  const path = clean.replace(/^https?:\/\/(www\.)?denvertrial\.com/i, "");
  if (!path.startsWith("/wp-content/")) {
    warn(slug, `image is not on the firm's domain, skipped: ${clean.slice(0, 70)}`);
    return null;
  }
  // Flat filenames, prefixed by the uploads year/month so two "image-1.jpg"
  // from different months cannot collide.
  const parts = path.split("/").filter(Boolean);
  const local = parts.slice(-3).join("-").replace(/[^a-zA-Z0-9._-]/g, "-");
  imagesToCopy.set(local, path);
  const alt = decode(el.getAttribute("alt") || "").trim();
  if (!alt) warn(slug, `image has no alt text: ${local}`);
  return { _type: "image", _key: mkKey("i"), src: `./images/${local}`, alt };
}

/* ------------------------------------------------------------- the walk ---
 * Block-level elements in document order. A `div` is recursed INTO rather than
 * emitted — WordPress wraps real paragraphs in layout divs, so treating one as
 * a block would swallow its children. */
function walk(node, slug, out) {
  for (const el of node.childNodes) {
    if (el.nodeType === 3) {
      const text = decode(el.rawText).trim();
      if (text) {
        // A bare text node between blocks — rare, but it is real copy.
        const b = block("normal", tidy([{ _type: "span", _key: mkKey("s"), text, marks: [] }]), []);
        if (b) out.push(b);
      }
      continue;
    }
    if (el.nodeType !== 1) continue;
    const tag = el.rawTagName.toLowerCase();
    if (isChrome(el)) continue;

    if (HEADING_STYLE[tag]) {
      const b = textBlock(el, HEADING_STYLE[tag], slug);
      if (b) out.push(b);
    } else if (tag === "h1" || tag === "h5" || tag === "h6") {
      // Not renderable. h1 would duplicate the page title; h5/h6 do not occur.
      warn(slug, `<${tag}> demoted to h4`);
      const b = textBlock(el, "h4", slug);
      if (b) out.push(b);
    } else if (tag === "p") {
      /* A PARAGRAPH CAN CARRY MEDIA AND TEXT AT ONCE, and an earlier version of
         this only handled a <p> that was NOTHING BUT an image — anything else
         went to the inline walker, which keeps words and drops tags, so an
         image or an iframe sharing a paragraph with a sentence vanished with no
         warning. That is how the three Google My Maps escaped their flag and
         ten images went missing. Media is lifted out FIRST, then whatever text
         is left becomes the block. */
      for (const media of el.querySelectorAll("img, iframe")) {
        if (inChrome(media)) { media.remove(); continue; }
        if (media.rawTagName.toLowerCase() === "img") {
          const n = imageNode(media, slug);
          if (n) out.push(n);
        } else {
          noteDroppedMap(media, slug);
        }
        media.remove();
      }
      const b = textBlock(el, "normal", slug);
      if (b) out.push(b);
    } else if (tag === "ul") {
      out.push(...listBlocks(el, "bullet", slug));
    } else if (tag === "ol") {
      out.push(...listBlocks(el, "number", slug));
    } else if (tag === "blockquote") {
      // A blockquote wraps paragraphs; each becomes its own quote block.
      const inner = [];
      walk(el, slug, inner);
      for (const b of inner) out.push(b._type === "block" ? { ...b, style: "blockquote", listItem: undefined, level: undefined } : b);
    } else if (tag === "img") {
      const n = imageNode(el, slug);
      if (n) out.push(n);
    } else if (tag === "figure") {
      for (const media of el.querySelectorAll("img, iframe")) {
        if (inChrome(media)) continue;
        if (media.rawTagName.toLowerCase() === "img") {
          const n = imageNode(media, slug);
          if (n) out.push(n);
        } else noteDroppedMap(media, slug);
      }
    } else if (tag === "table") {
      out.push(...tableBlocks(el, slug));
    } else if (tag === "iframe") {
      noteDroppedMap(el, slug);
    } else if (tag === "hr" || tag === "br") {
      // No Portable Text equivalent, and nothing depends on it.
    } else {
      // div, section, article, span-wrapped content: recurse.
      walk(el, slug, out);
    }
  }
}

/* Three Google My Maps of crash sites. Dropped at Rhan's direction, with the
 * map id recorded — the map lives in the firm's Google account and outlives the
 * post, so the id is enough to restore it later. */
function noteDroppedMap(el, slug) {
  const src = decode(el.getAttribute("src") || "");
  const mid = /[?&]mid=([^&"]+)/.exec(src)?.[1];
  warn(slug, `TODO(launch): Google My Map dropped — mid=${mid ?? "unknown"}`);
}

/* THE AUDIT. Every count below is a thing the source had; if the conversion
 * did not account for it, the difference is content that disappeared without
 * anyone being told. Written after an <img> inside a text paragraph did exactly
 * that, ten times, while the run reported one warning and looked clean. */
function countSourceImages(root) {
  return root.querySelectorAll("img").filter((el) => !inChrome(el)).length;
}

/* COUNTED BEFORE THE WALK, NOT AFTER. The walk calls `.remove()` to lift media
 * out of a paragraph, so counting the tree afterwards finds nothing and the
 * audit reports a negative — which is exactly what it did the first time. */
function audit(imgs, blocks, slug) {
  const emitted = blocks.filter((b) => b._type === "image").length;
  const skipped = warnings.filter((w) => w.startsWith(`${slug}: image is not on`)).length;
  if (imgs !== emitted + skipped) {
    warn(slug, `AUDIT: ${imgs} images in the source, ${emitted} emitted, ${skipped} skipped — ${imgs - emitted - skipped} unaccounted for`);
  }
}

export function convertBody(htmlString, slug) {
  const root = parse(htmlString, { blockTextElements: { script: false, style: false } });
  const sourceImages = countSourceImages(root);
  const out = [];
  walk(root, slug, out);
  audit(sourceImages, out, slug);
  return out;
}

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

const known = new Set(
  (await readFile("src/content/blog-categories", "utf8").catch(() => null))
    ? []
    : []
);

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
