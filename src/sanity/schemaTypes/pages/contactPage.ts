// /contact — the page's own copy. A singleton.
//
// SMALL ON PURPOSE. The consultation form, the four info cards and the
// office-hours band are NOT here: twelve of the fourteen comps carry them
// byte-identically, so they are `contactSettings` in Site Settings. What is
// left is what only this page says.
//
// COPY MOVES; VALUES STAY DERIVED. The "Find us" lede prints the office address
// and the map embed points at the firm's Google place — both read from Firm
// Details at render time rather than being fields here. A page keeping its own
// copy of the address is how a site ends up publishing two, which this one has
// already been through with a phone number.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { EnvelopeIcon } from "@sanity/icons/Envelope";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "The small line above the page title.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "lede",
      type: "simpleText",
      description: "The sentence under the title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "find",
      title: "Find us band",
      type: "object",
      description: "The heading above the map.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        /*
         * THE ADDRESS IS PREPENDED AT RENDER TIME, NOT TYPED HERE. The rendered
         * line reads "<the firm's address> — <this>", with the address coming
         * from Site Settings → Firm Details. So this field is the part AFTER
         * the dash: what is worth knowing about visiting, not where the office
         * is. Typing the address into it would publish it twice.
         */
        defineField({
          name: "lede",
          title: "Note after the address",
          type: "string",
          description:
            'The office address is printed automatically, from Firm Details, and this follows ' +
            'it after a dash — "in the RiNo district, with free parking on site". Do not type ' +
            "the address here; it would then appear twice and the two could disagree.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
