// Attorneys.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/attorneys.ts`. These
// become `attorney` documents (the legacy site has 7 attorneys plus 18 staff).
//
// The homepage comp lists five cards, but two are literally named "Attorney
// Name" with no photograph and a dead href — placeholder slots, not content.
// Shipping them would put "Attorney Name" on the homepage, so the rail carries
// only the three the comp gives real portraits. It scrolls, so it takes more the
// moment portraits exist for Jessica Mauser, Amy Rogers and Greg Bentley — Laura
// Browne's now does, from the live site, and the About grid uses it.
//
// The comp also carries a `primary` boolean that no markup reads — dropped.
import type { ImageMetadata } from "astro";
import kcHarpring from "../assets/attorneys/attorney-1.jpg";
import seanDormer from "../assets/attorneys/attorney-2.jpg";
import timGarvey from "../assets/attorneys/attorney-3.jpg";
import kcPortrait from "../assets/attorneys/kc-harpring.jpg";
import lauraBrowne from "../assets/team/laura-browne.jpg";
import { attorneyPath } from "../lib/routePaths";
import { PLACEHOLDER_VIDEO, type VideoRef } from "../lib/video";

export interface AttorneyCardData {
  _key: string;
  name: string;
  /** Split from `location` — the comp stores one "Role · City" string, but the
   *  separator is presentation and an editor should not have to type it. */
  role: string;
  location: string;
  href: string;
  portrait: ImageMetadata;
  /** The card's portrait opens this in a popover; the name below it goes to
   *  `href`. Two controls, deliberately — see AttorneyCard.astro.
   *  TODO(video): PLACEHOLDER_VIDEO on all four until real ids land. */
  video: VideoRef;
}

export interface AttorneysSection {
  eyebrow: string;
  title: string;
  quote: string;
  signature: { name: string; role: string; href: string; portrait: ImageMetadata };
  ctaLabel: string;
}

export async function getAttorneysSection(): Promise<AttorneysSection> {
  return {
    eyebrow: "Meet our team",
    title: "The people in your corner.",
    quote:
      "We're a boutique Denver firm on purpose. We take fewer cases so a named " +
      "partner can handle yours personally — the same lawyer, start to finish, " +
      "who knows your file by heart.",
    signature: {
      name: "KC Harpring",
      role: "Founding Partner",
      href: attorneyPath("k-c-harpring"),
      portrait: kcPortrait,
    },
    ctaLabel: "Meet our attorneys",
  };
}

/**
 * The card records, keyed by slug. Two pages select from this map and they pick
 * DIFFERENT sets — the homepage rail takes three, the About grid four — which
 * is exactly the shape the CMS will have: one `attorney` document per person,
 * referenced by whichever page wants it. One copy here means a portrait swap or
 * a title change is a single edit rather than a grep.
 */
const CARDS: Record<string, AttorneyCardData> = {
  "kc-harpring": {
    _key: "kc-harpring",
    name: "KC Harpring",
    role: "Founding Partner",
    location: "Denver",
    href: attorneyPath("k-c-harpring"),
    video: PLACEHOLDER_VIDEO,
    portrait: kcHarpring,
  },
  "sean-dormer": {
    _key: "sean-dormer",
    name: "Sean Dormer",
    role: "Founding Partner",
    location: "Denver",
    href: attorneyPath("sean-dormer"),
    video: PLACEHOLDER_VIDEO,
    portrait: seanDormer,
  },
  "tim-garvey": {
    _key: "tim-garvey",
    name: "Tim Garvey",
    role: "Attorney",
    location: "Denver",
    href: attorneyPath("tim-garvey"),
    video: PLACEHOLDER_VIDEO,
    portrait: timGarvey,
  },
  // The comp package ships no card portrait for Laura, so hers comes from the
  // live site's team page. Same shoot as the other three — one wood-plank
  // backdrop, one lighting setup — so the row of four reads as one set.
  "laura-browne": {
    _key: "laura-browne",
    name: "Laura Browne",
    role: "Attorney",
    location: "Denver",
    href: attorneyPath("laura-browne"),
    video: PLACEHOLDER_VIDEO,
    portrait: lauraBrowne,
  },
};

export async function getHomeAttorneys(): Promise<AttorneyCardData[]> {
  return [CARDS["kc-harpring"], CARDS["sean-dormer"], CARDS["tim-garvey"]];
}

/**
 * The About comp's "Meet the team" grid, in its order. A DIFFERENT selection
 * from the homepage rail rather than a longer one — the About comp names these
 * four explicitly, Laura included, and it is a fixed four-up grid rather than a
 * rail that could take more.
 */
export async function getAboutAttorneys(): Promise<AttorneyCardData[]> {
  return [
    CARDS["kc-harpring"],
    CARDS["sean-dormer"],
    CARDS["tim-garvey"],
    CARDS["laura-browne"],
  ];
}
