// Attorneys.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/attorneys.ts`. These
// become `attorney` documents (the legacy site has 7 attorneys plus 18 staff).
//
// The comp lists five cards, but two are literally named "Attorney Name" with
// no photograph and a dead href — placeholder slots, not content. Shipping them
// would put "Attorney Name" on the homepage, so only the three real attorneys
// with photography are here. The rail scrolls, so it takes more the moment
// portraits exist for Laura Browne, Jessica Mauser, Amy Rogers and Greg Bentley.
//
// The comp also carries a `primary` boolean that no markup reads — dropped.
import type { ImageMetadata } from "astro";
import kcHarpring from "../assets/attorneys/attorney-1.jpg";
import seanDormer from "../assets/attorneys/attorney-2.jpg";
import timGarvey from "../assets/attorneys/attorney-3.jpg";
import kcPortrait from "../assets/attorneys/kc-harpring.jpg";
import { attorneyPath } from "../lib/routePaths";

export interface AttorneyCardData {
  _key: string;
  name: string;
  /** Split from `location` — the comp stores one "Role · City" string, but the
   *  separator is presentation and an editor should not have to type it. */
  role: string;
  location: string;
  href: string;
  portrait: ImageMetadata;
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

export async function getHomeAttorneys(): Promise<AttorneyCardData[]> {
  return [
    {
      _key: "kc-harpring",
      name: "KC Harpring",
      role: "Founding Partner",
      location: "Denver",
      href: attorneyPath("k-c-harpring"),
      portrait: kcHarpring,
    },
    {
      _key: "sean-dormer",
      name: "Sean Dormer",
      role: "Founding Partner",
      location: "Denver",
      href: attorneyPath("sean-dormer"),
      portrait: seanDormer,
    },
    {
      _key: "tim-garvey",
      name: "Tim Garvey",
      role: "Attorney",
      location: "Denver",
      href: attorneyPath("tim-garvey"),
      portrait: timGarvey,
    },
  ];
}
