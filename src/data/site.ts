// Firm-wide facts: NAP, phones, hours, socials.
//
// SANITY: this reads the `firmDetails` singleton. The interfaces below are the
// projection's shape, which is why they did not change when the values moved —
// `FIRM_DETAILS_QUERY` returns exactly this and no call site was touched.
//
// Nothing in the codebase may hardcode a phone number or address — everything
// reads from here, so a change is one edit in the Studio and a redeploy.
//
// WHY THERE IS NO FALLBACK. If the document is missing the build THROWS rather
// than returning defaults. A second copy of the phone number in this file is a
// second number that can ship by accident, which is not hypothetical: this file
// once recorded (866) 683-6894 as "the firm's choice" and it was not. The 866
// number is retired, not kept as a spare.
//
// Content still waiting on the firm, and now waiting on it IN THE STUDIO:
//
//   TODO(launch): the contact email is UNVERIFIED. The comp's contact card
//   supplies info@dormerharpring.com; the live site publishes no contact
//   address anywhere (the only one in its markup is a WordPress author account
//   leaking into blog JSON-LD). The card renders only when `email` is set, so
//   clearing the field in the Studio is the whole change if the firm would
//   rather not publish one.
//
//   TODO(launch): the office hours are the live site's JSON-LD, not the comp's.
//   The Contact comp shows "Mon–Fri, 8:30am – 5:30pm"; `hours` and
//   `hoursDisplay` currently say 9–5. They sit side by side in the Studio
//   because a page showing one set while the structured data asserts another is
//   worse than either being wrong alone — change both together.
//
//   TODO(launch): if CallRail dynamic insertion returns, `phone` stays the
//   static fallback and the swap pool is configured in the CallRail dashboard.
import { sanityClient } from "sanity:client";
import { FIRM_DETAILS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

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
  /**
   * The footer's "Text" number. NOT the comps' (720) 734-6230, which 29 comp
   * files carry — the comps have now been wrong about both numbers.
   */
  sms: string;
  smsE164: string;
  email?: string;
  address: FirmAddress;
  geo: { lat: number; lng: number };
  /** THE canonical external map link. Every "Get directions" points here. */
  mapUrl: string;
  /**
   * The numeric Google Business Profile id behind `mapUrl`. An embedded map
   * cannot use the short link — it redirects to a `/maps/place/` page, which
   * refuses to be framed — and an address query drops an anonymous pin instead
   * of showing the listing. `?cid=` is the keyless way to embed the profile
   * itself, and it is the same place `mapUrl` opens.
   */
  mapPlaceCid: string;
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

export async function getFirmDetails(): Promise<FirmDetails> {
  const firm = await once("firmDetails", async () =>
    required(await sanityClient.fetch(FIRM_DETAILS_QUERY), "Firm Details")
  );

  // COALESCED EXPLICITLY RATHER THAN CAST. A blanket `as FirmDetails` would
  // typecheck and would also hide a real shape mismatch — the projection
  // returns `null` where this interface says `undefined`, and the two are not
  // the same thing to a component doing `{firm.email && …}`. Four fields
  // differ and each is handled on its own line.
  const { lat, lng } = firm.geo;
  if (lat === null || lng === null) {
    // NOT coalesced to 0. That is a real coordinate in the Gulf of Guinea, and
    // it would ship as the firm's location in the LocalBusiness structured
    // data — wrong in a way no page would show.
    throw new Error(
      `Firm Details has no map pin, so the firm's structured data would assert the wrong ` +
        `location. Set it in the Studio at /admin → Site Settings → Firm Details → ` +
        `Address & hours, and publish.`
    );
  }

  return {
    ...firm,
    email: firm.email ?? undefined,
    address: { ...firm.address, unit: firm.address.unit ?? undefined },
    geo: { lat, lng },
    socials: firm.socials ?? [],
  };
}

/** "3457 Ringsby Court, Unit 110, Denver, CO 80216" — one line, for the footer. */
export function formatAddress(a: FirmAddress): string {
  const street = a.unit ? `${a.street}, ${a.unit}` : a.street;
  return `${street}, ${a.city}, ${a.region} ${a.postalCode}`;
}
