// /denver-car-accident-lawyer/ — its FAQ accordion. A singleton.
//
// TWELVE QUESTIONS THAT ONLY EVER RENDER HERE. They shared the `faq` collection
// with the homepage's eight, split by a `shownOn` radio whose only job was to
// undo the sharing; Phase 2f dropped both.
//
// THIS IS A PAGE, NOT A PRACTICE AREA, and the difference is why it gets its own
// document rather than waiting for Phase 3. `src/pages/[slug].astro` unions
// three page kinds and this one is `area-detail` — a hand-authored one-off, the
// only one there is, explicitly not a variant of the 104 imported `area-page`s
// whose FAQs arrive with their body copy in `src/content/practice-areas/`.
//
// Phase 3/4 moves the rest of this page — 45KB across ~20 section interfaces in
// `src/data/carAccidents.ts` — onto this same document. The recommendation on
// the table is to keep that structure in code and move only its text and images.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { faqItemFields, faqItemPreview } from "./faqItemFields";

export const carAccidentsPage = defineType({
  name: "carAccidentsPage",
  title: "Car Accidents",
  type: "document",
  icon: WarningOutlineIcon,
  fields: [
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      description: "The accordion. Drag to reorder — the top question opens first.",
      of: [{ type: "object", fields: faqItemFields, preview: faqItemPreview }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { prepare: () => ({ title: "Car Accidents" }) },
});
