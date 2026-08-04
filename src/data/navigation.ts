// Site navigation.
//
// SANITY SWAP POINT, shaped as `src/sanity/lib/navigation.ts` will be. Kept as
// an async function returning a tree so the swap is a body change, not a
// refactor — nav was the one thing the previous build never finished migrating,
// precisely because it was a static import.

import { ROUTES, attorneyPath } from "../lib/routePaths";

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

/**
 * The six top-level items. Parents both navigate AND open a menu — the menu is
 * on hover/focus, so the landing pages stay one click away.
 *
 * No comp defines a menu behind any caret (they are decorative spans), so the
 * About and Practice Areas lists below are lifted from the CURRENT site's
 * working dropdowns; Attorneys and Locations are proposed, since the live site
 * has no dropdown for either.
 *
 * Two deliberate departures from the live nav, both flagged for review:
 *  - Its Practice Areas menu opens with "Personal Injury → /" because there the
 *    homepage doubles as the PI overview page. Dropped: here the homepage is
 *    the homepage, and "View all practice areas" already covers the hub.
 *  - Its "Our Team" points at /meet-our-attorneys; ours is /attorneys.
 */
export async function getNavItems(): Promise<NavItem[]> {
  return [
    {
      label: "About",
      href: ROUTES.about,
      children: [
        { label: "About Us", href: ROUTES.about },
        { label: "Our Team", href: ROUTES.attorneys },
        { label: "Community Involvement", href: ROUTES.community },
        { label: "Co-Counsel", href: ROUTES.coCounsel },
        { label: "Blog", href: ROUTES.blog },
        {
          label: "Accidents In The News",
          href: "https://accidentnews.denvertrial.com/category/accidents-in-the-news/",
          external: true,
        },
      ],
    },
    {
      label: "Practice Areas",
      href: ROUTES.practiceAreas,
      children: [
        { label: "Car Accidents", href: "/denver-car-accident-lawyer" },
        { label: "Truck Accidents", href: "/denver-truck-accident-lawyer" },
        { label: "Motorcycle Accidents", href: "/motorcycle-accident-lawyer-denver" },
        { label: "Wrongful Death", href: "/denver-wrongful-death-lawyer" },
        { label: "Premises Liability", href: "/denver-premises-liability-lawyer" },
        { label: "Brain Injuries", href: "/denver-brain-injury-lawyer" },
        { label: "View all practice areas", href: ROUTES.practiceAreas },
      ],
    },
    { label: "Results", href: ROUTES.results },
    {
      label: "Attorneys",
      href: ROUTES.attorneys,
      children: [
        { label: "Sean Dormer", href: attorneyPath("sean-dormer") },
        { label: "K.C. Harpring", href: attorneyPath("k-c-harpring") },
        { label: "Tim Garvey", href: attorneyPath("tim-garvey") },
        { label: "Laura Browne", href: attorneyPath("laura-browne") },
        { label: "Jessica Mauser", href: attorneyPath("jessica-mauser") },
        { label: "Amy Rogers", href: attorneyPath("amy-rogers") },
        { label: "Greg Bentley", href: attorneyPath("greg-bentley") },
        { label: "View all attorneys", href: ROUTES.attorneys },
      ],
    },
    {
      // Still no hub page to link the parent at — the legacy site has ~52
      // city×practice pages but nothing that lists them. The parent stays plain
      // text; the menu carries the nine cities that have a landing page.
      label: "Locations",
      href: null,
      children: [
        { label: "Denver", href: ROUTES.home },
        { label: "Aurora", href: "/aurora-personal-injury-attorney" },
        { label: "Boulder", href: "/boulder-personal-injury-attorney" },
        { label: "Lakewood", href: "/lakewood-personal-injury-attorney" },
        { label: "Thornton", href: "/thornton-personal-injury-attorney" },
        { label: "Highlands Ranch", href: "/highlands-ranch-personal-injury-attorney" },
        { label: "Greeley", href: "/greeley-personal-injury-lawyer" },
        { label: "Fort Collins", href: "/fort-collins-personal-injury-lawyer" },
        { label: "Grand Junction", href: "/grand-junction-personal-injury-lawyer" },
      ],
    },
    { label: "Contact", href: ROUTES.contact },
  ];
}

/** Practice-area links in the footer column. */
export async function getFooterPracticeAreas(): Promise<NavItem[]> {
  return [
    { label: "Car Accidents", href: "/denver-car-accident-lawyer" },
    { label: "Truck Accidents", href: "/denver-truck-accident-lawyer" },
    { label: "Motorcycle Accidents", href: "/motorcycle-accident-lawyer-denver" },
    { label: "Wrongful Death", href: "/denver-wrongful-death-lawyer" },
    { label: "Slip & Fall", href: "/denver-slip-and-fall-lawyer" },
    { label: "Pedestrian Accidents", href: "/denver-pedestrian-accident-lawyer" },
    { label: "Brain Injuries", href: "/denver-brain-injury-lawyer" },
    { label: "Dog Bites", href: "/denver-dog-bite-lawyer" },
  ];
}

/** The footer's two-column "Explore" list. */
export async function getFooterNav(): Promise<NavItem[]> {
  return [
    { label: "Home", href: ROUTES.home },
    { label: "About", href: ROUTES.about },
    { label: "Attorneys", href: ROUTES.attorneys },
    { label: "Results", href: ROUTES.results },
    { label: "Testimonials", href: ROUTES.testimonials },
    { label: "Co-Counsel", href: ROUTES.coCounsel },
    { label: "News", href: ROUTES.blog },
    { label: "Contact", href: ROUTES.contact },
  ];
}

/**
 * The 18 chips in the footer's "areas we serve" band. Plain strings today; they
 * become references to `serviceCity` documents (with their own landing pages)
 * in the CMS phase, which is why they already link rather than sit as text.
 */
export async function getServiceAreas(): Promise<string[]> {
  return [
    "Denver",
    "Aurora",
    "Lakewood",
    "Arvada",
    "Westminster",
    "Centennial",
    "Thornton",
    "Boulder",
    "Littleton",
    "Highlands Ranch",
    "Parker",
    "Commerce City",
    "Wheat Ridge",
    "Englewood",
    "Broomfield",
    "Castle Rock",
    "Golden",
    "Colorado Springs",
  ];
}
