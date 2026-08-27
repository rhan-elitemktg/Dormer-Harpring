// /testimonials — the page's own copy. A singleton.
//
// THE REVIEWS ARE A COLLECTION. The same records render on the homepage rail
// under a different heading, which is the case `sharedSections` exists to keep
// straight: the ITEMS are shared, the HEADINGS are not. So the two band
// headings below belong to this page and the homepage's belong to the homepage.
//
// THE PAGE-HEADER PHOTOGRAPH IS NOT A FIELD — see the note in `aboutPage`.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CommentIcon } from "@sanity/icons/Comment";

export const testimonialsPage = defineType({
  name: "testimonialsPage",
  title: "Testimonials",
  type: "document",
  icon: CommentIcon,
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
      name: "videos",
      title: "Video reviews band",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 2, validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "written",
      title: "Written reviews band",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "lede",
          type: "text",
          rows: 2,
          // The prior-results disclaimer is in this sentence. It is not in the
          // site footer — /results, /co-counsel and this page each carry their
          // own, because they are the three that publish outcomes.
          description:
            "Ends on the prior-results disclaimer, which this page carries itself rather than " +
            "inheriting from the footer.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "moreLabel",
          title: "Load-more button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Testimonials" }) },
});
