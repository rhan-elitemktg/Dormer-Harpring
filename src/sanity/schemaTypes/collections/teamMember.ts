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

export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  icon: UsersIcon,
  groups: [
    { name: "card", title: "Card", default: true },
    { name: "profile", title: "Bio page" },
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

    /*
     * THE RAIL IS ATTORNEYS AND PARTNERS ONLY — the short "meet our attorneys"
     * band on the homepage and About. No staff member or dog has ever been on
     * it.
     *
     * ONE CHECKBOX IS THE WHOLE RAIL NOW. It used to carry four more fields —
     * a position, a homepage/About choice, a city and a second video — and
     * every one of them was either duplicating something or a decision nobody
     * needed to make:
     *
     *   position   the rail follows the team page's drag order. One order to
     *              keep, not two that silently disagree.
     *   placement  the rail is the rail; both pages show it.
     *   city       dropped from the card entirely.
     *   film       the profile film below serves the card too.
     */
    defineField({
      name: "onAttorneyRail",
      title: "Show in the attorney rail",
      type: "boolean",
      group: "card",
      initialValue: false,
      description:
        "The short rail on the homepage and About. It follows the same order as the team " +
        "page, so drag them there to reorder it.",
      hidden: only("partner", "attorney"),
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
    /*
     * ONE FILM PER PERSON, and it is FLAT.
     *
     * It used to be an object holding a `videoRef` object holding one visible
     * string — three levels of box for a single id, which is what made this
     * corner of the form look broken. The provider is always Wistia, so the id
     * sits here directly and `data/team.ts` rebuilds the { provider, id } pair
     * that `lib/video.ts` wants. That indirection still lives in the code where
     * it belongs; it was never something an editor should have been looking at.
     *
     * The same film now serves the BIO PAGE and the attorney rail card. There
     * was a second "Rail card film" field; two ids for one person's one video
     * is two things to keep in step.
     *
     * NOT gated on `hasProfile`, deliberately: someone can be on the rail
     * without a written bio, and their card still wants a film.
     */
    defineField({
      name: "video",
      title: "Film",
      type: "object",
      group: "profile",
      description:
        "Shown on the bio page, and opened by the portrait on the attorney rail card.",
      hidden: only("partner", "attorney"),
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "id",
          title: "Wistia video ID",
          type: "string",
          description:
            "The id ONLY, not the whole URL — the last part of the media's address in " +
            "Wistia, like b4n3r4pchd.",
        }),
        defineField({
          name: "poster",
          title: "Poster frame",
          type: "image",
          options: { hotspot: true },
          description:
            "OPTIONAL. Left empty, the film's own thumbnail from Wistia is used instead.",
        }),
        defineField({
          name: "alt",
          title: "Poster alt text",
          type: "string",
          description: "What a screen reader says in place of the poster.",
        }),
      ],
    }),

  ],
  preview: {
    select: { title: "name", role: "role", kind: "kind", media: "photo" },
    prepare: ({ title, role, kind, media }) => ({ title, subtitle: `${role} · ${kind}`, media }),
  },
});
