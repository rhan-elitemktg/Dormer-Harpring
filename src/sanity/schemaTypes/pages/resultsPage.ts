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
  /* TWO TABS, NOT AN ACCORDION AT THE FOOT. The SEO block used to be the last
     field on this document, collapsed — which is a good way to make sure it is
     never filled in. A tab is one click from the top of the form and reads as a
     part of the document rather than an appendix to it.
     `default: true` on the content tab so opening the document still lands on
     the page itself. */
  groups: [
    { name: "page", title: "The page", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      group: "page",
      description: "The small line above the page title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      group: "page",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lede",
      title: "Lede",
      type: "simpleText",
      group: "page",
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
      group: "page",
      description: "The button under the grid, shown while there are more results to load.",
      validation: (rule) => rule.required(),
    }),

    /* ITS OWN TAB. Optional, and every one of its five values falls back to
       what the page already renders — see the note on the `seo` object type.
       It was the last field on the form and collapsed, which is a reliable way
       to make sure nobody fills it in. */
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: { prepare: () => ({ title: "Results" }) },
});
