// JSON-LD builders.
//
// The site we're replacing marks the firm up as a `Product` carrying an
// `AggregateRating` with review stars. That is a Google structured-data policy
// violation (a law firm is not a product, and self-serving review markup on an
// organization is explicitly disallowed), and it is not carried over. The firm
// is a `LegalService`; people are `Attorney`; posts are `BlogPosting`.
//
// Deliberately absent: any AggregateRating. The homepage's "5.0 on Google"
// card is presentational copy, and must stay that way.

import type { FirmDetails } from "../data/site";

/** The firm itself. Rendered once, in Layout, on every page. */
export function legalServiceSchema(
  firm: FirmDetails,
  siteUrl: string,
  logoUrl?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${siteUrl}/#organization`,
    name: firm.name,
    legalName: firm.legalName,
    url: siteUrl,
    ...(logoUrl ? { logo: logoUrl, image: logoUrl } : {}),
    telephone: firm.phoneE164,
    ...(firm.email ? { email: firm.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: firm.address.unit
        ? `${firm.address.street}, ${firm.address.unit}`
        : firm.address.street,
      addressLocality: firm.address.city,
      addressRegion: firm.address.region,
      postalCode: firm.address.postalCode,
      addressCountry: firm.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: firm.geo.lat,
      longitude: firm.geo.lng,
    },
    hasMap: firm.mapUrl,
    openingHours: firm.hours,
    priceRange: "Free Consultation",
    areaServed: { "@type": "State", name: "Colorado" },
    sameAs: firm.socials,
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

/** Breadcrumbs. Pass the trail without the site root — it is prepended here. */
export function breadcrumbSchema(entries: BreadcrumbEntry[], siteUrl: string) {
  const trail = [{ name: "Home", path: "/" }, ...entries];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: `${siteUrl}${entry.path === "/" ? "" : entry.path}`,
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * FAQ markup. Only emit this where the questions and answers are genuinely
 * visible on the page — Google requires it, and our FAQ blocks use <details>
 * precisely so the answers are in the DOM and indexable.
 */
export function faqSchema(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}
