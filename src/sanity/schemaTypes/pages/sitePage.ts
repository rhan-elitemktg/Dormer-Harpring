// The four utility pages — privacy policy, editorial guidelines, sitemap, 404.
// FOUR SINGLETONS OF ONE TYPE, not four types.
//
// WHY ONE TYPE. They are the same document in every way that matters: a title,
// an optional lede, a body, no taxonomy above them and no collection beneath.
// Four near-identical schema files beside each other would be four places to
// keep in step. What differs between them is two optional fields — see below.
//
// EDITORIAL GUIDELINES WAS THE FOURTH, AND ADDING IT COST ONE LINE IN `KINDS`
// PLUS ONE IN THE DESK. That is the argument for this shape, made after the
// fact: the page is live on the site being replaced, was found by the cutover
// URL audit as the only would-be 404 left, and slotted in without a schema
// file, a route pattern or a projection of its own.
//
// WHY NOT ONE TYPE WITH MANY DOCUMENTS, EITHER. Each is pinned to a fixed `_id`
// in the desk, the same way every other singleton is, so an editor cannot create
// a fifth and wonder why it does not appear anywhere. There is no route that
// would serve it: these four are `src/pages/privacy-policy.astro`,
// `editorial-guidelines.astro`, `sitemap.astro` and `404.astro`, hand-built
// files, not a dynamic route over a collection.
//
// TWO CONDITIONAL FIELDS. `hidden` rather than absent, because a schema is one
// shape and the alternative is four types again:
//
//   updated{}   the two WRITTEN documents stamp when they last changed — the
//               privacy policy and the editorial guidelines. Both are prose
//               somebody revises, and on both the date is the point: a policy
//               and a set of standards are read partly for how current they
//               are. The sitemap and the 404 have no such date, and printing
//               one would be a claim about content that is generated rather
//               than written.
//   links{}     only the 404 offers routes. A privacy policy that ended in four
//               suggestions would read as a page that had lost its way.
//
// NO EYEBROW ON ANY OF THE THREE, unlike the practice-area template whose shell
// they borrow. That template's eyebrow is the firm's tagline — marketing copy
// standing in for a taxonomy. On a privacy policy it would read as a slogan
// stapled to a legal notice, and on a 404 it would be noise above an apology.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { DocumentIcon } from "@sanity/icons/Document";
import { SECTION } from "./section";
import { validateHref } from "../objects/link";

/** Which of the three a document is. Fixed at seed time; the desk pins each to
 *  its own `_id`, so this is what the FORM keys its conditional fields on. */
const KINDS = [
  { title: "Privacy policy", value: "privacy" },
  { title: "Editorial guidelines", value: "editorial" },
  { title: "Sitemap", value: "sitemap" },
  { title: "404", value: "notFound" },
] as const;

/** Hidden unless the document is one of `kinds`. The plural form exists because
 *  `updated{}` is shared by the two written documents; `isNot` remains for
 *  `links{}`, which really is one document's field. */
const isNotOneOf = (...kinds: string[]) => (context: { parent?: unknown; document?: unknown }) =>
  !kinds.includes((context.document as { kind?: string } | undefined)?.kind ?? "");

const isNot = (kind: string) => (context: { parent?: unknown; document?: unknown }) =>
  ((context.document as { kind?: string } | undefined)?.kind ?? "") !== kind;

export const sitePage = defineType({
  name: "sitePage",
  title: "Utility page",
  type: "document",
  icon: DocumentIcon,
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
    /*
     * READ-ONLY, AND IT IS NOT BOOKKEEPING. Three routes are hand-built files
     * that each fetch one of these documents by id; changing this field would
     * not move a page, it would only make the form show the wrong conditional
     * fields. Hidden would be tidier and is wrong: an editor who opens "404"
     * should be able to see that is what they have.
     */
    defineField({
      name: "kind",
      title: "Which page",
      type: "string",
      group: "page",
      readOnly: true,
      options: { list: [...KINDS] },
      description: "Fixed. Each of these three has its own hand-built route.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Page content",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The title, the sentence under it, and the body.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "lede",
          type: "text",
          rows: 3,
          description:
            "One sentence under the title. The privacy policy has none — its body opens " +
            "straight into the first section.",
        }),
        defineField({
          name: "body",
          type: "richText",
          description:
            "Headings, lists, quotes and links. The sitemap and the 404 have no body: one is " +
            "generated from every page the site serves, the other is four links.",
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "updated",
      title: "Last-updated stamp",
      type: "object",
      group: "page",
      hidden: isNotOneOf("privacy", "editorial"),
      description: "Printed under the title, and as the page's machine-readable date.",
      options: { ...SECTION, columns: 2 },
      fields: [
        defineField({
          name: "at",
          title: "Date",
          type: "date",
          description:
            "When the text last changed — not when the page was first written. The live " +
            "policy dates from 2019 and was revised in 2026; a 2019 stamp on it reads as " +
            "stale rather than settled.",
        }),
        defineField({
          name: "label",
          title: "Label before it",
          type: "string",
        }),
      ],
    }),

    /*
     * FOUR ROUTES RATHER THAN A SEARCH BOX, and that is a decision rather than
     * a gap: this site has no search. The blog index filters client-side over a
     * list it already has, which would find nothing outside /news, and a box
     * that returns nothing is worse than no box.
     *
     * The four are the destinations a dead URL most plausibly wanted — the ~300
     * legacy URLs that land here are practice-area pages and blog posts, in
     * that order.
     *
     * THE WHOLE SECTION IS CONDITIONAL, not each field. Two of the three
     * documents of this type never show it, and a collapsed accordion row that
     * opens onto nothing is worse than no row.
     */
    defineField({
      name: "links",
      title: "Where to go instead",
      type: "object",
      group: "page",
      options: SECTION,
      hidden: isNot("notFound"),
      description:
        "Shown on the 404. There is no search box on this site, so these are the whole of " +
        "what the page offers.",
      fields: [
        defineField({
          name: "title",
          title: "Heading above the links",
          type: "string",
        }),
        defineField({
          name: "items",
          title: "Links",
          type: "array",
          of: [
            {
              type: "object",
              name: "notFoundLink",
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "description",
                  type: "string",
                  description: "One line under the label.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
              ],
              preview: { select: { title: "label", subtitle: "href" } },
            },
          ],
        }),
      ],
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
  preview: {
    select: { title: "content.title", kind: "kind" },
    prepare: ({ title, kind }) => ({
      title: title ?? "Untitled",
      subtitle: KINDS.find((k) => k.value === kind)?.title,
    }),
  },
});
