// Headings for bands that appear on MORE THAN ONE page.
//
// WHY THIS DOCUMENT EXISTS, AND WHY IT IS SMALL. A band that repeats across
// pages splits three ways, and only one third of it belongs here:
//
//   its ITEMS               → a collection (the six values, the awards)
//   its heading, if the SAME on every page it appears on   → here
//   its heading, if it DIFFERS per page                    → that page's own document
//
// The third case is real on this site, not hypothetical: `TestimonialRail` on
// the homepage and `about/InTheirWords` render the SAME testimonial records
// under DIFFERENT headings, About's coming from its own page document. So "a
// repeated band is a singleton" is wrong as a rule and each band has to be
// checked.
//
// Checked. THREE section getters are used on more than one page:
//
//   getCoreValuesSection   5 pages   about, co-counsel, index, attorneys, news
//   getAttorneysSection    2 pages   index, practice-areas
//   getHomeWhyUs           2 pages   index, practice-areas
//
// The other six — FAQ, feed, practice, practice promise, community, car-accident
// FAQ — are each used on ONE page, so they belong to that page's document. Six
// one-page sections filed in a document called "Shared" would be a lie the desk
// tells, and the next person would then trust it.
//
// THE THIRD ONE WAS MISSED FOR A PHASE, AND THE METHOD IS WHY. The sweep above
// was `grep -roE '\bget[A-Z][A-Za-z]*Section\(' src/pages`, which only ever
// finds getters whose NAME ends in "Section" — and Why Us is `getHomeWhyUs`.
// Phase 4 found it by listing every copy getter against every page instead:
//
//   for g in $(grep -hoE 'export async function (get\w+)' src/data/*.ts \
//               | awk '{print $4}'); do
//     printf '%-28s ' "$g"; grep -rl "\b$g(" src/pages | tr '\n' ' '; echo
//   done
//
// Grep the CALL SITES, not the naming convention. A convention is not a fact
// about the code and this one was two-thirds true.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { BlockElementIcon } from "@sanity/icons/BlockElement";

export const sharedSections = defineType({
  name: "sharedSections",
  title: "Shared Sections",
  type: "document",
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: "coreValues",
      title: "Core values band",
      type: "object",
      description:
        "The heading above the six value cards. Appears on About, Co-Counsel, the homepage, " +
        "Meet Our Attorneys and News — changing it changes all five.",
      options: { columns: 2 },
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          description: "The small gold line above the heading.",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
      ],
    }),
    defineField({
      name: "reviewSummary",
      title: "Review rating",
      type: "object",
      description:
        "The rating shown beside a testimonials heading. Appears on the homepage, About, the " +
        "attorney bios and the Car Accidents page — four places, one figure.",
      options: { columns: 3 },
      fields: [
        defineField({
          name: "count",
          type: "string",
          description: 'How many — "300+".',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "rating",
          type: "string",
          description: 'The score — "5.0".',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "source",
          type: "string",
          description: 'Where from — "Google".',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "attorneysBand",
      title: "Attorney rail",
      type: "object",
      description:
        "The heading and pull quote above the attorney cards. Appears on the homepage and " +
        "Practice Areas — two pages, one piece of copy.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "quote",
          type: "text",
          rows: 4,
          description: "The signed pull quote beside the cards.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "signature",
          title: "Signed by",
          type: "object",
          description:
            "Whose quote it is. The portrait is a small signature crop, not the rail card's.",
          fields: [
            defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "role", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "attorneyKey",
              title: "Links to",
              type: "string",
              description:
                "The team member's reference key, so the signature links to their bio. " +
                "TODO(sanity): a real reference once every page type exists to point at.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "portrait",
              type: "image",
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
          ],
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
      ],
    }),

    /*
     * "WHY CHOOSE DORMER HARPRING?" — the four-card band.
     *
     * Shared for the same reason the attorney rail is: the Practice Areas comp
     * carries this band WORD FOR WORD, so it is one piece of copy on two pages
     * rather than two that happen to agree. If the two ever need to differ, the
     * fix is a second field on the page that diverges, not a second copy of
     * these strings — that is the whole point of this document.
     */
    defineField({
      name: "whyUs",
      title: "Why choose us band",
      type: "object",
      description:
        "The four cards under the practice areas. Appears on the homepage and Practice " +
        "Areas — two pages, one piece of copy.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        /*
         * A TWO-PART HEADING, NOT ONE STRING, because the design renders the
         * second half gold on its own line. Storing "Why choose Dormer
         * Harpring?" as one string and splitting it in the component would put
         * the split point in CSS's hands, which cannot see where the firm's
         * name starts.
         */
        defineField({
          name: "title",
          type: "object",
          options: { columns: 2 },
          description: "Two halves. The second renders gold, beneath the first.",
          fields: [
            defineField({
              name: "lead",
              title: "First half",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "accent",
              title: "Gold half",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "points",
          title: "Cards",
          type: "array",
          of: [
            {
              type: "object",
              name: "whyPoint",
              fields: [
                defineField({
                  name: "title",
                  type: "array",
                  of: [{ type: "string" }],
                  description:
                    "ONE ENTRY PER RENDERED LINE — every card title is hard-broken in the " +
                    "design, and the break is part of how the four line up.",
                  validation: (rule) => rule.required().min(1),
                }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: { title: "title", subtitle: "body" },
                prepare: ({ title, subtitle }) => ({
                  title: Array.isArray(title) ? title.join(" ") : title,
                  subtitle,
                }),
              },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Shared Sections" }),
  },
});
