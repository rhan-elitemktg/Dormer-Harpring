// Firm-wide facts: NAP, phones, hours, socials.
//
// SANITY SWAP POINT. This module is shaped exactly as the future
// `src/sanity/lib/firmDetails.ts` will be: an async function returning the
// projection of a `firmDetails` singleton. When the Sanity phase lands, the
// body becomes a `sanityClient.fetch(...)` and the only other change is the
// import line in whichever files call it. Keep the shape and the export name.
//
// Nothing in the codebase may hardcode a phone number or address — everything
// reads from here, so the launch-day swap to a live CallRail number is one edit.

export interface FirmAddress {
  street: string;
  unit?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface SocialLink {
  /** Platform key — must match a glyph in `components/icons/SocialIcon.astro`. */
  name: string;
  href: string;
}

export interface FirmDetails {
  name: string;
  legalName: string;
  /** The number shown and dialled everywhere. */
  phone: string;
  /** E.164, for `tel:` hrefs and JSON-LD. */
  phoneE164: string;
  /** The footer's "Text" number. */
  sms: string;
  smsE164: string;
  email?: string;
  address: FirmAddress;
  geo: { lat: number; lng: number };
  mapUrl: string;
  /** schema.org `openingHours`. Must describe the same hours as `hoursDisplay`. */
  hours: string;
  /** The same hours written for a human. Shown on the contact page. */
  hoursDisplay: string;
  /** Rendered as icons in the footer. Each `name` needs a glyph. */
  socials: SocialLink[];
  /**
   * Additional real profiles that are NOT shown in the footer but belong in
   * JSON-LD `sameAs` — directory listings, review sites. Kept separate so the
   * footer never has to render a glyph we don't actually have.
   */
  directoryProfiles: string[];
}

/**
 * Phone: (866) 683-6894 site-wide — the number the comps carry on every
 * interior header, and the firm's choice over the (303) 756-3812 the live
 * site's JSON-LD and contact page still list. The homepage comp's
 * (303) 555-0100 is a placeholder and is not used anywhere.
 *
 * Changing it is this one line plus `phoneE164`: nothing else in the codebase
 * may hardcode a number, so the header, the footer, every `tel:` href, the
 * JSON-LD and the Thank You lede all follow.
 * TODO(launch): if CallRail dynamic insertion returns, this stays the static
 * fallback and the swap pool is configured in the CallRail dashboard.
 */
export async function getFirmDetails(): Promise<FirmDetails> {
  return {
    name: "Dormer Harpring",
    legalName: "Dormer Harpring, LLC",
    phone: "(866) 683-6894",
    phoneE164: "+18666836894",
    sms: "(720) 734-6230",
    smsE164: "+17207346230",
    address: {
      // "Ct", not "Court": the live site publishes both (866 uses to 571) and
      // every comp uses the short form, which is also what fits the contact
      // card and the footer column without wrapping "Unit 110" onto its own
      // line. NAP text should be identical everywhere it appears.
      street: "3457 Ringsby Ct",
      unit: "Unit 110",
      city: "Denver",
      region: "CO",
      postalCode: "80216",
      country: "US",
    },
    geo: { lat: 39.7726247, lng: -104.9820183 },
    mapUrl: "https://maps.app.goo.gl/8oWqkqUJtBrSS49s9",
    // TODO(launch): the Contact comp shows "Mon–Fri, 8:30am – 5:30pm". These
    // are the hours the live site actually publishes in its JSON-LD, so they
    // ship until someone confirms otherwise — and the two fields are kept
    // side by side because a page showing one set while the structured data
    // asserts another is worse than either being wrong alone.
    hours: "Mo-Fr 09:00-17:00",
    hoursDisplay: "Mon–Fri, 9:00am – 5:00pm",
    // TODO(launch): UNVERIFIED. The comp's contact card shows this address;
    // the live site publishes no contact email anywhere (the only address in
    // its markup is a WordPress author account leaking into blog JSON-LD).
    // The card renders only when this is set, so clearing it is the whole
    // change if the firm would rather not publish one.
    email: "info@dormerharpring.com",
    // The five the comps draw, in their order. The live site's `sameAs` omits
    // Instagram, TikTok and YouTube even though its footer links them — fixed
    // here, since everything below feeds the JSON-LD too.
    socials: [
      { name: "facebook", href: "https://www.facebook.com/DenverTrial" },
      { name: "linkedin", href: "https://www.linkedin.com/company/dormer-harpring-llc/" },
      { name: "youtube", href: "https://www.youtube.com/@denvertrial" },
      { name: "tiktok", href: "https://www.tiktok.com/@denvertrial" },
      { name: "instagram", href: "https://www.instagram.com/denver_trial/" },
    ],
    directoryProfiles: ["https://www.yelp.com/biz/dormer-harpring-denver-5"],
  };
}

/** "3457 Ringsby Court, Unit 110, Denver, CO 80216" — one line, for the footer. */
export function formatAddress(a: FirmAddress): string {
  const street = a.unit ? `${a.street}, ${a.unit}` : a.street;
  return `${street}, ${a.city}, ${a.region} ${a.postalCode}`;
}
