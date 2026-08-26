// A charity logo in the homepage's partner strip.
//
// TODO(sanity): one asset per organisation. Several of these logos are also
// used on the Community page's partner cards, and they are separate uploads
// today — see `communityPartner`.
import { defineField, defineType } from "sanity";
import { HeartIcon } from "@sanity/icons/Heart";

export const ngoPartner = defineType({
  name: "ngoPartner",
  title: "Charity Partner",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "logo",
      type: "image",
      description: "Reads as the logo's alt text via the name above.",
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
  preview: { select: { title: "name", media: "logo" } },
});
