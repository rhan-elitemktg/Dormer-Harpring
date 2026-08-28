// One award badge in the trust bar.
//
// The image lives on the RECORD, beside its alt text, and that is deliberate:
// splitting them is how a badge ends up captioned as the one next to it. It
// already happened once upstream — every comp captions the first four badges
// in an order the artwork does not match, and that mislabelling was copied
// across all fourteen pages before anyone read the images.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { StarIcon } from "@sanity/icons/Star";

export const award = defineType({
  name: "award",
  title: "Award",
  type: "document",
  icon: StarIcon,
  fields: [
    /*
     * A STABLE HANDLE, AND IT IS LOAD-BEARING. The heavy Car Accidents page
     * names six of these awards by key — `{ _key: "multi-million", awardKey:
     * "mmdaf" }` — and `[slug].astro` THROWS at build time when a named award
     * is missing. Dropping the keys in favour of generated document ids broke
     * that build immediately, which is the assertion earning its keep.
     *
     * So the key is content, not an implementation detail: it is projected as
     * `_key` and it is what a cross-reference resolves against. Renaming one
     * fails the build rather than quietly rendering the wrong badge.
     *
     * A `slug` rather than a plain string for the character set and the
     * uniqueness control; it is not a URL and nothing routes on it.
     *
     * PHASE 4f MADE THE CROSS-REFERENCE A REAL `reference`, so the Car Accidents
     * page can no longer name an award that is not there. The key survives that
     * change and is still content: the PROJECTION resolves the reference back
     * to `key.current`, because the components read a key and the whole
     * migration rests on no call site moving. What it stops being is the only
     * thing standing between a rename and the wrong badge.
     */
    defineField({
      name: "key",
      title: "Reference key",
      type: "slug",
      description:
        "A short stable handle — mmdaf, avvo, ntl-100. Other pages name specific awards by " +
        "this, so changing it on an award that is named elsewhere breaks the build until the " +
        "other end is changed too. Safe to leave alone.",
      options: { source: "alt", maxLength: 40 },
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value?.current) return "Required.";
          const client = context.getClient({ apiVersion: "2026-08-01" });
          const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
          const clash = await client.fetch(
            `count(*[_type == "award" && key.current == $key && !(_id in [$id, "drafts." + $id])])`,
            { key: value.current, id }
          );
          return clash === 0 || `Another award already uses the key "${value.current}".`;
        }),
    }),
    defineField({
      name: "alt",
      title: "Award name",
      type: "string",
      description:
        "The full name of the award — \"Multi-Million Dollar Advocates Forum\". This is also " +
        "the badge's alt text, so it has to read as a name out loud: it is what a screen " +
        "reader says and what Google reads.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Badge",
      type: "image",
      description: "The badge artwork. Check it is the award named above.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "height",
      title: "Height on the page",
      type: "number",
      description:
        "Pixels. The badges are drawn at different weights, so they are sized individually " +
        "rather than to one height — 74–88 is the range the others sit in.",
      validation: (rule) => rule.required().min(24).max(160),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description: "Low numbers first. The bar reads left to right in this order.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    { name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "alt", order: "order", key: "key.current", media: "image" },
    prepare: ({ title, order, key, media }) => ({
      title,
      subtitle: `${order} · ${key}`,
      media,
    }),
  },
});
