// The practice-area DETAIL page — Car Accidents.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/practiceAreaDetails.ts`.
// These become `practiceAreaDetail` documents. `getPracticeAreaDetails()`
// returns an ARRAY of one because the future GROQ query is
// `*[_type == "practiceAreaDetail"]` and `src/pages/[slug].astro` walks it to
// build paths — the same contract `getBlogPostArticles()` holds.
//
// BUILT FROM THE SECOND DESIGN OF THIS PAGE. The first was 31 sections, 23
// `sc-for` loops and 105 placeholders; this one is 17 sections, 10 loops and 75.
// Nine sections were cut outright (the glove-box card, the four long insurance
// Q&As, the damages grid, the adjuster-tactics band, the cost and court
// answers, the evidence band, the venue list), three were replaced by teasers
// pointing at articles, and two are new.
//
// ITS `renderVals()` STILL DEFINES FIFTEEN ARRAYS THE MARKUP NO LONGER USES —
// `keyPoints`, `crashSteps`, `leadAttorneys`, `otherAttorneys`, `processSteps`,
// `injuries`, `damageCols`, `faultBranches`, `denverData`, `corridors`,
// `courts`, `relatedAreas`, `relatedArticles`, `firmData`, `lawCtas`. They are
// the previous design's content, left behind. Several of them are close enough
// to the new copy to look authoritative and are not: `denverData` has four
// figures where the page draws three, `corridors` carries a completely
// different sentence per road, and `firmData`'s third label reads "Share of
// calls we tell to skip hiring a lawyer" where the page says "Of callers we
// tell they don't need a lawyer".
//
// SO: WHAT THE MARKUP RENDERS IS THE SOURCE, and a live array is only a source
// where a `{{ }}` placeholder actually reads it. `AGENTS.md` says to read the
// comp's script block rather than its markup; on this page you need both, and
// where they disagree the markup wins. `scripts/diff-comp-car-accidents.py`
// checks it that way round.
//
// SIX BANDS ARE THIS SITE'S, NOT THIS PAGE'S, and their strings live in their
// own modules: the testimonials rail (`testimonials.ts`), the awards row
// (`awards.ts`), the FAQ accordion (`faqs.ts`), and the contact form and info
// cards (`contact.ts` / `site.ts`), plus the header and footer.
import type { ImageMetadata } from "astro";
import { ROUTES, attorneyPath } from "../lib/routePaths";
import heroPhoto from "../assets/practice/car-accident-hero.jpg";
import crashVideoCover from "../assets/practice/crash-video-cover.jpg";
import caseVideoCover from "../assets/practice/case-video-cover.jpg";
import whyPhoto from "../assets/practice/why-attorneys-desktop.jpg";
import whyPhotoMobile from "../assets/practice/why-attorneys-mobile.jpg";
import consultPhoto from "../assets/blog/consult.jpg";
import kcHarpring from "../assets/team/kc-harpring-lg.jpg";

/**
 * In-page anchor ids, in one place because two things must agree about them:
 * the section nav's hrefs and the sections' own `id` attributes.
 *
 * NOT run through `lib/headings.ts`'s `headingId()`, which slugifies a
 * heading's text. These are short handles the comp chose (`#lawyers`, not
 * `#meet-our-car-accident-lawyers`), so there is nothing to slugify — and
 * because both sides read this object, the drift that helper exists to prevent
 * cannot happen here either. Do not add a second slugifier for them.
 *
 * `know` moved in the second design: it was the long "who pays my medical
 * bills" section and is now the four-point summary, which is what the nav's
 * "Colorado car accident laws" link has always pointed at.
 */
export const CA_SECTION_IDS = {
  know: "know",
  case: "case",
  lawyers: "lawyers",
  results: "results",
  reviews: "reviews",
  types: "types",
  next: "next",
  contact: "contact",
} as const;

// ---------------------------------------------------------------------------

/** A block of copy with a heading — used by four of the new sections. */
export interface DetailBlock {
  _key: string;
  title: string;
  body: string;
}

/** A statute citation, linked out to the code it cites. */
export interface StatuteSource {
  _key: string;
  label: string;
  note?: string;
  /** Optional: `SourceNote` renders a citation with no href as plain text. */
  href?: string;
}

export interface SourceNote {
  /** "Source:" or "Sources:" — the comp uses both. */
  label: string;
  items: StatuteSource[];
}

/** An inert video poster. Nothing on this page has a real id yet. */
export interface VideoPanel {
  poster: ImageMetadata;
  alt: string;
  title: string;
  length: string;
}

export interface DetailHeroProof {
  _key: string;
  big: string;
  label: string;
  href: string | null;
  /** Renders the Google glyph and five stars beside the figure. */
  google?: boolean;
}

export interface DetailHero {
  trail: { _key: string; label: string; href: string | null }[];
  title: string;
  lede: string;
  proof: DetailHeroProof[];
  ctaLabel: string;
  telLabel: string;
  photo: ImageMetadata;
  photoAlt: string;
  /**
   * The "Reviewed by" line. E-E-A-T signalling, and the reason the page names a
   * specific attorney rather than the firm.
   *
   * THE COMP'S FIVE CREDENTIAL LINES ARE NOT PORTED. It draws a <details>
   * holding "Licensed in Colorado since 2006", the $10M verdict and three
   * awards; by request this is one line and a link to the reviewer's bio
   * instead, and every one of those five facts is already on that bio. Carrying
   * them here as well would put the same claims in two places to verify.
   *
   * TODO(launch): "Updated July 2026" is the comp's date and has to move when
   * the copy is actually reviewed.
   */
  reviewer: {
    name: string;
    role: string;
    photo: ImageMetadata;
    updated: string;
    bioHref: string;
  };
}

export interface TriageRow {
  _key: string;
  /** Drives the pill's colour. A closed set, so it is a token and not a hex. */
  tone?: "money" | "deadline" | "warn";
  tag?: string;
  question: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  stat: { big: string; label: string };
}

export interface TriageSection {
  title: string;
  lede: string;
  video: VideoPanel;
  help: { text: string };
  rows: TriageRow[];
  sources: SourceNote;
}

export interface TakeawaysSection {
  eyebrow: string;
  title: string;
  lede: string;
  items: DetailBlock[];
}

export interface CriteriaSection {
  title: string;
  lede: string;
  video: VideoPanel;
  items: DetailBlock[];
  note: string;
}

export interface LawyersSection {
  title: string;
  lede: string;
  /**
   * The attorneys on the band, each with a line about what they do on crash
   * cases — the comp's four `caLawyers` plus Greg Bentley. `key` is a
   * `TeamMember._key`, which `getTeam()` also uses as the profile slug and
   * turns into an `href`.
   *
   * LENGTH IS OPEN. `LawyerCards` renders these on a rail, so adding or
   * removing one extends or shortens the track; it does not reflow the
   * section the way the comp's four-across grid did.
   *
   * The CREDENTIAL LINE is this page's, not the roster's — it is written about
   * car accident work specifically ("Litigates MedPay and first-party coverage
   * disputes"), which is exactly the kind of per-practice-area copy a detail
   * document owns and `team.ts` cannot.
   */
  attorneys: { _key: string; key: string; cred: string }[];
  moreLabel: string;
  moreHref: string;
}

export interface CredentialsSection {
  eyebrow: string;
  /**
   * `awardKey` indexes `getAwards()`, which owns the artwork AND its alt text.
   *
   * The comp gives each badge a visible caption and a link to the awarding
   * body; both are gone at Rhan's request, so nothing is left for this page to
   * own but the ORDER. The captions are not lost — `getAwards()`'s alt text
   * already says the same thing, and says it more precisely for three of the
   * six ("Avvo Rating 10.0 Superb" against the comp's "Avvo 10.0"). The
   * awarding-body URLs are in git, at 5862578.
   */
  badges: { _key: string; awardKey: string }[];
  disclaimer: string;
}

export interface WhyFirmSection {
  eyebrow: string;
  title: string;
  stats: { _key: string; big: string; label: string }[];
  disclaimer: string;
  columns: { _key: string; n: string; title: string; body: string }[];
  ctaLabel: string;
  ctaHref: string;
  /**
   * TWO CROPS OF THE SAME PHOTOGRAPH, not two resolutions — the section is a
   * side-by-side above 1080px and a stacked band below it, and those are
   * near-square and 16:9 boxes respectively. One source cannot serve both
   * without `cover` throwing away a third of it. `WhyFirm` picks between them
   * with `media`, so this is art direction and both are required.
   */
  photo: ImageMetadata;
  photoMobile: ImageMetadata;
  photoAlt: string;
}

export interface ResultStory {
  _key: string;
  offered: string;
  recovered: string;
  title: string;
  /** Present on the two figure cards; the video card carries a quote instead. */
  story?: string;
  changed?: string;
  /**
   * Set on the one card that is a client video. A key into `getVideoReviews()`
   * in `testimonials.ts`, which already holds that client's portrait, pull
   * quote and verified YouTube id — so the card does not carry a fourth copy of
   * any of them.
   */
  reviewKey?: string;
}

export interface ResultsSection {
  eyebrow: string;
  title: string;
  offeredLabel: string;
  recoveredLabel: string;
  stories: ResultStory[];
  disclaimer: string;
}

export interface TimelineSection {
  title: string;
  lede: string;
  /** The second, forest-coloured paragraph under the lede. */
  ledeStrong: string;
  steps: { _key: string; n: string; title: string; body: string }[];
  phases: { _key: string; title: string; when: string; body: string }[];
  photo: ImageMetadata;
  photoAlt: string;
  points: string[];
}

export interface TileSection {
  title: string;
  lede: string;
  tiles: {
    _key: string;
    name: string;
    body: string;
    linkLabel: string;
    href: string | null;
  }[];
}

export interface DenverSection {
  title: string;
  lede: string;
  stats: { _key: string; big: string; label: string; body: string }[];
  source: string;
  mapCaption: string;
  corridors: { _key: string; name: string; body: string }[];
}

/** The two "here is the short answer, the long one is an article" bands. */
export interface TeaserSection {
  title: string;
  body: string;
  ctaLabel: string;
  /** `null` where the article does not exist yet. */
  ctaHref: string | null;
  /** The checklist teaser's four illustrative cards. */
  steps?: { _key: string; iconKey: string; label: string }[];
  /** The fault teaser's scale labels. */
  scale?: { start: string; middle: string; end: string };
  source?: SourceNote;
}

export interface MoreSection {
  title: string;
  features: {
    _key: string;
    title: string;
    body: string;
    length: string;
    poster: ImageMetadata;
    ctaLabel: string;
    href: string | null;
  }[];
  cards: {
    _key: string;
    title: string;
    body: string;
    ctaLabel: string;
    href: string | null;
  }[];
}

export interface ClosingSection {
  title: string;
  lede: string;
  officeLabel: string;
  mapTitle: string;
}

export interface PracticeAreaDetail {
  _key: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  hero: DetailHero;
  nav: { items: { _key: string; label: string; href: string }[]; ctaLabel: string };
  triage: TriageSection;
  takeaways: TakeawaysSection;
  criteria: CriteriaSection;
  lawyers: LawyersSection;
  credentials: CredentialsSection;
  whyFirm: WhyFirmSection;
  results: ResultsSection;
  timeline: TimelineSection;
  crashTypes: TileSection;
  denver: DenverSection;
  checklistTeaser: TeaserSection;
  faultTeaser: TeaserSection;
  more: MoreSection;
  closing: ClosingSection;
}

const anchor = (id: string) => `#${id}`;

/**
 * Where every statute citation on this page points.
 *
 * TODO(launch): the comp sends all five to the Justia index for the Colorado
 * code rather than to the section each one names, so they all land in the same
 * place. The firm should confirm the deep links — and whether Justia is the
 * source it wants cited at all, against Casetext or the state's own site.
 */
const STATUTE_INDEX = "https://law.justia.com/codes/colorado/";

const carAccidents: PracticeAreaDetail = {
  _key: "car-accidents",
  // The live URL. `practiceAreaPath()` is `/${slug}` — see `routePaths.ts` on
  // why the flat WordPress shape is preserved.
  slug: "denver-car-accident-lawyer",
  // The live page's own <title> is "Denver Car Accident Lawyer | Start Your
  // Claim | Available 24/7" — a WordPress SEO plugin string. `lib/seo.ts`
  // appends the firm name, so the suffix here would be a third clause.
  metaTitle: "Denver Car Accident Lawyer",
  metaDescription:
    "Injured in a car accident? A Denver Car Accident Lawyer can help you get the " +
    "compensation you deserve. Call now for a free consultation!",

  hero: {
    trail: [
      { _key: "home", label: "Home", href: ROUTES.home },
      { _key: "practice", label: "Practice Areas", href: ROUTES.practiceAreas },
      { _key: "self", label: "Car Accidents", href: null },
    ],
    title: "Denver Car Accident Lawyers",
    lede:
      "Insurance companies offer more when they know your lawyer will take it to a " +
      "jury. We take fewer cases so we can do exactly that.",
    proof: [
      {
        _key: "google",
        big: "5.0",
        label: "300+ Google reviews",
        href: "https://www.google.com/search?q=Dormer+Harpring+Denver",
        google: true,
      },
      // TODO(launch): the same unverified claim `stats.ts` carries.
      { _key: "recovered", big: "$70M+", label: "Recovered for clients", href: null },
      { _key: "fee", big: "$0", label: "Unless we win", href: null },
    ],
    ctaLabel: "Speak with a lawyer",
    telLabel: "Or call or text",
    photo: heroPhoto,
    photoAlt: "Aftermath of a car accident on a Denver street",
    reviewer: {
      name: "K.C. Harpring",
      role: "Founding Partner",
      photo: kcHarpring,
      updated: "Updated July 2026",
      // `k-c-harpring`, not `kc-harpring` — the slug the live site indexes.
      bioHref: attorneyPath("k-c-harpring"),
    },
  },

  /**
   * IN DOCUMENT ORDER, and that is the whole point of this object.
   *
   * The comp's bar lists five links in an order unrelated to the page: "Colorado
   * car accident laws" is fourth of five and its section is the FIRST of the
   * five in the document, "Types of crashes" is third and eleventh. A bar that
   * disagrees with the page is a bar that misdescribes it — and it also broke
   * the scroll highlight, which marks "the last section whose top you have
   * passed" and can only walk in one direction.
   *
   * `diff-comp-car-accidents.py` asserts the order structurally, by resolving
   * each href to its position in the built page. Reorder the page and that
   * check fails until this list follows.
   *
   * SIX, NOT MORE: the bar's width is spent on the phone number and the CTA
   * before any link gets a look in. Labels are shortened for the same reason.
   * `#reviews` is deliberately absent — it sits directly under Results, so
   * jumping to Results lands beside it — but keeps its id, which the comp's own
   * footer links.
   */
  nav: {
    items: [
      { _key: "know", label: "Colorado law", href: anchor(CA_SECTION_IDS.know) },
      { _key: "case", label: "Do I have a case?", href: anchor(CA_SECTION_IDS.case) },
      { _key: "lawyers", label: "Our lawyers", href: anchor(CA_SECTION_IDS.lawyers) },
      { _key: "results", label: "Results", href: anchor(CA_SECTION_IDS.results) },
      { _key: "types", label: "Crash types", href: anchor(CA_SECTION_IDS.types) },
      { _key: "next", label: "Next steps", href: anchor(CA_SECTION_IDS.next) },
    ],
    ctaLabel: "Speak with a lawyer",
  },

  triage: {
    title: "Recently injured in a Denver car accident?",
    lede:
      "You’re probably in pain and already getting phone calls. Here are the things " +
      "that actually matter this week — in plain English.",
    video: {
      poster: crashVideoCover,
      alt: "",
      title: "What to do after a car accident",
      length: "1:14",
    },
    help: {
      text:
        "Not sure what applies to you? Call and ask. We’ll tell you in five minutes, " +
        "free, and you don’t have to hire us.",
    },
    // Five rows, all visible. The first design hid the last two behind a "More
    // things to know" disclosure; this one does not, and the 182-day notice is
    // the shortest deadline on the page, so showing it is the better call
    // anyway.
    rows: [
      {
        _key: "medpay",
        tone: "money",
        tag: "Do this first",
        question: "Who pays my medical bills right now?",
        body:
          "You may already have $5,000 in your own car policy set aside for medical " +
          "bills. It pays no matter who caused the crash. Most people don’t know they " +
          "have it.",
        ctaLabel: "How to check my policy",
        ctaHref: anchor(CA_SECTION_IDS.know),
        stat: { big: "$5,000", label: "Often already yours" },
      },
      {
        _key: "statement",
        question: "Do I have to talk to the insurance company?",
        body:
          "No. You do not have to give the other driver’s insurer a recorded statement " +
          "— not today, not ever. You can say “I’m not ready to talk yet” and hang up.",
        ctaLabel: "What to say instead",
        ctaHref: anchor(CA_SECTION_IDS.know),
        stat: { big: "No", label: "You can say no" },
      },
      {
        _key: "time",
        question: "How much time do I have to decide?",
        body:
          "For most Denver car crashes, you have 3 years from the day of the crash. You " +
          "do not have to make any decisions this week.",
        ctaLabel: "Check my deadline",
        ctaHref: anchor(CA_SECTION_IDS.know),
        stat: { big: "3 years", label: "From the crash date" },
      },
      {
        _key: "government",
        question: "Was a bus or a city vehicle involved?",
        body:
          "This one is different. You have to send written notice to the government " +
          "within 182 days, or the claim goes away. If a bus, police car, or city truck " +
          "was involved, call someone now.",
        ctaLabel: "What notice means",
        ctaHref: anchor(CA_SECTION_IDS.know),
        stat: { big: "182 days", label: "Much shorter deadline" },
      },
      {
        _key: "fault",
        question: "What if part of it was my fault?",
        body:
          "You can still recover money. Being partly at fault just reduces the amount. " +
          "You only lose the claim if you were more than half responsible — and that is " +
          "usually argued, not obvious.",
        ctaLabel: "How fault is decided",
        ctaHref: anchor(CA_SECTION_IDS.know),
        stat: { big: "Still yes", label: "Partly at fault is okay" },
      },
    ],
    sources: {
      label: "Sources:",
      items: [
        { _key: "medpay", label: "C.R.S. 10-4-635", href: STATUTE_INDEX },
        { _key: "sol", label: "13-80-101", href: STATUTE_INDEX },
        { _key: "cgia", label: "24-10-109", href: STATUTE_INDEX },
        { _key: "comparative", label: "13-21-111", href: STATUTE_INDEX },
      ],
    },
  },

  takeaways: {
    eyebrow: "The short version",
    title: "If you read nothing else on this page",
    lede: "Four things worth knowing about a Colorado crash before you talk to any adjuster.",
    items: [
      {
        _key: "at-fault",
        title: "Colorado is an at-fault state",
        body:
          "There is no no-fault system here. The driver who caused the crash is " +
          "responsible for your injuries — but their insurer pays once, at the end, in " +
          "a single check. Nothing arrives while you are still treating.",
      },
      {
        _key: "own-policy",
        title: "Your own policy is what pays right now",
        body:
          "Medical payments coverage — usually $5,000 — is on your policy unless you " +
          "rejected it in writing. It pays your treatment regardless of who caused the " +
          "crash, and it pays fast.",
      },
      {
        _key: "public-entity",
        title: "The clock is shorter for public entities",
        body:
          "Only 182 days to notify a government entity if an RTD bus, a city vehicle, " +
          "or a road defect was involved.",
      },
      {
        _key: "partly",
        title: "Partly at fault is still a case",
        body:
          "Colorado reduces what you recover by your share of the blame instead of " +
          "erasing it. Being told it was your fault is not the final word.",
      },
    ],
  },

  criteria: {
    title: "Do I have a case?",
    lede:
      "Three things have to be true. You can usually tell in a couple of minutes — and " +
      "if one is missing, we'll say so.",
    video: {
      poster: caseVideoCover,
      alt: "",
      title: "The three things a case needs",
      length: "1:30",
    },
    items: [
      {
        _key: "hurt",
        title: "You got hurt, and a doctor saw you",
        body:
          "If you were treated, there's a record of it. Without any record, there's very " +
          "little to prove. Seeing a doctor now still counts.",
      },
      {
        _key: "blame",
        title: "Someone else was at least partly to blame",
        body:
          "It does not have to be all their fault. Partly is enough. You can still " +
          "recover money even if some of it was on you.",
      },
      {
        _key: "insurance",
        title: "There's insurance to pay it",
        body:
          "Their policy, your own coverage, or the medical coverage on your policy. If " +
          "nobody has insurance, there is usually nothing to collect — and we'd rather " +
          "tell you that early.",
      },
    ],
    note:
      "If there isn't a case here, we'll tell you that " +
      "instead of selling you one.",
  },

  lawyers: {
    title: "Meet our car accident lawyers",
    lede:
      "The attorneys below handle our Denver car accident cases from investigation " +
      "through trial.",
    attorneys: [
      {
        _key: "kc",
        key: "k-c-harpring",
        cred:
          "Tried the $10,000,000 crash verdict in Colorado state court. Named to the " +
          "National Trial Lawyers Top 40 Under 40.",
      },
      {
        _key: "sean",
        key: "sean-dormer",
        cred:
          "Handles uninsured and underinsured motorist claims, including Hartkopp v. " +
          "State Farm. Listed in Top 20 Colorado Jury Verdicts.",
      },
      {
        _key: "tim",
        key: "tim-garvey",
        cred:
          "Litigates auto injury cases in Denver District Court, from filing through " +
          "trial setting.",
      },
      {
        _key: "laura",
        key: "laura-browne",
        cred:
          "Litigates MedPay and first-party coverage disputes arising out of Colorado " +
          "crashes.",
      },
      // The fifth, and not one of the comp's four. Added at Rhan's request —
      // the band is a rail rather than a four-across grid precisely so the
      // roster can grow without the section reflowing.
      //
      // The line is drawn from his own bio in `team.ts`, so both claims are
      // already published elsewhere on this site and neither is a TODO(launch).
      {
        _key: "greg",
        key: "greg-bentley",
        cred:
          "Handles commercial trucking and catastrophic-injury crashes. Obtained an " +
          "$8,260,000 verdict for a client with traumatic brain and spinal injuries.",
      },
    ],
    moreLabel: "See the full team",
    moreHref: ROUTES.attorneys,
  },

  credentials: {
    eyebrow: "Recognized & awarded",
    // The badges are `awards.ts`'s six, in the comp's order — and the order is
    // now the only thing this page contributes, the caption and the link having
    // been dropped. See `CredentialsSection`.
    //
    // `awardKey` IS MATCHED TO THE COMP'S CAPTION, NOT TO ITS FILENAME. Every
    // comp captions badge-1 as Avvo, badge-2 as TopVerdict, badge-3 as Million
    // Dollar and badge-4 as Multi-Million, and all four files are something
    // else — the labels were shifted against the artwork upstream, and
    // `getAwards()` documents the correction. This comp repeats the shift. So
    // "Multi-Million Dollar Advocates Forum" here resolves to `mmdaf`, which is
    // the badge that actually SAYS Multi-Million, rather than to whatever the
    // comp's <img> src happened to be.
    badges: [
      { _key: "multi-million", awardKey: "mmdaf" },
      { _key: "top-20-verdicts", awardKey: "topverdict" },
      { _key: "top-100", awardKey: "ntl-100" },
      { _key: "top-40", awardKey: "ntl-40" },
      { _key: "avvo", awardKey: "avvo" },
      { _key: "million", awardKey: "mdaf" },
    ],
    disclaimer:
      "Awarding organizations are not certifying authorities. Selection criteria vary " +
      "by organization.",
  },

  whyFirm: {
    eyebrow: "Why Dormer Harpring?",
    title: "We are built to try cases, not to settle them cheaply.",
    // TODO(launch): three claims about the firm's own closed files, and the
    // comp's own disclaimer marks the period "[date range]". The third label is
    // the MARKUP's wording; the dead `firmData` array in the same file says
    // "Share of calls we tell to skip hiring a lawyer" instead.
    stats: [
      {
        _key: "increase",
        big: "3.4x",
        label: "Average increase over the insurer's first offer",
      },
      { _key: "verdicts", big: "41", label: "Car accident cases taken to verdict" },
      {
        _key: "declined",
        big: "1 in 5",
        label: "Of callers we tell they don't need a lawyer",
      },
    ],
    disclaimer:
      "Based on Dormer Harpring's closed car accident matters, [date range]. Past " +
      "results do not guarantee future outcomes. Every case is different.",
    columns: [
      {
        _key: "price",
        n: "01",
        title: "Insurers price cases by who is across the table",
        body:
          "Carriers keep records of which firms file suit and which firms take a " +
          "verdict. That history is part of how an adjuster values your claim.",
      },
      {
        _key: "caseload",
        n: "02",
        title: "Fewer cases means more hours on yours",
        body:
          "We keep the caseload per attorney small on purpose. The lawyer who answers " +
          "your call is the lawyer who works the file.",
      },
      {
        _key: "trial-date",
        n: "03",
        title: "What changes when a case is set for trial",
        body:
          "Setting a trial date starts discovery, depositions and expert disclosures. " +
          "The carrier has to price the case against a real courtroom deadline.",
      },
    ],
    ctaLabel: "See the case results",
    ctaHref: anchor(CA_SECTION_IDS.results),
    photo: whyPhoto,
    photoMobile: whyPhotoMobile,
    photoAlt: "Three Dormer Harpring attorneys standing in a courthouse colonnade",
  },

  results: {
    eyebrow: "Car accident results",
    title: "What we were offered, and what we recovered.",
    offeredLabel: "Offered",
    recoveredLabel: "Recovered",
    stories: [
      {
        _key: "hartkopp",
        offered: "$60,000",
        recovered: "$2.4 Million",
        title: "Trial win: breach of insurance contract",
        reviewKey: "evelyn",
      },
      {
        _key: "low-speed",
        offered: "$2,543.62",
        recovered: "$750,000",
        title: "Rear-end crash, no visible damage",
        story:
          "Our clients hurt their neck and back after another vehicle struck their " +
          "trailer hitch.",
        changed: "We proved the injuries with treatment records, not photos of bumpers.",
      },
      {
        _key: "pileup",
        offered: "$50,000",
        recovered: "$2.5 Million",
        title: "Trial win: five-car highway pileup",
        story: "Our client was injured in a five-car pileup on a Denver-area highway.",
        changed: "Liability across five vehicles had to be untangled and proven.",
      },
      // A FOURTH, WHERE THE COMP DRAWS THREE. Added at Rhan's request so the
      // rail actually overflows and its arrows have something to do — three
      // cards fit the container exactly and never scrolled.
      //
      // NOT INVENTED. This is `trucking-crash` from `caseResults.ts`, already
      // published on /results, restated in this rail's voice: the figures are
      // written long the way the other three are ("$200K" -> "$200,000") and
      // the one sentence is split into what happened and what was at issue.
      // Nothing is claimed here that the case results page does not already
      // claim — which matters, because Colorado's Rule 7.1 governs how these
      // are described.
      {
        _key: "semi-brakes",
        offered: "$200,000",
        recovered: "$1.15 Million",
        title: "Semi-truck that could not stop",
        story:
          "Our client, a former marine, was hit and injured by a semi-truck near " +
          "Colorado Springs whose brakes were poorly maintained.",
        changed: "He had pre-existing injuries, which is the argument insurers reach for.",
      },
    ],
    disclaimer: "Past results do not guarantee future outcomes. Every case is different.",
  },

  timeline: {
    title: "What the next few months look like",
    lede: "Most people have never done this before. Here is the honest version.",
    ledeStrong:
      "Most of our clients never set foot in a courtroom — but the case has to be built " +
      "as if it will be tried.",
    steps: [
      {
        _key: "same-day",
        n: "1",
        title: "Same day, with a lawyer",
        body: "Not an intake screener.",
      },
      {
        _key: "deadlines",
        n: "2",
        title: "We check deadlines and coverage",
        body: "Before anything else.",
      },
      {
        _key: "no-case",
        n: "3",
        title: "If it isn't a case, we say so",
        body: "And point you somewhere useful.",
      },
      {
        _key: "take-it",
        n: "4",
        title: "If it is, we take the insurers",
        body: "You handle getting better.",
      },
    ],
    phases: [
      {
        _key: "treating",
        title: "While you're treating",
        when: "weeks to months",
        body:
          "Your job is appointments and getting better. We collect the records and bills " +
          "as they come in, and we deal with the adjusters.",
      },
      {
        _key: "demand",
        title: "The demand",
        when: "after treatment",
        body:
          "Once your treatment settles, we put the whole picture in front of the insurer " +
          "— the injuries, the costs, and what the crash actually changed for you.",
      },
      {
        _key: "file",
        title: "If they won't pay, we file",
        when: "months",
        body:
          "Filing puts the case on a court schedule the insurer cannot ignore. Discovery " +
          "starts: written questions, records, depositions, and expert opinions on both " +
          "sides.",
      },
      {
        _key: "mediation",
        title: "Mediation",
        when: "a day",
        body:
          "A neutral mediator works between both sides in one sitting. Many cases resolve " +
          "here, and nothing is agreed to without you.",
      },
      {
        _key: "trial",
        title: "Trial",
        when: "if it gets here",
        body:
          "A jury hears the evidence and decides. Most cases never reach this point — but " +
          "every case we take is built as though it will.",
      },
    ],
    photo: consultPhoto,
    photoAlt: "An attorney meeting with a client at a conference table",
    points: [
      "You will not be chasing us. One person knows your case.",
      "Most cases run several months to a year or more.",
      "No offer is accepted unless you say yes.",
    ],
  },

  crashTypes: {
    title: "Types of car accidents we handle",
    lede: "How the crash happened changes what has to be proven, and who ends up paying.",
    // The comp points all eight at `DH - Practice Areas.html` — its way of
    // saying "somewhere else", not a destination. Six of the eight match a live
    // legacy URL and take it; two do not exist anywhere on the legacy site and
    // carry `href: null`, rendering as plain text rather than a dead link.
    // Same convention as `getPracticeAreaGroups()` and `navigation.ts`.
    tiles: [
      {
        _key: "rear-end",
        name: "Rear-end",
        body:
          "Liability is usually conceded, so the fight moves to injury severity. Low " +
          "visible damage is the standard argument against you.",
        linkLabel: "Rear-end collisions",
        // TODO(launch): no legacy page. `/denver-whiplash-injury-attorney` is the
        // nearest, and is a different subject.
        href: null,
      },
      {
        _key: "t-bone",
        name: "T-bone and intersection",
        body:
          "Right-of-way is contested and often decided by cameras, signal timing, or a " +
          "witness. Evidence disappears within days.",
        linkLabel: "Intersection crashes",
        href: "/denver-side-impact-accident-lawyer",
      },
      {
        _key: "head-on",
        name: "Head-on",
        body:
          "Catastrophic injuries against limits that are frequently too low. Finding " +
          "additional coverage matters more than liability.",
        linkLabel: "Head-on crashes",
        // TODO(launch): no legacy page.
        href: null,
      },
      {
        _key: "rollover",
        name: "Rollover",
        body:
          "Vehicle design and roof strength can put a manufacturer in the case alongside " +
          "the driver. Preserve the vehicle.",
        linkLabel: "Rollover crashes",
        href: "/denver-product-liability-lawyer",
      },
      {
        _key: "multi-vehicle",
        name: "Multi-vehicle",
        body:
          "Several insurers each pointing at the others, and limits shared among " +
          "claimants. Sequence and speed matter.",
        linkLabel: "Multi-vehicle pileups",
        href: "/denver-distracted-driver-accident-lawyer",
      },
      {
        _key: "hit-and-run",
        name: "Hit-and-run",
        body:
          "Your own uninsured motorist coverage becomes the claim. Prompt reporting is " +
          "usually a policy condition.",
        linkLabel: "Hit-and-run",
        href: "/denver-uninsured-and-underinsured-motorcyclist-accident-lawyer",
      },
      {
        _key: "rideshare",
        name: "Rideshare",
        body:
          "Coverage depends on what the app was doing at that moment — offline, waiting, " +
          "en route, or carrying a passenger.",
        linkLabel: "Uber and Lyft crashes",
        href: "/denver-uber-accident-lawyer",
      },
      {
        _key: "commercial",
        name: "Commercial vehicle",
        body:
          "Federal rules, driver logs, and telematics apply, and a spoliation letter has " +
          "to go out before data is overwritten.",
        linkLabel: "Commercial vehicles",
        href: "/denver-truck-accident-lawyer",
      },
    ],
  },

  denver: {
    title: "Car accidents in Denver",
    lede:
      "Where and how a crash happens changes what the case looks like — which insurer is " +
      "involved, what evidence exists, and how fast it disappears.",
    // THREE figures, each with a sentence about what it means for a claim. The
    // dead `denverData` array in the same comp still lists FOUR bare figures
    // from the first design; the markup is the source here.
    // TODO(launch): the comp dates all three "[year]" and sources them to
    // "[CDOT / DRCOG / Denver Open Data]". Nothing is sourced to a published
    // table yet.
    stats: [
      {
        _key: "hit-and-run",
        big: "1 in 4",
        label: "Crashes here is a hit-and-run [year]",
        body: "Which means your own uninsured motorist coverage becomes the claim.",
      },
      {
        _key: "injury",
        big: "5,900",
        label: "Injury crashes a year in Denver [year]",
        body:
          "Roughly sixteen a day. Most people involved have never dealt with an insurer " +
          "before.",
      },
      {
        _key: "fatal",
        big: "84",
        label: "Fatal crashes a year [year]",
        body: "Wrongful death claims run on a different deadline than injury claims.",
      },
    ],
    source: "Source: [CDOT / DRCOG / Denver Open Data], [year].",
    mapCaption: "Schematic, not to scale.",
    // Five roads, numbered against the schematic map. Every sentence here is
    // NEW — the dead `corridors` array carries a different one per road.
    corridors: [
      {
        _key: "i25",
        name: "I-25",
        body:
          "High speeds, multi-vehicle impacts, and commercial traffic. Coverage limits get " +
          "tested here more than anywhere else in the metro.",
      },
      {
        _key: "colfax",
        name: "Colfax Avenue",
        body:
          "Constant turning movements, pedestrians, and buses. Right-of-way is the usual " +
          "fight, and camera footage is the usual answer.",
      },
      {
        _key: "federal",
        name: "Federal Boulevard",
        body:
          "Wide lanes, frequent uninsured drivers, and a high hit-and-run rate. Your own " +
          "policy often carries the claim.",
      },
      {
        _key: "colorado",
        name: "Colorado Boulevard",
        body:
          "Heavy commuter volume through signalized intersections. Rear-end and left-turn " +
          "collisions dominate.",
      },
      {
        _key: "speer",
        name: "Speer Boulevard",
        body:
          "Angled intersections and merging traffic along Cherry Creek. Fault is rarely " +
          "obvious from the police report alone.",
      },
    ],
  },

  /**
   * The eight-step checklist that used to be a section on this page. The second
   * design turns it into a teaser pointing at `DH - Blog - What to do after a
   * car accident.html`, a comp that arrived with this revision and that this
   * build does not serve.
   *
   * `ctaHref: null` by Rhan's decision: the label stays, the affordance goes,
   * and nothing points at a page that does not exist. The four cards in the
   * illustration are the comp's own — a sample of the eight, not all of them.
   * TODO(launch): build the article, then set the href.
   */
  checklistTeaser: {
    title: "8 things to do after a car accident",
    body: "From the scene to the first adjuster call — the steps that protect your claim.",
    ctaLabel: "See all 8 steps",
    ctaHref: null,
    steps: [
      { _key: "police", iconKey: "police", label: "Call the police" },
      { _key: "photos", iconKey: "camera", label: "Photograph the scene" },
      { _key: "witnesses", iconKey: "witnesses", label: "Get witness names" },
      { _key: "doctor", iconKey: "stethoscope", label: "See a doctor" },
      { _key: "insurer", iconKey: "none", label: "Tell your insurer" },
    ],
  },

  /**
   * The comparative-fault section, likewise reduced to a teaser. The comp links
   * it at `DH - Blog.html` — the blog index, which this build serves — so
   * unlike the checklist it has a real destination.
   */
  faultTeaser: {
    title: "What if part of it was my fault?",
    body:
      "Colorado reduces what you recover by your share of the blame instead of erasing " +
      "it. Being told it was your fault is not the final word.",
    ctaLabel: "How fault gets decided",
    ctaHref: ROUTES.blog,
    scale: {
      start: "None of it your fault",
      middle: "Over half — you get nothing",
      end: "All your fault",
    },
    source: {
      label: "Source:",
      items: [{ _key: "comparative", label: "C.R.S. 13-21-111", href: STATUTE_INDEX }],
    },
  },

  /**
   * Eight article stubs, all of which the comp points at `DH - Blog.html`.
   * Their subjects are the first design's cut sections — the insurance Q&As,
   * the damages grid, the adjuster tactics, the venue list — turned into
   * promised articles.
   *
   * They keep the comp's destination, the blog index, which this build serves
   * at `/news`. That is not a dead href, and it is what the comp specifies; but
   * "Read the answer" landing on an index with no such answer is a launch
   * problem either way.
   * TODO(launch): write the eight, or cut the section back to what exists.
   */
  more: {
    title: "More on car accident claims",
    features: [
      {
        _key: "fault",
        title: "Who was at fault?",
        body: "What happens if part of it was your fault, and how fault actually gets decided.",
        length: "2:05",
        poster: consultPhoto,
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "medical",
        title: "Who pays my medical bills right now?",
        body: "Your own policy usually pays first — most people don’t know they have it.",
        length: "1:14",
        poster: crashVideoCover,
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
    ],
    cards: [
      {
        _key: "limits",
        title: "What if their insurance isn’t enough?",
        body: "Colorado minimums are low. Your own coverage is often the larger source.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "offer",
        title: "Should I take the first offer?",
        body: "Sometimes yes. Here’s how to tell which kind of offer you have.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "adjusters",
        title: "How adjusters actually work",
        body: "What the friendly early call is really for.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "damages",
        title: "What money can I actually get?",
        body: "The categories Colorado recognizes, and what each one requires.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "government",
        title: "Suing a government entity",
        body: "RTD buses, city vehicles, and the 182-day deadline that catches people out.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
      {
        _key: "venue",
        title: "Where your case gets filed",
        body: "Venue, timelines, and what the local courts are like.",
        ctaLabel: "Read the answer",
        href: ROUTES.blog,
      },
    ],
  },

  closing: {
    title: "Talk to a lawyer about your crash",
    lede:
      "Free, confidential, and no obligation. If there isn't a case here, we'll tell you " +
      "that instead of selling you one.",
    officeLabel: "Our office",
    mapTitle: "Dormer Harpring — Denver office",
  },
};

/**
 * Every practice-area detail page. One today; the array shape is what
 * `src/pages/[slug].astro` walks and what the GROQ query will return.
 */
export async function getPracticeAreaDetails(): Promise<PracticeAreaDetail[]> {
  return [carAccidents];
}

/** One page by slug, for a caller that already knows which it wants. */
export async function getPracticeAreaDetail(
  slug: string
): Promise<PracticeAreaDetail | undefined> {
  const details = await getPracticeAreaDetails();
  return details.find((detail) => detail.slug === slug);
}
