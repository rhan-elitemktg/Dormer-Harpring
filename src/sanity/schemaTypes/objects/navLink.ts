// One row in a navigation menu or a footer column.
//
// NO `external` FLAG, AND THAT IS THE SAME CALL `link` MAKES. `NavItem` carries
// one today and `Header.astro` reads it for target, rel and the outbound glyph
// — but a flag is a second source of truth for something the href already
// says, and the failure mode is an editor pasting an https:// URL and not
// finding the checkbox: the link then opens in the same tab with no glyph, and
// nothing reports it. The getter derives it, exactly as `ProseLink.astro`
// already does for body links, so there is one rule for the whole site.
//
// Only ONE nav row is external today (Accidents In The News) and it is an
// https:// URL, so deriving returns the same answer the flag does.
import { defineField, defineType } from "sanity";
import { validateHref } from "./link";

export const navLink = defineType({
  name: "navLink",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "The words a visitor reads and clicks.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path like /about/ (with the trailing slash) or a full https:// URL. " +
        "External links open in a new tab and get an outbound arrow automatically.",
      validation: (rule) => rule.required().custom(validateHref),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "href" },
  },
});
