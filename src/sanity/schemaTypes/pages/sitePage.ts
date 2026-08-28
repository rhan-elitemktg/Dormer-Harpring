// The three utility pages — privacy policy, sitemap, 404. THREE SINGLETONS OF
// ONE TYPE, not three types.
//
// WHY ONE TYPE. They are the same document in every way that matters: a title,
// an optional lede, a body, no taxonomy above them and no collection beneath.
// Three near-identical schema files beside each other would be three places to
// keep in step. What differs between them is two optional fields, and each of
// the two is used by exactly one of the three — see below.
//
// WHY NOT ONE TYPE WITH MANY DOCUMENTS, EITHER. Each is pinned to a fixed `_id`
// in the desk, the same way every other singleton is, so an editor cannot create
// a fourth and wonder why it does not appear anywhere. There is no route that
// would serve it: these three are `src/pages/privacy-policy.astro`,
// `sitemap.astro` and `404.astro`, hand-built files, not a dynamic route over a
// collection.
//
// TWO CONDITIONAL FIELDS, EACH ON ONE DOCUMENT. `hidden` rather than absent,
// because a schema is one shape and the alternative is three types again:
//
//   updated{}   only the privacy policy stamps when it last changed. A sitemap
//               and a 404 have no such date, and printing one would be a claim
//               about content that is generated rather than written.
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
  { title: "Sitemap", value: "sitemap" },
  { title: "404", value: "notFound" },
] as const;

const isNot = (kind: string) => (context: { parent?: unknown; document?: unknown }) =>
  ((context.document as { kind?: string } | undefined)?.kind ?? "") !== kind;

export const sitePage = defineType({
  name: "sitePage",
  title: "Utility page",
  type: "document",
  icon: DocumentIcon,
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
      readOnly: true,
      options: { list: [...KINDS] },
      description: "Fixed. Each of these three has its own hand-built route.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Page content",
      type: "object",
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
      hidden: isNot("privacy"),
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
  ],
  preview: {
    select: { title: "content.title", kind: "kind" },
    prepare: ({ title, kind }) => ({
      title: title ?? "Untitled",
      subtitle: KINDS.find((k) => k.value === kind)?.title,
    }),
  },
});
