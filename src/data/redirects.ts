/**
 * SANITY SWAP POINT — editor-managed redirects.
 *
 * Rhan's direction is that these eventually live in Sanity, so the shape here
 * is already the one a `redirect` document will project: a flat list of
 * `{ from, to, permanent }`, no platform syntax. When the CMS
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
  /**
   * The path AS LINKED AND INDEXED — with its trailing slash, matching ROUTES.
   * NOT `normalizePath`'s comparison form: Vercel normalizes an incoming
   * request to the trailing-slash shape before matching `redirects`, so a
   * source without one would never fire. The comparison form is still used for
   * the checks below, where the slash must not matter.
   */
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

/**
 * Legacy URL SHAPES for pages this build already serves.
 *
 * Nine paths, twenty-five in-body links. Every destination is a page we build —
 * these are the same documents under the path form the old site used before it
 * went flat, and the legacy site 301s most of them itself. They surfaced from a
 * sweep of the imported bodies for hrefs with no matching page in `dist/`.
 *
 * Three groups:
 *
 *  - `/news/<slug>` — the blog before it moved to the root. WordPress already
 *    301s these; this keeps that behaviour after cutover.
 *  - `/practice-areas/<slug>` — the legacy hub links its children RELATIVELY
 *    and without a `../`, so they resolve under the hub. That is also why three
 *    of these pages were recorded in HANDOFF as having "no page anywhere": the
 *    hub's own links 404, so the pages looked absent when they were live all
 *    along.
 *  - `/why-hire-personal-injury-attorney` and its testimonials child. The
 *    parent already 301s to `/about/` upstream and is not in the REST page
 *    list at all; the child is the legacy "Client Testimonials" page, which is
 *    `/testimonials/` here.
 *
 * WRITTEN OUT RATHER THAN WILDCARDED. A `/news/:slug` rule would cover the
 * three above and anything else, but it also claims every future path under
 * `/news/`, and this list is going into a CMS where an editor has to be able to
 * read a rule and know what it does. Three explicit rules cost nothing.
 */
const LEGACY_PATH_FORMS: ReadonlyArray<readonly [from: string, to: string]> = [
  ["/news/who-is-liable-in-a-denver-truck-accident/", "/who-is-liable-in-a-denver-truck-accident/"],
  ["/news/what-are-common-types-of-product-defects/", "/what-are-common-types-of-product-defects/"],
  [
    "/news/understanding-plaintiff-status-under-colorados-premises-liability-act/",
    "/understanding-plaintiff-status-under-colorados-premises-liability-act/",
  ],
  ["/practice-areas/legal-malpractice-attorney/", "/legal-malpractice-attorney/"],
  ["/practice-areas/denver-life-insurance-bad-faith-lawyer/", "/denver-life-insurance-bad-faith-lawyer/"],
  ["/practice-areas/denver-pet-insurance-bad-faith-lawyer/", "/denver-pet-insurance-bad-faith-lawyer/"],
  [
    "/practice-areas/personal-injury-attorney/defective-product-liability/colorado-defective-helmet/",
    "/colorado-defective-helmet/",
  ],
  ["/why-hire-personal-injury-attorney/client-review-testimonial/", ROUTES.testimonials],
  ["/why-hire-personal-injury-attorney/", ROUTES.about],
];

/**
 * THE 24 COMMUNITY WRITE-UPS, all to the page that covers what they are about.
 *
 * WordPress PAGES rather than posts — the third bucket of that shape this
 * project has hit, after the fourteen article-pages that went into the blog and
 * the five slip-and-fall ones. `scripts/practice-area-pages.mjs` excluded every
 * one of them as a "community involvement write-up", which was right for THAT
 * import and left them with no home at all: nothing here served them and
 * nothing redirected them, so all 24 would have 404'd at cutover while still
 * being live and linked from the firm's own community page.
 *
 * NOT IMPORTED AS POSTS, BY REQUEST, AND THE LENGTHS ARE WHY. They run 32 to
 * 560 words — photo-led notes about a volunteering day, not articles. Craig
 * Hospital's is a caption. Twenty-four of those in `/news` would be a quarter
 * of the feed and would devalue the legal writing around them.
 *
 * THE CONTENT IS NOT LOST, WHICH IS WHAT MAKES THIS THE RIGHT DESTINATION.
 * `/community-involvement/` carries the eleven partner cards and the
 * sponsorships — the same organisations these write-ups are about. A reader
 * arriving from a 2025 Google result lands on the firm's account of that work.
 *
 * ONE DESTINATION, WRITTEN OUT RATHER THAN WILDCARDED, for the same reason the
 * legacy path forms above are: this list is going into a CMS where an editor
 * has to read a rule and know what it does, and a pattern claiming 24 root
 * slugs would also claim every future one.
 */
const COMMUNITY_WRITE_UPS: readonly string[] = [
  "/2023-big-little-gala-hosted-by-big-brothers-big-sisters-of-colorado/",
  "/a-great-success-at-the-2025-cca-convention/",
  "/a-week-of-cinema-at-the-denver-film-festival-48/",
  "/back-to-clothes-to-kids-denver/",
  "/big-brothers-big-sisters-annual-big-little-gala/",
  "/big-brothers-big-sisters-annual-big-little-gala-2025/",
  "/cba-well-being-symposium-spring-summit/",
  "/clothes-to-kids-denver/",
  "/craig-hospital/",
  "/dinner-at-the-ronald-mcdonald-house/",
  "/dinner-at-the-ronald-mcdonald-house-2/",
  "/dressed-for-success-dormer-harpring-volunteers-at-clothes-to-kids-denver/",
  "/dumb-friends-league/",
  "/giving-back-at-craig-hospital/",
  "/giving-back-with-the-park-people/",
  "/highlights-from-the-2025-dmar-inaugural/",
  "/jassy-rendezvous-fundraising-gala/",
  "/project-angel-heart/",
  "/standing-together-for-access-and-expression-with-the-cwba/",
  "/stepping-up-for-a-cause-our-2025-pikes-peak-challenge-experience/",
  "/true-companions-animal-shelter-clinic/",
  "/volunteer-day-project-cure/",
  "/volunteering-at-metro-carings-fresh-foods-market/",
  "/we-dont-waste/",
];

export async function getRedirects(): Promise<Redirect[]> {
  const list: Redirect[] = [
    ...CATEGORY_ARCHIVES.map(([from, to]) => ({
      _key: `cat-${normalizePath(from).split("/").pop()}`,
      from,
      to,
      permanent: true,
    })),
    ...LEGACY_PATH_FORMS.map(([from, to]) => ({
      _key: `legacy-${normalizePath(from).split("/").filter(Boolean).join("-")}`,
      from,
      to,
      permanent: true,
    })),
    ...COMMUNITY_WRITE_UPS.map((from) => ({
      _key: `community-${normalizePath(from).split("/").filter(Boolean).join("-")}`,
      from,
      to: ROUTES.community,
      permanent: true,
    })),
  ];

  // Loud rather than silent, the way getStaticPaths checks its slug union.
  // A redirect that never fires is invisible in every build log; these two
  // mistakes are the ones that produce it.
  // Compared in `normalizePath`'s form so `/category/x` and `/category/x/`
  // cannot both slip through as if they were different rules.
  const seen = new Set<string>();
  for (const r of list) {
    if (isReservedPath(r.from)) {
      throw new Error(
        `redirects: "${r.from}" is a RESERVED_PATH — a page file serves it, so ` +
          `the redirect would never fire.`
      );
    }
    if (seen.has(normalizePath(r.from))) {
      throw new Error(`redirects: "${r.from}" is listed twice; the second would never fire.`);
    }
    seen.add(normalizePath(r.from));
  }

  return list;
}
