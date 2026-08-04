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

export interface FirmDetails {
  name: string;
  legalName: string;
  /** The number shown and dialled everywhere. */
  phone: string;
  /** E.164, for `tel:` hrefs and JSON-LD. */
  phoneE164: string;
  email?: string;
  address: FirmAddress;
  geo: { lat: number; lng: number };
  mapUrl: string;
  hours: string;
  socials: string[];
}

/**
 * Phone: the comps carry three different numbers — (866) 683-6894 on the
 * interior headers and a clearly placeholder (303) 555-0100 on the homepage.
 * Neither is used. (303) 756-3812 is the firm's number per the live site's
 * JSON-LD and contact page, and it is what ships site-wide.
 * TODO(launch): if CallRail dynamic insertion returns, this stays the static
 * fallback and the swap pool is configured in the CallRail dashboard.
 */
export async function getFirmDetails(): Promise<FirmDetails> {
  return {
    name: "Dormer Harpring",
    legalName: "Dormer Harpring, LLC",
    phone: "(303) 756-3812",
    phoneE164: "+13037563812",
    address: {
      street: "3457 Ringsby Court",
      unit: "Unit 110",
      city: "Denver",
      region: "CO",
      postalCode: "80216",
      country: "US",
    },
    geo: { lat: 39.7726247, lng: -104.9820183 },
    mapUrl: "https://maps.app.goo.gl/8oWqkqUJtBrSS49s9",
    hours: "Mo-Fr 09:00-17:00",
    socials: [
      "https://www.facebook.com/DenverTrial",
      "https://www.linkedin.com/company/dormer-harpring-llc/",
      "https://www.youtube.com/@denvertrial",
      "https://www.tiktok.com/@denvertrial",
      "https://www.instagram.com/denver_trial/",
      "https://www.yelp.com/biz/dormer-harpring-denver-5",
    ],
  };
}

/** "3457 Ringsby Court, Unit 110, Denver, CO 80216" — one line, for the footer. */
export function formatAddress(a: FirmAddress): string {
  const street = a.unit ? `${a.street}, ${a.unit}` : a.street;
  return `${street}, ${a.city}, ${a.region} ${a.postalCode}`;
}
