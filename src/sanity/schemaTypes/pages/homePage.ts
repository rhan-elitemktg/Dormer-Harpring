// The homepage's repeatable lists. A singleton.
//
// FIVE LISTS THAT EACH APPEAR ON EXACTLY ONE PAGE. They were collections until
// Phase 2f, which is the wrong group for them: a Collection exists for content
// reused in more than one place — the six that stay reach 111, 104, 29, 27, 5
// and 3 built pages — and every one of these reaches exactly this one. An
// editor looking for the press cards was hunting a global list for something
// that only ever renders here.
//
// ARRAY POSITION IS THE ORDER, so the `order: number` each of these carried is
// gone and editors drag instead. That is a real change for the mosaic — see the
// note on `communityPhotos` below.
//
// Phase 4 adds this page's COPY to this same document — the hero, the band
// headings, the promise slides. Anything written here has to survive that, so
// the migration script reads the document back and merges rather than replacing.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HomeIcon } from "@sanity/icons/Home";
import { validateHref } from "../objects/link";
import { faqItemFields, faqItemPreview } from "./faqItemFields";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      description: "The accordion. Drag to reorder — the top question opens first.",
      of: [{ type: "object", fields: faqItemFields, preview: faqItemPreview }],
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "pressMentions",
      title: "Press Mentions",
      type: "array",
      description: "The feed's first tab — the firm in someone else's publication.",
      of: [
        {
          type: "object",
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
            defineField({
              name: "headline",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Link to the article",
              type: "string",
              // TODO(content): four of these point at "#". The articles are real
              // and published (FOX31, Denver7, OutThere Colorado, The Mountain
              // Mail) and their URLs are findable; nobody has found them.
              description:
                "The published article's URL. A bare # is a PLACEHOLDER and must not ship — " +
                "the link checker counts them and fails when the count changes without being " +
                "declared.",
              validation: (rule) => rule.required().custom(validateHref),
            }),
          ],
          preview: { select: { title: "headline", subtitle: "outlet", media: "logo" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "insightTeasers",
      title: "Insight Teasers",
      type: "array",
      description: "The feed's second tab.",
      of: [
        {
          type: "object",
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
                "Must match a glyph in components/icons/InsightIcon.astro. A key with no glyph " +
                "draws an empty plate — a new one needs a developer.",
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
              // TODO(content): all four point at "#" — they teaser articles
              // nobody has written. Unlike the press mentions there is no real
              // destination to find: either the articles get written or the
              // section comes out.
              description: "A bare # is a placeholder and must not ship.",
              validation: (rule) => rule.required().custom(validateHref),
            }),
          ],
          preview: { select: { title: "title", subtitle: "category" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "communityPhotos",
      title: "Community Photos",
      type: "array",
      // THE ORDER IS A LAYOUT CONSTRAINT AND THIS IS THE ONLY PLACE IT IS NOW
      // WRITTEN DOWN WHERE THE PERSON CHANGING IT WILL SEE IT. It used to live
      // in a comment in src/data/community.ts, which was safe while an editor
      // reordered by typing a number into a form; they drag now, and the person
      // dragging never opens that file.
      description:
        "The mosaic is a 12-column grid and the widths have to add up ROW BY ROW: 5+3+4, " +
        "then 4+5+3, then one full-width 12. Reordering without keeping each row at twelve " +
        "leaves a gap on the page.",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "org",
              title: "Organisation",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "span",
              title: "Width",
              type: "number",
              // `span` IS CONTENT HERE, NOT PRESENTATION, and that is a genuine
              // exception to the rule that layout stays in CSS. Each
              // photograph's width is a composition decision about THAT
              // photograph — a wide group shot and a tall portrait are not
              // interchangeable at the same width.
              description:
                "How many of the mosaic's twelve columns this photograph fills. Only these " +
                "four widths are drawn — anything else breaks the row.",
              options: {
                list: [
                  { title: "Quarter (3)", value: 3 },
                  { title: "Third (4)", value: 4 },
                  { title: "Wide (5)", value: 5 },
                  { title: "Full row (12)", value: 12 },
                ],
              },
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "org", subtitle: "caption", media: "image" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "charityPartners",
      title: "Charity Partners",
      type: "array",
      // TODO(sanity): one asset per organisation. Several of these logos are
      // also on the Community Involvement page's partner cards, and they are
      // separate uploads today.
      description: "The logo strip under the mosaic.",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "logo",
              type: "image",
              description: "Reads as the logo's alt text via the name above.",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "name", media: "logo" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { prepare: () => ({ title: "Homepage" }) },
});
