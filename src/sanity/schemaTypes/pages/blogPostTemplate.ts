// The chrome every blog post renders — the labels around the article, not the
// article. A singleton, and it reaches 186 pages.
//
// UNDER PAGES, NOT SETTINGS. It holds copy that appears ON a page, which is
// exactly what an SEO editor reaches for; Settings is for firm-wide facts.
//
// TWO TEMPLATES, NOT ONE, and their labels prove it rather than merely allowing
// it: this one heads its contents box "In this article" where the practice-area
// template says "On this page", because one is an article and the other is a
// service page. Folding them together would mean choosing which of those is
// wrong.
//
// THE SIDEBAR'S CONSULTATION FORM IS NOT HERE. It is identical on all 290 pages
// both templates serve, so it lives once on Site Settings → Shared Sections and
// both templates read it — change it there and both follow. (It is also NOT the
// page-foot form: that one says "Take the first step." and is in Site Settings →
// Contact. Three forms, three sets of copy, all different.)
//
// THE FACT-CHECK SENTENCE IS NOT HERE EITHER, and that is the one string Phase 4
// deliberately left in code. `factCheckLabel` below is the tag above the band;
// the sentence inside it names the reviewing attorney and links to their bio,
// and both of those are read from the roster rather than typed — the comp says
// "KC Harpring" and the live site "KC Harping", and `byline()` takes whatever
// Collections → Team says. Storing the sentence would freeze that name.
//
// Making it editable needs a decision nobody has made: either a placeholder
// syntax for the substitution, or dropping the per-post derivation so an
// editor writes the name themselves. `blogPost.factCheck` already exists as the
// per-document override — 0 of 186 use it — so the escape hatch is there for an
// article reviewed by someone else. See the note on `reviewedBy()` in
// `src/data/blog.ts`.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { DocumentTextIcon } from "@sanity/icons/DocumentText";

export const blogPostTemplate = defineType({
  name: "blogPostTemplate",
  title: "Blog post template",
  type: "document",
  icon: DocumentTextIcon,
  description: "Labels shared by every blog post. Changing one changes all 186.",
  fields: [
    defineField({
      name: "contentsLabel",
      title: "Contents box heading",
      type: "string",
      description:
        'Above the box that lists the article\'s sections. NOT "Key takeaways" — most articles ' +
        "open with an H2 by that name and two of them on one page reads as a bug.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categoriesLabel",
      title: "Categories card heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "relatedSidebarLabel",
      title: "Related articles card heading",
      type: "string",
      description: "In the sidebar.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "relatedTitle",
      title: "Related posts band heading",
      type: "string",
      description: "The band under the article, which is a different place from the card above.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "factCheckLabel",
      title: "Fact-check tag",
      type: "string",
      description:
        "The tag above the reviewed-by band. The SENTENCE in that band is not editable here — " +
        "it names the reviewing attorney and links to their bio, both read from Collections → " +
        "Team. A post reviewed by someone else can override the whole band on its own document.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readMoreLabel",
      title: "Link on a related card",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Blog post template" }) },
});
