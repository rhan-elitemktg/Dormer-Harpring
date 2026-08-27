// Header and footer navigation. A singleton.
//
// THE MAIN NAV'S TOP LEVEL IS NOT HERE, AND THAT IS THE POINT.
//
// The six top-level items — About, Practice Areas, Results, Testimonials,
// Locations, Contact — keep their labels, destinations, order and existence in
// `getNavItems()` in src/data/navigation.ts. Nothing in this document can
// rename one, reorder them, add a seventh or delete one. By request: the nav is
// the site's spine and an editor should not be able to break it.
//
// `Locations` in particular carries `href: null` deliberately — no hub page
// exists, so the parent renders as plain text rather than a dead link. That is
// a rendering decision, not content, and it stays in code with the rest.
//
// ONE NAMED FIELD PER MENU THAT EXISTS, rather than a generic list of menus
// with a "parent" key on each. The named form means an editor cannot invent a
// menu and cannot attach one to the wrong parent, and it means a menu appearing
// under Results — which has none by design — is a code change rather than a
// mis-click. That constraint IS the guarantee that was asked for.
//
// The footer is a different case and stays fully editable: it is flat, it has
// no parent/child relationship to get wrong, and the ask was about the main nav.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { MenuIcon } from "@sanity/icons/Menu";

export const navigation = defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  icon: MenuIcon,
  groups: [
    { name: "header", title: "Header menus", default: true },
    { name: "footer", title: "Footer" },
  ],
  fields: [
    defineField({
      name: "aboutMenu",
      title: "About — dropdown",
      type: "array",
      group: "header",
      of: [{ type: "navLink" }],
      description:
        "The rows under \"About\". The parent itself already links to /about/, so there is " +
        "deliberately no \"About Us\" row repeating it — the mobile drawer adds that link " +
        "itself, because a parent there is a toggle rather than a link.",
    }),
    defineField({
      name: "practiceAreasMenu",
      title: "Practice Areas — dropdown",
      type: "array",
      group: "header",
      of: [{ type: "navLink" }],
      description:
        "The rows under \"Practice Areas\". The last one is \"View all practice areas\" — it " +
        "is the only route from this menu to the full directory, so removing it leaves the " +
        "other 90-odd pages reachable only from a sibling's sidebar.",
    }),
    defineField({
      name: "locationsMenu",
      title: "Locations — dropdown",
      type: "array",
      group: "header",
      of: [{ type: "navLink" }],
      description:
        "The cities with a landing page. \"Locations\" has no hub page of its own, so this " +
        "menu is the only thing behind it — an empty list leaves a caret opening nothing.",
    }),

    defineField({
      name: "footerPracticeAreas",
      title: "Footer — Practice Areas column",
      type: "array",
      group: "footer",
      of: [{ type: "navLink" }],
    }),
    defineField({
      name: "footerNav",
      title: "Footer — Explore column",
      type: "array",
      group: "footer",
      of: [{ type: "navLink" }],
    }),
    defineField({
      name: "serviceAreas",
      title: "Footer — areas we serve",
      type: "array",
      group: "footer",
      of: [{ type: "string" }],
      description:
        "PLAIN TEXT, NOT LINKS, and deliberately so. These render as chips with no href: a " +
        "linked city chip promises a landing page for that city or an office in it, and the " +
        "firm has neither — there is one office, in RiNo, which the note beside them says. " +
        "They pointed at /contact/ once, eighteen chips at one destination.",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Navigation" }),
  },
});
