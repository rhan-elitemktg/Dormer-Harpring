// The /contact page's own copy.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/contactPage.ts` and a
// `contactPage` singleton.
//
// The photo, the four info cards and the office-hours band are NOT here: the
// Testimonials comp carries them byte-identically and the remaining interior
// pages repeat them, so they live in `getContactDetails()` as a singleton. What
// is left is what only this page says.
import { pt, type PortableTextBlock } from "./portableText";
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
  const firm = await getFirmDetails();
  const address = formatAddress(firm.address);

  return {
    eyebrow: "Get in touch",
    title: "Let's talk.",
    lede: pt(
      "One conversation can bring clarity. Reach out for a free, confidential " +
        "case review — we take on fewer cases, so yours gets our full attention."
    ),
    find: {
      eyebrow: "Find us",
      title: "Visit our Denver office.",
      lede: `${address} — in the RiNo district, with free parking on site.`,
      // Same place as `mapUrl`, embedded rather than linked. See the note on
      // `mapPlaceCid` for why this is not the short link or an address query.
      mapSrc: `https://maps.google.com/maps?cid=${firm.mapPlaceCid}&output=embed`,
      mapTitle: `${firm.name} — Denver office`,
    },
  };
}
