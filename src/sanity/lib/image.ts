// Sanity image assets → URLs.
//
// The site's images are moving in two directions at once and this module owns
// one of them. Large DECORATIVE images (page-header photographs, band
// backgrounds, the two logos) stay as `src/assets` imports and keep going
// through Astro's build-time pipeline. Card and interactive images — attorney
// portraits, award badges, practice-area cards, video posters, partner logos,
// everything inside an article body — become Sanity assets and come through
// here instead.
//
// WHY NOT ASTRO'S `<Image>` FOR THESE. Astro can fetch a remote image at build
// time, but there are ~290 of them: that is minutes added to every build, and
// it throws away the hotspot and crop an editor sets in the Studio, because
// Astro re-crops from the original. Sanity's CDN applies the hotspot itself and
// serves the right format by content negotiation. So the Sanity branch builds
// URLs and lets the CDN do the work.
//
// Nothing outside `components/media/Picture.astro` and
// `components/prose/ProseImage.astro` should import this — the wrapper is still
// the one place the site decides how an image is rendered.
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";

const builder = imageUrlBuilder(sanityClient);

/** The `@sanity/image-url` builder for one asset. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Is this a Sanity asset rather than a local import?
 *
 * `ImageMetadata` from `astro:assets` always carries a `src` string; a Sanity
 * image object carries `asset`, and a raw reference string starts with
 * `image-`. Checking for what Sanity has rather than what Astro lacks, so a
 * future Astro field addition cannot silently flip the branch.
 */
export function isSanityImage(src: unknown): src is SanityImageSource {
  if (typeof src === "string") return src.startsWith("image-");
  if (typeof src !== "object" || src === null) return false;
  return "asset" in src || "_ref" in src;
}

/**
 * The asset's intrinsic pixel dimensions, read out of its reference.
 *
 * Sanity encodes them in the id — `image-<hash>-1200x800-jpg` — which is a
 * documented, stable format and the only way to get width and height WITHOUT a
 * second network round trip per image at build time. 290 images is 290 round
 * trips, so this matters.
 *
 * Returns null when the ref is not in that shape, and every caller treats null
 * as "omit the attributes" rather than guessing: a wrong `width`/`height` pair
 * is worse than none, because the browser reserves the wrong box and the layout
 * shifts anyway — with the shift now baked into the markup.
 */
export function imageDimensions(
  source: SanityImageSource
): { width: number; height: number } | null {
  const ref =
    typeof source === "string"
      ? source
      : typeof source === "object" && source !== null
        ? ((source as { asset?: { _ref?: string }; _ref?: string }).asset?._ref ??
          (source as { _ref?: string })._ref)
        : undefined;
  if (!ref) return null;

  const match = /-(\d+)x(\d+)-[a-z]+$/.exec(ref);
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
}

/**
 * The widths a Sanity image is offered at when the caller names none.
 *
 * Astro's `<Image>` with no `widths` emits a single `src` and no srcset, and
 * this branch matches that: `srcSetFor` returns undefined for an empty ladder,
 * so a caller that did not ask for responsive images does not silently get
 * them. This constant is for callers that ask for the default rather than a
 * specific set.
 */
export const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

/**
 * A `srcset` for the given widths, or undefined when there are none.
 *
 * Every candidate is capped at the asset's own intrinsic width. Without the cap
 * a 460px portrait asked for at 1600 would be upscaled by the CDN and ship a
 * file with no more detail than the original — the same mistake the site's
 * prose rule already fixed by moving body images from `width: 100%` to
 * `max-width: 100%`. Duplicates that the cap creates are collapsed, so a small
 * asset offers one candidate rather than four identical ones.
 */
export function srcSetFor(source: SanityImageSource, widths?: number[]): string | undefined {
  if (!widths || widths.length === 0) return undefined;

  const intrinsic = imageDimensions(source)?.width;
  const capped = [...new Set(widths.map((w) => (intrinsic ? Math.min(w, intrinsic) : w)))].sort(
    (a, b) => a - b
  );

  return capped.map((w) => `${urlFor(source).width(w).auto("format").url()} ${w}w`).join(", ");
}

/**
 * The single `src` a Sanity image falls back to.
 *
 * The largest candidate the ladder offers, so a browser with no srcset support
 * — and any context that reads the attribute directly, like an og:image — gets
 * the best version rather than the smallest.
 */
export function srcFor(source: SanityImageSource, widths?: number[]): string {
  const intrinsic = imageDimensions(source)?.width;
  const largest = widths && widths.length > 0 ? Math.max(...widths) : undefined;
  const width = intrinsic && largest ? Math.min(largest, intrinsic) : (largest ?? intrinsic);

  const image = urlFor(source).auto("format");
  return width ? image.width(width).url() : image.url();
}
