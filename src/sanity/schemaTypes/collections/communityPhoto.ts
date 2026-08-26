// One photograph in the homepage's community mosaic.
//
// `span` IS CONTENT HERE, NOT PRESENTATION, and that is a genuine exception to
// the rule that layout stays in CSS. The mosaic is a 12-track grid and each
// photograph's width is a composition decision about THAT photograph — a wide
// group shot and a tall portrait are not interchangeable at the same width.
// Constrained to the four widths the band actually implements.
import { defineField, defineType } from "sanity";
import { ImageIcon } from "@sanity/icons/Image";

export const communityPhoto = defineType({
  name: "communityPhoto",
  title: "Community Photo",
  type: "document",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "org",
      title: "Organisation",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "span",
      title: "Width",
      type: "number",
      description:
        "How many of the mosaic's twelve columns this photograph fills. Only these four " +
        "widths are drawn — anything else breaks the row.",
      options: {
        list: [
          { title: "Quarter (3)", value: 3 },
          { title: "Third (4)", value: 4 },
          { title: "Wide (5)", value: 5 },
          { title: "Full row (12)", value: 12 },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "org", subtitle: "caption", media: "image" } },
});
