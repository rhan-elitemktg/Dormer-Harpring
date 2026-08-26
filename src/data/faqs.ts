// Homepage FAQ.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/faqs.ts`. These become
// `faq` documents; 28 of the 104 imported practice-area pages carry their own
// accordion, so this is a collection rather than page-local copy. That figure
// was "65 of 98" while it was an estimate off the scrape — the import counted
// them: 28 pages, 153 items. The accordion is not in `content.rendered`, which
// is why guessing was ever necessary; see scripts/import-practice-areas.mjs.
//
// The answers stay plain strings rather than Portable Text on purpose: they
// also feed FAQPage structured data, which takes a string, and an answer with
// headings or lists inside it would not be valid there. If they ever need rich
// text, `lib/portableText.ts` gets a toPlainText() for the JSON-LD side.
import type { ImageMetadata } from "astro";
import { sanityClient } from "sanity:client";
import { CAR_ACCIDENT_FAQS_QUERY, HOME_FAQS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import seanDormer from "../assets/attorneys/attorney-2.jpg";
import { ROUTES } from "../lib/routePaths";
// PLACEHOLDER_VIDEO is no longer imported here: the ids are fields in the
// Studio now, and every FAQ still carries the stand-in one as DATA rather
// than as a constant. Grep PLACEHOLDER_VIDEO to find the slots that still
// need a real id — this module is no longer one of them.
import type { VideoRef } from "../lib/video";

export interface Faq {
  _key: string;
  question: string;
  answer: string;
  /** Runtime of the attorney video that answers it. */
  videoLength: string;
  /** TODO(video): the attorney's filmed answer. Every FAQ still carries the
   *  same stand-in id — but it is a FIELD in the Studio now, so replacing them
   *  is an editor's job rather than a code change. */
  video: VideoRef;
}

export interface FaqSection {
  eyebrow: string;
  title: string;
  lede: string;
  answerCtaLabel: string;
  ask: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    portrait: ImageMetadata;
    portraitAlt: string;
  };
}

export async function getFaqSection(): Promise<FaqSection> {
  return {
    eyebrow: "What you should know",
    title: "Answers, straight from your attorney.",
    lede:
      "The questions we hear most — expand any one to read the answer and watch a " +
      "short video from the attorney who would handle your case.",
    answerCtaLabel: "Speak with a lawyer",
    ask: {
      title: "Have a question you don't see?",
      body: "We're happy to help. Reach out and Sean will point you in the right direction.",
      ctaLabel: "Get in touch",
      ctaHref: ROUTES.contact,
      portrait: seanDormer,
      portraitAlt: "Sean Dormer, Founding Partner",
    },
  };
}

/**
 * The Car Accidents page's accordion.
 *
 * THE SAME TYPE, not a second one. `lawQuestionsData` in that comp is twelve
 * `{q, a}` pairs with a parallel `faqLens` array of reading times beside it —
 * which is this `Faq` shape with the two halves kept apart, and the reason the
 * homepage's is one object per row. So the comp's twelve rows drop straight in,
 * `FaqBand` and `FaqItem` render them unchanged, and `faqSchema` marks them up
 * for free. That answers the question HANDOFF.md left open.
 *
 * A collection rather than page copy for the reason the note at the top of this
 * file gives: 28 of the 104 imported practice-area pages carry their own
 * accordion, so a `faq` document belongs to a practice area, and the next
 * detail page adds a `getXFaqs()` here rather than a field on its own document.
 */
export async function getCarAccidentFaqs(): Promise<Faq[]> {
  return once("faqs:car-accidents", async () =>
    required(await sanityClient.fetch(CAR_ACCIDENT_FAQS_QUERY), "FAQs (Car Accidents)")
  );
}

/**
 * The band's own copy on the Car Accidents page. Different eyebrow, heading and
 * lede from the homepage's — the accordion sits after ten sections that have
 * already answered the big questions, and its heading says so ("OTHER questions
 * people ask us").
 *
 * The ask card is the homepage's word for word, so it reads from
 * `getFaqSection()` rather than being retyped. Only `ctaHref` differs: this
 * page carries its own contact section, so the button scrolls rather than
 * navigating away mid-page.
 */
export async function getCarAccidentFaqSection(anchor: string): Promise<FaqSection> {
  const home = await getFaqSection();
  return {
    ...home,
    eyebrow: "What you should know",
    title: "Other questions people ask us",
    lede:
      "Expand any question to read the answer and watch a short video from the attorney " +
      "who would handle your case.",
    ask: { ...home.ask, ctaHref: anchor },
  };
}

export async function getHomeFaqs(): Promise<Faq[]> {
  return once("faqs:home", async () =>
    required(await sanityClient.fetch(HOME_FAQS_QUERY), "FAQs (Homepage)")
  );
}
