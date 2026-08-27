// The /contact page's own copy.
//
// SANITY: reads the `contactPage` singleton.
//
// The photo, the four info cards and the office-hours band are NOT here: the
// Testimonials comp carries them byte-identically and the remaining interior
// pages repeat them, so they live in `getContactDetails()` as a singleton. What
// is left is what only this page says.
//
// COPY MOVES; VALUES STAY DERIVED. The Studio holds the "Find us" NOTE — "in
// the RiNo district, with free parking on site." — and the address in front of
// it is read from `firmDetails` here, at render time. The map embed and its
// title are built the same way. A page keeping its own copy of the address is
// how a site ends up publishing two, which this one has already been through
// with a phone number.
import { sanityClient } from "sanity:client";
import { CONTACT_PAGE_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";
import { formatAddress, getFirmDetails } from "./site";

export interface ContactPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  find: {
    eyebrow: string;
    title: string;
    lede: string;
    /** Google Maps embed src, built from the firm's place id rather than pasted. */
    mapSrc: string;
    mapTitle: string;
  };
}

export async function getContactPage(): Promise<ContactPage> {
  const [copy, firm] = await Promise.all([
    once("contactPage", async () =>
      required(await sanityClient.fetch(CONTACT_PAGE_QUERY), "Contact", "Pages")
    ),
    getFirmDetails(),
  ]);
  const address = formatAddress(firm.address);

  return {
    ...copy,
    lede: copy.lede as PortableTextBlock[],
    find: {
      ...copy.find,
      lede: `${address} — ${copy.find.lede}`,
      // Same place as `mapUrl`, embedded rather than linked. See the note on
      // `mapPlaceCid` for why this is not the short link or an address query.
      mapSrc: `https://maps.google.com/maps?cid=${firm.mapPlaceCid}&output=embed`,
      mapTitle: `${firm.name} — Denver office`,
    },
  };
}
