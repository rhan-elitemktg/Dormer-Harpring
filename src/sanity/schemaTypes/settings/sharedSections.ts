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
// Checked. Only TWO section-copy getters are used on more than one page:
//
//   getCoreValuesSection   5 pages   about, co-counsel, index, attorneys, news
//   getAttorneysSection    2 pages   index, practice-areas
//
// The other six — FAQ, feed, practice, practice promise, community, car-accident
// FAQ — are each used on ONE page, so they belong to that page's document. Six
// one-page sections filed in a document called "Shared" would be a lie the desk
// tells, and the next person would then trust it.
//
//   grep -roE '\bget[A-Z][A-Za-z]*Section\(' src/pages | sort | uniq -c | sort -rn
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
  ],
  preview: {
    prepare: () => ({ title: "Shared Sections" }),
  },
});
