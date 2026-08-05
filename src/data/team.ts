// The firm's people — attorneys, support staff and the office dogs.
//
// SANITY SWAP POINT — the future `teamMember` collection. ONE type with a
// `kind` discriminator rather than three arrays: the comp keeps `partners`,
// `attorneys` and `staffData` apart and then merges them back together for the
// grid, which means the merge order is code rather than content and a person
// cannot move between groups without an edit in two places.

import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import { attorneyPath } from "../lib/routePaths";
import seanLg from "../assets/team/sean-dormer-lg.jpg";
import kcLg from "../assets/team/kc-harpring-lg.jpg";
import seanSm from "../assets/team/sean-dormer.jpg";
import kcSm from "../assets/team/kc-harpring.jpg";
import timgarvey from "../assets/team/tim-garvey.jpg";
import laurabrowne from "../assets/team/laura-browne.jpg";
import jessicamauser from "../assets/team/jessica-mauser.jpg";
import amyrogers from "../assets/team/amy-rogers.jpg";
import gregbentley from "../assets/team/greg-bentley.jpg";
import marcieemch from "../assets/team/marcie-emch.jpg";
import kassandraburival from "../assets/team/kassandra-burival.jpg";
import brittanyfreeman from "../assets/team/brittany-freeman.jpg";
import cindywaller from "../assets/team/cindy-waller.jpg";
import brittanylesmeister from "../assets/team/brittany-lesmeister.jpg";
import juliealtenhofen from "../assets/team/julie-altenhofen.jpg";
import ashleyreisman from "../assets/team/ashley-reisman.jpg";
import davidgarber from "../assets/team/david-garber.jpg";
import abbyhouk from "../assets/team/abby-houk.jpg";
import jessicaayala from "../assets/team/jessica-ayala.jpg";
import livilesch from "../assets/team/livi-lesch.jpg";
import leanakim from "../assets/team/leana-kim.jpg";
import maddyricciardi from "../assets/team/maddy-ricciardi.jpg";
import morganjewel from "../assets/team/morgan-jewel.jpg";
import rachelpavelko from "../assets/team/rachel-pavelko.jpg";
import ellanelson from "../assets/team/ella-nelson.jpg";
import michaelgreer from "../assets/team/michael-greer.jpg";
import marilynmorales from "../assets/team/marilyn-morales.jpg";
import randysawpring from "../assets/team/randy-sawpring.jpg";
import janegonzalesdormer from "../assets/team/jane-gonzales-dormer.jpg";
import bellasawpring from "../assets/team/bella-sawpring.jpg";
import awardTop20Verdicts from "../assets/awards/top-20-verdicts.webp";
import awardMultiMillion from "../assets/awards/multi-million.webp";
import awardAvvo10 from "../assets/awards/avvo-10.webp";
import awardBestLawyers from "../assets/awards/best-lawyers.webp";
import awardNationalTrial40 from "../assets/awards/national-trial-40.webp";
import awardOnesToWatch from "../assets/awards/ones-to-watch.webp";

export type TeamKind = "partner" | "attorney" | "staff" | "dog";

export interface TeamMember {
  _key: string;
  name: string;
  role: string;
  kind: TeamKind;
  /**
   * Absent for the two people the firm has no photograph of. The card falls
   * back to their initials rather than leaving a hole.
   */
  photo?: ImageMetadata;
  /** The larger crop the founding-partner cards need. */
  photoLarge?: ImageMetadata;
  /** Only attorneys have a bio page today; everyone else renders as a card. */
  href?: string;
  bio?: PortableTextBlock[];
  /** Personal accolades, shown on the founding-partner cards. */
  awards?: { _key: string; image: ImageMetadata; alt: string }[];
  /** Shows "In Loving Memory" above the role. */
  memorial?: boolean;
}

/** Initials for the fallback monogram: "Alexandra Petroff" -> "AP". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export async function getTeam(): Promise<TeamMember[]> {
  return [
    {
      _key: "sean-dormer",
      name: "Sean Dormer",
      role: "Founding Partner",
      kind: "partner",
      photo: seanSm,
      photoLarge: seanLg,
      href: attorneyPath("sean-dormer"),
      bio: pt(
        "Sean was shaped most by his tenure as a student attorney in CU Law School’s " +
        "Defense Clinic, representing clients with limited means for free. Twenty years " +
        "later he is still picking fights with bullies — taking clients other lawyers " +
        "rejected, bringing their cases to trial, and winning against long odds. In 2017 he " +
        "took a permanently injured single mother’s case against one of the country’s " +
        "largest grocery chains, which offered $250,000; the jury returned $1.77 million " +
        "and the case settled for $2.1 million. He speaks on trial technique for the " +
        "Colorado Trial Lawyers Association and has testified for fairer injury laws at the " +
        "state legislature. Born and raised in Colorado, he spends his time with his wife, " +
        "their dog and two cats, and anything the mountains allow."
      ),
      awards: [
        { _key: "top-20-verdicts", image: awardTop20Verdicts, alt: "TopVerdict Top 20 Jury Verdicts Colorado" },
        { _key: "multi-million", image: awardMultiMillion, alt: "Multi-Million Dollar Advocates Forum" },
        { _key: "avvo-10", image: awardAvvo10, alt: "Avvo Rating 10.0 Superb" },
        { _key: "best-lawyers", image: awardBestLawyers, alt: "Best Lawyers" },
      ],
    },
    {
      _key: "kc-harpring",
      name: "K.C. Harpring",
      role: "Founding Partner",
      kind: "partner",
      photo: kcSm,
      photoLarge: kcLg,
      href: attorneyPath("kc-harpring"),
      bio: pt(
        "K.C. has always wanted work that improves the day-to-day lives of real people " +
        "rather than the bottom line of a faceless company. He tried corporate law in " +
        "Chicago and Spain, then found his calling in DePaul’s Poverty Law clinic — where " +
        "he won back the home of a single mother wrongfully evicted over a clerical error. " +
        "That moment became the driving force behind his practice. After passing the " +
        "Colorado bar in 2014 he worked at a high-volume plaintiff’s firm and saw a model " +
        "that could not give clients the service they deserved, so he partnered with Sean " +
        "to build something different. Outside the office he is in the foothills with his " +
        "partner and their two dogs — hiking, skiing, and working through the Colorado " +
        "Mountain Club’s mountaineering courses."
      ),
      awards: [
        { _key: "national-trial-40", image: awardNationalTrial40, alt: "The National Trial Lawyers Top 40 Under 40" },
        { _key: "ones-to-watch", image: awardOnesToWatch, alt: "Best Lawyers: Ones to Watch" },
        { _key: "avvo-10", image: awardAvvo10, alt: "Avvo Rating 10.0 Superb" },
        { _key: "best-lawyers", image: awardBestLawyers, alt: "Best Lawyers" },
      ],
    },
    {
      _key: "tim-garvey",
      name: "Tim Garvey",
      role: "Attorney",
      kind: "attorney",
      photo: timgarvey,
      href: attorneyPath("tim-garvey"),
    },
    {
      _key: "laura-browne",
      name: "Laura Browne",
      role: "Attorney",
      kind: "attorney",
      photo: laurabrowne,
      href: attorneyPath("laura-browne"),
    },
    {
      _key: "jessica-mauser",
      name: "Jessica Mauser",
      role: "Attorney",
      kind: "attorney",
      photo: jessicamauser,
      href: attorneyPath("jessica-mauser"),
    },
    {
      _key: "amy-rogers",
      name: "Amy Rogers",
      role: "Attorney",
      kind: "attorney",
      photo: amyrogers,
      href: attorneyPath("amy-rogers"),
    },
    {
      _key: "greg-bentley",
      name: "Greg Bentley",
      role: "Attorney",
      kind: "attorney",
      photo: gregbentley,
      href: attorneyPath("greg-bentley"),
    },
    {
      _key: "marcie-emch",
      name: "Marcie Emch",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: marcieemch,
    },
    {
      _key: "kassandra-burival",
      name: "Kassandra Burival",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: kassandraburival,
    },
    {
      _key: "brittany-freeman",
      name: "Brittany Freeman",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: brittanyfreeman,
    },
    {
      _key: "cindy-waller",
      name: "Cindy Waller",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: cindywaller,
    },
    {
      _key: "brittany-lesmeister",
      name: "Brittany Lesmeister",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: brittanylesmeister,
    },
    {
      _key: "julie-altenhofen",
      name: "Julie Altenhofen",
      role: "Paralegal",
      kind: "staff",
      photo: juliealtenhofen,
    },
    {
      _key: "ashley-reisman",
      name: "Ashley Reisman",
      role: "Paralegal",
      kind: "staff",
      photo: ashleyreisman,
    },
    {
      _key: "david-garber",
      name: "David Garber",
      role: "Paralegal",
      kind: "staff",
      photo: davidgarber,
    },
    {
      _key: "alexandra-petroff",
      name: "Alexandra Petroff",
      role: "Paralegal",
      kind: "staff",
    },
    {
      _key: "abby-houk",
      name: "Abby Houk",
      role: "Intake Specialist",
      kind: "staff",
      photo: abbyhouk,
    },
    {
      _key: "jessica-ayala",
      name: "Jessica Ayala",
      role: "Intake Specialist",
      kind: "staff",
      photo: jessicaayala,
    },
    {
      _key: "livi-lesch",
      name: "Livi Lesch",
      role: "Office Manager",
      kind: "staff",
      photo: livilesch,
    },
    {
      _key: "leana-kim",
      name: "Leana Kim",
      role: "Office Assistant",
      kind: "staff",
      photo: leanakim,
    },
    {
      _key: "maddy-ricciardi",
      name: "Maddy Ricciardi",
      role: "Controller",
      kind: "staff",
      photo: maddyricciardi,
    },
    {
      _key: "morgan-jewel",
      name: "Morgan Jewel",
      role: "Law Clerk",
      kind: "staff",
      photo: morganjewel,
    },
    {
      _key: "rachel-pavelko",
      name: "Rachel Pavelko",
      role: "Law Clerk",
      kind: "staff",
      photo: rachelpavelko,
    },
    {
      _key: "ella-nelson",
      name: "Ella Nelson",
      role: "Legal Assistant",
      kind: "staff",
      photo: ellanelson,
    },
    {
      _key: "dinorah-gutierrez",
      name: "Dinorah Gutierrez",
      role: "Legal Assistant",
      kind: "staff",
    },
    {
      _key: "michael-greer",
      name: "Michael Greer",
      role: "Legal Assistant",
      kind: "staff",
      photo: michaelgreer,
    },
    {
      _key: "marilyn-morales",
      name: "Marilyn Morales",
      role: "Legal Assistant",
      kind: "staff",
      photo: marilynmorales,
    },
    {
      _key: "randy-ira-sawpring",
      name: "Randy Ira Sawpring",
      role: "Chief of Security",
      kind: "dog",
      photo: randysawpring,
    },
    {
      _key: "jane-gonzales-dormer",
      name: "Jane Gonzales-Dormer",
      role: "Greeter",
      kind: "dog",
      photo: janegonzalesdormer,
      memorial: true,
    },
    {
      _key: "bella-mae-sawpring",
      name: "Bella Mae Sawpring",
      role: "Hype Girl",
      kind: "dog",
      photo: bellasawpring,
    },
  ];
}
