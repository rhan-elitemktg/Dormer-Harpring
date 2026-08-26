// A press mention — the firm in someone else's publication.
//
// TODO(content): four of these point at `href: "#"`. The articles are real and
// published (FOX31, Denver7, OutThere Colorado, The Mountain Mail) and their
// URLs are findable; nobody has found them. `#` MUST NOT REACH PRODUCTION —
// `check-links.py` counts the placeholders and fails when the number moves, so
// filling one in means lowering that count in the same change.
import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons/Book";
import { validateHref } from "../objects/link";

export const newsMention = defineType({
  name: "newsMention",
  title: "Press Mention",
  type: "document",
  icon: BookIcon,
  fields: [
    defineField({ name: "outlet", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "logo",
      type: "image",
      description: "The outlet's mark, shown on the card.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      type: "string",
      description: 'Typed as shown — "Mar 2026". A display string, not a date.',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "headline", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "href",
      title: "Link to the article",
      type: "string",
      description:
        "The published article's URL. A bare # is a PLACEHOLDER and must not ship — the link " +
        "checker counts them and fails when the count changes without being declared.",
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
  preview: { select: { title: "headline", subtitle: "outlet", media: "logo" } },
});
