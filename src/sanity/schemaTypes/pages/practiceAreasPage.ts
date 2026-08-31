// The /practice-areas page — its featured grid and the full directory.
//
// PHASE 3d. It holds the two LISTS only; the page's copy — its eyebrow, title,
// lede and band headings — is Phase 4 and lands on this same document, so any
// seed for that must read this back and MERGE. `dataset import --replace`
// replaces a document whole, and emitting only the copy fields would delete the
// directory.
//
// WHY THE DIRECTORY IS CURATED AND NOT DERIVED. Every entry but two points at a
// `practiceArea`, and the collection already knows each page's city and short
// name — so grouping by city and ordering by label would produce this list with
// no editing at all. It is deliberately not done that way: WHICH pages appear
// and IN WHAT ORDER are editorial acts. Four built pages are in no group today
// (Defective Helmets, Autonomous Vehicle, Drunk Driving, Taxi — all Denver)
// because the firm's own live hub does not list them, and deriving the list
// would add them silently rather than leaving the ruling open. See HANDOFF.
import { defineArrayMember, defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { SECTION } from "./section";
import { validateHref } from "../objects/link";

/**
 * A directory row that points at a practice-area page.
 *
 * A REFERENCE, and this is where the `link` type's own TODO finally comes due:
 * "internal links become a `reference` … it cannot be declared yet, no document
 * types exist". They exist now, and this is the list that most needs it — 100
 * rows an editor would otherwise type as URLs, on a site that has already
 * shipped 984 dead links from hand-written hrefs. A reference cannot dangle,
 * and the Studio gives a searchable picker showing the real page titles.
 *
 * `label` IS AN OVERRIDE AND IS USED EXACTLY ONCE. 99 of the 100 rows print the
 * referenced page's own short name, so storing a label on each would be 100
 * chances for the two to drift. The one exception is
 * `denver-premises-liability-lawyer`, which the firm's hub calls "Premises
 * Liability" in the Denver column and "Premises Liability Overview" as a
 * heading — both the hub's own wording, and the shorter one is what this page
 * prints.
 */
const areaEntry = defineArrayMember({
  type: "object",
  name: "areaEntry",
  title: "Practice area",
  fields: [
    defineField({
      name: "page",
      title: "Page",
      type: "reference",
      to: [{ type: "practiceArea" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label override",
      type: "string",
      description:
        "Leave EMPTY — the row prints the page's own short name, so the two cannot drift. " +
        "Fill it in only when this list needs different wording from the page itself.",
    }),
  ],
  preview: {
    select: { label: "label", page: "page.label", slug: "page.slug.current" },
    prepare({ label, page, slug }) {
      return { title: label || page || "(no page)", subtitle: label ? `overrides "${page}" · /${slug}/` : `/${slug}/` };
    },
  },
});

/**
 * A directory row that points somewhere other than a practice-area document.
 *
 * TWO OF THEM, and both are real rather than an escape hatch nobody needs:
 *
 *   Personal Injury  → the HOMEPAGE, which doubles as the firm's Denver
 *                      personal-injury overview. The legacy hub does this too.
 *   Car Accidents    → `/denver-car-accident-lawyer/`, which the heavy
 *                      hand-authored template serves. It is a practice-area
 *                      page, but not a `practiceArea` DOCUMENT — its content is
 *                      seventeen typed sections on the Car Accidents page
 *                      document, so there is nothing here to point at.
 *
 * A second member type rather than an optional `href` beside the reference: two
 * fields where an editor must know to fill exactly one is a validator's job,
 * and "add a Practice area" vs "add Another link" needs no explaining.
 */
const customEntry = defineArrayMember({
  type: "object",
  name: "customEntry",
  title: "Another link",
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "For the two rows that are not practice-area pages — the homepage, and the Car " +
        "Accidents page. Everything else should be a Practice area above, which cannot break.",
      validation: (rule) => rule.required().custom(validateHref),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

/**
 * A card in the featured grid.
 *
 * ITS COPY IS ITS OWN, AND THAT IS WHY IT IS NOT A REFERENCE-PLUS-LOOKUP. The
 * name here is not the page's short name — this grid says "Bicycle Accidents"
 * where the page is filed as "Bike Accidents", and "Premises Liability" where
 * the page says "Premises Liability Overview". The blurb differs from the
 * homepage's for the same area (a two-sentence pitch against a one-line label),
 * and the photograph is the comp's. So the card is copy that happens to link
 * somewhere, not a pointer to a page — which makes the destination a plain
 * href, validated the same way every other one is.
 */
const areaCard = defineArrayMember({
  type: "object",
  name: "areaCard",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "iconKey",
      title: "Icon",
      type: "string",
      description:
        "Must match an icon in components/icons/PracticeIcon.astro — car-accident, " +
        "truck-accident, slip-and-fall and so on. An unknown key draws nothing.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "blurb",
      type: "text",
      rows: 3,
      description: "Two sentences. Longer than the homepage's version of the same card.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      validation: (rule) => rule.required().custom(validateHref),
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      description: "Without one the card falls back to an icon plate.",
    }),
  ],
  preview: { select: { title: "name", subtitle: "href", media: "image" } },
});

export const practiceAreasPage = defineType({
  name: "practiceAreasPage",
  title: "Practice Areas",
  type: "document",
  icon: ThLargeIcon,
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
      name: "header",
      title: "Page header",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The band at the top of the page.",
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
          name: "ctaLabel",
          title: "Header button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "ctaNote",
          title: "Note beside the button",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "featured",
      title: "Featured grid",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The nine cards above the directory, and the heading over them.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 2, validation: (rule) => rule.required() }),
        defineField({
          name: "areas",
          title: "Cards",
          type: "array",
          of: [areaCard],
          description: "The grid above the directory. Drag to reorder.",
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    /*
     * NINE GROUPS, AND THE GROUP TITLES ARE THE FIRM'S OWN. They read as places
     * — "Denver Personal Injury", "Thornton Personal Injury" — which is why the
     * band's heading says "by location" and why the two TOPICAL groups the
     * legacy hub carries were folded into Denver: every one of their entries
     * pointed at a Denver page, so the heading is now true of the whole section.
     */
    defineField({
      name: "directory",
      title: "Browse all",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The by-location list at the foot of the page, and the heading over it.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "entries",
          title: "Groups",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "areaGroup",
              fields: [
                defineField({
                  name: "title",
                  type: "string",
                  description: 'The column heading — "Denver Personal Injury".',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "items",
                  type: "array",
                  of: [areaEntry, customEntry],
                  description:
                    "Drag to reorder. A page listed twice in one group is a duplicate the " +
                    "built page will show twice — the diff script fails on that.",
                  validation: (rule) => rule.required().min(1),
                }),
              ],
              preview: {
                select: { title: "title", items: "items" },
                prepare({ title, items }) {
                  const count = Array.isArray(items) ? items.length : 0;
                  return { title, subtitle: `${count} ${count === 1 ? "entry" : "entries"}` };
                },
              },
            }),
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
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
  preview: {
    select: { featured: "featured.areas", directory: "directory.entries" },
    prepare({ featured, directory }) {
      const groups = Array.isArray(directory) ? directory.length : 0;
      const entries = Array.isArray(directory)
        ? directory.reduce((n: number, g: { items?: unknown[] }) => n + (g.items?.length ?? 0), 0)
        : 0;
      return {
        title: "Practice Areas",
        subtitle: `${Array.isArray(featured) ? featured.length : 0} featured · ${entries} in ${groups} groups`,
      };
    },
  },
});
