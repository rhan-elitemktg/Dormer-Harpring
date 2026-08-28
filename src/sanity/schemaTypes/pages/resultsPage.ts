// /results — the page's own copy. A singleton.
//
// THE RESULTS THEMSELVES ARE A COLLECTION. Each verdict appears on this page,
// on the homepage's strip and — for seven of them — on Co-Counsel, which is
// what makes them reusable content rather than this page's own. The three lists
// are three projections of one collection, not three lists.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CaseIcon } from "@sanity/icons/Case";

export const resultsPage = defineType({
  name: "resultsPage",
  title: "Results",
  type: "document",
  icon: CaseIcon,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "The small line above the page title.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "lede",
      title: "Lede",
      type: "simpleText",
      // The prior-results disclaimer lives INSIDE this sentence rather than in
      // the footer's legal bar, which is where the comps put it. It was taken
      // out of the bar deliberately: /results, /co-counsel and /testimonials
      // are the three pages that actually publish outcomes, and each carries
      // its own copy of it. Removing it from here removes it from this page.
      description:
        "The sentence under the title. It ends on the prior-results disclaimer, which this " +
        "page carries itself — it is not in the site footer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "moreLabel",
      title: "Load-more button",
      type: "string",
      description: "The button under the grid, shown while there are more results to load.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Results" }) },
});
