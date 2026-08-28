// /news — the blog index's own copy. A singleton.
//
// SIX OF THESE EIGHT FIELDS ARE INTERFACE LABELS, not prose: a tab row's
// heading, the "All posts" tab, the featured badge, two buttons and the line
// shown when a filter matches nothing. They are strings in fixed design slots
// and they stay strings — turning one into rich text would add a wrapper
// element to the markup in exchange for a link nobody wants inside a button.
//
// THE POSTS ARE A COLLECTION and the categories are another; neither belongs
// here. So is the featured post, which is a flag on a `blogPost` document
// rather than a field on this one — an editor promoting a post should do it
// from the post, not from a page that then names it.
//
// A NOTE ON `emptyLabel`, WHICH LOOKS DEAD AND IS NOT. The category tabs filter
// client-side over the whole feed, and every tab the row draws is a category
// some post leads with — so today nothing can select an empty list. It is what
// the page says if that ever stops being true, and it is one line of copy
// against a blank panel.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { DocumentTextIcon } from "@sanity/icons/DocumentText";

export const blogIndexPage = defineType({
  name: "blogIndexPage",
  title: "Blog index",
  type: "document",
  icon: DocumentTextIcon,
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
      type: "simpleText",
      description: "The sentence under the title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categoryLabel",
      title: "Above the category tabs",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "allLabel",
      title: "First tab",
      type: "string",
      description: "The tab that clears the filter. It is not a category.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featuredBadge",
      type: "string",
      description: "The tag on the panel at the top of the feed.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readMoreLabel",
      title: "Link on each card",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "loadMoreLabel",
      title: "Load-more button",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "emptyLabel",
      title: "When a category has no posts",
      type: "string",
      description:
        "Shown in place of the feed if a category tab matches nothing. Nothing can select an " +
        "empty category today — every tab belongs to a post — so this is the fallback rather " +
        "than something visitors see.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Blog index" }) },
});
