// The consultation band — "Take the first step." — and the contact card
// beside it.
//
// SANITY: both read the `contactSettings` singleton. It appears on 12 of the 14
// comps, which is what makes it a singleton rather than page-local content.
//
// THE STUDIO HOLDS COPY; EVERY VALUE IS STILL DERIVED. The cards below get
// their label and their note from Sanity and their phone number, text number,
// email and address from `firmDetails` — never from a field an editor could
// retype. A page that keeps its own copy of the phone number is how a site ends
// up publishing two, which this one has already been through.
//
// The photograph stays a local import: it is large decorative art, not editor
// content, per the image rule.
import type { ImageMetadata } from "astro";
import { sanityClient } from "sanity:client";
import { CONTACT_SETTINGS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
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

/** The `contactSettings` singleton, whichever getter asked for it. */
function settings() {
  return once("contactSettings", async () =>
    required(await sanityClient.fetch(CONTACT_SETTINGS_QUERY), "Contact & Consultation")
  );
}

/**
 * A field the schema does not force an editor to fill.
 *
 * Empty rather than a stand-in: these are labels and notes in fixed design
 * slots, and a blank slot reads as "nothing to say here" where invented copy
 * would read as the firm's own words.
 */
const text = (value: string | null | undefined) => value ?? "";

export async function getContactBand(): Promise<ContactBand> {
  const copy = await settings();
  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    reassurances: copy.reassurances,
    callPrompt: text(copy.callPrompt),
    callBadge: text(copy.callBadge),
    form: {
      title: copy.form?.title ?? "",
      lede: text(copy.form?.lede),
      submitLabel: copy.form?.submitLabel ?? "",
      disclaimer: text(copy.form?.disclaimer),
    },
  };
}

// ---------------------------------------------------------------------------
// The photo + info cards + office-hours block that sits beside the form on the
// interior pages. A SINGLETON, not page content: the Contact and Testimonials
// comps carry it byte-identically, and the remaining interior pages repeat it.

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
  const [firm, copy] = await Promise.all([getFirmDetails(), settings()]);

  const street = firm.address.unit
    ? `${firm.address.street}, ${firm.address.unit}`
    : firm.address.street;

  const cards: ContactInfoCard[] = [
    {
      _key: "call",
      iconKey: "phone",
      label: text(copy.callCard?.label),
      value: firm.phone,
      href: `tel:${firm.phoneE164}`,
      note: text(copy.callCard?.note),
    },
    {
      _key: "text",
      iconKey: "message",
      label: text(copy.textCard?.label),
      value: firm.sms,
      href: `sms:${firm.smsE164}`,
      note: text(copy.textCard?.note),
    },
    // Only when there is an address to show. See the TODO(launch) in site.ts:
    // the comp supplies an email the live site has never published, so this
    // card has to be able to disappear without leaving a hole in the grid.
    // Clearing the field in the Studio is the whole change.
    ...(firm.email
      ? [
          {
            _key: "email",
            iconKey: "mail" as const,
            label: text(copy.emailCard?.label),
            value: firm.email,
            href: `mailto:${firm.email}`,
            note: text(copy.emailCard?.note),
          },
        ]
      : []),
    {
      _key: "office",
      iconKey: "pin",
      label: text(copy.officeCard?.label),
      value: street,
      value2: `${firm.address.city}, ${firm.address.region} ${firm.address.postalCode}`,
      href: firm.mapUrl,
      note: text(copy.officeCard?.note),
    },
  ];

  return {
    photo: teamPhoto,
    photoAlt: text(copy.photoAlt),
    cards,
    hours: {
      label: text(copy.hours?.label),
      // Composed here rather than typed in the Studio: the hours themselves are
      // firmDetails', and "Calls answered 24/7" is the same claim the call
      // card's note makes. One source, two places it shows.
      value: `${firm.hoursDisplay} · Calls answered 24/7`,
      note: text(copy.hours?.note),
      ctaLabel: `Call ${firm.phone}`,
      ctaHref: `tel:${firm.phoneE164}`,
    },
  };
}
