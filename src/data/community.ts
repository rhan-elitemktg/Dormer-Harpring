// "Rooted in Denver." — the community mosaic and NGO partner row.
//
// SANITY SWAP POINT — these become `communityPost` (23 on the legacy site) and
// `ngoPartner` documents.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { COMMUNITY_PHOTOS_QUERY, NGO_PARTNERS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import angelHeart from "../assets/community/angel-heart.jpg";
import clothesToKids from "../assets/community/clothes-to-kids.jpg";
import fridge from "../assets/community/fridge.jpg";
import pikesPeak from "../assets/community/pikes-peak.jpg";
import projectCure from "../assets/community/project-cure.jpg";
import rmhc from "../assets/community/rmhc.jpg";
import shelter from "../assets/community/shelter.jpg";

import ngoClothesToKids from "../assets/ngos/clothes-to-kids.jpg";
import ngoHumane from "../assets/ngos/humane-colorado.webp";
import ngoMetroCaring from "../assets/ngos/metro-caring.webp";
import ngoAngelHeart from "../assets/ngos/project-angel-heart.webp";
import ngoRmhc from "../assets/ngos/rmhc.webp";
import ngoTrueCompanions from "../assets/ngos/true-companions.jpg";
import ngoWeDontWaste from "../assets/ngos/we-dont-waste.webp";

export interface CommunityPhoto {
  _key: string;
  image: ImageMetadata | SanityImageSource;
  org: string;
  caption: string;
  /** Columns of a 12-track grid. One of 3, 4, 5 or 12 — see CommunityBand. */
  span: 3 | 4 | 5 | 12;
}

export interface NgoPartner {
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
  return {
    eyebrow: "Giving back",
    title: "Rooted in Denver.",
    lede:
      "Denver is home. Beyond the courtroom, our team shows up — boots on the " +
      "ground — for the local causes that support Colorado families.",
    ctaLabel: "See all community work",
  };
}

/** Order matters: the spans are laid out to fill 12-column rows as 5+3+4, 4+5+3, 12. */
export async function getCommunityPhotos(): Promise<CommunityPhoto[]> {
  const photos = await once("communityPhotos", async () =>
    required(await sanityClient.fetch(COMMUNITY_PHOTOS_QUERY), "Community Photos")
  );
  return photos as CommunityPhoto[];
}

export async function getNgoPartners(): Promise<NgoPartner[]> {
  return once("ngoPartners", async () =>
    required(await sanityClient.fetch(NGO_PARTNERS_QUERY), "Charity Partners")
  );
}
