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
import { SECTION } from "./section";

export const testimonialsPage = defineType({
  name: "testimonialsPage",
  title: "Testimonials",
  type: "document",
  icon: CommentIcon,
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
      name: "videos",
      title: "Video reviews band",
      type: "object",
      group: "page",
      options: SECTION,
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
      group: "page",
      options: SECTION,
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
  preview: { prepare: () => ({ title: "Testimonials" }) },
});
