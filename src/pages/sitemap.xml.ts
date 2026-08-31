// The XML sitemap — the crawler file, not the human page.
//
// `/sitemap/` is `sitemap.astro`, which the footer links and a visitor reads.
// THIS is what `robots.txt` points at and what gets submitted to Search
// Console. They list the same pages and neither is derived from the other:
// both read `getSiteEntries()`, so they cannot disagree about what exists.
//
// HAND-ROLLED RATHER THAN `@astrojs/sitemap`, and the reason is `noIndex`. That
// integration's `filter` hook is synchronous, so it cannot await the Sanity
// read that says whether an editor asked to keep a page out of search — it can
// only filter on the URL string. A page flagged noIndex in the Studio would
// keep appearing here, which is a sitemap contradicting the page it lists: the
// one thing a sitemap must never do.
//
// Every URL is absolute off `site:` in astro.config.mjs — settled on www. See
// the note there; if that ever moves, every URL in this file moves with it.
import type { APIRoute } from "astro";
import { getSiteEntries } from "../sanity/lib/routes";
import { canonicalize } from "../lib/seo";

/**
 * XML has five characters that cannot appear raw in text. None of this site's
 * paths contain any of them today — they are slugs — but a path is a string
 * from a CMS, and the day one carries an ampersand this file would emit
 * malformed XML that Search Console rejects wholesale rather than per-URL.
 */
const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ site }) => {
  const entries = await getSiteEntries();

  /* `site` is set in astro.config.mjs. The fallback exists for a bare
     `astro dev`, which can run without it — the same fallback Layout.astro and
     the JSON-LD builder use, for the same reason. */
  const origin = (site?.href ?? "https://www.denvertrial.com/").replace(/\/+$/, "");

  const urls = entries
    /* A page that asked to stay out of search does not belong in the file whose
       job is to ask for indexing. `/404/` is not in `getSiteEntries()` at all —
       see STATIC_ROUTES there. */
    .filter((entry) => !entry.noIndex)
    .map((entry) => {
      const loc = escapeXml(`${origin}${canonicalize(entry.path)}`);
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod.slice(0, 10))}</lastmod>`
        : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
