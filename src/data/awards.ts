// Award badges for the trust bar.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/awards.ts`. The image
// is an ImageMetadata today and becomes a Sanity image reference later;
// `Picture.astro` is the single place that has to learn the difference.
//
// The images are imported HERE rather than in AwardsBar, so that the alt text
// and the file it describes stay in one record. Splitting them is how a badge
// ends up captioned as the one next to it.
import type { ImageMetadata } from "astro";
import badge1 from "../assets/badges/badge-1.webp";
import badge2 from "../assets/badges/badge-2.webp";
import badge3 from "../assets/badges/badge-3.webp";
import badge4 from "../assets/badges/badge-4.webp";
import badge5 from "../assets/badges/badge-5.webp";
import badge8 from "../assets/badges/badge-8.webp";

export interface Award {
  _key: string;
  image: ImageMetadata;
  /** Full award name — this is the alt text, so it has to read as one. */
  alt: string;
  /** Rendered height in px. The badges are drawn at different weights. */
  height: number;
}

export async function getAwards(): Promise<Award[]> {
  return [
    { _key: "avvo", image: badge1, alt: "Avvo Rating 10.0 Superb", height: 74 },
    { _key: "topverdict", image: badge2, alt: "TopVerdict Top 20 Colorado 2023", height: 74 },
    { _key: "mdaf", image: badge3, alt: "Million Dollar Advocates Forum", height: 80 },
    { _key: "mmdaf", image: badge4, alt: "Multi-Million Dollar Advocates Forum", height: 80 },
    {
      _key: "ntl-40",
      image: badge5,
      alt: "The National Trial Lawyers Top 40 Under 40",
      height: 80,
    },
    { _key: "ntl-100", image: badge8, alt: "The National Trial Lawyers Top 100", height: 88 },
  ];
}
