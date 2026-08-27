// The /community-involvement page.
//
// ITS TWO LISTS ARE ARRAYS ON THE `communityPage` DOCUMENT since Phase 2f, not
// collections. Neither renders anywhere else — this page exists to render them
// — and a Collection is for content reused in more than one place.
//
// The homepage's mosaic and charity row stay in `community.ts`. They are the
// same organisations, but they carry their own display labels ("Ronald McDonald
// House", not "Ronald McDonald House Denver") and a different crop of six of
// the logos — merging them would silently restyle an approved homepage. They
// become one set when an editor owns the assets.
//
// THE `CommunityPage` INTERFACE BELOW SHARES A NAME with the type typegen emits
// for the document, and Phase 4 put the page's copy on that same document
// without either having to give way. Nothing collides because they live in
// different modules and the getter reads a QUERY type
// (`COMMUNITY_PAGE_COPY_QUERY_RESULT`) rather than the document type — typegen
// names a result after the query, not after the schema. Worth knowing before
// renaming either.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import {
  COMMUNITY_PAGE_COPY_QUERY,
  COMMUNITY_PARTNERS_QUERY,
  SPONSORSHIPS_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";

// THE ASSET IMPORTS THAT USED TO SIT HERE ARE GONE — the getters have read
// Sanity since Phase 2e and nothing referenced them; an unused module-level
// import is not an error, so nothing reported them for four commits. The FILES
// stay in `src/assets/`: `npm run backup` runs `--no-assets`, so git is the only
// copy of those originals outside Sanity's asset store, and `scripts/prep-assets.mjs`
// still re-derives the eleven partner logos from the comps.

export interface CommunityPartner {
  _key: string;
  org: string;
  logo: ImageMetadata | SanityImageSource;
  /**
   * A photograph of the team at work. Optional: four of the eleven have none
   * yet, and the card falls back to the logo on white rather than leaving a
   * hole. TODO(launch): photography for Craig Hospital, The Park People, We
   * Don't Waste and the Dumb Friends League.
   */
  photo?: ImageMetadata | SanityImageSource;
  body: string;
}

export interface Sponsorship {
  _key: string;
  name: string;
  body: string;
}

export interface CommunityPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  volunteer: { eyebrow: string; title: string; ctaLabel: string };
  sponsorships: { eyebrow: string; title: string };
  partners: { label: string };
}

export async function getCommunityPage(): Promise<CommunityPage> {
  const copy = await once("communityPage:copy", async () =>
    required(
      await sanityClient.fetch(COMMUNITY_PAGE_COPY_QUERY),
      "Community Involvement",
      "Pages"
    )
  );
  return { ...copy, lede: copy.lede as PortableTextBlock[] };
}

export async function getCommunityPartners(): Promise<CommunityPartner[]> {
  const partners = await once("communityPartners", async () =>
    required(
      await sanityClient.fetch(COMMUNITY_PARTNERS_QUERY),
      "Community Involvement",
      "Pages"
    )
  );
  return partners.map((p) => ({ ...p, photo: p.photo ?? undefined })) as CommunityPartner[];
}

export async function getSponsorships(): Promise<Sponsorship[]> {
  return once("sponsorships", async () =>
    required(await sanityClient.fetch(SPONSORSHIPS_QUERY), "Community Involvement", "Pages")
  );
}
