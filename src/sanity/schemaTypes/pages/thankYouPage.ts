// /thank-you — where the consultation form lands after a successful submit.
// A singleton.
//
// ITS THREE REASSURANCES DUPLICATE THE CONSULTATION BAND'S, DELIBERATELY. They
// are two documents rather than one shared list because an editor changing what
// a visitor is promised BEFORE submitting should not silently change what they
// are told AFTER. That is the one case in this schema where duplication is the
// feature.
//
// `noIndex` — this page is not in the sitemap and search engines are told to
// skip it. It is reachable only by submitting the form.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { SECTION } from "./section";
import { validateHref } from "../objects/link";

export const thankYouPage = defineType({
  name: "thankYouPage",
  title: "Thank You",
  type: "document",
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: "header",
      title: "Page header",
      type: "object",
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
        /*
         * RICH TEXT SO THE PHONE NUMBER CAN BE A REAL `tel:` LINK MID-SENTENCE —
         * which is what this field type is for. The NUMBER itself still comes from
         * Firm Details: write the link, not the digits.
         */
        defineField({
          name: "lede",
          type: "simpleText",
          description:
            "The sentence under the title. It carries the firm's phone number as a link — write " +
            "that link with the number from Site Settings → Firm Details, and change it there " +
            "rather than here if the number ever moves.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "panel",
      title: "While you wait panel",
      type: "object",
      options: SECTION,
      description: "The band under the header. Its photograph is not editable — see below.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "title",
          type: "array",
          of: [{ type: "string" }],
          description: "ONE ENTRY PER RENDERED LINE — the design breaks this deliberately.",
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "lede", type: "text", rows: 4, validation: (rule) => rule.required() }),
        defineField({
          name: "reassurances",
          title: "Ticked list",
          type: "array",
          of: [{ type: "string" }],
          description:
            "The consultation band on every other page carries a list like this one. They are " +
            "SEPARATE on purpose: what a visitor is promised before submitting and what they " +
            "are told after should not change together by accident.",
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "ctas",
          title: "Buttons",
          type: "array",
          of: [
            {
              type: "object",
              name: "thankYouCta",
              options: { columns: 2 },
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
              ],
              preview: { select: { title: "label", subtitle: "href" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
],
  preview: { prepare: () => ({ title: "Thank You" }) },
});
