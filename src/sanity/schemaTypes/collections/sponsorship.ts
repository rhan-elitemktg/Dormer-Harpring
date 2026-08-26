// A team, event or cause the firm sponsors. Text only — no logo, by design.
import { defineField, defineType } from "sanity";
import { StarIcon } from "@sanity/icons/Star";

export const sponsorship = defineType({
  name: "sponsorship",
  title: "Sponsorship",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "body",
      title: "What it is",
      type: "text",
      rows: 3,
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
  preview: { select: { title: "name", subtitle: "body" } },
});
