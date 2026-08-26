// Firm-wide facts: NAP, phones, hours, socials. A singleton.
//
// NOTHING IN THE CODEBASE MAY HARDCODE A PHONE NUMBER OR ADDRESS. The header,
// the footer, every tel: href, the JSON-LD and the Thank You lede all follow
// from this one document, which is what made the site-wide number change a
// single edit rather than a grep. That rule survives the move to Sanity — it is
// the reason this is a singleton and not a field on each page.
//
// The history matters for anyone tempted to add a fallback: this file's static
// predecessor recorded (866) 683-6894 as "the firm's choice" and it was not.
// The 866 number is retired, not kept as a spare, because a second number in
// the data layer is a second number that can ship by accident.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
import { validatePhone } from "../../lib/phone";

export const firmDetails = defineType({
  name: "firmDetails",
  title: "Firm Details",
  type: "document",
  icon: EarthGlobeIcon,
  groups: [
    { name: "identity", title: "Name", default: true },
    { name: "contact", title: "Phone & email" },
    { name: "location", title: "Address & hours" },
    { name: "social", title: "Social profiles" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Firm name",
      type: "string",
      group: "identity",
      description: "How the firm is written everywhere on the site.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "legalName",
      title: "Legal name",
      type: "string",
      group: "identity",
      description: "The registered entity, including the LLC. Used in structured data.",
      validation: (rule) => rule.required(),
    }),

    /*
     * ONE FIELD PER NUMBER. What a tap dials is DERIVED from what a visitor
     * reads — see sanity/lib/phone.ts. These were briefly two fields each,
     * with a validator making sure they agreed; a rule whose whole job is to
     * stop two fields disagreeing is a rule that would not exist if there were
     * one field.
     *
     * `validatePhone` is the same function the site derives with, so the Studio
     * cannot save a number the site cannot dial.
     */
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      group: "contact",
      description:
        "Written the way a visitor reads it — (303) 756-3812. What a tap dials is worked out " +
        "from this, so there is nothing else to keep in step.",
      validation: (rule) => rule.required().custom(validatePhone),
    }),
    defineField({
      name: "sms",
      title: "Text number",
      type: "string",
      group: "contact",
      description: "The footer's Text number — (720) 730-7997. Same rule as the phone above.",
      validation: (rule) => rule.required().custom(validatePhone),
    }),
    defineField({
      name: "email",
      title: "Contact email",
      type: "string",
      group: "contact",
      description:
        "OPTIONAL. The contact page's Email card renders only when this is set, so clearing " +
        "it removes the card cleanly rather than leaving a hole.",
      validation: (rule) => rule.email(),
    }),

    defineField({
      name: "address",
      title: "Office address",
      type: "object",
      group: "location",
      description:
        "The same words everywhere they appear — the footer, the contact card and the " +
        "structured data all read this. Search engines treat a mismatched address as a " +
        "different business.",
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "street",
          type: "string",
          description: "Short form — \"3457 Ringsby Ct\", not \"Court\". It is what fits the card.",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "unit", type: "string" }),
        defineField({ name: "city", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "region",
          title: "State",
          type: "string",
          description: "Two letters — CO.",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "postalCode", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "country",
          type: "string",
          description: "Two letters — US.",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "geo",
      title: "Map pin",
      type: "geopoint",
      group: "location",
      description: "Where the office sits, for structured data.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mapUrl",
      title: "Directions link",
      type: "url",
      group: "location",
      description: "Where every \"Get directions\" opens.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mapPlaceCid",
      title: "Google Business Profile ID",
      type: "string",
      group: "location",
      description:
        "The numeric id behind the directions link. The embedded map needs it: the short " +
        "link redirects to a page that refuses to be framed, and an address query drops an " +
        "anonymous pin instead of showing the listing.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "hoursDisplay",
      title: "Office hours (as shown)",
      type: "string",
      group: "location",
      description: "Written for a human — \"Mon–Fri, 9:00am – 5:00pm\".",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "hours",
      title: "Office hours (for search engines)",
      type: "string",
      group: "location",
      description:
        "The SAME hours in schema.org's format — \"Mo-Fr 09:00-17:00\". Change both together: " +
        "a page showing one set while the structured data asserts another is worse than " +
        "either being wrong alone.",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "socials",
      title: "Social profiles",
      type: "array",
      group: "social",
      description: "Shown as icons in the footer, and listed in the firm's structured data.",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Platform",
              type: "string",
              description:
                "MUST match a glyph in components/icons/SocialIcon.astro. A platform with no " +
                "glyph renders an empty space in the footer.",
              options: {
                list: [
                  { title: "Facebook", value: "facebook" },
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "YouTube", value: "youtube" },
                  { title: "TikTok", value: "tiktok" },
                  { title: "Instagram", value: "instagram" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Profile URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "name", subtitle: "href" } },
        },
      ],
    }),
    defineField({
      name: "directoryProfiles",
      title: "Other profiles",
      type: "array",
      group: "social",
      of: [{ type: "url" }],
      description:
        "Real profiles that belong in structured data but have no footer glyph — directory " +
        "and review listings. Kept apart from the icons above so the footer never has to " +
        "draw one we do not have.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "phone" },
  },
});
