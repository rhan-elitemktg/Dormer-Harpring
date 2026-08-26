// A teaser card on the homepage's Insights tab.
//
// TODO(content): all four point at `href: "#"` — they teaser articles nobody
// has written. Unlike the press mentions, these have no real destination to
// find: either the articles get written or the section comes out. `#` must not
// reach production; see the note on `newsMention`.
import { defineField, defineType } from "sanity";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { validateHref } from "../objects/link";

export const insight = defineType({
  name: "insight",
  title: "Insight Teaser",
  type: "document",
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "category",
      type: "string",
      description: "Also picks the card's tint.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "iconKey",
      title: "Icon",
      type: "string",
      description:
        "Must match a glyph in components/icons/InsightIcon.astro. A key with no glyph draws " +
        "an empty plate — a new one needs a developer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readTime",
      type: "string",
      description: 'As shown — "4 min read".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "href",
      title: "Link to the article",
      type: "string",
      description: "A bare # is a placeholder and must not ship.",
      validation: (rule) => rule.required().custom(validateHref),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "category" } },
});
