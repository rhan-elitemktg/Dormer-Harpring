// Site navigation.
//
// THE MAIN NAV'S TOP LEVEL IS IN THIS FILE AND NOT IN SANITY, BY REQUEST.
//
// `TOP_LEVEL` below is the whole main menu's spine: six items, their labels,
// their destinations and their order. Nothing in the Studio can rename one,
// reorder them, add a seventh or delete one — the nav is how every page on the
// site is reached, and an editor should not be able to break it while changing
// a dropdown row.
//
// What the Studio DOES own is everything from the second level down: the three
// dropdown lists, and the footer's two columns and its chips. Those are
// content — a practice area gains a page, a city is added — and they carry no
// structural risk, because a bad row is one bad row rather than a missing
// section of the site.
//
// The `menu` key on a spine item names the FIELD the Studio holds its children
// in. That binding is what stops a menu from being attached to the wrong
// parent: `navigation.ts` says which field feeds which item, and the schema
// declares one named field per menu rather than a generic list with a parent
// key on each row.
import { sanityClient } from "sanity:client";
import { NAVIGATION_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import { ROUTES } from "../lib/routePaths";

export interface NavItem {
  label: string;
  /**
   * `null` where no destination exists yet. The item still renders (the comps
   * show it) but as plain text rather than a dead link.
   */
  href: string | null;
  /**
   * Sub-items. Presence of the key — not its length — is what draws the caret,
   * so `children: []` reads as "menu intended, not yet authored".
   */
  children?: NavItem[];
  /** Opens in a new tab and gets rel="noopener". */
  external?: boolean;
}

/** Which menu field in the `navigation` singleton feeds a top-level item. */
type MenuField = "aboutMenu" | "practiceAreasMenu" | "locationsMenu";

/**
 * THE SIX TOP-LEVEL ITEMS. Code-owned; see the note at the top of this file.
 *
 * Parents both navigate AND open a menu — the menu is on hover/focus, so the
 * landing pages stay one click away.
 *
 * No comp defines a menu behind any caret (they are decorative spans), so the
 * About and Practice Areas lists were lifted from the CURRENT site's working
 * dropdowns; Locations is proposed, since the live site has no dropdown for it.
 *
 * The team sits inside About as "Our Team" rather than at the top level. The
 * comps put an "Attorneys" item there, but the live site's own nav files the
 * team under About, and dropping it frees the slot that "Testimonials" now
 * takes.
 *
 * Two deliberate departures from the live nav, both flagged for review:
 *  - Its Practice Areas menu opens with "Personal Injury → /" because there the
 *    homepage doubles as the PI overview page. Dropped: here the homepage is
 *    the homepage, and "View all practice areas" already covers the hub.
 *  - Its "Our Team" points at /meet-our-attorneys; ours is /attorneys.
 */
const TOP_LEVEL: { label: string; href: string | null; menu?: MenuField }[] = [
  { label: "About", href: ROUTES.about, menu: "aboutMenu" },
  { label: "Practice Areas", href: ROUTES.practiceAreas, menu: "practiceAreasMenu" },
  { label: "Results", href: ROUTES.results },
  { label: "Testimonials", href: ROUTES.testimonials },
  {
    // Still no hub page to link the parent at — the legacy site has ~52
    // city×practice pages but nothing that lists them. The parent stays plain
    // text; the menu carries the nine cities that have a landing page.
    label: "Locations",
    href: null,
    menu: "locationsMenu",
  },
  { label: "Contact", href: ROUTES.contact },
];

/**
 * Does this href leave the site?
 *
 * DERIVED, NOT STORED, and that reverses what this file used to do. `NavItem`
 * carried an `external` boolean an editor would have had to remember to tick;
 * forget it on a pasted https:// URL and the link opens in the same tab with no
 * outbound glyph, and nothing anywhere reports it. `ProseLink.astro` already
 * decides the same thing from the href for body links — "so an editor pasting a
 * full URL gets it right" — and this is now one rule for the whole site.
 */
const isExternal = (href: string | null) => !!href && /^https?:\/\//i.test(href);

/** One Studio row → one `NavItem`. */
const toItem = (row: { label: string; href: string | null }): NavItem => ({
  label: row.label,
  href: row.href,
  ...(isExternal(row.href) ? { external: true } : {}),
});

/** The `navigation` singleton, fetched once per build regardless of callers. */
function nav() {
  return once("navigation", async () =>
    required(await sanityClient.fetch(NAVIGATION_QUERY), "Navigation")
  );
}

export async function getNavItems(): Promise<NavItem[]> {
  const menus = await nav();

  return TOP_LEVEL.map((item) => ({
    label: item.label,
    href: item.href,
    // The key is present whenever the spine says this item HAS a menu, even if
    // the Studio list is empty — presence is what draws the caret, and an item
    // designed to open a menu that is momentarily empty should still look like
    // one rather than silently becoming a plain link.
    ...(item.menu ? { children: menus[item.menu].map(toItem) } : {}),
  }));
}

/** Practice-area links in the footer column. */
export async function getFooterPracticeAreas(): Promise<NavItem[]> {
  return (await nav()).footerPracticeAreas.map(toItem);
}

/** The footer's two-column "Explore" list. */
export async function getFooterNav(): Promise<NavItem[]> {
  return (await nav()).footerNav.map(toItem);
}

/**
 * The chips in the footer's "areas we serve" band.
 *
 * Plain strings, and they render as `<span>`s rather than links: eighteen
 * linked city chips promise a landing page for each city or an office in it,
 * and the firm has neither — there is one office, in RiNo, which the note
 * beside them says. They pointed at /contact/ once, all eighteen of them.
 */
export async function getServiceAreas(): Promise<string[]> {
  return (await nav()).serviceAreas;
}
