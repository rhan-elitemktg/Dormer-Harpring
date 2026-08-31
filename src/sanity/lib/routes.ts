// EVERY URL THIS SITE SERVES, in one place.
//
// WHY A MODULE AND NOT INLINE IN `sitemap.xml.ts`. Two consumers need this list
// and they need it to agree: the XML sitemap tells Google what exists, and the
// redirect generator needs to know what exists so it can refuse to redirect
// away from a live page. Two copies of "what URLs exist" drift, and the two
// failures that drift produces are a page Google never learns about and a page
// a redirect quietly takes off the site.
//
// COMPOSED FROM THE COLLECTION GETTERS, NOT FROM THE DIRECTORY. That is the
// same call `src/pages/sitemap.astro` documents at length and for the same
// reason: `getPracticeAreaGroups()` is synced to the firm's live hub, and the
// hub omits four built pages. A sitemap built off the hub inherits that hole
// silently. Reading the collections instead is complete by construction.
//
// The human `/sitemap/` page composes its own GROUPING and LABELS on top of the
// same getters — that part is presentation and stays there. Membership comes
// from the same source in both, so the two cannot disagree about which pages
// exist.
import { getBlogPosts, getFeaturedPost } from "../../data/blog";
import { getPracticeAreaDetails } from "../../data/carAccidents";
import { getPracticeAreaArticles } from "../../data/practiceAreaPages";
import { getTeamProfiles } from "../../data/team";
import { getStaticPageSeo } from "../../data/seo";
import { attorneyPath, normalizePath, RESERVED_PATHS, ROUTES } from "../../lib/routePaths";
import { once } from "./fetch";

export interface SiteEntry {
  /** The path as the site links it — leading AND trailing slash. */
  path: string;
  /** ISO date for `<lastmod>`, when the source knows one. */
  lastmod?: string;
  /** True when this page asked to stay out of search. */
  noIndex: boolean;
}

/**
 * The fixed routes, paired with the document each reads its `seo` from.
 *
 * THE ONE THING HERE THAT IS NOT DERIVED, and it is written out rather than
 * looped over `ROUTES` because those two lists differ in both directions:
 * `ROUTES` also holds `consult` (an endpoint, not a page) and there is no
 * ROUTES entry for `/404/`, which is a page file with no URL worth listing.
 *
 * Adding a static page means adding it here. `check:links` will not catch the
 * omission — a page missing from the sitemap is still linked and still builds.
 */
const STATIC_ROUTES: ReadonlyArray<readonly [path: string, pageId: string]> = [
  [ROUTES.home, "homePage"],
  [ROUTES.about, "aboutPage"],
  [ROUTES.attorneys, "teamPage"],
  [ROUTES.practiceAreas, "practiceAreasPage"],
  [ROUTES.results, "resultsPage"],
  [ROUTES.testimonials, "testimonialsPage"],
  [ROUTES.coCounsel, "coCounselPage"],
  [ROUTES.community, "communityPage"],
  [ROUTES.blog, "blogIndexPage"],
  [ROUTES.contact, "contactPage"],
  [ROUTES.thankYou, "thankYouPage"],
  [ROUTES.privacy, "privacy"],
  [ROUTES.editorialGuidelines, "editorial"],
  [ROUTES.sitemap, "sitemap"],
];

/**
 * Every route the site serves, with its last-modified date and noIndex flag.
 *
 * MEMOIZED, because both consumers run in the same build and each would
 * otherwise re-read four collections. `once()` is the same helper every getter
 * uses; see the note in `fetch.ts` for why it caches for five seconds in dev
 * and forever in a build.
 */
export async function getSiteEntries(): Promise<SiteEntry[]> {
  return await once("routes:siteEntries", async () => {
    const [staticSeo, areas, details, posts, featured, profiles] = await Promise.all([
      getStaticPageSeo(STATIC_ROUTES.map(([, id]) => id)),
      getPracticeAreaArticles(),
      getPracticeAreaDetails(),
      getBlogPosts(),
      getFeaturedPost(),
      getTeamProfiles(),
    ]);

    const seoById = new Map(staticSeo.map((row) => [row._id, row]));

    const entries: SiteEntry[] = STATIC_ROUTES.map(([path, pageId]) => {
      const row = seoById.get(pageId);
      return {
        path,
        lastmod: row?._updatedAt ?? undefined,
        noIndex: row?.noIndex === true,
      };
    });

    /* The light practice-area template — 104 pages, flat at the root. The
       heavy one is a separate collection because both light getters filter out
       any slug the detail pages claim, so neither list contains the other's
       members and both are needed.

       `getPracticeAreaArticles()` rather than `getPracticeAreaPages()`: same
       104 records, but the article shape carries `publishedAt`/`updatedAt` and
       the page shape does not. A `<lastmod>` a crawler can trust is most of the
       value of a sitemap on a 329-page site. */
    for (const area of areas) {
      entries.push({
        path: `/${area.slug}/`,
        lastmod: area.updatedAt || area.publishedAt || undefined,
        noIndex: false,
      });
    }
    for (const detail of details) {
      entries.push({ path: `/${detail.slug}/`, noIndex: false });
    }

    /* `[featured, ...posts]` — THE FEATURED POST IS NOT IN `getBlogPosts()`.
       It is its own getter, and a list built from the feed alone silently omits
       one live, linked article. `sitemap.astro` already unions the two; this
       missed it until the built pages were diffed against this list, which is
       precisely the drift two copies of "what exists" produce.

       `href` rather than the slug: a post whose article has no body has no page
       and carries a null href — see the note in `[slug].astro`. Listing it
       would put a 404 in the sitemap. */
    for (const post of [featured, ...posts]) {
      if (!post?.href) continue;
      entries.push({
        /* `updatedAt` first — it is stamped on publish when the body changes, so
           it is the date that answers "has this been revised". `publishedAt` is
           the fallback for a post never edited since the import. */
        path: post.href,
        lastmod: post.updatedAt || post.publishedAt || undefined,
        noIndex: false,
      });
    }

    for (const profile of profiles) {
      entries.push({ path: attorneyPath(profile.slug), noIndex: false });
    }

    /* Deduplicated on the comparison form, so `/About/` and `/about` cannot
       both survive. Two entries for one URL is a crawl-budget bug that reads as
       a typo in the output rather than as a bug in here. */
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = normalizePath(entry.path);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
}

/**
 * Every live path, in `normalizePath`'s comparison form.
 *
 * THIS IS THE REDIRECT SAFETY NET. Vercel evaluates bulk redirects BEFORE the
 * filesystem, so a rule whose source is a page that still exists takes that
 * page off the site — a live, ranking URL replaced by a 301 to somewhere else,
 * with a green build and nothing reporting it. The generator drops any rule
 * whose source is in here.
 *
 * `RESERVED_PATHS` is unioned in rather than assumed to be a subset: it carries
 * `/admin`, which is not a built page and so is not in `getSiteEntries()`, and
 * a redirect away from `/admin` locks the SEO team out of the one tool they
 * would use to undo it.
 */
export async function getLivePaths(): Promise<Set<string>> {
  const entries = await getSiteEntries();
  return new Set([
    ...entries.map((entry) => normalizePath(entry.path)),
    ...RESERVED_PATHS,
  ]);
}
