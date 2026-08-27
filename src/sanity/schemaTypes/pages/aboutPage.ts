// /about — the page's own copy. A singleton.
//
// SIX OF THE COMP'S ELEVEN BANDS ARE NOT HERE, because this site already serves
// them from somewhere else and the About comp repeats them word for word: the
// stats band, the awards bar, the core values, the contact block and its
// office-hours band, the attorney cards, and the review records. What is left is
// what only this page says.
//
// THE PAGE-HEADER PHOTOGRAPH IS NOT A FIELD, AND NEITHER IS ITS ALT TEXT.
//
// Two reasons, and the second is the one that decided it:
//
//  1. `PageHeader` art-directs — a panorama above 760px and a portrait crop
//     below it — through a hand-built `<picture>` with `getImage()` on both
//     sources. Making those editable is a rewrite of that component into two
//     CDN crops chosen by `media`, which is a component change rather than a
//     data change, and it would cost this phase the byte-diff it rests on.
//  2. AN ALT THAT DESCRIBES A PHOTOGRAPH THE EDITOR CANNOT SEE OR CHANGE IS A
//     FIELD THAT DRIFTS WITH NOTHING CHECKING IT. This page's own alt carries a
//     live `TODO(launch)` — the comp names two people who do not exist and the
//     man on the right is identified by inference — and a comment beside a
//     literal does not survive that literal moving to a CMS. This project has
//     lost markers that way twice.
//
// Same call for the two band photographs below. If the client wants the art
// editable, that is a real request and the answer is to move `PageHeader` and
// all eight page headers together — not one page at a time.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { validateHref } from "../objects/link";

/**
 * A two-column band: eyebrow, heading, prose — and, on one of the two, a button.
 *
 * A SHARED FIELDS ARRAY RATHER THAN A NAMED OBJECT TYPE, the way `faqItemFields`
 * is: two callers is under this project's four-caller threshold for extracting.
 * The photograph and its alt are not in here — see the note above.
 */
const storyFields = (withCta: boolean) => [
  defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
  defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
  defineField({
    name: "body",
    type: "simpleText",
    description: "One paragraph per block. Bold and links render; nothing else does.",
    validation: (rule) => rule.required(),
  }),
  ...(withCta
    ? [
        defineField({
          name: "ctaLabel",
          title: "Button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "ctaHref",
          title: "Button destination",
          type: "string",
          // The component renders the button only when it has an href, so an
          // empty one hides it. Required here anyway: a band with a labelled
          // button that goes nowhere is the failure, not the hiding.
          validation: (rule) => rule.required().custom(validateHref),
        }),
      ]
    : []),
];

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About",
  type: "document",
  icon: InfoOutlineIcon,
  // Fields in the order the page renders them, top to bottom.
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

    defineField({
      name: "whoWeAre",
      title: "Who we are band",
      type: "object",
      description: "The first two-column band, under the header.",
      fields: storyFields(true),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "quote",
      title: "Quote band",
      type: "object",
      description: "The full-width pull quote over a photograph.",
      fields: [
        /*
         * PORTABLE TEXT RATHER THAN A STRING, because the design emphasises a
         * run mid-sentence — "it is *what personal service actually means*".
         * The emphasis is CONTENT (this clause is the point); the gold it
         * renders in is not, and is picked in CSS.
         *
         * `inlineText` caps it at one block: a second paragraph inside a pull
         * quote is a layout the design does not have.
         */
        defineField({
          name: "text",
          type: "inlineText",
          description: "One sentence. Bold marks the clause the design highlights.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "attribution",
          type: "string",
          description: "The line under the quote.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "team",
      title: "Attorneys band",
      type: "object",
      description:
        "The heading above the four attorney cards. WHO is on that grid, and in what order, " +
        "is set on the team members themselves — drag them in Collections → Team.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "ctaHref",
          title: "Button destination",
          type: "string",
          validation: (rule) => rule.required().custom(validateHref),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "reviews",
      title: "Client reviews band",
      type: "object",
      options: { columns: 2 },
      description:
        "The heading above the review cards. The SAME records render on the homepage under a " +
        "different heading — that is why this heading is here and not in Shared Sections.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "oneShot",
      title: "One shot band",
      type: "object",
      description: "The second two-column band. No button in this one.",
      fields: storyFields(false),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "expect",
      title: "What to expect band",
      type: "object",
      description: "Three promise cards, then a four-up strip of milestones.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "promises",
          title: "Promise cards",
          type: "array",
          of: [
            {
              type: "object",
              name: "aboutPromise",
              fields: [
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 4,
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "iconKey",
                  title: "Icon",
                  type: "string",
                  description:
                    "Must match a glyph in components/icons/ExpectIcon.astro — compassion, " +
                    "phone, fee. A key with no glyph draws an empty plate.",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "title", subtitle: "body" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "milestones",
          title: "Milestone strip",
          type: "array",
          of: [
            {
              type: "object",
              name: "aboutMilestone",
              fields: [
                defineField({
                  name: "tag",
                  type: "string",
                  description: 'The small gold word above the title — "Then", "Now", "Always".',
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "title", subtitle: "tag" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "About" }) },
});
