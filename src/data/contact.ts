// The consultation band — "Take the first step."
//
// SANITY SWAP POINT. This band appears on 12 of the 14 comps, so the copy is a
// singleton (`contactBand`) rather than page-local content.
import type { ImageMetadata } from "astro";
import { getFirmDetails } from "./site";
import teamPhoto from "../assets/team/attorneys-skyline.jpg";

export interface ContactBand {
  eyebrow: string;
  title: string;
  /** Ticked list beside the photograph. */
  reassurances: string[];
  callPrompt: string;
  callBadge: string;
  form: {
    title: string;
    lede: string;
    submitLabel: string;
    disclaimer: string;
  };
}

export async function getContactBand(): Promise<ContactBand> {
  return {
    eyebrow: "Free case review",
    title: "Talk to an attorney about your case.",
    reassurances: [
      "Free & completely confidential",
      "No fee unless we win",
      "We come to you — home or hospital",
    ],
    callPrompt: "Prefer to talk now?",
    callBadge: "24/7",
    form: {
      title: "Take the first step.",
      lede: "Tell us what happened. It's free, confidential, and there's no obligation.",
      submitLabel: "Request my free case review",
      disclaimer:
        "By submitting, you agree to be contacted about your case. No fee unless we win.",
    },
  };
}

// ---------------------------------------------------------------------------
// The photo + info cards + office-hours block that sits beside the form on the
// interior pages. A SINGLETON, not page content: the Contact and Testimonials
// comps carry it byte-identically, and the remaining interior pages repeat it.
//
// Every VALUE below comes from `firmDetails` — the labels and the notes are the
// only copy here. A page that keeps its own copy of the phone number is how a
// site ends up publishing two.

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

export interface ContactDetails {
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
}

export async function getContactDetails(): Promise<ContactDetails> {
  const firm = await getFirmDetails();
  const street = firm.address.unit
    ? `${firm.address.street}, ${firm.address.unit}`
    : firm.address.street;

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
      value2: `${firm.address.city}, ${firm.address.region} ${firm.address.postalCode}`,
      href: firm.mapUrl,
      note: "RiNo district",
    },
  ];

  return {
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
  };
}
