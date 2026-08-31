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
import { SECTION } from "./section";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact",
  type: "document",
  icon: EnvelopeIcon,
  /* TWO TABS, NOT AN ACCORDION AT THE FOOT. The SEO block used to be the last
     field on this document, collapsed — which is a good way to make sure it is
     never filled in. A tab is one click from the top of the form and reads as a
     part of the document rather than an appendix to it.
     `default: true` on the content tab so opening the document still lands on
     the page itself. */
  groups: [
    { name: "page", title: "The page", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "header",
      title: "Page header",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The band at the top of the page.",
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
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "find",
      title: "Find us band",
      type: "object",
      group: "page",
      options: SECTION,
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

    /* ITS OWN TAB. Optional, and every one of its five values falls back to
       what the page already renders — see the note on the `seo` object type.
       It was the last field on the form and collapsed, which is a reliable way
       to make sure nobody fills it in. */
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
