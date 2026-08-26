// One question and its answer.
//
// A COLLECTION RATHER THAN PAGE COPY. The homepage has an accordion, the heavy
// Car Accidents page has its own twelve, and 28 of the 104 imported
// practice-area pages carry one each — 153 items in total. An FAQ belongs to
// the subject, not to the page it happens to sit on.
//
// THE ANSWER IS A PLAIN STRING, NOT PORTABLE TEXT, and that is deliberate.
// These also feed FAQPage structured data, which takes a string: an answer with
// headings or lists inside it is not valid there. If they ever need rich text,
// `lib/portableText.ts` already has `toPlainText()` for the JSON-LD side —
// change both together or the markup silently stops validating.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
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
    defineField({
      name: "shownOn",
      title: "Accordion",
      type: "string",
      description: "Which page's accordion this question appears in.",
      options: {
        list: [
          { title: "Homepage", value: "home" },
          { title: "Car Accidents", value: "car-accidents" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "video",
      title: "Attorney's filmed answer",
      type: "videoRef",
      description:
        "The short video beside the answer. Every FAQ currently points at the same stand-in " +
        "film — replacing these with real ids is what this field is for.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "videoLength",
      title: "Video length",
      type: "string",
      description: 'As shown on the row — "2 min". Not read from the video; type what it says.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description: "Low numbers first, within this page's accordion.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    { name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "question", shownOn: "shownOn", order: "order" },
    prepare: ({ title, shownOn, order }) => ({ title, subtitle: `${shownOn} · ${order}` }),
  },
});
