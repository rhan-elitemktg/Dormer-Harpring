// The homepage's repeatable lists. A singleton.
//
// SEVEN LISTS THAT EACH APPEAR ON EXACTLY ONE PAGE. Five were collections until
// Phase 2f, which is the wrong group for them: a Collection exists for content
// reused in more than one place — the six that stay reach 111, 104, 29, 27, 5
// and 3 built pages — and every one of these reaches exactly this one. An
// editor looking for the press cards was hunting a global list for something
// that only ever renders here. Phase 3d added the two card rails at the foot of
// this file for the same reason, out of `data/practiceAreas.ts`.
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
    /*
     * THE SIX PRACTICE-AREA CARDS, and they are COPY rather than pointers.
     *
     * The obvious modelling — a reference to the `practiceArea` document, with
     * the name and blurb read off it — is wrong here, and the data says so. This
     * rail calls one card "Bicycle Accidents" where the page it links is filed
     * as "Bike Accidents", and "Slip & Fall" where the page is "Slip and Fall
     * Accidents". Its blurb is a one-line label where /practice-areas ships a
     * two-sentence pitch for the same area. Four of the cards appear in both
     * lists with the SAME href and DIFFERENT copy — so they are two lists of
     * cards, not one list read twice.
     *
     * That also means the destination is a plain href rather than a reference:
     * one of the six points at `/denver-car-accident-lawyer/`, which the heavy
     * hand-authored template serves and which is therefore not a `practiceArea`
     * document at all. `check:links` is what catches a dead one.
     */
    defineField({
      name: "practiceAreaCards",
      title: "Practice area cards",
      type: "array",
      description:
        "The rail under the hero. Its wording is its own — this is not the same copy as the " +
        "Practice Areas page's grid, and four of these areas appear on both with different " +
        "blurbs. Drag to reorder.",
      of: [
        {
          type: "object",
          name: "areaCard",
          fields: [
            defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "iconKey",
              title: "Icon",
              type: "string",
              description:
                "Must match an icon in components/icons/PracticeIcon.astro — car-accident, " +
                "truck-accident, slip-and-fall. An unknown key draws nothing.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "blurb",
              type: "text",
              rows: 2,
              description: "One line. The Practice Areas page's version of the same card is longer.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Destination",
              type: "string",
              validation: (rule) => rule.required().custom(validateHref),
            }),
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
              description: "Without one the card falls back to an icon plate.",
            }),
          ],
          preview: { select: { title: "name", subtitle: "href", media: "image" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    /*
     * THE FOUR CATASTROPHIC-INJURY PANELS. Same shape one field short — these
     * carry no photograph, and their one line of copy is an `insight` rather
     * than a blurb, which is the field name the component reads.
     */
    defineField({
      name: "catastrophicAreas",
      title: "Catastrophic injury panels",
      type: "array",
      description: "The four panels further down the page. No photographs — these draw an icon.",
      of: [
        {
          type: "object",
          name: "catastrophicArea",
          fields: [
            defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "iconKey",
              title: "Icon",
              type: "string",
              description: "Must match an icon in components/icons/PracticeIcon.astro.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "insight",
              type: "text",
              rows: 2,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Destination",
              type: "string",
              validation: (rule) => rule.required().custom(validateHref),
            }),
          ],
          preview: { select: { title: "name", subtitle: "insight" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),

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
