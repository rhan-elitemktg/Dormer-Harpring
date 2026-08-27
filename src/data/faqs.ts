// The two hand-authored FAQ accordions — the homepage's eight and Car
// Accidents' twelve.
//
// EACH IS AN ARRAY ON ITS OWN PAGE DOCUMENT, not a shared collection, since
// Phase 2f. They were one `faq` collection split by a `shownOn` radio, and the
// argument for that was the 28 imported practice-area accordions — 153 items,
// counted by the import rather than estimated. Those are not `faq` documents:
// they live in `src/content/practice-areas/`, arrive with the body copy (they
// are not in `content.rendered` either — see scripts/import-practice-areas.mjs)
// and are read through `practiceAreaPages.ts`. So nothing was shared, and a
// Collection is for content reused in more than one place.
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
 * PAGE COPY, NOT A COLLECTION, WHICH REVERSES WHAT THIS COMMENT USED TO SAY. It
 * argued that 28 of the 104 imported practice-area pages carry their own
 * accordion, so an FAQ belongs to a practice area — but those 28 are not in
 * Sanity at all: they arrive with the body copy in `src/content/practice-areas/`
 * and are read through `practiceAreaPages.ts`. Nothing was ever shared, and the
 * `shownOn` radio holding the collection together existed only to take it apart
 * again. The next detail page gets a field on its own document.
 */
export async function getCarAccidentFaqs(): Promise<Faq[]> {
  return once("faqs:car-accidents", async () =>
    required(
      await sanityClient.fetch(CAR_ACCIDENT_FAQS_QUERY),
      "Car Accidents",
      "Pages"
    )
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
    required(await sanityClient.fetch(HOME_FAQS_QUERY), "Homepage", "Pages")
  );
}
