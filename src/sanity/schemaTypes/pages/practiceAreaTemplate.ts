// The chrome every practice-area page renders. A singleton, and it reaches 104
// service pages — plus the three utility pages, which borrow this template's
// shell.
//
// UNDER PAGES, NOT SETTINGS, for the same reason the blog post template is:
// this is copy that appears ON a page.
//
// SEPARATE FROM THE BLOG POST TEMPLATE, and the two disagree in ways that show
// why. This one's contents box says "On this page" where the post's says "In
// this article"; this one has an FAQ heading and a meta line with two date
// labels, and the post has categories and a related-posts band. Their overlap is
// three short labels whose sameness is coincidence.
//
// THE EYEBROW IS THE FIRM'S TAGLINE, not a taxonomy — see the field below. The
// slot holds a category on the post page; these are service pages with nothing
// above them.
//
// NOT HERE, and each for its own reason:
//
//   the sidebar's consultation form   identical on all 290 pages both templates
//                                     serve, so it lives once on Site Settings →
//                                     Shared Sections
//   the byline's author               the FIRM writes all 104, and its name and
//                                     link come from Firm Details rather than
//                                     being typed
//   the fact-check SENTENCE           names the reviewing attorney and links to
//                                     their bio, both read from Collections →
//                                     Team. See the note on the blog post
//                                     template
//   the sidebar's practice-area card  its heading names the city and its rows
//                                     are the city's own pages — all derived
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CaseIcon } from "@sanity/icons/Case";

export const practiceAreaTemplate = defineType({
  name: "practiceAreaTemplate",
  title: "Practice area template",
  type: "document",
  icon: CaseIcon,
  description: "Labels shared by every practice-area page. Changing one changes all 104.",
  fields: [
    /*
     * IT HAS BEEN FOUR THINGS, and the history is why it is a constant now: the
     * city, then "Practice Area", then the city again, then this. The city kept
     * stuttering against the 84 titles that open with one — "Denver" above
     * "Denver Truck Accident Lawyer" — and trimming the city out of the TITLE
     * instead was declined as an SEO change on 104 ranking pages.
     */
    defineField({
      name: "eyebrow",
      title: "Line above the title",
      type: "string",
      description:
        "The same on all 104 pages — the firm's tagline. On a blog post this slot holds the " +
        "post's category; a service page has no taxonomy above it, so it takes marketing copy " +
        "instead. Do not put the city here: it is already the first word of most of the titles.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meta",
      title: "Byline row",
      type: "object",
      description:
        "The line under the title. WHO wrote it is the firm itself, read from Firm Details — " +
        "only the labels are here. There is no reviewer in this row on purpose: the band at " +
        "the foot of the page already names one, and saying it twice reads as a mistake.",
      options: { columns: 3 },
      fields: [
        defineField({
          name: "writtenByLabel",
          type: "string",
          description: 'Before the firm\'s name — "Written by".',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "updatedLabel",
          type: "string",
          description: "Before the date, on a page that has been revised. All 104 have been.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "postedLabel",
          type: "string",
          description:
            "Before the date on a page that has NOT been revised. Nothing uses it today — it " +
            "is what a newly created page would say.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contentsLabel",
      title: "Contents box heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "relatedSidebarLabel",
      title: "Related articles card heading",
      type: "string",
      description:
        "In the sidebar. The three utility pages that borrow this template override it to " +
        '"Latest articles", because their card is the five most recent posts rather than ' +
        "anything matched to a subject.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "faqsTitle",
      title: "FAQ accordion heading",
      type: "string",
      description: "Shown on the 28 pages that have an accordion.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "factCheckLabel",
      title: "Fact-check tag",
      type: "string",
      description:
        "The tag above the reviewed-by band. The SENTENCE in that band is not editable here — " +
        "see the note on the Blog post template.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Practice area template" }) },
});
