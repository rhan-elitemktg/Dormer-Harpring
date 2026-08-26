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
import { attorneyPath } from "../lib/routePaths";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { ATTORNEY_RAIL_QUERY, SHARED_SECTIONS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
// PLACEHOLDER_VIDEO is no longer imported: the stand-in ids are FIELDS in the
// Studio now, so grepping the constant finds exactly the slots still needing a
// real one — and this module is no longer one of them.
import type { VideoRef } from "../lib/video";

export interface AttorneyCardData {
  _key: string;
  name: string;
  /** Split from `location` — the comp stores one "Role · City" string, but the
   *  separator is presentation and an editor should not have to type it. */
  role: string;
  location: string;
  href: string;
  portrait: ImageMetadata | SanityImageSource;
  /** The card's portrait opens this in a popover; the name below it goes to
   *  `href`. Two controls, deliberately — see AttorneyCard.astro.
   *  TODO(video): PLACEHOLDER_VIDEO on all four until real ids land. */
  video: VideoRef;
}

export interface AttorneysSection {
  eyebrow: string;
  title: string;
  quote: string;
  signature: { name: string; role: string; href: string; portrait: ImageMetadata | SanityImageSource };
  ctaLabel: string;
}

export async function getAttorneysSection(): Promise<AttorneysSection> {
  const { attorneysBand } = await once("sharedSections", async () =>
    required(await sanityClient.fetch(SHARED_SECTIONS_QUERY), "Shared Sections")
  );
  if (!attorneysBand?.signature) {
    throw new Error(
      "Shared Sections has no attorney-rail band, so the homepage and Practice Areas cannot " +
        "render their attorney section. Fill it in at /admin → Site Settings → Shared Sections."
    );
  }

  const { signature } = attorneysBand;
  return {
    eyebrow: attorneysBand.eyebrow!,
    title: attorneysBand.title!,
    quote: attorneysBand.quote!,
    signature: {
      name: signature.name!,
      role: signature.role!,
      // The KEY is stored, not the path — `attorneyPath()` stays the only thing
      // that builds an internal URL, so the trailing slash has one owner.
      href: attorneyPath(signature.attorneyKey!),
      portrait: signature.portrait as SanityImageSource,
    },
    ctaLabel: attorneysBand.ctaLabel!,
  };
}

/*
 * THE `CARDS` MAP IS GONE. It kept one record per person so a portrait swap
 * was a single edit — the right instinct, and the note on it predicted exactly
 * what happened: "one `attorney` document per person, referenced by whichever
 * page wants it". That is now literally true. The rail fields live on the team
 * member, so there is one record per person for real rather than one map that
 * happened to mirror the roster.
 *
 * A note the map made, worth keeping: the homepage takes three and About four,
 * and the homepage's is a SUBSET. The seed asserted that before relying on it.
 */


/**
 * The rail's cards, from the team members that carry rail fields.
 *
 * ONE FETCH FOR BOTH RAILS. The homepage shows a SUBSET of About's four, so
 * both getters read the same query and filter — and `once()` makes that one
 * request however many pages ask.
 */
async function attorneyRail(): Promise<(AttorneyCardData & { onHomeRail: boolean })[]> {
  const rows = await once("attorneyRail", async () =>
    required(await sanityClient.fetch(ATTORNEY_RAIL_QUERY), "Team (attorney rail)")
  );
  return rows.map((row) => ({
    _key: row._key!,
    name: row.name!,
    role: row.role!,
    location: row.location ?? "",
    href: attorneyPath(row._key!),
    portrait: row.portrait as SanityImageSource,
    video: row.video as VideoRef,
    onHomeRail: row.onHomeRail,
  }));
}

export async function getHomeAttorneys(): Promise<AttorneyCardData[]> {
  return (await attorneyRail()).filter((card) => card.onHomeRail);
}

/**
 * The About comp's "Meet the team" grid, in its order. A DIFFERENT selection
 * from the homepage rail rather than a longer one — the About comp names these
 * four explicitly, Laura included, and it is a fixed four-up grid rather than a
 * rail that could take more.
 */
export async function getAboutAttorneys(): Promise<AttorneyCardData[]> {
  return attorneyRail();
}
