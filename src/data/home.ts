// Homepage content.
//
// SANITY: the hero, the firm introduction and the promise carousel are fields
// on the `homePage` singleton; Why Us is on `sharedSections`, because Practice
// Areas renders that band word for word. The three case results are their own
// collection.
//
// Two rules this file follows, both learned the hard way on the last build:
//  - No component holds its own copy of any of this. Components take props;
//    the page fetches. Private component-level arrays drift out of sync with
//    the data module and nobody notices until migration.
//  - Nothing here is a hex code, a style string, or SVG markup. The comps'
//    `renderVals()` carried plenty of those on its derived view-models; they
//    are re-derived in CSS instead, because no editor will ever type one.
//
// ONE QUERY FOR THREE OF THE FOUR PAGE-COPY GETTERS. `homeCopy()` projects the
// hero, the introduction and the carousel together, the way
// `practiceAreasDocument()` serves two getters in `practiceAreas.ts`. `once()`
// makes it one round trip per build either way; what it buys is one projection
// to keep in step rather than three.
//
// THE REST OF THE HOMEPAGE'S COPY IS NOT HERE, and that is deliberate: the
// practice band is in `practiceAreas.ts`, the FAQ band in `faqs.ts`, the feed
// in `news.ts` and the mosaic heading in `community.ts`. Each of those modules
// already owns the list underneath its heading, and a heading filed away from
// its list is how the two drift.

import type { CaseResult } from "./caseResults";
import type { PortableTextBlock } from "./portableText";
import { sanityClient } from "sanity:client";
import { HOME_COPY_QUERY, HOME_RESULTS_QUERY, SHARED_SECTIONS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { VideoRef } from "../lib/video";

export interface HomeHero {
  eyebrow: string;
  /** One entry per rendered line — the comp breaks after "All in." */
  headline: string[];
  lede: string;
  primaryCta: { label: string; href: string };
  /** The hero's "Watch our video" affordance. `video` is a reference, never a
   *  URL — `src/lib/video.ts` is the only place one gets built, so re-hosting
   *  is a change to `provider` here and nothing else. */
  videoCta: { label: string; video: VideoRef };
}

export interface HomeStat {
  _key: string;
  big: string;
  label: string;
}

/** The `homePage` singleton's own copy, read once per build for three getters. */
function homeCopy() {
  return once("homePage:copy", async () =>
    required(await sanityClient.fetch(HOME_COPY_QUERY), "Homepage", "Pages")
  );
}

/** The `sharedSections` singleton. Shared with whatever else lands on it. */
function shared() {
  return once("sharedSections", async () =>
    required(await sanityClient.fetch(SHARED_SECTIONS_QUERY), "Shared Sections")
  );
}

/** The awards bar's label — one line, on nearly every page of the site. */
export interface AwardsBarCopy {
  eyebrow: string;
}

/**
 * A PROP DEFAULT UNTIL PHASE 6a. `AwardsBar.astro` declared
 * `eyebrow = "Recognized & awarded"` in its own props and no caller ever
 * overrode it, so the string was content living in a component — invisible to
 * the readiness sweep, which looked for arrays.
 *
 * On `sharedSections` rather than the Homepage because the bar renders on the
 * homepage, About, Thank You, the three utility pages and all 290 pages
 * `[slug].astro` serves. One record, changed once.
 */
export async function getAwardsBar(): Promise<AwardsBarCopy> {
  const { awardsBar } = await shared();
  return awardsBar;
}

/** The testimonial rail's heading and button. */
export interface TestimonialRailCopy {
  eyebrow: string;
  title: string;
  ctaLabel: string;
}

/**
 * Also markup until Phase 6a — `TestimonialRail.astro` carried its own eyebrow,
 * heading and button label.
 *
 * Three callers render it under this heading: the homepage, all 26 attorney
 * bios and the Car Accidents page. The About page renders the same records
 * under its OWN heading, from `aboutPage`, which is exactly the case the
 * shared-vs-page split exists to serve.
 */
export async function getTestimonialRail(): Promise<TestimonialRailCopy> {
  const { testimonialRail } = await shared();
  return testimonialRail;
}

export async function getHomeHero(): Promise<HomeHero> {
  const { hero } = await homeCopy();
  return hero;
}

export async function getHomeStats(): Promise<HomeStat[]> {
  const { heroStats } = await homeCopy();
  return heroStats;
}

/**
 * The three results the homepage leads with. The TYPE and the full list live in
 * `caseResults.ts` — these are the same cases in different words, and the note
 * there covers reconciling the two at the Sanity phase.
 */
export async function getRecentResults(): Promise<CaseResult[]> {
  return once("caseResults:home", async () =>
    required(await sanityClient.fetch(HOME_RESULTS_QUERY), "Case Results (Homepage)")
  );
}

/** The results strip's own copy — the heading and the link out of it. */
export interface HomeResultsStrip {
  title: string;
  ctaLabel: string;
}

/**
 * The band's copy, which the COMPONENT used to own.
 *
 * "Outstanding results." and "See all results" were markup in
 * `home/RecentResults.astro` — a component owning content, which this
 * codebase's first rule forbids and which the Sanity readiness sweep missed
 * because it looked for content ARRAYS in component frontmatter.
 *
 * The three figures stay a collection: they render on /results too.
 */
export async function getResultsStrip(): Promise<HomeResultsStrip> {
  const { resultsStrip } = await homeCopy();
  return resultsStrip;
}

export interface WhyPoint {
  _key: string;
  /** One entry per rendered line — the comp hard-breaks each card title. */
  title: string[];
  body: string;
}

export interface HomeWhyUs {
  eyebrow: string;
  /** Two-part heading; `accent` renders gold beneath `lead`. */
  title: { lead: string; accent: string };
  lede: string;
  points: WhyPoint[];
  ctaLabel: string;
}

/**
 * "Why choose Dormer Harpring?" — and it is on `sharedSections`, not on
 * `homePage`, because Practice Areas renders the same band word for word.
 *
 * KEPT IN THIS MODULE UNDER ITS ORIGINAL NAME so no call site moves, which is
 * the property the whole migration is built on. `practice-areas.astro` imports
 * `getHomeWhyUs` from here and its own comment explains why: the copy is shared,
 * not copied, and if the two pages ever need to differ the fix is a second field
 * on the page that diverges.
 */
export async function getHomeWhyUs(): Promise<HomeWhyUs> {
  const { whyUs } = await shared();
  return required(whyUs, "Shared Sections → Why choose us band");
}

export interface PromiseSlide {
  _key: string;
  label: string;
  body: string;
}

export interface HomePromise {
  eyebrow: string;
  title: string;
  slides: PromiseSlide[];
  ctaLabel: string;
}

/**
 * The comp's `promisesData` carries an `href` per slide and the derived
 * `promiseSlides` adds `num`/`total`; no markup renders any of the three, so
 * none of them is a field. Labels are stored in sentence case, since the caps
 * are `text-transform` in CSS.
 */
export async function getHomePromise(): Promise<HomePromise> {
  const { promise } = await homeCopy();
  return promise;
}

export interface HelpPoint {
  _key: string;
  /** Rendered bold, ahead of the detail. */
  lead: string;
  text: string;
}

export interface HomeFirmIntro {
  /** One entry per rendered line, same as the hero's headline. */
  title: string[];
  /** The Newsreader italic line carrying the hand-drawn underline. */
  tagline: string;
  body: PortableTextBlock[];
  helpTitle: string;
  helpPoints: HelpPoint[];
  videoLabel: string;
  /** The firm film. Still the stand-in id — but it is a FIELD in the Studio
   *  now, so replacing it is an editor's job rather than a code change. The
   *  marker for it lives on that field, in `schemaTypes/pages/homePage.ts`. */
  video: VideoRef;
  quote: { text: string; name: string; role: string };
  aside: { title: string; text: string; ctaLabel: string };
}

export async function getHomeFirmIntro(): Promise<HomeFirmIntro> {
  const { firmIntro } = await homeCopy();
  return {
    ...firmIntro,
    // The cast is on its own line rather than over the whole object: a
    // projection's `SimpleText` and this module's `PortableTextBlock[]` are the
    // same blocks under two names, and casting the object would hide a real
    // mismatch in any of the eight fields around it.
    body: firmIntro.body as PortableTextBlock[],
  };
}
