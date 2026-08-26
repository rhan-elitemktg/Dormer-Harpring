// One of the firm's core values.
//
// NO SVG IN THE DATA. The comps store a raw SVG string on each record and
// render it through `dangerouslySetInnerHTML`. Here the record carries an
// `iconKey` and `components/icons/ValueIcon.astro` owns the markup — markup in
// a content field is not something an editor can fill in, and it becomes an
// injection surface the moment the field is CMS-backed.
//
// The key is a CLOSED LIST for the same reason a Portable Text mark set is
// closed: an icon key with no matching shape renders nothing at all, silently.
// Adding a seventh value means adding its glyph to ValueIcon first.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HeartIcon } from "@sanity/icons/Heart";

export const coreValue = defineType({
  name: "coreValue",
  title: "Core Value",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({
      name: "title",
      title: "Value",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "string",
      description: "One sentence. The cards are drawn for roughly this length.",
      validation: (rule) =>
        rule.required().max(120).warning("Longer than about 120 characters unbalances the row."),
    }),
    defineField({
      name: "iconKey",
      title: "Icon",
      type: "string",
      description:
        "Each option has a hand-drawn glyph in the codebase. There is no way to add one here " +
        "— a new icon needs a developer, or the card renders with an empty space.",
      options: {
        list: [
          { title: "Commitment — heart with a tick", value: "commitment" },
          { title: "Integrity — scales", value: "integrity" },
          { title: "Compassion — hands and heart", value: "compassion" },
          { title: "Community — people", value: "community" },
          { title: "Innovation — lightbulb", value: "innovation" },
          { title: "Teamwork — linked figures", value: "teamwork" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description: "Low numbers first.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    { name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "body" },
  },
});
