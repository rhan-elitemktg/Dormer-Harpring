// The four fields one FAQ row carries, shared by the two accordions that have one.
//
// A SHARED FIELDS ARRAY, NOT A NAMED OBJECT TYPE. Two callers is under this
// project's documented four-caller threshold for extracting a type, and a
// top-level object registration would also collide with the `faq` DOCUMENT type
// for as long as both exist. Phase 3 brings 28 practice-area accordions — 153
// items — and that is when a named type earns itself and the name is free.
//
// THIS USED TO ARGUE FOR BEING A COLLECTION, and the argument was wrong. The
// header on the retired `collections/faq.ts` said "an FAQ belongs to the
// subject, not to the page it happens to sit on", and to hold that up it needed
// a `shownOn` radio whose only job was to split one collection back into the
// two page-local lists it always was. The practice-area accordions it cited as
// the third caller are not in Sanity at all — they arrive with the imported
// body copy, in `src/content/practice-areas/`. Nothing is shared, so nothing is
// a collection: eight questions belong to the homepage and twelve to Car
// Accidents.
//
// THE ANSWER IS A PLAIN STRING, NOT PORTABLE TEXT, and that is deliberate.
// These also feed FAQPage structured data, which takes a string: an answer with
// headings or lists inside it is not valid there. If they ever need rich text,
// `lib/portableText.ts` already has `toPlainText()` for the JSON-LD side —
// change both together or the markup silently stops validating.
import { defineField } from "sanity";

/** Spread into an accordion's array member. Order is the array's, so no `order`. */
export const faqItemFields = [
  defineField({
    name: "question",
    type: "string",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "answer",
    type: "text",
    rows: 5,
    description:
      "Plain text. This is also what Google reads as the answer in search results, so it " +
      "has to make sense on its own — no headings, no lists, no links.",
    validation: (rule) => rule.required(),
  }),
  /*
   * A BARE ID, NOT A `videoRef` OBJECT — the object hid its provider and drew
   * an accordion around one input. The projection reassembles `{provider, id}`,
   * so `lib/video.ts` is untouched and nothing stores a URL.
   */
  defineField({
    name: "videoId",
    title: "Video ID",
    type: "string",
    description:
      "The short video beside the answer. Wistia's hashed id — the id ONLY, not the whole " +
      "URL. Every FAQ currently points at the same stand-in film; replacing these with real " +
      "ids is what this field is for.",
    validation: (rule) => rule.required(),
  }),
  /*
   * THE BUTTON INSIDE THIS ANSWER, per question rather than per band.
   *
   * It was one `answerCtaLabel` on the FAQ section, so twenty open answers
   * offered the same words. A question about filing deadlines and one about
   * medical bills do not want the same call to action.
   *
   * CAR ACCIDENTS FOLLOWS, because this array is shared by both accordions.
   * That page used to read the homepage's label; each of its twelve questions
   * now carries its own.
   */
  defineField({
    name: "ctaLabel",
    title: "Button inside the open answer",
    type: "string",
    validation: (rule) => rule.required(),
  }),
];

/*
 * THE ROW'S LABEL IN THE ARRAY LIST.
 *
 * `videoLength` was the subtitle and the field is gone — the duration comes off
 * Wistia now, so there is nothing typed to show. The answer stands in: it is
 * the half of the row an editor is scanning for.
 */
export const faqItemPreview = {
  select: { title: "question", subtitle: "answer" },
};
