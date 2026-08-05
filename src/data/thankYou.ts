// The /thank-you page — where the consultation form lands after a successful
// submit.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/thankYou.ts` and a
// `thankYouPage` singleton.
//
// The three reassurances duplicate the ones on the homepage's consultation band
// rather than sharing a module. That is deliberate: they are two different
// singletons in the CMS, and an editor changing what a visitor is promised
// *before* submitting should not silently change what they are told *after*.
import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import { getFirmDetails } from "./site";
import { ROUTES } from "../lib/routePaths";
// The firm portrait above the Denver skyline. The comp ships its own crop of
// this frame, a couple of percent tighter than the homepage hero's; they are
// the same photograph from the same shoot, so five pages share one asset
// rather than carrying five near-identical six-megabyte sources.
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
  const firm = await getFirmDetails();

  return {
    eyebrow: "Message received",
    title: "Thank you.",
    // Rich text rather than a plain string so the phone number can be a real
    // `tel:` link inside the sentence. The number still comes from firmDetails,
    // so the launch-day swap to a tracking number remains a single edit.
    lede: pt(
      "We've got your request. An attorney will reach out within one business " +
        `day — often much sooner. If it's urgent, call us anytime at ` +
        `[${firm.phone}](tel:${firm.phoneE164}).`
    ),
    panel: {
      eyebrow: "While you wait",
      title: ["All in.", "Every case."],
      lede:
        "We take on fewer cases so every client gets our full attention — and " +
        "we prepare each one as if it is going to a jury. That is why insurers " +
        "pay full value, not their opening number.",
      image: teamPhoto,
      imageAlt: "The Dormer Harpring attorneys above the Denver skyline",
      reassurances: [
        "Free & completely confidential",
        "No fee unless we win",
        "We come to you — home or hospital",
      ],
      ctas: [
        { _key: "attorneys", label: "Meet our attorneys", href: ROUTES.attorneys },
        { _key: "results", label: "See our results", href: ROUTES.results },
      ],
    },
  };
}
