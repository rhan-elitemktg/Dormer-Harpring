/**
 * SANITY SWAP POINT — editor-managed redirects.
 *
 * Rhan's direction is that these eventually live in Sanity, so the shape here
 * is already the one a `redirect` document will project: a flat list of
 * `{ from, to, permanent }`, paths normalized, no platform syntax. When the CMS
 * phase lands, `getRedirects()`'s body becomes a `sanityClient.fetch(...)` and
 * `scripts/build-redirects.ts` — the only consumer — does not change.
 *
 * WHY THIS EXISTS NOW. The legacy site serves a category archive at
 * `/category/<slug>/` for all 24 of its populated categories, and every one of
 * them is a live 200 today. THIS BUILD SERVES NO SUCH PAGE: the blog index
 * filters by query string instead (`blogFilterUrl`), so at cutover all 24 would
 * become 404s on URLs Google currently has indexed. That is the whole of the
 * list below.
 *
 * Post URLs themselves need nothing — they are flat at the root here exactly as
 * they are on WordPress, which is why `blogPath()` is `/${slug}`.
 *
 * NOT A REDIRECT, DELIBERATELY: `/category/accidents-in-the-news/`. It already
 * 301s to accidentnews.denvertrial.com, a separate site the firm runs. Claiming
 * it here would hijack a live redirect of theirs and point their own traffic
 * back at us. If that subdomain is ever retired, this is where the replacement
 * goes.
 */
import { ROUTES, blogCategoryPath, blogFilterUrl, isReservedPath, normalizePath } from "../lib/routePaths";

export interface Redirect {
  _key: string;
  /** Canonical path form — leading slash, no trailing slash, lowercase. */
  from: string;
  /** A path on this site, or an absolute URL. */
  to: string;
  /** 308 vs 307. Every legacy redirect here is permanent; an editor-created
   *  one may not be, which is why it is a field rather than an assumption. */
  permanent: boolean;
}

/**
 * The 23 categories that survive the import, plus the two that do not.
 *
 * `articles` is Uncategorized — the slug is NOT `uncategorized`, and the
 * archive carries 11 real posts. Those posts were reassigned individually (see
 * scripts/blog-category-overrides.mjs), so there is no single category to send
 * this archive to; it goes to the unfiltered index.
 *
 * `darcare-injuries` is the firm's typo for Daycare. It has no posts, but the
 * URL is live, so it is pointed at the correctly spelled category.
 */
const CATEGORY_ARCHIVES: ReadonlyArray<readonly [from: string, to: string]> = [
  ...[
    "auto-accident",
    "personal-injury",
    "auto-insurance-accident-claims",
    "motorcycle-accidents",
    "truck-accidents",
    "verdicts",
    "product-liability",
    "trials",
    "dating-apps",
    "ski-accident",
    "wrongful-death",
    "awards",
    "news",
    "premises-liability",
    "dog-bites",
    "laws",
    "medical-malpractice",
    "slip-and-fall",
    "bike-accidents",
    "burn-injury",
    "daycare-injury",
    "pedestrian-accident",
    "trampoline-park-injuries",
  ].map((slug) => [blogCategoryPath(slug), blogFilterUrl(slug)] as const),
  [blogCategoryPath("articles"), ROUTES.blog],
  [blogCategoryPath("darcare-injuries"), blogFilterUrl("daycare-injury")],
];

export async function getRedirects(): Promise<Redirect[]> {
  const list: Redirect[] = CATEGORY_ARCHIVES.map(([from, to]) => ({
    _key: `cat-${normalizePath(from).split("/").pop()}`,
    from: normalizePath(from),
    to,
    permanent: true,
  }));

  // Loud rather than silent, the way getStaticPaths checks its slug union.
  // A redirect that never fires is invisible in every build log; these two
  // mistakes are the ones that produce it.
  const seen = new Set<string>();
  for (const r of list) {
    if (isReservedPath(r.from)) {
      throw new Error(
        `redirects: "${r.from}" is a RESERVED_PATH — a page file serves it, so ` +
          `the redirect would never fire.`
      );
    }
    if (seen.has(r.from)) {
      throw new Error(`redirects: "${r.from}" is listed twice; the second would never fire.`);
    }
    seen.add(r.from);
  }

  return list;
}
