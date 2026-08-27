// Award badges for the trust bar.
//
// SANITY: reads the `award` collection, ordered by its `order` field. A
// collection of documents has no inherent order, so the band's — which is the
// comps' own — is explicit rather than incidental.
//
// THE IMAGE LIVES ON THE RECORD, beside its alt text, and that is not filing
// tidiness. Splitting them is how a badge ends up captioned as the one next to
// it, and it has already happened once here: every comp captions the first four
// badges in an order the artwork does not match, and the mislabelling was
// copied across all fourteen pages before anyone read the images.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { AWARDS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

export interface Award {
  _key: string;
  /**
   * `ImageMetadata` was the local-import form; these are Sanity assets now.
   * The union stays because `Picture.astro` takes either and the callers do
   * not care which they were handed — which is the whole point of the wrapper.
   */
  image: ImageMetadata | SanityImageSource;
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
 * fourteen pages. The rendered ORDER is unchanged; only the descriptions are
 * corrected, so a screen reader and Google stop being told the firm holds four
 * awards in the wrong order. The corrected text is in the Studio now — do not
 * "fix" it back against a comp.
 */
export async function getAwards(): Promise<Award[]> {
  const awards = await once("awards", async () =>
    required(await sanityClient.fetch(AWARDS_QUERY), "Awards")
  );
  return awards as Award[];
}
