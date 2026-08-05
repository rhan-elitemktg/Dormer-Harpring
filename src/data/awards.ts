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

/**
 * The alt text on the first four is NOT the comp's. Every comp captions
 * badge-1 as Avvo, badge-2 as TopVerdict, badge-3 as Million Dollar and
 * badge-4 as Multi-Million — and all four files are something else. Read in
 * order, the artwork is Multi-Million, Million, TopVerdict, Avvo: the labels
 * were shifted against the images somewhere upstream and copied across all
 * fourteen pages. The rendered ORDER here still matches the comps exactly;
 * only the descriptions are corrected, so a screen reader and Google stop
 * being told the firm holds four awards in the wrong order.
 */
export async function getAwards(): Promise<Award[]> {
  return [
    { _key: "mmdaf", image: badge1, alt: "Multi-Million Dollar Advocates Forum", height: 74 },
    { _key: "mdaf", image: badge2, alt: "Million Dollar Advocates Forum", height: 74 },
    {
      _key: "topverdict",
      image: badge3,
      alt: "TopVerdict Top 20 Jury Verdicts Colorado 2023",
      height: 80,
    },
    { _key: "avvo", image: badge4, alt: "Avvo Rating 10.0 Superb", height: 80 },
    {
      _key: "ntl-40",
      image: badge5,
      alt: "The National Trial Lawyers Top 40 Under 40",
      height: 80,
    },
    { _key: "ntl-100", image: badge8, alt: "The National Trial Lawyers Top 100", height: 88 },
  ];
}
