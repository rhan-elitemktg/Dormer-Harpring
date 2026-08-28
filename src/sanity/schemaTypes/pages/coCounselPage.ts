// /co-counsel — the firm's pitch to other lawyers. A singleton.
//
// THE ONLY PAGE ON THIS SITE WHOSE AUDIENCE IS NOT A CLIENT, which is why it
// has a second form: `CoCounselForm` takes a case referral where `ContactForm`
// takes a consultation request. Both are headed for one `/api/consult` endpoint
// with a hidden field telling the payloads apart, so the two sets of form copy
// stay two sets.
//
// THE SEVEN RESULTS ARE A COLLECTION — six of them appear on /results in the
// same words, so they are one record rendered twice rather than two records.
//
// The page-header photograph and the partnership band's photograph are not
// fields; the note in `aboutPage` has the reasoning.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { UsersIcon } from "@sanity/icons/Users";
import { SECTION } from "./section";
import { validateHref } from "../objects/link";

export const coCounselPage = defineType({
  name: "coCounselPage",
  title: "Co-Counsel",
  type: "document",
  icon: UsersIcon,
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
        defineField({
          name: "lede",
          type: "simpleText",
          description: "The sentence under the title.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "ctaLabel",
          title: "Header button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "ctaNote",
          title: "Note beside the button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "partnership",
      title: "Why partner with us band",
      type: "object",
      options: SECTION,
      description: "Three blocks of prose with a pull-out figure between the first two.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "intro",
          type: "simpleText",
          description: "The paragraph above the callout card.",
          validation: (rule) => rule.required(),
        }),
        /*
         * THE FIGURE IS BOLD INSIDE THE SENTENCE, not a separate number field
         * beside it. "an average co-counsel settlement value of over **$300,000**"
         * reads as one claim and is one claim; splitting it would let the
         * sentence and the figure disagree, and the card has no slot for a
         * number on its own.
         *
         * TODO(launch): the firm has to stand behind that figure, the same way
         * README tracks "$70M+" and "20 Years".
         */
        defineField({
          name: "callout",
          title: "Callout card",
          type: "inlineText",
          description:
            "One sentence, with the figure in bold. The design draws the card; the bold is " +
            "what makes the number stand out inside it.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "terms",
          type: "simpleText",
          description: "The fee-split paragraph under the callout.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "results",
      title: "Results band",
      type: "object",
      options: SECTION,
      description: "The heading above the co-counsel results.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "lede",
          type: "text",
          rows: 2,
          description:
            "Ends on the prior-results disclaimer, which this page carries itself rather than " +
            "inheriting from the footer.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "areas",
      title: "Practice areas band",
      type: "object",
      options: SECTION,
      description: "The eleven links to the areas the firm takes referrals in.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        /*
         * A LIST OF LABELS AND HREFS, NOT REFERENCES, and the same call the
         * homepage's card rail makes: this list renames what it links to
         * ("Bicycle Accidents" for a page filed as "Bike Accidents"), and two of
         * the eleven point at the practice-areas hub rather than at any page —
         * see the TODO below. A reference cannot express either.
         */
        defineField({
          name: "items",
          title: "Links",
          type: "array",
          of: [
            {
              type: "object",
              name: "coCounselArea",
              options: { columns: 2 },
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  // TODO(launch): Insurance Bad Faith and Product Liability have
                  // no page of their own on the live site, so both point at the
                  // hub. A general link is better than a dead one, but the real
                  // fix is two pages.
                  description:
                    "Two of these deliberately point at /practice-areas/ because the firm has " +
                    "no page for that area yet. A link to a page that does not exist fails " +
                    "the build's link check.",
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

    defineField({
      name: "form",
      title: "Referral form",
      type: "object",
      options: SECTION,
      description:
        "The case-referral form at the foot of the page. This is NOT the consultation form " +
        "every other page carries — that one's copy is in Site Settings → Contact.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "requiredNote",
          title: "Note above the fields",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "submitLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "disclaimer",
          title: "Under the submit button",
          type: "string",
          description:
            "A legal notice, not marketing copy — it disclaims an attorney-client relationship. " +
            "Check with the firm before rewording it.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
],
  preview: { prepare: () => ({ title: "Co-Counsel" }) },
});
