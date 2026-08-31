// /meet-our-attorneys — the page's own copy. A singleton.
//
// THE ROSTER IS NOT HERE. The people are `teamMember` documents in Collections,
// because a person appears on this page, on their own bio, on the homepage rail
// and on About — which is exactly what a Collection is for. This document holds
// only the strings the page says about them.
//
// The two band headings are named fields rather than an array of sections. The
// page renders founding partners and then everyone else, and those two groups
// are wired in the template — an array would let an editor add a third heading
// with no band under it, or delete the one the partners band needs.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { UsersIcon } from "@sanity/icons/Users";
import { SECTION } from "./section";

export const teamPage = defineType({
  name: "teamPage",
  title: "Meet Our Attorneys",
  type: "document",
  icon: UsersIcon,
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
          description: "The sentence under the title. Bold and links render; nothing else does.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "partners",
      title: "Founding partners band",
      type: "object",
      group: "page",
      options: { ...SECTION, columns: 2 },
      description: "The heading above the two founding partners.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "team",
      title: "Everyone else band",
      type: "object",
      group: "page",
      options: { ...SECTION, columns: 2 },
      description: "The heading above the rest of the roster — attorneys, staff and the dogs.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
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
  preview: { prepare: () => ({ title: "Meet Our Attorneys" }) },
});
