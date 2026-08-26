// A city the firm serves.
//
// The nine cities that have practice-area pages. This is the only place they
// are written down in prose, which is why the module it came from has been
// orphaned and un-orphaned three times — deleted on the strength of one grep,
// then needed again for a sidebar heading.
//
// TODO(sanity): these become the `serviceCity` documents the footer's
// service-area band wants, with their own landing pages. The eighteen footer
// chips are plain text today precisely because no such page exists.
import { defineField, defineType } from "sanity";
import { PinIcon } from "@sanity/icons/Pin";

export const city = defineType({
  name: "city",
  title: "City",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({
      name: "key",
      title: "Reference key",
      type: "slug",
      description: "The slug practice-area pages are filed under — denver, highlands-ranch.",
      options: { source: "name", maxLength: 40 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description: "Low numbers first. Denver leads — it is the firm's own city.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "key.current" } },
});
