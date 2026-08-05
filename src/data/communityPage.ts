// The /community-involvement page.
//
// SANITY SWAP POINT — `communityPartner` documents (11) plus a `sponsorship`
// list and a `communityPage` singleton.
//
// The homepage's mosaic and NGO row stay in `community.ts`. They are the same
// organisations, but they carry their own display labels ("Ronald McDonald
// House", not "Ronald McDonald House Denver") and a different crop of six of
// the logos — merging them would silently restyle an approved homepage. They
// become one document set when an editor owns the assets.
import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import clothesToKids from "../assets/partners/clothes-to-kids.webp";
import craigHospital from "../assets/partners/craig-hospital.jpg";
import humaneColorado from "../assets/partners/humane-colorado.webp";
import metroCaring from "../assets/partners/metro-caring.webp";
import pikesPeakLogo from "../assets/partners/pikes-peak-challenge.jpg";
import angelHeartLogo from "../assets/partners/project-angel-heart.webp";
import projectCureLogo from "../assets/partners/project-cure.jpg";
import rmhcDenver from "../assets/partners/rmhc-denver.webp";
import theParkPeople from "../assets/partners/the-park-people.webp";
import trueCompanions from "../assets/partners/true-companions.webp";
import weDontWaste from "../assets/partners/we-dont-waste.webp";

import angelHeartPhoto from "../assets/community/angel-heart.jpg";
import clothesToKidsPhoto from "../assets/community/clothes-to-kids.jpg";
import fridgePhoto from "../assets/community/fridge.jpg";
import pikesPeakPhoto from "../assets/community/pikes-peak.jpg";
import projectCurePhoto from "../assets/community/project-cure.jpg";
import rmhcPhoto from "../assets/community/rmhc.jpg";
import shelterPhoto from "../assets/community/shelter.jpg";

export interface CommunityPartner {
  _key: string;
  org: string;
  logo: ImageMetadata;
  /**
   * A photograph of the team at work. Optional: four of the eleven have none
   * yet, and the card falls back to the logo on white rather than leaving a
   * hole. TODO(launch): photography for Craig Hospital, The Park People, We
   * Don't Waste and the Dumb Friends League.
   */
  photo?: ImageMetadata;
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
  return {
    eyebrow: "Community involvement",
    title: "Showing up for Colorado.",
    lede: pt(
      "We take the same approach to our neighborhood that we take to our cases " +
        "— show up, do the work, and stay. Here is where our team spends its time " +
        "outside the courtroom."
    ),
    volunteer: {
      eyebrow: "Where we volunteer",
      title: "The organizations we stand behind.",
      ctaLabel: "Read our stories",
    },
    sponsorships: {
      eyebrow: "Sponsorships",
      title: "Events we're proud to back.",
    },
    partners: { label: "Organizations we support" },
  };
}

export async function getCommunityPartners(): Promise<CommunityPartner[]> {
  return [
    {
      _key: "pikes-peak",
      org: "Pikes Peak Challenge",
      logo: pikesPeakLogo,
      photo: pikesPeakPhoto,
      body:
        "Our team hiked the Barr Camp trail in the 2025 Pikes Peak Challenge, " +
        "raising $1,670 to support survivors of brain injuries and their families.",
    },
    {
      _key: "true-companions",
      org: "True Companions Animal Shelter",
      logo: trueCompanions,
      photo: shelterPhoto,
      body:
        "We volunteered at Colorado's largest no-kill animal shelter and clinic, " +
        "supporting its shelter programs and advanced veterinary care.",
    },
    {
      _key: "metro-caring",
      org: "Metro Caring",
      logo: metroCaring,
      photo: fridgePhoto,
      body:
        "At Metro Caring's Fresh Foods Market we stocked shelves and checked in " +
        "community members for an anti-hunger organization now in its 50th year.",
    },
    {
      _key: "rmhc",
      org: "Ronald McDonald House Denver",
      logo: rmhcDenver,
      photo: rmhcPhoto,
      body:
        "The team prepared and served a homemade Peruvian dinner for families " +
        "staying at the house while their children receive medical care.",
    },
    {
      _key: "clothes-to-kids",
      org: "Clothes To Kids Denver",
      logo: clothesToKids,
      photo: clothesToKidsPhoto,
      body:
        "Our ongoing work organizing clothing for an organization that has " +
        "provided free school wardrobes to more than 100,000 students.",
    },
    {
      _key: "angel-heart",
      org: "Project Angel Heart",
      logo: angelHeartLogo,
      photo: angelHeartPhoto,
      body:
        "Team members prepared medically tailored meals for Coloradans battling " +
        "severe illness — something Project Angel Heart has done since 1991.",
    },
    {
      _key: "project-cure",
      org: "Project C.U.R.E.",
      logo: projectCureLogo,
      photo: projectCurePhoto,
      body:
        "We sorted medical supplies and equipment shipped to communities in need " +
        "worldwide, alongside the volunteers who keep that pipeline running.",
    },
    {
      _key: "craig-hospital",
      org: "Craig Hospital",
      logo: craigHospital,
      body:
        "We volunteered at Craig Hospital, a world-renowned rehabilitation " +
        "hospital specializing exclusively in spinal cord and brain injury " +
        "neuro-rehabilitation and research.",
    },
    {
      _key: "park-people",
      org: "The Park People",
      logo: theParkPeople,
      body:
        "Our team planted 18 trees at Chaffee Park with an organization that has " +
        "planted over 60,000 trees across Denver's neighborhoods.",
    },
    {
      _key: "we-dont-waste",
      org: "We Don't Waste",
      logo: weDontWaste,
      body:
        "We helped distribute recovered surplus food at a mobile market — " +
        "addressing the 1 in 3 Coloradans who face food insecurity.",
    },
    {
      _key: "dumb-friends",
      org: "Dumb Friends League",
      logo: humaneColorado,
      body:
        "The firm ran a supply drive delivery for an organization finding loving " +
        "homes for animals through adoption, medical care, and behavioral support.",
    },
  ];
}

export async function getSponsorships(): Promise<Sponsorship[]> {
  return [
    {
      _key: "jas-jewels",
      name: "Jas Jewels Foundation",
      body:
        "We sponsored the Jassy Rendezvous Fundraising Gala, helping raise over " +
        "$10,000 for an organization connecting Denver community members with " +
        "coaching, networking, and holistic healing.",
    },
    {
      _key: "bbbs",
      name: "Big Brothers Big Sisters",
      body:
        "A multi-year sponsor of Colorado's Big Little Gala. The stories of " +
        "mentorship were moving enough that several team members volunteered to " +
        "become Bigs themselves.",
    },
    {
      _key: "cwba",
      name: "CWBA Policy Action Benefit",
      body:
        "We supported the Colorado Women's Bar Association's fundraising event " +
        "focused on combating book bans and protecting intellectual freedom.",
    },
    {
      _key: "denver-film",
      name: "Denver Film Festival 48",
      body:
        "The firm sponsored the 48th Annual Denver Film Festival, celebrating " +
        "diverse storytelling and supporting local Colorado filmmakers.",
    },
    {
      _key: "cca",
      name: "Colorado Chiropractic Association",
      body:
        "We exhibited at the CCA's “Brain Meets Body” convention, connecting with " +
        "chiropractic professionals across the state.",
    },
    {
      _key: "dmar",
      name: "DMAR Inaugural",
      body:
        "We sponsored the Denver Metro Association of Realtors' 2025 Inaugural, " +
        "raising funds for housing-related charitable initiatives.",
    },
    {
      _key: "cba",
      name: "CBA Well-Being Symposium",
      body:
        "We sponsored the Colorado Bar Association Well-Being Symposium Spring " +
        "Summit, centered on the well-being of Colorado's legal professionals.",
    },
  ];
}
