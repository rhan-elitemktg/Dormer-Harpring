// The site's three Portable Text field types.
//
// THE MARK SET IS RESTRICTED ON PURPOSE, and it is restricted to exactly what
// `proseComponents` in `components/prose/components.ts` maps. Sanity's default
// `block` offers h1–h6, underline, code and strike-through; none of those four
// extras is mapped, and an unmapped block or mark does NOT error — the block
// renders with no spacing at all (the site's reset sets `margin: 0` on
// headings, lists and paragraphs) and the mark falls through leaving the words
// with no emphasis. So an editor reaching for underline would produce copy that
// looks broken with nothing anywhere reporting it.
//
// Offering only what renders is the fix, and it is also what the brief asked
// for: rich text rather than a row of text fields, with the markup limited to
// what the design actually has.
//
// THREE TYPES, NOT ONE, because the right answer differs by field:
//
//   richText    an article body. Headings, quotes, lists, images, links.
//   simpleText  a card body, a lede, a blurb. Paragraphs and links only — an
//               h2 inside a card would outrank the card's own heading, and a
//               list inside a 60-word blurb is a design nobody drew.
//   inlineText  one sentence, no paragraph breaks. For the places that are a
//               string today but need to carry a link.
//
// The SEO team can add a link in all three. That is the point of all three.
import { defineArrayMember, defineField, defineType } from "sanity";

/** Bold and italic. Both are mapped; nothing else is. */
const decorators = [
  { title: "Bold", value: "strong" },
  { title: "Italic", value: "em" },
];

/**
 * `alt` on a body image.
 *
 * NOT `required()`, deliberately: Sanity's `required()` rejects an empty
 * string, and an empty alt is the CORRECT markup for a decorative image — it
 * tells a screen reader to skip it rather than read a filename. The site
 * already relies on that for card art. So this warns instead, which is
 * visible to the editor without being a publish blocker on an image that is
 * genuinely decorative.
 */
const altField = defineField({
  name: "alt",
  title: "Alt text",
  type: "string",
  description:
    "What a screen reader says in place of the image. Leave it EMPTY only if the image is " +
    "purely decorative and the surrounding text already says everything it shows.",
  validation: (rule) =>
    rule.custom((value) =>
      typeof value === "string" && value.trim() !== ""
        ? true
        : "Empty alt marks this image as decorative and screen readers skip it. Only leave it empty on purpose."
    ).warning(),
});

/** The full article block: every style and list `proseComponents` maps. */
const fullBlock = defineArrayMember({
  type: "block",
  styles: [
    { title: "Paragraph", value: "normal" },
    { title: "Heading 2", value: "h2" },
    { title: "Heading 3", value: "h3" },
    // h4 arrived with the legacy import rather than the comps — see ProseH4.astro.
    { title: "Heading 4", value: "h4" },
    { title: "Quote", value: "blockquote" },
  ],
  lists: [
    { title: "Bulleted", value: "bullet" },
    { title: "Numbered", value: "number" },
  ],
  marks: {
    decorators,
    annotations: [{ type: "link" }],
  },
});

/** Paragraphs and links. No headings, no lists, no images. */
const plainBlock = defineArrayMember({
  type: "block",
  styles: [{ title: "Paragraph", value: "normal" }],
  lists: [],
  marks: {
    decorators,
    annotations: [{ type: "link" }],
  },
});

/**
 * A photograph in the flow of an article.
 *
 * `hotspot: true` is what makes the crop an editor's decision rather than a
 * developer's — and it is half the reason these render through Sanity's CDN
 * instead of Astro's build pipeline, which would re-crop from the original and
 * throw the hotspot away. See `sanity/lib/image.ts`.
 */
const bodyImage = defineArrayMember({
  type: "image",
  options: { hotspot: true },
  fields: [altField],
});

export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [fullBlock, bodyImage],
});

export const simpleText = defineType({
  name: "simpleText",
  title: "Text",
  type: "array",
  of: [plainBlock],
});

export const inlineText = defineType({
  name: "inlineText",
  title: "Text",
  type: "array",
  of: [plainBlock],
  // One block. This type exists for fields that are a single sentence today —
  // a CTA note, an attribution, a stat label — and a second paragraph in one of
  // those is a layout the design does not have.
  validation: (rule) => rule.max(1),
});
