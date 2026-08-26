// One person at the firm — and their bio page, where they have one.
//
// ONE DOCUMENT, NOT TWO. The codebase held a roster and a set of bio pages as
// separate lists joined by key, and every one of the 25 profiles matched a
// roster entry exactly. They are the same person; splitting them means an
// editor updating a name in one place and not the other.
//
// THE FORM IS DIFFERENT FOR EACH GROUP, and that is the point of grouping them.
// The desk opens Team into Founding Partners, Attorneys, Staff and Office Dogs;
// showing all four the same twenty fields would make the separation cosmetic.
// What each group actually uses was COUNTED, not guessed, across all 30
// documents:
//
//   partners only   card bio, accolades, figures band, bio eyebrow, profile film
//   staff only      standfirst  (16 of 20 have one; no attorney or partner does)
//   dogs only       in loving memory
//   not staff/dogs  email, press links, the attorney rail
//   not dogs        education, bio page
//   everyone        portrait, name, role
//
// A field hidden here is not deleted — the data survives and reappears if the
// condition is met again. What it stops is an editor filling in a field that
// nothing on their page renders.
import { defineField, defineType, type ConditionalPropertyCallback } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { UsersIcon } from "@sanity/icons/Users";

/** The document's `kind`, read through the cast Sanity's own callback type needs. */
const kindOf = (document: unknown) => (document as { kind?: string } | undefined)?.kind;

/** Show only for these groups. */
const only =
  (...kinds: string[]): ConditionalPropertyCallback =>
  ({ document }) =>
    !kinds.includes(kindOf(document) ?? "");

/** Show for everyone EXCEPT these groups. */
const except =
  (...kinds: string[]): ConditionalPropertyCallback =>
  ({ document }) =>
    kinds.includes(kindOf(document) ?? "");

const noProfile: ConditionalPropertyCallback = ({ document }) =>
  !(document as { hasProfile?: boolean } | undefined)?.hasProfile;

const notOnRail: ConditionalPropertyCallback = ({ document }) =>
  !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail;

export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  icon: UsersIcon,
  groups: [
    { name: "card", title: "Card", default: true },
    { name: "profile", title: "Bio page" },
    { name: "rail", title: "Attorney rail" },
  ],
  fields: [
    /*
     * HIDDEN, NOT REMOVED, and the difference matters. The four desk lists are
     * FILTERS on this field and the team page builds its sections from it, so
     * deleting it would break both. Hidden by request: the group is implied by
     * which list you created the person in, and a dropdown repeating it is
     * noise.
     *
     * THE COST, RECORDED SO IT IS NOT A SURPRISE: nobody can move a person
     * between groups in the Studio any more — a paralegal who becomes an
     * attorney needs this field un-hidden, or the document editing via the API.
     *
     * `sanity.config.ts` removes this type from the global "create new" menu,
     * so every creation path goes through a group and therefore sets `kind`. A
     * document with no `kind` would match none of the four filters and be
     * invisible in the desk — content that exists and cannot be reached.
     */
    defineField({
      name: "kind",
      title: "Group",
      type: "string",
      group: "card",
      hidden: true,
      options: {
        list: [
          { title: "Founding partner", value: "partner" },
          { title: "Attorney", value: "attorney" },
          { title: "Staff", value: "staff" },
          { title: "Office dog", value: "dog" },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    /*
     * Drag-and-drop, by request. `orderRank` is a LexoRank string the plugin
     * rewrites when a row is dragged — never typed, so it is hidden. It
     * replaced a `position` number that had to be edited on four documents to
     * reorder four people.
     */
    orderRankField({ type: "teamMember", hidden: true }),

    defineField({
      name: "key",
      title: "URL / reference key",
      type: "slug",
      group: "card",
      description:
        "The last part of the bio page's address, and how other pages name this person. " +
        "Changing it breaks the bio's URL and any link to it — leave it alone on anyone who " +
        "is already published.",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      type: "string",
      group: "card",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Job title",
      type: "string",
      group: "card",
      description: 'As shown under the name — "Founding Partner", "Paralegal".',
      validation: (rule) => rule.required(),
    }),

    /*
     * ONE PORTRAIT, USED EVERYWHERE. There were two — a tight 460×580 for the
     * team page and a wider 600×800 for the founding-partner cards — plus a
     * third for the attorney rail. Collapsed by request, and it is only
     * possible because these are Sanity assets: the hotspot below derives every
     * tighter crop from one source, where a local import had to be re-exported
     * per shape.
     *
     * So the WIDEST source is the one to keep. Cropping in is free; cropping
     * out is not.
     */
    defineField({
      name: "photo",
      title: "Portrait",
      type: "image",
      group: "card",
      options: { hotspot: true },
      description:
        "Used on the team page, the bio page and the attorney rail. Set the hotspot to the " +
        "face — the narrower cards crop to it. OPTIONAL: two people have no photograph and " +
        "their card shows their initials instead, which is deliberate rather than a gap.",
    }),
    defineField({
      name: "memorial",
      title: "In loving memory",
      type: "boolean",
      group: "card",
      initialValue: false,
      description: 'Adds "In Loving Memory" above the role.',
      // Only one record has ever used this and it is a dog. Un-hide it if it
      // ever has to apply to a person.
      hidden: only("dog"),
    }),
    defineField({
      name: "bio",
      title: "Card bio",
      type: "simpleText",
      group: "card",
      description: "The paragraph on the founding-partner cards.",
      hidden: only("partner"),
    }),
    defineField({
      name: "awards",
      title: "Personal accolades",
      type: "array",
      group: "card",
      description:
        "Badges shown on this person's card. Their own, not the firm-wide awards in the " +
        "trust bar.",
      hidden: only("partner"),
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "image", type: "image", validation: (rule) => rule.required() }),
            defineField({
              name: "alt",
              title: "Award name",
              type: "string",
              description: "Reads as the badge's alt text, so it has to be the award's name.",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "alt", media: "image" } },
        },
      ],
    }),

    defineField({
      name: "hasProfile",
      title: "Has a bio page",
      type: "boolean",
      group: "profile",
      initialValue: false,
      description:
        "Turn on to give this person their own page. While it is off their card does not " +
        "link anywhere, which is how the five people without a written bio appear today.",
      hidden: except("dog"),
    }),
    defineField({
      name: "category",
      title: "Bio eyebrow",
      type: "string",
      group: "profile",
      description:
        'The small line above the name on the bio page. Defaults to the job title — the ' +
        'partners are the exception, whose cards read "Founding Partner" but whose bios open ' +
        '"Attorney · Founding Partner".',
      hidden: only("partner"),
    }),
    defineField({
      name: "lede",
      title: "Standfirst",
      type: "text",
      rows: 3,
      group: "profile",
      description:
        "The single sentence pulled out beside the portrait. Staff bios only — an attorney " +
        "bio has none and opens on its first body paragraph instead.",
      hidden: only("staff"),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      group: "profile",
      description:
        "TODO(launch): VERIFY BEFORE PUBLISHING. The live site publishes no attorney email " +
        "anywhere; these follow the pattern of the one example in the comps. A published " +
        "address that bounces is worse than none — clear the field and the contact line " +
        "closes up on its own.",
      validation: (rule) => rule.email(),
      hidden: only("partner", "attorney"),
    }),
    defineField({
      name: "facts",
      title: "Figures band",
      type: "array",
      group: "profile",
      description: "The three-up dark band under the name.",
      hidden: only("partner"),
      of: [
        {
          type: "object",
          options: { columns: 2 },
          fields: [
            defineField({
              name: "value",
              title: "Figure",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        },
      ],
    }),
    defineField({
      name: "body",
      title: "Biography",
      type: "richText",
      group: "profile",
      description: "A QUOTE paragraph becomes the page's pull quote.",
      hidden: noProfile,
    }),
    defineField({
      name: "education",
      title: "Education",
      type: "array",
      of: [{ type: "string" }],
      group: "profile",
      description: "Degrees, most recent first.",
      hidden: except("dog"),
    }),
    defineField({
      name: "links",
      title: "Press and profiles",
      type: "array",
      group: "profile",
      of: [{ type: "navLink" }],
      description: "Real destinations only — press mentions and directory listings.",
      hidden: only("partner", "attorney"),
    }),
    defineField({
      name: "video",
      title: "Profile film",
      type: "object",
      group: "profile",
      hidden: only("partner", "attorney"),
      fields: [
        defineField({ name: "ref", title: "Video", type: "videoRef" }),
        defineField({
          name: "poster",
          type: "image",
          options: { hotspot: true },
          title: "Poster frame",
        }),
        defineField({ name: "alt", title: "Poster alt text", type: "string" }),
      ],
    }),

    /*
     * THE RAIL IS ATTORNEYS AND PARTNERS ONLY. It is the short "meet our
     * attorneys" band on the homepage and About, and no staff member or dog has
     * ever been on it.
     *
     * There is no rail PORTRAIT any more — the card uses the one portrait above
     * like every other surface.
     */
    defineField({
      name: "onAttorneyRail",
      title: "Show in the attorney rail",
      type: "boolean",
      group: "rail",
      initialValue: false,
      description: "The short rail on the homepage and About. Four people today.",
      hidden: only("partner", "attorney"),
    }),
    defineField({
      name: "railOrder",
      title: "Position in the rail",
      type: "number",
      group: "rail",
      description:
        "A separate sequence from the team page's — the rail leads with a different partner. " +
        "Low numbers first.",
      hidden: notOnRail,
    }),
    defineField({
      name: "onHomeRail",
      title: "Also on the homepage",
      type: "boolean",
      group: "rail",
      initialValue: false,
      description:
        "The homepage rail is a SUBSET of About's — About shows four, the homepage three. " +
        "Leave this off to appear on About only.",
      hidden: notOnRail,
    }),
    defineField({
      name: "location",
      title: "City",
      type: "string",
      group: "rail",
      description:
        'Shown after the role on the rail card. Stored apart from the role because the ' +
        'separator ("·") is presentation and an editor should not have to type it.',
      hidden: notOnRail,
    }),
    defineField({
      name: "railVideo",
      title: "Rail card film",
      type: "videoRef",
      group: "rail",
      description:
        "The card's portrait opens this; the name below it goes to the bio. Two controls, " +
        "deliberately — an <a> may not contain another <a>, which is why the card was split.",
      hidden: notOnRail,
    }),
  ],
  preview: {
    select: { title: "name", role: "role", kind: "kind", media: "photo" },
    prepare: ({ title, role, kind, media }) => ({ title, subtitle: `${role} · ${kind}`, media }),
  },
});
