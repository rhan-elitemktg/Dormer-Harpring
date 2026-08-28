// The /community-involvement page's two lists. A singleton.
//
// Both were collections until Phase 2f and neither renders anywhere else — this
// page exists to render them. See the note on `homePage` for the rule.
//
// THESE ARE NOT THE HOMEPAGE'S ORGANISATIONS, though several are the same
// charities. The homepage mosaic and logo strip carry their own display labels
// ("Ronald McDonald House", not "Ronald McDonald House Denver") and a different
// crop of the logos; merging them would silently restyle an approved homepage.
// They become one set when an editor owns the assets — TODO(sanity).
//
// Phase 4 adds this page's copy — the hero, the two band headings — to this
// same document.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HeartFilledIcon } from "@sanity/icons/HeartFilled";

export const communityPage = defineType({
  name: "communityPage",
  title: "Community Involvement",
  type: "document",
  icon: HeartFilledIcon,
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
    /*
     * THE PARTNER CARDS ARE RENDERED TWICE ON THIS PAGE, under two headings —
     * once as the volunteer grid and once as the logo strip at the foot. So the
     * list is one array and the two headings are two fields, which is the same
     * split `sharedSections` makes across pages, applied within one.
     */
    defineField({
      name: "volunteer",
      title: "Volunteer grid heading",
      type: "object",
      description: "Above the partner cards.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sponsorshipsHeading",
      title: "Sponsorships heading",
      type: "object",
      options: { columns: 2 },
      description: "Above the sponsorship list.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "partnersLabel",
      title: "Logo strip label",
      type: "string",
      description:
        "The line above the logos at the foot of the page — the SAME organisations as the " +
        "volunteer grid above, shown as marks rather than cards.",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "partners",
      title: "Community Partners",
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
              // THE PHOTOGRAPH IS OPTIONAL AND MUST STAY OPTIONAL. Four of the
              // eleven have none. TODO(launch): photography for Craig Hospital,
              // The Park People, We Don't Waste and the Dumb Friends League.
              description:
                "OPTIONAL. Without one the card shows the logo on white, which is deliberate " +
                "— not a gap to fill with a stock photograph.",
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

    defineField({
      name: "sponsorships",
      title: "Sponsorships",
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
  preview: { prepare: () => ({ title: "Community Involvement" }) },
});
