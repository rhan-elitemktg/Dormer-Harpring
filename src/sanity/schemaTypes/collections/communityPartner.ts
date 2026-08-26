// An organisation the firm works with, on the Community page.
//
// THE PHOTOGRAPH IS OPTIONAL AND MUST STAY OPTIONAL. Four of the eleven have
// none, and the card falls back to the logo on white rather than leaving a
// hole. TODO(launch): photography for Craig Hospital, The Park People, We Don't
// Waste and the Dumb Friends League.
import { defineField, defineType } from "sanity";
import { UsersIcon } from "@sanity/icons/Users";

export const communityPartner = defineType({
  name: "communityPartner",
  title: "Community Partner",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "org",
      title: "Organisation",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "logo", type: "image", validation: (rule) => rule.required() }),
    defineField({
      name: "photo",
      title: "The team at work",
      type: "image",
      options: { hotspot: true },
      description:
        "OPTIONAL. Without one the card shows the logo on white, which is deliberate — not a " +
        "gap to fill with a stock photograph.",
    }),
    defineField({
      name: "body",
      title: "What the firm does with them",
      type: "text",
      rows: 4,
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
  preview: { select: { title: "org", subtitle: "body", media: "logo" } },
});
