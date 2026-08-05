// The /contact page.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/contactPage.ts` and a
// `contactPage` singleton.
//
// Every VALUE on the four info cards comes from `firmDetails`, not from this
// module: the labels and the notes underneath are page copy, the numbers and
// the address are firm facts. That split is the reason the number swap earlier
// was one line — a contact page that keeps its own copy of the phone number is
// exactly how a site ends up publishing two.
import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import { formatAddress, getFirmDetails } from "./site";
import teamPhoto from "../assets/team/attorneys-skyline.jpg";

export interface ContactInfoCard {
  _key: string;
  /** Must match a glyph in `components/icons/ContactIcon.astro`. */
  iconKey: "phone" | "message" | "mail" | "pin";
  label: string;
  value: string;
  /** Second line, for the address card. */
  value2?: string;
  href: string;
  note: string;
}

export interface ContactPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  photoAlt: string;
  cards: ContactInfoCard[];
  hours: {
    label: string;
    value: string;
    note: string;
    ctaLabel: string;
    ctaHref: string;
  };
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
  const street = firm.address.unit
    ? `${firm.address.street}, ${firm.address.unit}`
    : firm.address.street;
  const cityLine = `${firm.address.city}, ${firm.address.region} ${firm.address.postalCode}`;

  const cards: ContactInfoCard[] = [
    {
      _key: "call",
      iconKey: "phone",
      label: "Call us",
      value: firm.phone,
      href: `tel:${firm.phoneE164}`,
      note: "Answered 24/7 — free consultation.",
    },
    {
      _key: "text",
      iconKey: "message",
      label: "Text us",
      value: firm.sms,
      href: `sms:${firm.smsE164}`,
      note: "Send a message any time.",
    },
    // Only when there is an address to show. See the TODO in site.ts: the comp
    // supplies one the live site has never published, so this card has to be
    // able to disappear without leaving a hole in the grid.
    ...(firm.email
      ? [
          {
            _key: "email",
            iconKey: "mail" as const,
            label: "Email",
            value: firm.email,
            href: `mailto:${firm.email}`,
            note: "We reply within one business day.",
          },
        ]
      : []),
    {
      _key: "office",
      iconKey: "pin",
      label: "Office",
      value: street,
      value2: cityLine,
      href: firm.mapUrl,
      note: "RiNo district",
    },
  ];

  return {
    eyebrow: "Get in touch",
    title: "Let's talk.",
    lede: pt(
      "One conversation can bring clarity. Reach out for a free, confidential " +
        "case review — we take on fewer cases, so yours gets our full attention."
    ),
    photo: teamPhoto,
    photoAlt: "The Dormer Harpring attorneys in Denver",
    cards,
    hours: {
      label: "Office hours",
      value: `${firm.hoursDisplay} · Calls answered 24/7`,
      note: "Can't make it to us? We come to you — at home or in the hospital.",
      ctaLabel: `Call ${firm.phone}`,
      ctaHref: `tel:${firm.phoneE164}`,
    },
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
