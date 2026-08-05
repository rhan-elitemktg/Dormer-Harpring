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
import { pt, type PortableTextBlock } from "./portableText";
import type { VideoRef } from "../lib/video";
import teamPhoto from "../assets/team/skyline.jpg";
import teamCrop from "../assets/team/skyline-crop.jpg";
import evelyn from "../assets/testimonials/evelyn.jpg";
import ben from "../assets/testimonials/ben.jpg";
import joel from "../assets/testimonials/joel.jpg";
import elijah from "../assets/testimonials/elijah.jpg";
import kelly from "../assets/testimonials/kelly.jpg";
import videoCover1 from "../assets/testimonials/video-cover-1.jpg";

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

// ---------------------------------------------------------------------------
// The /testimonials page.

export interface VideoReview {
  _key: string;
  /**
   * Provider + id, never a URL. The firm is moving from YouTube to Wistia, and
   * that migration should be a change to these records rather than a hunt
   * through components — `src/lib/video.ts` is what turns this into a link.
   */
  video: VideoRef;
  name: string;
  quote: string;
  poster: ImageMetadata;
}

export interface WrittenReview {
  _key: string;
  name: string;
  /** Where the review was left. Drives the platform glyph on the card. */
  source: "google";
  /** The pull quote, set larger than the body. */
  quote: string;
  body: string;
}

export interface TestimonialsPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  /** The narrow-viewport crop — see `PageHeader`'s `photoMobile`. */
  photoMobile: ImageMetadata;
  photoAlt: string;
  ctaLabel: string;
  ctaNote: string;
  videos: { eyebrow: string; title: string; lede: string };
  written: { eyebrow: string; title: string; lede: string; moreLabel: string };
}

export async function getTestimonialsPage(): Promise<TestimonialsPage> {
  return {
    eyebrow: "Client testimonials",
    title: "In our clients' own words.",
    lede: pt(
      "Our clients love our personalized, caring approach to personal injury " +
        "law. Don't take our word for it — hear it from the people we've represented."
    ),
    photo: teamPhoto,
    photoMobile: teamCrop,
    photoAlt: "The Dormer Harpring attorneys in Denver",
    ctaLabel: "Talk to a lawyer",
    ctaNote: "No win, no fee",
    videos: {
      eyebrow: "Video reviews",
      title: "Hear it from our clients.",
      lede: "Real people, real cases — no scripts and no actors.",
    },
    written: {
      eyebrow: "Written reviews",
      title: "What clients say about working with us.",
      lede: "Reviews collected from Google. Prior results do not guarantee a similar outcome.",
      moreLabel: "Load more reviews",
    },
  };
}

/**
 * The firm's six published client testimonials, all live on the @denvertrial
 * YouTube channel. These are REAL ids — verified against YouTube's oEmbed
 * endpoint — which makes this the one place on the site where the video is not
 * a placeholder. The cards link out to YouTube exactly as the comp does; the
 * lightbox on the launch list would replace that, not enable it.
 *
 * The posters are the design package's own, NOT YouTube's. All six videos were
 * shot vertically, so every thumbnail YouTube serves is a 9:16 title card
 * letterboxed into 16:9 against a blurred copy of itself — in a 16:9 card that
 * is mostly blur, and it shows a stock river clip rather than the client. The
 * five named clients reuse the portraits the homepage rail already carries;
 * the sixth takes `vid-cover-1`, which the design package ships and nothing
 * else was using.
 * TODO(launch): a still lifted from each video would beat both.
 */
export async function getVideoReviews(): Promise<VideoReview[]> {
  return [
    {
      _key: "evelyn",
      video: { provider: "youtube", id: "kFdrOgblr6A" },
      name: "Evelyn",
      quote: "They made me feel like part of the family — I had a good team on my side.",
      poster: evelyn,
    },
    {
      _key: "ben",
      video: { provider: "youtube", id: "sMGtyzxGaxY" },
      name: "Ben",
      quote: "Jessica is a great lawyer. She cares about people.",
      poster: ben,
    },
    {
      _key: "joel",
      video: { provider: "youtube", id: "AhfhEBczLcY" },
      name: "Joel",
      quote: "Stay away from the billboards — these guys are the best.",
      poster: joel,
    },
    {
      _key: "elijah",
      video: { provider: "youtube", id: "aqX7B7vu1ZI" },
      name: "Elijah",
      quote:
        "It really made me so grateful that there are people out there helping " +
        "people in this way.",
      poster: elijah,
    },
    {
      _key: "kelly",
      video: { provider: "youtube", id: "B3-hJPujs0U" },
      name: "Kelly",
      quote:
        "This team of champions were so attentive, so responsive, so professional, " +
        "so kind to me.",
      poster: kelly,
    },
    {
      _key: "sean-client",
      video: { provider: "youtube", id: "-cSgLpR2TfA" },
      name: "Former client",
      quote: "Sean guided me every step of the way.",
      poster: videoCover1,
    },
  ];
}

/**
 * ONE flat, ordered list. The comp hand-balances these into three literal
 * column arrays; that is a layout decision baked into content, and it breaks
 * the moment the column count changes or an editor adds a review. The columns
 * are rebuilt in the component from this order.
 */
export async function getWrittenReviews(): Promise<WrittenReview[]> {
  return [
    {
      _key: "lisa-kelly",
      name: "Lisa Kelly",
      source: "google",
      quote:
        "I am so fortunate to have found them and would look no further if you're " +
        "looking for a great law firm to have on your side.",
      body:
        "If you are looking for a law firm to help you navigate the legal system " +
        "after you have been injured, I would highly recommend Dormer Harpring. " +
        "Jessica and Nancy made the entire process from start to finish painless. " +
        "They handled everything in a very timely and professional manner. Thank " +
        "you for helping me — it was a pleasure working with you!",
    },
    {
      _key: "ashlee-wagoner",
      name: "Ashlee Wagoner",
      source: "google",
      quote:
        "From start to finish, their team was incredibly professional, " +
        "compassionate, and dedicated to my case.",
      body:
        "I cannot recommend Dormer Harpring, LLC highly enough! They took the time " +
        "to thoroughly explain every step of the process, ensuring I felt informed " +
        "and confident along the way. What truly sets them apart is their personal " +
        "approach — unlike some larger firms where you feel like just another case " +
        "number, the attorneys at Dormer Harpring genuinely care about their " +
        "clients. They fought tirelessly to ensure I received the best possible " +
        "outcome, and their attention to detail was second to none.",
    },
    {
      _key: "nana-boakye",
      name: "Nana Boakye",
      source: "google",
      quote:
        "From start to finish, their professionalism, dedication, and genuine care " +
        "have been nothing short of extraordinary.",
      body:
        "I want to extend my deepest gratitude to Timothy, Marcie, and the entire " +
        "team at Dormer Harpring. They not only provided expert legal advice but " +
        "also made me feel supported every step of the way. They truly listen, " +
        "understand, and advocate for their clients with compassion and integrity. " +
        "It's rare to find a firm that balances professionalism with a personal " +
        "touch, and this team does it flawlessly.",
    },
    {
      _key: "kelly-richards",
      name: "Kelly Richards",
      source: "google",
      quote: "I had a great experience with my lawyer and her support staff at Dormer Harpring.",
      body:
        "They were so nice and supportive as well as hard working. I'm the kind of " +
        "person that likes to know what's going on weekly, and I received constant " +
        "and consistent communication from them. Would recommend to anyone that has " +
        "gone through an accident and needs help navigating insurance companies.",
    },
    {
      _key: "josh-bennett",
      name: "Josh Bennett",
      source: "google",
      quote:
        "I had a superior experience having Dormer Harpring represent me in my " +
        "personal injury case.",
      body:
        "They were all very caring with exceptional communication and professional " +
        "knowledge. Julie and Tim both worked extremely hard on my case to get the " +
        "settlement I deserved! Overall a 10/10 experience and I highly recommend them.",
    },
    {
      _key: "nadia-borja",
      name: "Nadia Borja",
      source: "google",
      quote:
        "My attorney and the rest of the team took the time to explain every step " +
        "of the process, making me feel at ease.",
      body:
        "From the moment I inquired, the staff was welcoming and professional. They " +
        "were always available to answer my questions and provided excellent " +
        "guidance throughout my case. The best part is I never had to leave the " +
        "comfort of my home. I truly felt like a valued client.",
    },
    {
      _key: "savannah-graves",
      name: "Savannah Graves",
      source: "google",
      quote: "I highly recommend this firm for anyone in need of legal assistance!",
      body:
        "I had a great experience with Dormer Harpring, LLC. The team is " +
        "professional and knowledgeable, and Abby, in particular, was incredibly " +
        "helpful. Her expertise and attention to detail made everything much easier.",
    },
    {
      _key: "cindy-valentine",
      name: "Cindy Valentine",
      source: "google",
      quote: "Tim, his co-attorneys and staff did a wonderful job getting her deposit returned.",
      body:
        "Tim Garvey represented my sister after her senior living facility refused " +
        "to refund her deposit as well as deducting money from her deposit account. " +
        "Tim and his team did a wonderful job getting her deposit returned as well " +
        "as damages against the corporation taking advantage of its senior residents.",
    },
    {
      _key: "alicia-jones-tabor",
      name: "Alicia Jones Tabor",
      source: "google",
      quote: "What an amazing experience it has been with Dormer Harpring, LLC.",
      body:
        "They have been knowledgeable, caring, and go above and beyond keeping a " +
        "client informed. It has been such a pleasure working with Morgan Hawkins " +
        "and her colleagues. Their entire team of litigators and support staff work " +
        "together to ensure fair settlements for their clients.",
    },
    {
      _key: "michael-harris",
      name: "Michael Harris",
      source: "google",
      quote: "The team is led by top-notch trial lawyers and their staff is fantastic.",
      body:
        "Dormer Harpring is a talented team of true trial lawyers, dedicated to " +
        "actually litigating cases to obtain proper value for their clients' " +
        "hardships. In particular, my experience in working alongside Tim Garvey, " +
        "Sean Dormer, and their team has been exceptional.",
    },
    {
      _key: "collins",
      name: "Chris and Lynn Collins",
      source: "google",
      quote: "Thank you Greg Bentley for your help and guidance in our predicament!",
      body:
        "Greg was to the point, truthful, and did not waste our money. Thank you " +
        "for always being available and answering our questions — and thank you so " +
        "much for going the extra mile for us!",
    },
  ];
}
