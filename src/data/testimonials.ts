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
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import {
  HOME_TESTIMONIALS_QUERY,
  SHARED_SECTIONS_QUERY,
  VIDEO_REVIEWS_QUERY,
  WRITTEN_REVIEWS_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import { WISTIA_POSTER_SIZE, wistiaPosterUrl } from "../lib/video";
// PLACEHOLDER_VIDEO is no longer imported: the stand-in id is DATA in the
// Studio now, so grepping the constant still finds exactly the slots that need
// a real one — and this module is no longer one of them.
import type { VideoRef } from "../lib/video";
import teamPhoto from "../assets/team/skyline.jpg";
import teamCrop from "../assets/team/skyline-crop.jpg";
import evelyn from "../assets/testimonials/evelyn.jpg";
import ben from "../assets/testimonials/ben.jpg";
import joel from "../assets/testimonials/joel.jpg";
import elijah from "../assets/testimonials/elijah.jpg";
import kelly from "../assets/testimonials/kelly.jpg";
import videoCover1 from "../assets/testimonials/video-cover-1.jpg";

/**
 * A filmed card's poster, falling back to the film's own Wistia thumbnail.
 *
 * The poster field is optional in the Studio and every filmed testimonial has
 * one today — but "has one today" is not a guarantee, and the card renders it
 * unconditionally. The attorney rail hit exactly this: a video field that was
 * always filled while it was written down in code, and the first record an
 * editor added without it threw at render.
 *
 * Requiring a poster instead would have been one line, and was rejected for
 * the reason Rhan gave for the bio: nobody should have to upload a still that
 * Wistia already has.
 */
async function posterFor(
  poster: unknown,
  video: { id?: string | null } | null | undefined
): Promise<{ poster: unknown; posterSize?: { width: number; height: number } }> {
  if (poster) return { poster };
  const remote = video?.id ? await wistiaPosterUrl(video.id) : null;
  return remote ? { poster: remote, posterSize: WISTIA_POSTER_SIZE } : { poster };
}

export interface VideoTestimonial {
  _key: string;
  kind: "video";
  /** The rail card's popover. Was inert until every slot got the stand-in. */
  video: VideoRef;
  name: string;
  /** Runtime, shown on the poster. */
  length: string;
  /** May be a plain URL — see `posterSize`. */
  poster: ImageMetadata | SanityImageSource | string;
  /** Set only for a REMOTE poster, which `Picture` cannot measure. */
  posterSize?: { width: number; height: number };
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
  const { reviewSummary } = await once("sharedSections", async () =>
    required(await sanityClient.fetch(SHARED_SECTIONS_QUERY), "Shared Sections")
  );
  return {
    count: reviewSummary?.count ?? "",
    rating: reviewSummary?.rating ?? "",
    source: reviewSummary?.source ?? "",
  };
}

/** Alternating video and written, exactly as the comp orders them. */
export async function getHomeTestimonials(): Promise<Testimonial[]> {
  const rows = await once("testimonials:rail", async () =>
    required(await sanityClient.fetch(HOME_TESTIMONIALS_QUERY), "Testimonials")
  );

  // The projection cannot express a discriminated union — GROQ returns one
  // shape with the unused half null — so the split happens here, once, rather
  // than at every call site. `kind` is the CARD's shape; `format` in the Studio
  // is the review's medium. They agree, and the names differ because the
  // component prop predates the field.
  return Promise.all(
    rows.map(async (row): Promise<Testimonial> =>
      row.kind === "video"
        ? {
            _key: row._key!,
            kind: "video",
            name: row.name!,
            length: row.length ?? "",
            video: row.video as VideoRef,
            ...((await posterFor(row.poster, row.video)) as {
              poster: SanityImageSource | string;
              posterSize?: { width: number; height: number };
            }),
          }
          : {
            _key: row._key!,
            kind: "quote",
            name: row.name!,
            headline: row.headline ?? "",
            body: row.body ?? "",
          }
    )
  );
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
  /** May be a plain URL — see `posterSize`. */
  poster: ImageMetadata | SanityImageSource | string;
  /** Set only for a REMOTE poster, which `Picture` cannot measure. */
  posterSize?: { width: number; height: number };
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
  const rows = await once("testimonials:video", async () =>
    required(await sanityClient.fetch(VIDEO_REVIEWS_QUERY), "Testimonials (filmed)")
  );
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      ...(await posterFor(row.poster, row.video)),
    }))
  ) as Promise<VideoReview[]>;
}

/**
 * ONE flat, ordered list. The comp hand-balances these into three literal
 * column arrays; that is a layout decision baked into content, and it breaks
 * the moment the column count changes or an editor adds a review. The columns
 * are rebuilt in the component from this order.
 */
export async function getWrittenReviews(): Promise<WrittenReview[]> {
  const rows = await once("testimonials:written", async () =>
    required(await sanityClient.fetch(WRITTEN_REVIEWS_QUERY), "Testimonials (written)")
  );
  return rows as WrittenReview[];
}
