// Resolves a page's <head> metadata.
//
// Every field is optional and every fallback is deliberate: a page that passes
// no `seo` block at all must render exactly the title and description it would
// have rendered without this module. That is what lets the editable-SEO layer
// be attached later with zero edits to any page.
//
// SANITY SWAP POINT: `ogImage` is a plain URL string today. When the Sanity
// phase lands, widen it to `string | SanityImageSource` and run the Sanity case
// through `urlFor(...).width(1200).height(630)`. Nothing else here changes.

export const SITE_NAME = "Dormer Harpring";

/** The `seo` object as the future GROQ queries will project it. */
export interface SeoInput {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
  ogImage?: string | null;
}

export interface ResolvedSeo {
  title: string;
  description?: string;
  canonical: string;
  noIndex: boolean;
  ogImage?: string;
}

/** Blank strings from the Studio count as "not set". */
const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * A page's absolute URL with any trailing slash dropped — the site's canonical
 * form. Shared with the sitemap so the two can never disagree.
 */
export const canonicalize = (url: URL | string) => {
  const href = typeof url === "string" ? url : url.href;
  return href.replace(/\/+$/, "");
};

/**
 * The full <title>. `metaTitle` replaces the page name only — " | Dormer
 * Harpring" is always appended, so nobody has to type the brand. A page whose
 * name already IS the brand (the homepage) is left bare rather than doubled.
 */
export function resolveTitle(seo: SeoInput | null | undefined, fallback: string) {
  const name = clean(seo?.metaTitle) ?? fallback;
  return name === SITE_NAME ? name : `${name} | ${SITE_NAME}`;
}

/** Everything Layout needs for the <head>. */
export function resolveSeo(
  seo: SeoInput | null | undefined,
  {
    fallbackTitle,
    fallbackDescription,
    pageUrl,
    defaultOgImage,
  }: {
    fallbackTitle: string;
    fallbackDescription?: string;
    pageUrl: URL;
    defaultOgImage?: string | null;
  }
): ResolvedSeo {
  return {
    title: resolveTitle(seo, fallbackTitle),
    description: clean(seo?.metaDescription) ?? clean(fallbackDescription),
    canonical: clean(seo?.canonicalUrl) ?? canonicalize(pageUrl),
    noIndex: seo?.noIndex === true,
    ogImage: clean(seo?.ogImage) ?? clean(defaultOgImage),
  };
}
