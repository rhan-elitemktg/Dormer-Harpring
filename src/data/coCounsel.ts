// The /co-counsel page — the firm's pitch to other lawyers.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/coCounsel.ts` and a
// `coCounselPage` singleton.
import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import type { CaseResult } from "./caseResults";
import { sanityClient } from "sanity:client";
import { CO_COUNSEL_RESULTS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import { practiceAreaPath } from "../lib/routePaths";
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
  return {
    eyebrow: "Empowering justice through partnership",
    title: "Co-counsel opportunities.",
    lede: pt(
      "Our collaborative team of trial lawyers is here to help — in Denver, " +
        "across Colorado, and anywhere your client needs a courtroom partner."
    ),
    photo: heroPhoto,
    photoMobile: heroCrop,
    photoAlt: "Sean Dormer and K.C. Harpring in the Colorado mountains",
    ctaLabel: "Contact us today",
    ctaNote: "We shoulder the case costs",

    partnership: {
      eyebrow: "Why partner with us",
      title: "Sometimes it really does take a village.",
      intro: pt(
        "At Dormer Harpring, we put community and partnership first. Whether " +
          "that community starts here in Denver or reaches across the country, we " +
          "care about building connections — and we would be happy to help secure " +
          "the outcome your client deserves."
      ),
      callout: pt(
        "With an average co-counsel settlement value of over **$300,000**, we are " +
          "confident we will add value to your case."
      ),
      terms: pt(
        "We are committed to working with you to determine an equitable fee split " +
          "that suits all parties, and we are prepared to shoulder the case costs. " +
          "Since we will be splitting the fee, it is most beneficial for everyone " +
          "that the case have at least a $200,000 settlement value or projected " +
          "damages."
      ),
      photo: duoPhoto,
      photoAlt: "Sean Dormer and K.C. Harpring",
    },

    results: {
      eyebrow: "DH co-counsel results",
      title: "What partnership has produced.",
      lede: "Prior results do not guarantee a similar outcome in your client's case.",
    },

    areas: {
      eyebrow: "Practice areas",
      title: "Where we can help.",
      ctaLabel: "View all areas",
      items: [
        { _key: "car", label: "Car Accidents", href: practiceAreaPath("denver-car-accident-lawyer") },
        {
          _key: "motorcycle",
          label: "Motorcycle Accidents",
          href: practiceAreaPath("motorcycle-accident-lawyer-denver"),
        },
        {
          _key: "trucking",
          label: "Trucking Accidents",
          href: practiceAreaPath("denver-truck-accident-lawyer"),
        },
        {
          _key: "premises",
          label: "Premises Liability",
          href: practiceAreaPath("denver-premises-liability-lawyer"),
        },
        { _key: "dog", label: "Dog Bites", href: practiceAreaPath("denver-dog-bite-lawyer") },
        {
          _key: "brain",
          label: "Brain Injuries",
          href: practiceAreaPath("denver-brain-injury-lawyer"),
        },
        {
          _key: "pedestrian",
          label: "Pedestrian Accidents",
          href: practiceAreaPath("denver-pedestrian-accident-lawyer"),
        },
        {
          _key: "bicycle",
          label: "Bicycle Accidents",
          href: practiceAreaPath("denver-bicycle-accident-lawyer"),
        },
        {
          _key: "wrongful-death",
          label: "Wrongful Death",
          href: practiceAreaPath("denver-wrongful-death-lawyer"),
        },
        // TODO(launch): the last two have no page on the live site. They link to
        // the hub until one exists — a dead link is worse than a general one.
        { _key: "bad-faith", label: "Insurance Bad Faith", href: practiceAreaPath("practice-areas") },
        { _key: "product", label: "Product Liability", href: practiceAreaPath("practice-areas") },
      ],
    },

    form: {
      title: "Refer a case.",
      lede:
        "Request a no-obligation case evaluation. We'll tell you honestly whether " +
        "we can add value.",
      requiredNote: "All fields required",
      submitLabel: "Submit case for review",
      disclaimer: "Submitting this form does not create an attorney-client relationship.",
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
