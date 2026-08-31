// The SEO layer's getters.
//
// NOT THE SAME FILE AS `lib/seo.ts`, and the split is this project's usual one:
// `lib/seo.ts` is pure logic — `resolveSeo`, `resolveTitle`, `canonicalize`,
// which take values and return values and touch nothing. This module FETCHES.
// A page imports the getter from here and the resolver from there.
//
// NOTHING HERE USES `required()`, WHICH IS DELIBERATE AND IS THE OPPOSITE OF
// EVERY OTHER GETTER IN `src/data/`. Those throw at build time when a singleton
// is missing, because a site with no phone number that builds green is the
// silent failure the whole convention exists to prevent. This layer is the
// other shape: EVERY FIELD IS A FALLBACK. A page with no `seo` block must
// render exactly what it rendered before the layer existed, and the Global SEO
// Settings document may genuinely not exist yet on a dataset nobody has opened.
// Throwing here would make the optional layer mandatory.
//
// SANITY SWAP POINT: none. This module IS the Sanity read.
import { sanityClient } from "sanity:client";
import {
  EDITOR_REDIRECTS_QUERY,
  GLOBAL_SEO_QUERY,
  PAGE_SEO_QUERY,
  STATIC_PAGE_SEO_QUERY,
} from "../sanity/lib/queries";
import { once } from "../sanity/lib/fetch";

/**
 * One page singleton's `seo` block, by document id.
 *
 * Returns null when the page has no SEO set, which every consumer already
 * handles — `resolveSeo(null, …)` is the no-op case.
 *
 * KEYED PER PAGE in `once()`, so the eleven page singletons cost eleven reads
 * across a build rather than eleven per page. These are singletons read once
 * each, not the per-page shape that made `astro dev` hang after Phase 3 — see
 * HANDOFF for why that distinction matters.
 */
export async function getSeo(pageId: string) {
  return await once(`seo:${pageId}`, async () =>
    sanityClient.fetch(PAGE_SEO_QUERY, { pageId })
  );
}

/**
 * `_updatedAt` and the noIndex flag for a batch of page singletons, for
 * `sitemap.xml`. One round trip for all of them rather than one per page.
 */
export async function getStaticPageSeo(ids: string[]) {
  return (
    (await once("seo:staticPages", async () =>
      sanityClient.fetch(STATIC_PAGE_SEO_QUERY, { ids })
    )) ?? []
  );
}

/**
 * The site-wide fallbacks: the crawl switch and the default share image.
 *
 * Read once per build and consumed by `Layout.astro` on every page and by
 * `robots.txt.ts`, so `once()` is doing real work here — without it this is one
 * fetch per page across 329 pages.
 */
export async function getGlobalSeo() {
  return await once("seo:global", async () => sanityClient.fetch(GLOBAL_SEO_QUERY));
}

/**
 * The redirects an editor added in the Studio.
 *
 * DELIBERATELY NOT IN `data/redirects.ts`, even though that is where redirects
 * live. `src/sanity/schemaTypes/collections/redirect.ts` imports that module
 * for its collision check, and the Sanity CLI parses schema files during
 * `npm run typegen` — where `sanity:client` does not resolve. One import here
 * would make the type gate fail with an error pointing at a Vite virtual
 * module, which is a long way from the cause.
 *
 * The two tiers stay separate all the way to the edge: `data/redirects.ts`
 * generates `vercel.json` at build time, this generates `bulk-redirects.json`.
 * See the note on the `redirect` schema type for why the 196 cutover rules did
 * not move.
 */
export async function getEditorRedirects() {
  return (
    (await once("seo:redirects", async () => sanityClient.fetch(EDITOR_REDIRECTS_QUERY))) ?? []
  );
}
