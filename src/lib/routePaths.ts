// The single source of truth for every internal URL on the site.
//
// Nothing may hardcode an href in markup. Components and data modules call the
// helpers here, so that changing a URL shape is one edit rather than a
// site-wide grep — and so the sitemap, the nav, and the future editor-managed
// redirect validator all agree by construction.
//
// THIS MODULE MUST STAY DEPENDENCY-FREE. Sanity schema files import it (a
// redirect's validator needs to know which paths are already taken), and the
// Sanity CLI parses schema files during `typegen`, where the `sanity:client`
// Vite virtual module does not resolve. One transitive import of it here would
// break the whole typegen step.

/** URL shape decision: the legacy WordPress site is flat at the root
 *  (`/denver-car-accident-lawyer`, `/what-is-my-claim-worth`), and we keep it
 *  that way so ~300 live URLs need no redirect. Team pages keep their legacy
 *  `/meet-our-attorneys/<slug>` shape for the same reason — the live site has
 *  25 of them indexed, and `/attorneys/<slug>` would have cost 26 redirects to
 *  buy a slightly shorter URL. */
export const practiceAreaPath = (slug: string) => `/${slug}`;
export const locationPath = (slug: string) => `/${slug}`;
export const blogPath = (slug: string) => `/${slug}`;
export const communityPath = (slug: string) => `/${slug}`;
export const resourcePath = (slug: string) => `/${slug}`;
export const blogCategoryPath = (slug: string) => `/category/${slug}`;

/** Fixed routes. Referenced by the nav, the footer, and the sitemap. */
export const ROUTES = {
  home: "/",
  about: "/about",
  attorneys: "/meet-our-attorneys",
  practiceAreas: "/practice-areas",
  results: "/results",
  testimonials: "/testimonials",
  coCounsel: "/co-counsel",
  community: "/community-involvement",
  blog: "/news",
  contact: "/contact",
  thankYou: "/thank-you",
  privacy: "/privacy-policy",
  editorialGuidelines: "/editorial-guidelines",
} as const;

/** Declared after ROUTES so the shared prefix is read from one place. */
export const attorneyPath = (slug: string) => `${ROUTES.attorneys}/${slug}`;

/**
 * The blog index with one category already selected.
 *
 * NOT `blogCategoryPath`, which is the legacy WordPress `/category/<slug>`
 * archive — this build does not serve those and the tab row deliberately does
 * not link to them. This lands on `/news` and `scripts/blogFeed.ts` presses the
 * matching tab on load, so the link works as a link (right-click, new tab,
 * shareable) while the filtering stays client-side. With JS off it is still the
 * blog index with every post on it.
 */
export const blogFilterUrl = (slug: string) => `${ROUTES.blog}?category=${slug}`;

/**
 * Paths owned by a page file rather than a content document. A redirect may
 * never point *from* one of these — the file would win and the redirect would
 * silently never fire.
 */
export const RESERVED_PATHS: readonly string[] = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.attorneys,
  ROUTES.practiceAreas,
  ROUTES.results,
  ROUTES.testimonials,
  ROUTES.coCounsel,
  ROUTES.community,
  ROUTES.blog,
  ROUTES.contact,
  ROUTES.thankYou,
  ROUTES.privacy,
  ROUTES.editorialGuidelines,
  "/admin",
];

/**
 * Leading slash, no trailing slash, lowercase — the site's canonical path form.
 * Used before any comparison against RESERVED_PATHS or a document slug, so that
 * `/About/` and `about` both resolve to `/about`.
 */
export function normalizePath(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withSlash.replace(/\/+$/, "");
  return withoutTrailing || "/";
}

/** True when the path is served by a page file rather than a CMS document. */
export function isReservedPath(input: string): boolean {
  return RESERVED_PATHS.includes(normalizePath(input));
}
