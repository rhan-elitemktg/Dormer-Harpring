// The firm's people — attorneys, support staff and the office dogs.
//
// SANITY SWAP POINT — the future `teamMember` collection. ONE type with a
// `kind` discriminator rather than three arrays: the comp keeps `partners`,
// `attorneys` and `staffData` apart and then merges them back together for the
// grid, which means the merge order is code rather than content and a person
// cannot move between groups without an edit in two places.

import type { ImageMetadata } from "astro";
import type { PortableTextBlock } from "./portableText";
import { attorneyPath } from "../lib/routePaths";
import type { VideoRef } from "../lib/video";

import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { TEAM_PROFILES_QUERY, TEAM_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

export type TeamKind = "partner" | "attorney" | "staff" | "dog";

export interface TeamMember {
  _key: string;
  name: string;
  role: string;
  kind: TeamKind;
  /**
   * ONE PORTRAIT, EVERY SURFACE — the team page, the bio and the attorney rail.
   * There were three fields; the hotspot on a Sanity asset derives each crop
   * from one source, which a local import could not do.
   *
   * Absent for the two people the firm has no photograph of. The card falls
   * back to their initials rather than leaving a hole.
   */
  photo?: ImageMetadata | SanityImageSource;
  /**
   * Set by `getTeam` for anyone who has a profile below, and by nobody else —
   * see the note there. Absent for the two people with no live bio page.
   */
  href?: string;
  bio?: PortableTextBlock[];
  /** Personal accolades, shown on the founding-partner cards. */
  awards?: { _key: string; image: ImageMetadata | SanityImageSource; alt: string }[];
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
  const roster = await once("team", async () =>
    required(await sanityClient.fetch(TEAM_QUERY), "Team")
  );

  // A card links to a bio when, and only when, that bio exists. Derived rather
  // than stored, because a hand-written href outlives the page it points at:
  // the homepage rail once linked Tim Garvey to a route `getStaticPaths` had
  // never built. `hasProfile` is the same condition the Studio toggles, and
  // `attorneyPath()` is the only thing allowed to build the URL — three layers
  // already agree on the trailing slash and a projection must not become a
  // fourth.
  return roster.map(({ hasProfile, ...member }) => ({
    ...(member as TeamMember),
    ...(hasProfile ? { href: attorneyPath(member._key!) } : {}),
  }));
}

// ---------------------------------------------------------------------------
// The long-form profiles behind /meet-our-attorneys/<slug>.
//
// A SECOND PROJECTION of the same `teamMember` documents, not a second type —
// the roster above needs a name, a role and a portrait, and this needs two
// thousand words. In Sanity that is two GROQ projections; here it is two
// functions, so the index page never ships a bio it does not render.
//
// The prose is the firm's own, lifted from the live site rather than the comp:
// the comp carries only Sean's, and paraphrasing a lawyer's biography is not
// something a rebuild should be doing. Three bios end on an appended sentence
// about the firm rather than the person ("Part of the Dormer Harpring team,
// dedicated to helping those injured in Colorado."); those are left out — see
// the README.
//
// Everyone on the live site has one of these. Alexandra Petroff and Dinorah
// Gutierrez do not, which is why they have no photograph either: they joined
// after the last update to it.

export interface AttorneyFact {
  _key: string;
  /** The figure — set in Geist, not the display face. */
  value: string;
  label: string;
}

export interface ProfileLink {
  _key: string;
  label: string;
  href: string;
}

export interface TeamProfile {
  slug: string;
  /**
   * The eyebrow above the name. Optional — it defaults to the member's role,
   * which is what it says for everyone except the two partners, whose cards
   * read "Founding Partner" but whose bios open "Attorney · Founding Partner".
   */
  category?: string;
  /**
   * The single sentence the live site pulls out beside the portrait. STAFF
   * ONLY — the attorney comp has no standfirst, and its opening sentence is
   * the first body paragraph, so the seven attorneys carry theirs in `body`.
   * Two of the staff bios have none and simply open on the body.
   */
  lede?: string;
  /**
   * Personal address, shown in the bio's contact line.
   *
   * TODO(launch): VERIFY EVERY ONE OF THESE. The live site publishes no
   * attorney email anywhere — the only address in the whole 433-page scrape is
   * `lcl@denvertrial.com`, a WordPress author account leaking into blog
   * JSON-LD. These follow the comp's single example, `sean@dormerharpring.com`,
   * so the pattern is <first name>@dormerharpring.com and the rest are
   * inferred. A published address that bounces is worse than none, so if the
   * firm cannot confirm them, clear the field and the line closes up.
   */
  email?: string;
  /** The three-up dark band under the name. Optional — the two partners only. */
  facts?: AttorneyFact[];
  /** A `> ` paragraph becomes the pull quote. */
  body: PortableTextBlock[];
  /** Degrees, most recent first. */
  education?: string[];
  /**
   * Press mentions and directory profiles. Real destinations, read off the live
   * site — the comp points every one of Sean's at "#". Seven of them are the
   * firm's own posts, which arrive with Phase 3j and 404 until then.
   */
  links?: ProfileLink[];
  /**
   * A profile film, where one exists — the SAME film the attorney rail card
   * opens. There was a second id for that, and one person's one video does not
   * want two places to keep in step.
   *
   * No poster: the bio's portrait is the play affordance, so there is no
   * separate frame to upload or describe.
   */
  video?: VideoRef;
}


/** Undefined for anyone without a profile — today, the two people the live site
 *  has no page for. `getStaticPaths` builds only the pages that exist. */
/** Undefined for anyone without a bio page. `getStaticPaths` builds only the
 *  pages that exist. */
export async function getTeamProfile(slug: string): Promise<TeamProfile | undefined> {
  const profiles = await getTeamProfiles();
  return profiles.find((profile) => profile.slug === slug);
}

export async function getTeamProfiles(): Promise<TeamProfile[]> {
  const rows = await once("teamProfiles", async () =>
    required(await sanityClient.fetch(TEAM_PROFILES_QUERY), "Team (bio pages)")
  );

  return rows.map(({ videoId, ...profile }) => ({
    ...profile,
    // Rebuilt here rather than stored: the Studio holds the id, and the
    // provider half of the pair is a code concern. Undefined rather than a
    // blank ref, because the bio branches on its presence to decide whether the
    // portrait gets a play button.
    ...(videoId ? { video: { provider: "wistia", id: videoId } as VideoRef } : {}),
  })) as TeamProfile[];
}
