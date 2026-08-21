// Pulls the blog taxonomy from the legacy WordPress site and writes the
// `blogCategories` content collection.
//
// RERUNNABLE AND AUTHORITATIVE. The category set is the live site's, not ours —
// run this again and the collection is rebuilt from source. Anything hand-typed
// into src/content/blog-categories would be overwritten, so edit the RULES here
// instead. The three of them are editorial decisions, recorded so the next
// session does not have to re-derive them:
//
//   1. UNCATEGORIZED IS DROPPED. Its WordPress slug is `articles`, NOT
//      `uncategorized`, and /category/articles/ is a live 200 carrying 11
//      posts — so dropping it orphans a real indexed URL. Those 11 posts are
//      reassigned by hand (see scripts/blog-category-overrides.mjs)
//      and the archive is redirected in data/redirects.ts.
//
//   2. EMPTY CATEGORIES ARE DROPPED. Two carry no posts:
//      `accidents-in-the-news` and `darcare-injuries` (a typo for Daycare).
//      `accidents-in-the-news` already 301s off to accidentnews.denvertrial.com,
//      a separate site the firm runs — so it is deliberately NOT recreated
//      here, and the redirect layer must not claim that path either.
//
//   3. NAMES ARE DECODED. WordPress returns `Auto Insurance &amp; Accident
//      Claims`; an editor should never see an entity in a title field.
import { writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const API = "https://www.denvertrial.com/wp-json/wp/v2";
const OUT = "src/content/blog-categories";

/** WordPress term ids that never become categories here. See RULES above. */
const DROP_IDS = new Set([1]); // Uncategorized (slug `articles`)

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;|&#8217;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();

const res = await fetch(`${API}/categories?per_page=100&_fields=id,slug,name,count`);
if (!res.ok) throw new Error(`categories: HTTP ${res.status}`);
const live = await res.json();

const kept = live
  .filter((c) => !DROP_IDS.has(c.id))
  .filter((c) => c.count > 0) // rule 2: unused categories are dropped
  .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));

const dropped = live.filter((c) => !kept.includes(c));

await mkdir(OUT, { recursive: true });
// Rebuild from scratch so a category removed upstream disappears here too.
for (const f of await readdir(OUT).catch(() => [])) {
  if (f.endsWith(".json")) await unlink(join(OUT, f));
}

for (const c of kept) {
  const doc = { title: decode(c.name), slug: c.slug, legacyId: c.id };
  await writeFile(join(OUT, `${c.slug}.json`), JSON.stringify(doc, null, 2) + "\n");
}

console.log(`wrote ${kept.length} categories to ${OUT}`);
for (const c of kept) console.log(`  ${String(c.count).padStart(3)}  ${c.slug}`);
console.log(`\ndropped ${dropped.length}:`);
for (const c of dropped)
  console.log(`  ${c.slug} (${c.count} posts) — ${DROP_IDS.has(c.id) ? "rule 1" : "rule 2"}`);
