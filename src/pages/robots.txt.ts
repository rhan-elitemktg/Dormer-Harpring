// robots.txt, generated rather than static.
//
// A FILE IN `public/` WOULD SHADOW THIS AND CANNOT READ SANITY. That is the
// whole reason this is an endpoint: the "Discourage this site from being
// crawled" switch in Global SEO Settings has to be able to turn the whole site
// off from the Studio, and a static file cannot. If anyone ever adds
// `public/robots.txt`, it wins silently and the switch stops working.
//
// THE SWITCH IS BELT AND BRACES WITH THE META TAG, not a duplicate of it.
// `Disallow: /` asks a crawler not to FETCH a page; `noindex` asks it not to
// LIST one. A page that is disallowed but already indexed can stay in results
// with no snippet, because the crawler is not allowed to fetch it and read the
// noindex. Emitting both is what actually clears a staging site out of search —
// see Layout.astro, which is the other half.
import type { APIRoute } from "astro";
import { getGlobalSeo } from "../data/seo";

export const GET: APIRoute = async ({ site }) => {
  const globalSeo = await getGlobalSeo();
  const origin = (site?.href ?? "https://www.denvertrial.com/").replace(/\/+$/, "");

  /* `globalSeo` may be null — the document need not exist for the site to
     build, see `data/seo.ts`. Absent means "not discouraged", which is the
     safe default for production and the wrong one for staging. The Studio
     field's own description carries the launch warning. */
  const body = globalSeo?.discourageCrawling
    ? `# Every page on this site is currently asking not to be crawled.
# This is the "Discourage this site from being crawled" switch in
# Sanity → Site Settings → Global SEO Settings. Turn it OFF at launch.
User-agent: *
Disallow: /
`
    : `User-agent: *
Allow: /

# The Studio. Nothing here is a page, and a crawler following it gets a
# JavaScript application rather than content.
Disallow: /admin

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
