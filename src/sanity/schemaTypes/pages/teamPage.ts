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

export const teamPage = defineType({
  name: "teamPage",
  title: "Meet Our Attorneys",
  type: "document",
  icon: UsersIcon,
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
    defineField({
      name: "partners",
      title: "Founding partners band",
      type: "object",
      options: { columns: 2 },
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
      options: { columns: 2 },
      description: "The heading above the rest of the roster — attorneys, staff and the dogs.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Meet Our Attorneys" }) },
});
