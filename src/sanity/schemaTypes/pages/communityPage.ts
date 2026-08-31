// The /community-involvement page — three bands, three accordion sections.
//
// Both lists were collections until Phase 2f and neither renders anywhere else
// — this page exists to render them. See the note on `homePage` for the rule.
//
// THESE ARE NOT THE HOMEPAGE'S ORGANISATIONS, though several are the same
// charities. The homepage mosaic and logo strip carry their own display labels
// ("Ronald McDonald House", not "Ronald McDonald House Denver") and a different
// crop of the logos; merging them would silently restyle an approved homepage.
// They become one set when an editor owns the assets — TODO(sanity).
//
// PHASE 5 PUT EACH BAND'S HEADING INSIDE THE BAND. The heading used to sit at
// the top level beside its list — `sponsorshipsHeading` next to `sponsorships`
// — which is two accordion rows for one band, and a naming convention as the
// only thing pairing them. A band is one object now.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HeartFilledIcon } from "@sanity/icons/HeartFilled";
import { SECTION } from "./section";

export const communityPage = defineType({
  name: "communityPage",
  title: "Community Involvement",
  type: "document",
  icon: HeartFilledIcon,
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
      ],
      validation: (rule) => rule.required(),
    }),

    /*
     * THE PARTNER CARDS ARE RENDERED TWICE ON THIS PAGE, under two headings —
     * once as the volunteer grid and once as the logo strip at the foot. So the
     * list is one array and the two headings are two fields, which is the same
     * split `sharedSections` makes across pages, applied within one. Both
     * headings live here, with the list they head.
     */
    defineField({
      name: "partners",
      title: "Community partners",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The volunteer grid, and the logo strip at the foot drawn from the same list.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "label",
          title: "Logo strip label",
          type: "string",
          description:
            "The line above the logos at the foot of the page — the SAME organisations as the " +
            "volunteer grid above, shown as marks rather than cards.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "items",
          title: "Organisations",
          type: "array",
          description:
            "Rendered twice on the page — as the volunteer cards and as the logo row beneath " +
            "them. Drag to reorder; both follow.",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "org",
                  title: "Organisation",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "logo", type: "image", validation: (rule) => rule.required() }),
                defineField({
                  name: "photo",
                  title: "The team at work",
                  type: "image",
                  options: { hotspot: true },
                  // THE PHOTOGRAPH IS OPTIONAL AND MUST STAY OPTIONAL. Four of
                  // the eleven have none. TODO(launch): photography for Craig
                  // Hospital, The Park People, We Don't Waste and the Dumb
                  // Friends League.
                  description:
                    "OPTIONAL. Without one the card shows the logo on white, which is " +
                    "deliberate — not a gap to fill with a stock photograph.",
                }),
                defineField({
                  name: "body",
                  title: "What the firm does with them",
                  type: "text",
                  rows: 4,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "org", subtitle: "body", media: "logo" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "sponsorships",
      title: "Sponsorships",
      type: "object",
      group: "page",
      options: SECTION,
      description: "The list at the foot of the page, and the heading above it.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "items",
          title: "Teams, events and causes",
          type: "array",
          description: "Text only — no logo, by design.",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  title: "What it is",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "name", subtitle: "body" } },
            },
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
  preview: { prepare: () => ({ title: "Community Involvement" }) },
});
