// One person at the firm — and their bio page, where they have one.
//
// ONE DOCUMENT, NOT TWO. The codebase held a roster (`getTeam`) and a set of
// bio pages (`getTeamProfiles`) as separate lists joined by key, and every one
// of the 25 profiles matches a roster entry exactly. They are the same person;
// splitting them means an editor updating a name in one place and not the other.
//
// The five without a profile are staff whose bio page was never written. They
// still appear on the team page — their card simply does not link.
//
// TWO PEOPLE HAVE NO PHOTOGRAPH. Alexandra Petroff and Dinorah Gutierrez appear
// in the comps but nowhere on the live site, so their cards fall back to a
// monogram of their initials rather than leaving a hole. That is why `photo` is
// optional and must stay optional.
import { defineField, defineType, type ConditionalPropertyCallback } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { UsersIcon } from "@sanity/icons/Users";

/**
 * Hide the bio-page fields until someone turns the bio page on.
 *
 * Typed through Sanity's own `ConditionalPropertyCallback` rather than a
 * hand-written parameter shape: `SanityDocument` shares no properties with an
 * inline `{ hasProfile?: boolean }`, so the structural check fails outright
 * rather than narrowing. The read is what needs the cast, not the signature.
 */
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
    { name: "rail", title: "Attorney rail" },
  ],
  fields: [
    /*
     * STABLE, AND NAMED FROM ELSEWHERE. `blog.ts` keys a post's reviewer into a
     * team member by this, and it is also the bio page's URL segment — so it is
     * doubly content. Same shape as the award and testimonial keys; see the
     * award type for what happened the one time a key like this was dropped.
     */
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
    defineField({
      name: "kind",
      title: "Group",
      type: "string",
      group: "card",
      description: "Which section of the team page this person appears in.",
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
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      group: "card",
      description: "Low numbers first, within the group above.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "photo",
      title: "Portrait",
      type: "image",
      group: "card",
      options: { hotspot: true },
      description:
        "OPTIONAL. Two people have no photograph and their card shows their initials instead " +
        "— which is deliberate, not a gap to fill with a stand-in.",
    }),
    defineField({
      name: "photoLarge",
      title: "Wide portrait",
      type: "image",
      group: "card",
      options: { hotspot: true },
      description:
        "The wider crop the founding-partner cards need. The bio page deliberately uses the " +
        "tight portrait above instead.",
      hidden: ({ document }) => (document as { kind?: string } | undefined)?.kind !== "partner",
    }),
    defineField({
      name: "memorial",
      title: "In loving memory",
      type: "boolean",
      group: "card",
      initialValue: false,
      description: 'Adds "In Loving Memory" above the role.',
    }),
    defineField({
      name: "bio",
      title: "Card bio",
      type: "simpleText",
      group: "card",
      description:
        "The short paragraph on the founding-partner cards. Most people have none — the card " +
        "shows their name and role only.",
    }),
    defineField({
      name: "awards",
      title: "Personal accolades",
      type: "array",
      group: "card",
      description:
        "Badges shown on this person's card. These are their own, not the firm-wide awards in " +
        "the trust bar.",
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
     * A THIRD PRESENTATION OF THE SAME PERSON. The homepage and About render a
     * short attorney rail whose cards use a WIDER marketing crop than the team
     * page and a different portrait file entirely — and whose portrait opens a
     * film while the name goes to the bio. All four people in it are already
     * team members, so this is fields on their record rather than a second
     * collection of the same humans.
     */
    defineField({
      name: "onAttorneyRail",
      title: "Show in the attorney rail",
      type: "boolean",
      group: "rail",
      initialValue: false,
      description: "The short rail on the homepage and About. Four people today.",
    }),
    defineField({
      name: "railOrder",
      title: "Position in the rail",
      type: "number",
      group: "rail",
      hidden: ({ document }) => !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail,
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
      hidden: ({ document }) => !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail,
    }),
    defineField({
      name: "railPortrait",
      title: "Rail portrait",
      type: "image",
      group: "rail",
      options: { hotspot: true },
      description:
        "A wider crop than the team-page portrait, and a different photograph. The rail card " +
        "is drawn for this shape.",
      hidden: ({ document }) => !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail,
    }),
    defineField({
      name: "location",
      title: "City",
      type: "string",
      group: "rail",
      description:
        'Shown after the role. The two are stored apart because the separator ("·") is ' +
        "presentation and an editor should not have to type it.",
      hidden: ({ document }) => !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail,
    }),
    defineField({
      name: "railVideo",
      title: "Rail card film",
      type: "videoRef",
      group: "rail",
      description:
        "The card's portrait opens this; the name below it goes to the bio. Two controls, " +
        "deliberately — an <a> may not contain another <a>, which is why the card was split.",
      hidden: ({ document }) => !(document as { onAttorneyRail?: boolean } | undefined)?.onAttorneyRail,
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
    }),
    defineField({
      name: "category",
      title: "Bio eyebrow",
      type: "string",
      group: "profile",
      description:
        'The small line above the name on the bio page. Defaults to the job title — the two ' +
        'partners are the exception, whose cards read "Founding Partner" but whose bios open ' +
        '"Attorney · Founding Partner".',
      hidden: noProfile,
    }),
    defineField({
      name: "lede",
      title: "Standfirst",
      type: "text",
      rows: 3,
      group: "profile",
      description:
        "The single sentence pulled out beside the portrait. STAFF ONLY — the attorney bios " +
        "have no standfirst and open on their first body paragraph instead.",
      hidden: noProfile,
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
      hidden: noProfile,
    }),
    defineField({
      name: "facts",
      title: "Figures band",
      type: "array",
      group: "profile",
      description: "The three-up dark band under the name. The two partners only.",
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
      hidden: noProfile,
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
      hidden: noProfile,
    }),
    defineField({
      name: "links",
      title: "Press and profiles",
      type: "array",
      group: "profile",
      of: [{ type: "navLink" }],
      description: "Real destinations only — press mentions and directory listings.",
      hidden: noProfile,
    }),
    defineField({
      name: "video",
      title: "Profile film",
      type: "object",
      group: "profile",
      hidden: noProfile,
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
  ],
  orderings: [
    { name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", role: "role", kind: "kind", media: "photo" },
    prepare: ({ title, role, kind, media }) => ({ title, subtitle: `${role} · ${kind}`, media }),
  },
});
