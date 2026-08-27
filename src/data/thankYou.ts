// The /thank-you page — where the consultation form lands after a successful
// submit.
//
// SANITY: reads the `thankYouPage` singleton.
//
// The three reassurances duplicate the ones on the homepage's consultation band
// rather than sharing a module. That is deliberate: they are two different
// singletons in the CMS, and an editor changing what a visitor is promised
// *before* submitting should not silently change what they are told *after*.
//
// THE LEDE IS THE ONE FIELD HERE THAT STORES A DERIVED VALUE. It carries the
// firm's phone number twice — once as text and once inside a `tel:` href —
// because the sentence needs a real link mid-flow and Portable Text is how a
// link gets into a sentence. Everywhere else on this site the number is read
// from `firmDetails` at render time, so this is a genuine second copy of it,
// and `scripts/check-phone.py` is what stops the two disagreeing: it fails when
// any `tel:` in the built site is not the firm's own number.
import type { ImageMetadata } from "astro";
import { sanityClient } from "sanity:client";
import { THANK_YOU_PAGE_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";
// The firm portrait above the Denver skyline. The comp ships its own crop of
// this frame, a couple of percent tighter than the homepage hero's; they are
// the same photograph from the same shoot, so five pages share one asset
// rather than carrying five near-identical six-megabyte sources.
//
// A local import, like every other band photograph and page header — see the
// note in `aboutPage.ts` for why the art did not move with the copy.
import teamPhoto from "../assets/team/skyline.jpg";

export interface ThankYouCta {
  _key: string;
  label: string;
  href: string;
}

export interface ThankYouPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  /** The "While you wait" panel below the header. */
  panel: {
    eyebrow: string;
    /** One entry per rendered line — the comp breaks it deliberately. */
    title: string[];
    lede: string;
    image: ImageMetadata;
    imageAlt: string;
    reassurances: string[];
    ctas: ThankYouCta[];
  };
}

export async function getThankYouPage(): Promise<ThankYouPage> {
  const copy = await once("thankYouPage", async () =>
    required(await sanityClient.fetch(THANK_YOU_PAGE_QUERY), "Thank You", "Pages")
  );

  return {
    ...copy,
    lede: copy.lede as PortableTextBlock[],
    panel: {
      ...copy.panel,
      image: teamPhoto,
      imageAlt: "The Dormer Harpring attorneys above the Denver skyline",
    },
  };
}
