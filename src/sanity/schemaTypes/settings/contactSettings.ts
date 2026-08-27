// The consultation band and the contact card, both singletons' worth of copy
// in one document.
//
// COPY ONLY — EVERY VALUE IS DERIVED. The cards below have labels and notes and
// no phone number, no address, no email. Those come from Firm Details at render
// time, and the Email card renders only when an email is set there. A page that
// keeps its own copy of the phone number is how a site ends up publishing two,
// which this site has already been through once.
//
// NAMED CARDS, NOT AN ARRAY, for the same reason the nav menus are named
// fields: each card is bound to a specific fact and a specific glyph, so an
// editor reordering or deleting one would take the firm's phone number off the
// contact page. The wording is theirs; the wiring is not.
//
// The band's photograph is not here either — it is large decorative art and
// stays a local import, per the image rule.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { EnvelopeIcon } from "@sanity/icons/Envelope";

/** A card's editable half: what it is called and the line under it. */
const cardCopy = (name: string, title: string, note: string) =>
  defineField({
    name,
    title,
    type: "object",
    options: { columns: 2 },
    fields: [
      defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
      defineField({ name: "note", type: "string", description: note }),
    ],
  });

export const contactSettings = defineType({
  name: "contactSettings",
  title: "Contact & Consultation",
  type: "document",
  icon: EnvelopeIcon,
  groups: [
    { name: "band", title: "Consultation band", default: true },
    { name: "card", title: "Contact card" },
  ],
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "band",
      description: "The small gold line above the heading.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      group: "band",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reassurances",
      title: "Ticked list",
      type: "array",
      group: "band",
      of: [{ type: "string" }],
      description: "The short reassurances beside the photograph. Three fits the design.",
      validation: (rule) => rule.max(4).warning("More than four crowds the photograph."),
    }),
    defineField({
      name: "callPrompt",
      title: "Call prompt",
      type: "string",
      group: "band",
      description: "Above the phone number — \"Prefer to talk now?\"",
    }),
    defineField({
      name: "callBadge",
      title: "Call badge",
      type: "string",
      group: "band",
      description: "The small chip on the phone button — \"24/7\".",
    }),
    defineField({
      name: "form",
      title: "Form",
      type: "object",
      group: "band",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 2 }),
        defineField({
          name: "submitLabel",
          title: "Button label",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "disclaimer",
          type: "text",
          rows: 2,
          description: "The small print under the button.",
        }),
      ],
    }),

    defineField({
      name: "photoAlt",
      title: "Photograph — alt text",
      type: "string",
      group: "card",
      description:
        "The card's photograph is fixed art and lives in the codebase; this is what a screen " +
        "reader says in its place.",
    }),
    cardCopy("callCard", "Card — Call", "Under the phone number."),
    cardCopy("textCard", "Card — Text", "Under the text number."),
    cardCopy(
      "emailCard",
      "Card — Email",
      "Under the email address. The whole card disappears when Firm Details has no email."
    ),
    cardCopy("officeCard", "Card — Office", "Under the address."),
    defineField({
      name: "hours",
      title: "Office hours block",
      type: "object",
      group: "card",
      description: "The hours themselves come from Firm Details. This is the wording around them.",
      fields: [
        defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "note", type: "text", rows: 2 }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: "Contact & Consultation", subtitle: title }),
  },
});
