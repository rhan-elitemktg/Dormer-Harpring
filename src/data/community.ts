// "Rooted in Denver." — the homepage's community mosaic and charity logo row.
//
// BOTH ARE ARRAYS ON THE `homePage` DOCUMENT since Phase 2f, not collections.
// Each renders on the homepage and nowhere else, and a Collection is for
// content reused in more than one place.
//
// The Community Involvement page's partner cards are a SEPARATE set in
// `communityPage.ts`, even where they are the same charities — see the note
// there.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import {
  CHARITY_PARTNERS_QUERY,
  COMMUNITY_PHOTOS_QUERY,
  HOME_COMMUNITY_SECTION_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

// THE ASSET IMPORTS THAT USED TO SIT HERE ARE GONE — the getters have read
// Sanity since Phase 2e and nothing referenced them; an unused module-level
// import is not an error, so nothing reported them for four commits. The FILES
// stay in `src/assets/`: `npm run backup` runs `--no-assets`, so git is the only
// copy of those originals outside Sanity's asset store.

export interface CommunityPhoto {
  _key: string;
  image: ImageMetadata | SanityImageSource;
  org: string;
  caption: string;
  /** Columns of a 12-track grid. One of 3, 4, 5 or 12 — see CommunityBand. */
  span: 3 | 4 | 5 | 12;
}

export interface CharityPartner {
  _key: string;
  name: string;
  logo: ImageMetadata | SanityImageSource;
}

export interface CommunitySection {
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
}

export async function getCommunitySection(): Promise<CommunitySection> {
  return once("homePage:communitySection", async () =>
    required(await sanityClient.fetch(HOME_COMMUNITY_SECTION_QUERY), "Homepage", "Pages")
  );
}

/**
 * Order matters: the spans are laid out to fill 12-column rows as 5+3+4, 4+5+3, 12.
 *
 * THAT CONSTRAINT NOW LIVES ON THE FIELD IN THE STUDIO as well, and has to. It
 * was safe here while an editor reordered by typing a number into a form; they
 * drag the array now, and the person dragging never opens this file.
 *
 * The `as CommunityPhoto[]` this used to end on is gone: `span`'s 3 | 4 | 5 | 12
 * union survives the inline array member, so the projection matches the
 * interface and the cast was hiding nothing — which is the only reason to keep
 * one.
 */
export async function getCommunityPhotos(): Promise<CommunityPhoto[]> {
  return once("communityPhotos", async () =>
    required(await sanityClient.fetch(COMMUNITY_PHOTOS_QUERY), "Homepage", "Pages")
  );
}

export async function getCharityPartners(): Promise<CharityPartner[]> {
  return once("charityPartners", async () =>
    required(await sanityClient.fetch(CHARITY_PARTNERS_QUERY), "Homepage", "Pages")
  );
}
