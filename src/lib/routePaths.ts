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
export const practiceAreaPath = (slug: string) => `/${slug}/`;
export const locationPath = (slug: string) => `/${slug}/`;
export const blogPath = (slug: string) => `/${slug}/`;
export const communityPath = (slug: string) => `/${slug}/`;
export const resourcePath = (slug: string) => `/${slug}/`;
export const blogCategoryPath = (slug: string) => `/category/${slug}/`;

/**
 * Fixed routes. Referenced by the nav, the footer, and the sitemap.
 *
 * EVERY PATH CARRIES A TRAILING SLASH, matching `trailingSlash: "always"` in
 * astro.config.mjs and `"trailingSlash": true` in the generated vercel.json.
 * The three have to agree: Astro decides what it builds, Vercel decides what it
 * serves and redirects, and these decide what the site links to. If they
 * disagree, every internal link takes a needless redirect hop.
 *
 * WHY THE SLASH AND NOT THE BARE PATH. All ~300 indexed legacy URLs carry one —
 * WordPress 301s the bare form to it — so matching means those URLs keep
 * working exactly as Google already has them. Dropping it would quietly move
 * every URL on the site, which is the one thing the flat root shape exists to
 * prevent.
 */
export const ROUTES = {
  home: "/",
  about: "/about/",
  attorneys: "/meet-our-attorneys/",
  practiceAreas: "/practice-areas/",
  results: "/results/",
  testimonials: "/testimonials/",
  coCounsel: "/co-counsel/",
  community: "/community-involvement/",
  blog: "/news/",
  contact: "/contact/",
  thankYou: "/thank-you/",
  privacy: "/privacy-policy/",
  editorialGuidelines: "/editorial-guidelines/",
  /* The HUMAN sitemap, not `/sitemap.xml`. The footer used to link the XML file
     and nothing built it — 328 dead links. The XML one is a crawler file whose
     every URL is absolute off `site:` — settled on www — and it belongs to
     /new-seo-setup with robots.txt. */
  sitemap: "/sitemap/",

  /* THE ONE ENDPOINT, not a page — no HTML is served here and nothing links to
     it; it is the `action` of both forms. It lives in ROUTES anyway because the
     convention is that no internal URL is ever a literal in a component, and
     because the trailing slash below is load-bearing rather than cosmetic:
     `vercel.json` sets `trailingSlash: true`, so a POST to the bare
     `/api/consult` earns a 308 that re-sends the entire body. Matching the
     site's own slash rule here means the form posts straight to the function.

     It is deliberately NOT in RESERVED_PATHS: that list guards the ROOT slug
     namespace the blog and practice areas share, and this path is nested, so no
     slug can collide with it. */
  consult: "/api/consult/",
} as const;

/** Declared after ROUTES so the shared prefix is read from one place. */
export const attorneyPath = (slug: string) => `${ROUTES.attorneys}${slug}/`;

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
  ROUTES.sitemap,
  "/admin",
  // Stored in `normalizePath`'s COMPARISON form, because `isReservedPath`
  // normalizes its input before looking in here. Mapped rather than typed that
  // way so ROUTES stays the one place a path is written.
].map((path) => normalizePath(path));

/**
 * The COMPARISON form: leading slash, NO trailing slash, lowercase.
 *
 * NOT the form the site links in — that carries a trailing slash, see ROUTES.
 * This exists so two paths can be compared without the slash mattering, which
 * is what every caller actually wants: `/About/`, `/about` and `about` all
 * reduce to `/about`. Keeping it slash-free means the comparison survives
 * whichever convention the site links in, and it is why flipping the site to
 * trailing slashes did not have to touch a single comparison.
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
