// The /co-counsel page — the firm's pitch to other lawyers.
//
// SANITY: reads the `coCounselPage` singleton. The seven results beneath it are
// `caseResult` documents — six of them appear on /results in the same words, so
// they are one record rendered twice.
//
// The page header and the partnership band's photograph are still local
// imports; `aboutPage.ts` has the reasoning, and it is the same call on all
// eight pages that carry one.
import type { ImageMetadata } from "astro";
import type { PortableTextBlock } from "./portableText";
import type { CaseResult } from "./caseResults";
import { sanityClient } from "sanity:client";
import { CO_COUNSEL_PAGE_QUERY, CO_COUNSEL_RESULTS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import heroPhoto from "../assets/cocounsel/hero.jpg";
import heroCrop from "../assets/cocounsel/hero-crop.jpg";
import duoPhoto from "../assets/cocounsel/duo.jpg";

export interface CoCounselArea {
  _key: string;
  label: string;
  href: string;
}

export interface CoCounselPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  /** The narrow-viewport crop — see `PageHeader`'s `photoMobile`. */
  photoMobile: ImageMetadata;
  photoAlt: string;
  ctaLabel: string;
  ctaNote: string;

  partnership: {
    eyebrow: string;
    title: string;
    /** Two paragraphs with the callout card between them. */
    intro: PortableTextBlock[];
    /** The pull-out figure. `**bold**` marks the amount. */
    callout: PortableTextBlock[];
    terms: PortableTextBlock[];
    photo: ImageMetadata;
    photoAlt: string;
  };

  results: { eyebrow: string; title: string; lede: string };

  areas: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
    items: CoCounselArea[];
  };

  form: {
    title: string;
    lede: string;
    requiredNote: string;
    submitLabel: string;
    disclaimer: string;
  };
}

export async function getCoCounselPage(): Promise<CoCounselPage> {
  const copy = await once("coCounselPage", async () =>
    required(await sanityClient.fetch(CO_COUNSEL_PAGE_QUERY), "Co-Counsel", "Pages")
  );

  return {
    ...copy,
    lede: copy.lede as PortableTextBlock[],
    // The page header and the partnership band's photograph are local imports,
    // like every other page's — see the note in `aboutPage.ts`.
    photo: heroPhoto,
    photoMobile: heroCrop,
    photoAlt: "Sean Dormer and K.C. Harpring in the Colorado mountains",
    partnership: {
      ...copy.partnership,
      intro: copy.partnership.intro as PortableTextBlock[],
      callout: copy.partnership.callout as PortableTextBlock[],
      terms: copy.partnership.terms as PortableTextBlock[],
      photo: duoPhoto,
      photoAlt: "Sean Dormer and K.C. Harpring",
    },
  };
}

/**
 * The seven results the firm won alongside another firm. A subset of the same
 * shape as `caseResults.ts` — six of these appear there too, in the same words —
 * so they render through the shared ResultCard.
 */
export async function getCoCounselResults(): Promise<CaseResult[]> {
  return once("caseResults:co-counsel", async () =>
    required(await sanityClient.fetch(CO_COUNSEL_RESULTS_QUERY), "Case Results (Co-Counsel)")
  );
}
