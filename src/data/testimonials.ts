// Client testimonials — video and written, interleaved in the homepage rail.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/testimonials.ts`.
//
// The comp carries two parallel arrays merged into one with `isVideo`/`isQuote`
// boolean pairs on each entry. That is one type with two shapes, so it is
// modelled as one here with a `kind` discriminator: a mutually-exclusive pair
// of booleans can express states that don't exist (both true, neither true),
// and the rail's order is content, not code.
import type { ImageMetadata } from "astro";
import evelyn from "../assets/testimonials/evelyn.jpg";
import ben from "../assets/testimonials/ben.jpg";
import joel from "../assets/testimonials/joel.jpg";
import elijah from "../assets/testimonials/elijah.jpg";
import kelly from "../assets/testimonials/kelly.jpg";

export interface VideoTestimonial {
  _key: string;
  kind: "video";
  name: string;
  /** Runtime, shown on the poster. */
  length: string;
  poster: ImageMetadata;
}

export interface QuoteTestimonial {
  _key: string;
  kind: "quote";
  headline: string;
  body: string;
  name: string;
}

export type Testimonial = VideoTestimonial | QuoteTestimonial;

/** Ratings shown beside the section heading. Presentational copy only. */
export interface ReviewSummary {
  count: string;
  rating: string;
  source: string;
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  return { count: "300+", rating: "5.0", source: "Google" };
}

/** Alternating video and written, exactly as the comp orders them. */
export async function getHomeTestimonials(): Promise<Testimonial[]> {
  return [
    { _key: "evelyn", kind: "video", name: "Evelyn", length: "2:14", poster: evelyn },
    {
      _key: "lisa-kelly",
      kind: "quote",
      headline: "I am so fortunate to have found them.",
      body:
        "If you are looking for a law firm to help you navigate the legal system " +
        "after you have been injured, I would highly recommend Dormer Harpring. " +
        "Jessica and Nancy made the entire process from start to finish painless.",
      name: "Lisa Kelly",
    },
    { _key: "ben", kind: "video", name: "Ben", length: "1:38", poster: ben },
    {
      _key: "nadia-borja",
      kind: "quote",
      headline: "They took the time to explain every step of the process.",
      body:
        "I recently had the pleasure of working with Dormer Harpring for my legal " +
        "needs, and I couldn't be happier with the experience. From the moment I " +
        "inquired, the staff was welcoming and professional.",
      name: "Nadia Borja",
    },
    { _key: "joel", kind: "video", name: "Joel", length: "1:52", poster: joel },
    {
      _key: "ashlee-wagoner",
      kind: "quote",
      headline: "Professional, compassionate, and dedicated to my case.",
      body:
        "I cannot recommend Dormer Harpring highly enough! From start to finish, " +
        "their team was incredibly professional, compassionate, and dedicated to my " +
        "case. They took the time to thoroughly explain every step.",
      name: "Ashlee Wagoner",
    },
    { _key: "elijah", kind: "video", name: "Elijah", length: "2:03", poster: elijah },
    {
      _key: "marcus-delgado",
      kind: "quote",
      headline: "They fought for me and kept me informed the whole way.",
      body:
        "After my accident I felt completely overwhelmed. Dormer Harpring took the " +
        "pressure off, handled the insurance company, and kept me updated at every " +
        "turn. I always felt like a priority, never a number.",
      name: "Marcus Delgado",
    },
    { _key: "kelly", kind: "video", name: "Kelly", length: "1:47", poster: kelly },
  ];
}
