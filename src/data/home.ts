// Homepage content.
//
// SANITY SWAP POINT. Every export here is shaped as the future
// `src/sanity/lib/homePage.ts` will project it: flat, pre-coalesced, and free
// of presentation. When the CMS phase lands, each function body becomes a
// `sanityClient.fetch(...)` and index.astro's import line changes — nothing
// else moves.
//
// Two rules this file follows, both learned the hard way on the last build:
//  - No component holds its own copy of any of this. Components take props;
//    the page fetches. Private component-level arrays drift out of sync with
//    the data module and nobody notices until migration.
//  - Nothing here is a hex code, a style string, or SVG markup. The comps'
//    `renderVals()` carried plenty of those on its derived view-models; they
//    are re-derived in CSS instead, because no editor will ever type one.

import { pt, type PortableTextBlock } from "./portableText";
import { practiceAreaPath } from "../lib/routePaths";
import { PLACEHOLDER_VIDEO, type VideoRef } from "../lib/video";

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

export async function getHomeHero(): Promise<HomeHero> {
  return {
    eyebrow: "Denver Personal Injury Attorneys",
    headline: ["All in.", "Every case."],
    lede:
      "When you're hurt, everything changes. We take on fewer cases — so yours " +
      "gets our full attention, and our full fight.",
    primaryCta: { label: "Talk to a lawyer", href: practiceAreaPath("contact") },
    videoCta: {
      label: "Watch our video",
      /* "Dormer Harpring - Who We Are", 3:20, 1080p — the same film that is
         public on the firm's YouTube channel as `p3nycI7XqbI`, now re-hosted.
         Wistia's player colour for this account is already #151e19, which is
         this site's own --dh-forest-600. */
      video: { provider: "wistia", id: "b4n3r4pchd" },
    },
  };
}

export async function getHomeStats(): Promise<HomeStat[]> {
  return [
    { _key: "recovered", big: "$70M+", label: "Recovered" },
    { _key: "years", big: "20 Years", label: "in Denver" },
    { _key: "fee", big: "No Fee", label: "Unless we win" },
    { _key: "travel", big: "We Come", label: "To you" },
  ];
}

/**
 * The three results the homepage leads with. The TYPE and the full list live in
 * `caseResults.ts` — these are the same cases in different words, and the note
 * there covers reconciling the two at the Sanity phase.
 */
export async function getRecentResults(): Promise<CaseResult[]> {
  return [
    {
      _key: "kingsoopers",
      tag: "Slip & Fall",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$250K",
      recovered: "$2.1M",
      story:
        "King Soopers disputed liability and offered $250K. A Boulder jury awarded " +
        "our client $1.77M — resolved at $2.1M with interest and costs.",
    },
    {
      _key: "disputed-crash",
      tag: "Car Accident",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$250K",
      recovered: "$669K",
      story:
        "The insurer offered $250K on a disputed crash. We took it to a jury and " +
        "won a $668,642 judgment for our client.",
    },
    {
      _key: "low-speed",
      tag: "Low-Speed Collision",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$15K",
      recovered: "$263K",
      story:
        "A low-speed crash the insurer valued at just $15K. The jury awarded " +
        "$263,121 — roughly 17× the offer.",
    },
  ];
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

export async function getHomeWhyUs(): Promise<HomeWhyUs> {
  return {
    eyebrow: "The Dormer difference",
    title: { lead: "Why choose", accent: "Dormer Harpring?" },
    lede:
      "The difference between a quick settlement and the full amount you deserve " +
      "comes down to who is in your corner.",
    points: [
      {
        _key: "fewer-cases",
        title: ["Fewer cases,", "full attention"],
        body:
          "We carry a fraction of a volume firm's caseload, so yours never becomes " +
          "a file number in a queue.",
      },
      {
        _key: "trial-lawyers",
        title: ["Trial lawyers,", "not mills"],
        body:
          "Insurers know we'll take a case to a jury and win 98% of them. That " +
          "credibility drives their offers higher.",
      },
      {
        _key: "experienced",
        title: ["Experienced", "trial lawyer"],
        body:
          "We build every case to be tried, not just settled — and insurers price " +
          "cases accordingly.",
      },
      {
        _key: "two-decades",
        title: ["Two decades in", "Denver courts"],
        body:
          "20+ years trying injury cases in Denver. We know the local judges, " +
          "juries, and defense firms, and how they value a case like yours.",
      },
    ],
    ctaLabel: "Request a free consultation",
  };
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
 * `promiseSlides` adds `num`/`total`; no markup renders any of the three.
 * Labels are also half-shouted there ("WE'LL Walk you through every step") —
 * stored in sentence case here, since the caps are `text-transform` in CSS.
 */
export async function getHomePromise(): Promise<HomePromise> {
  return {
    eyebrow: "The promise",
    title: "What you can expect working with us.",
    slides: [
      {
        _key: "walk-through",
        label: "We'll walk you through every step",
        body:
          "You will always know exactly where your case stands. We explain each " +
          "decision in plain English, return your calls the same day, and never let " +
          "you feel lost in the process.",
      },
      {
        _key: "take-stress",
        label: "We take the stress off your plate",
        body:
          "From medical bills to insurance adjusters and mountains of paperwork, we " +
          "handle the parts that keep clients up at night — so you can put your " +
          "energy into healing.",
      },
      {
        _key: "fight",
        label: "We'll fight relentlessly for your family",
        body:
          "We prepare every case as if it is going to trial. Insurers know we will " +
          "not settle for less than your claim is worth, and that pressure is what " +
          "drives full-value results.",
      },
    ],
    ctaLabel: "Request a free consultation",
  };
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
  /** TODO(video): the firm film. PLACEHOLDER_VIDEO until a real id lands. */
  video: VideoRef;
  quote: { text: string; name: string; role: string };
  aside: { title: string; text: string; ctaLabel: string };
}

export async function getHomeFirmIntro(): Promise<HomeFirmIntro> {
  return {
    title: ["Denver's boutique", "personal injury law firm."],
    tagline: "Fewer cases. All in on every one.",
    body: pt(
      "Injuries are never planned. They arrive with hospital bills, lost income, and " +
        "a life that suddenly looks different. We understand how much is riding on " +
        "your recovery — and **you don't have to face the insurance companies alone.**",
      "When you're hurt and scared, the last thing you need is to feel like a case " +
        "number. Dormer Harpring stays small on purpose — so when you call, you reach " +
        "a named partner, not a stranger. **Your fight becomes our fight,** all the " +
        "way to the final check.",
      "In the days after a crash, the insurance company is often already calling — " +
        "angling for a recorded statement and a fast, low offer before anyone knows " +
        "how badly you're hurt. **You don't have to talk to them.** Make one call to " +
        "us, and we take every conversation from there."
    ),
    helpTitle: "How can we help?",
    helpPoints: [
      {
        _key: "mess",
        lead: "We handle the mess.",
        text: "So you can focus on getting better — we deal with the paperwork, calls, and liens.",
      },
      {
        _key: "straight",
        lead: "Straight talk, always.",
        text: "Real answers from your attorney — never a sales pitch.",
      },
      {
        _key: "trial",
        lead: "An experienced trial lawyer, not just a settlement lawyer.",
        text: "We prepare every case to be tried — insurers know it.",
      },
      {
        _key: "care",
        lead: "Care now, not later.",
        text: "We help you get treatment right away, even before a settlement.",
      },
    ],
    videoLabel: "Watch our firm video",
    video: PLACEHOLDER_VIDEO,
    quote: {
      text:
        "You focus on getting better. We'll handle the insurance company, the " +
        "paperwork, and the phone calls — and you'll always reach me, never a case number.",
      name: "KC Harpring",
      role: "Founding Partner",
    },
    aside: {
      title: "Can we help? We're here.",
      text: "Free case review, available 24/7. No fee unless we win.",
      ctaLabel: "Get a free consultation",
    },
  };
}
