// "Rooted in Denver." — the community mosaic and NGO partner row.
//
// SANITY SWAP POINT — these become `communityPost` (23 on the legacy site) and
// `ngoPartner` documents.
import type { ImageMetadata } from "astro";
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
  image: ImageMetadata;
  org: string;
  caption: string;
  /** Columns of a 12-track grid. One of 3, 4, 5 or 12 — see CommunityBand. */
  span: 3 | 4 | 5 | 12;
}

export interface NgoPartner {
  _key: string;
  name: string;
  logo: ImageMetadata;
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
  return [
    {
      _key: "pikes-peak",
      image: pikesPeak,
      org: "Pikes Peak Challenge",
      caption: "Brain Injury Alliance of Colorado",
      span: 5,
    },
    {
      _key: "rmhc",
      image: rmhc,
      org: "Ronald McDonald House",
      caption: "Cooking for families in care",
      span: 3,
    },
    {
      _key: "clothes-to-kids",
      image: clothesToKids,
      org: "Clothes To Kids of Denver",
      caption: "Clothe a child, change a life",
      span: 4,
    },
    {
      _key: "metro-caring",
      image: fridge,
      org: "Metro Caring",
      caption: "Front-range hunger relief",
      span: 4,
    },
    {
      _key: "angel-heart",
      image: angelHeart,
      org: "Project Angel Heart",
      caption: "Meals for those in crisis",
      span: 5,
    },
    {
      _key: "true-companions",
      image: shelter,
      org: "True Companions Shelter",
      caption: "Homes for rescue animals",
      span: 3,
    },
    {
      _key: "project-cure",
      image: projectCure,
      org: "Project C.U.R.E.",
      caption: "Medical relief worldwide",
      span: 12,
    },
  ];
}

export async function getNgoPartners(): Promise<NgoPartner[]> {
  return [
    { _key: "metro-caring", name: "Metro Caring", logo: ngoMetroCaring },
    { _key: "angel-heart", name: "Project Angel Heart", logo: ngoAngelHeart },
    { _key: "we-dont-waste", name: "We Don't Waste", logo: ngoWeDontWaste },
    { _key: "humane-colorado", name: "Humane Colorado", logo: ngoHumane },
    {
      _key: "rmhc",
      name: "Ronald McDonald House Charities Denver",
      logo: ngoRmhc,
    },
    { _key: "clothes-to-kids", name: "Clothes To Kids of Denver", logo: ngoClothesToKids },
    { _key: "true-companions", name: "True Companions Animal Shelter", logo: ngoTrueCompanions },
  ];
}
