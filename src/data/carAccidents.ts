// The practice-area DETAIL page — Car Accidents.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/practiceAreaDetails.ts`.
// These become `practiceAreaDetail` documents. `getPracticeAreaDetails()`
// returns an ARRAY of one because the future GROQ query is
// `*[_type == "practiceAreaDetail"]` and `src/pages/[slug].astro` walks it to
// build paths — the same contract `getBlogPostArticles()` holds. One page is
// built; the other 45 practice areas are the CMS phase's job, and the shape is
// already right for them.
//
// EVERYTHING HERE IS THE COMP'S OWN CONTENT, read out of the `renderVals()`
// block at the foot of `DH - Car Accidents.html` — 23 arrays behind 88
// placeholders — plus the static copy in its markup. `AGENTS.md` records that
// building a page from comp markup alone has already cost this project one
// full rebuild; `scripts/diff-comp-car-accidents.py` is what stops it here.
//
// EIGHT OF THE COMP'S 23 ARRAYS ARE NOT IN THIS FILE, deliberately — they are
// bands this site already builds, and a second copy of their strings is a
// second copy that drifts:
//   keyPoints                                    → `stats.ts` (identical, all four)
//   leadAttorneys / otherAttorneys               → `team.ts`
//   testimonials / quoteReviews / videoTestimonials → `testimonials.ts`
//   infoCardsData / socials                      → `contact.ts` / `site.ts`
//   serviceAreas / footerAreas / footerNav       → the global Footer
// The page composes those from their own modules, exactly as
// `practice-areas.astro` composes WhyUs and the attorneys band.
//
// TWO OF THE COMP'S FEATURES ARE DEAD IN THE COMP ITSELF and are not built:
//   - `lawCtas` is declared in `renderVals()` and never returned from it, and no
//     placeholder references it. Three mid-FAQ call-to-action strings that no
//     markup can reach.
//   - the transcript toggle. `state.transcriptOpen`, `transcriptIcon` and
//     `toggleTranscript` are all returned, and `.ca-transcript` / `.ca-tr__body`
//     are both styled — but neither class appears anywhere in the markup, so
//     the comp renders no transcript UI. Named in HANDOFF.md as "the one new
//     interaction"; it isn't one. Same story for `.ca-crit`, `.ca-card`,
//     `.ca-step`, `.ca-qa`, `.ca-acc`, `.ca-insight`, `.ca-office` and
//     `.ca-review`, all styled and all unrendered — earlier drafts left behind.
import type { ImageMetadata } from "astro";
import { ROUTES, attorneyPath } from "../lib/routePaths";
import heroPhoto from "../assets/practice/car-accident-hero.jpg";
import crashVideoCover from "../assets/practice/crash-video-cover.jpg";
import seanDormer from "../assets/team/sean-dormer-lg.jpg";
import kcHarpring from "../assets/team/kc-harpring-lg.jpg";

/**
 * In-page anchor ids, in one place because two things must agree about them:
 * the section nav's hrefs and the sections' own `id` attributes.
 *
 * NOT run through `lib/headings.ts`'s `headingId()`, which slugifies a heading's
 * text. These are short handles the comp chose (`#lawyers`, not
 * `#meet-our-car-accident-lawyers`), so there is nothing to slugify — and
 * because both sides read this object, the drift that helper exists to prevent
 * cannot happen here either. Do not add a second slugifier for them.
 */
export const CA_SECTION_IDS = {
  lawyers: "lawyers",
  results: "results",
  types: "types",
  know: "know",
  next: "next",
  contact: "contact",
} as const;

// ---------------------------------------------------------------------------
// Shared shapes. Several sections are the same construction with different
// copy, and the comp's CSS says so: `.ca-sec`, `.ca-inline`, `.ca-secfoot` and
// `.ca-decl` each appear in three or more sections.

/** One `.ca-sec` — an h3 over one or more paragraphs. */
export interface DetailBlock {
  _key: string;
  title: string;
  /** One entry per paragraph. */
  body: string[];
}

/** The dark `.ca-inline` bar — a line of copy and one link. */
export interface InlineCta {
  text: string;
  label: string;
  href: string;
}

/** `.ca-secfoot` / `.ca-tacfoot` / `.ca-nonum__ask` — copy beside the phone. */
export interface PhoneAsk {
  text: string;
}

/**
 * A statute citation under a section.
 *
 * The comp links every one to `law.justia.com/codes/colorado/` — the index, not
 * the section — so the citation is the content and the URL is a placeholder the
 * designer used eight times. Kept as the comp has it rather than guessed at:
 * Justia's per-section URLs are stable but constructing eight of them from a
 * pattern is exactly the kind of unverified link this project doesn't ship.
 * TODO(launch): point each citation at its own statute, or drop the links and
 * leave the citations as text.
 */
export interface StatuteSource {
  _key: string;
  label: string;
  /** What the statute covers, where the comp names it. */
  note?: string;
}

export interface SourceNote {
  /** "Source:" or "Sources:" — the comp uses both. */
  label: string;
  items: StatuteSource[];
}

/** A `.ca-decl` figure — the mocked-up insurance declarations page. */
export interface DeclarationsFigure {
  caption: string;
  title: string;
  /** Upper-right of the head — "Coverages & limits", "Per C.R.S. 10-4-620". */
  meta: string;
  rows: { _key: string; label: string; value: string; highlight?: boolean }[];
  note: { label: string; text: string };
}

/** A `<details>` disclosure — `.ca-more`. */
export interface Disclosure {
  /** A `<summary>`; where absent the comp renders a plain label and no toggle. */
  label: string;
}

/** An inert video panel. Nothing on this page has a real id yet. */
export interface VideoPanel {
  poster: ImageMetadata;
  alt: string;
  /** The italic pull quote over the poster's foot. */
  caption?: string;
  /** Shown as a duration chip. */
  length?: string;
}

// ---------------------------------------------------------------------------

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
   * The "Reviewed by" disclosure. E-E-A-T signalling, and the reason the page
   * names a specific attorney rather than the firm.
   * TODO(launch): "Updated July 2026" is the comp's date and has to move when
   * the copy is reviewed. The five credential lines are K.C.'s, and the $10M
   * verdict and 2006 admission both want confirming — see `team.ts`.
   */
  reviewer: {
    name: string;
    role: string;
    photo: ImageMetadata;
    updated: string;
    credentials: string[];
    bioLabel: string;
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
  video: VideoPanel & { title: string };
  help: { text: string };
  rows: TriageRow[];
  moreLabel: string;
  moreRows: TriageRow[];
  sources: SourceNote;
}

export interface LawyersSection {
  title: string;
  lede: string;
  /**
   * Slugs into `team.ts`, not copies of the roster. The comp's own
   * `leadAttorneys` carries a `focus` sentence per partner that appears nowhere
   * in its markup — the card renders a photo and a name — and a `badges` array
   * that is likewise never rendered. Both are dropped rather than ported into a
   * shape nothing reads, the same call `practiceAreas.ts` made about `stat`,
   * `statContext` and `bullets`.
   *
   * These are `TeamMember._key` values, which `getTeam()` also uses as the
   * profile slug and turns into `href` for anyone who has a bio page.
   */
  leadKeys: string[];
  otherKeys: string[];
  moreLabel: string;
  moreHref: string;
}

export interface TakeawaysSection {
  eyebrow: string;
  title: string;
  lede: string;
  items: DetailBlock[];
}

export interface ResultStory {
  _key: string;
  offered: string;
  recovered: string;
  title: string;
  story: string;
  changedLabel: string;
  changed: string;
  /**
   * A key into `getVideoReviews()` in `testimonials.ts`, which already holds
   * the client's name, portrait, pull quote and real YouTube id.
   *
   * The comp inlines a poster path and a quote per story, and gets one of the
   * three wrong: story two shows `assets/reviews/ben.jpg` and attributes the
   * quote to Joel. Both are real clients with their own separate videos, so it
   * is a mismatch rather than a naming quirk. Keying into the one testimonials
   * collection fixes it and stops a fourth copy of the same three quotes.
   */
  reviewKey: string;
}

export interface ResultsSection {
  eyebrow: string;
  title: string;
  offeredLabel: string;
  recoveredLabel: string;
  stories: ResultStory[];
  disclaimer: string;
}

export interface ChecklistStep {
  _key: string;
  /** Into `components/icons/CrashStepIcon.astro`. */
  iconKey: string;
  n: number;
  title: string;
  body: string;
}

export interface ChecklistSection {
  title: string;
  lede: string;
  stepLabel: string;
  steps: ChecklistStep[];
  ctaLabel: string;
  ctaHref: string;
}

export interface GloveBoxSection {
  eyebrow: string;
  title: string;
  body: string;
  /**
   * TODO(launch): the "Download and print" link has no target — the comp's is
   * `href="#"` and no artwork exists. It ships pointing at the contact anchor
   * alongside "Mail me a free card" rather than at a dead `#`, because a button
   * that scrolls nowhere is worse than two that ask the same thing twice.
   */
  ctas: { _key: string; label: string; href: string; tone: "red" | "ghost" }[];
  note: string;
  front: {
    faceLabel: string;
    title: string;
    steps: string[];
    footLabel: string;
  };
  back: {
    faceLabel: string;
    notTitle: string;
    notItems: string[];
    deadlines: { _key: string; big: string; label: string }[];
    footLabel: string;
    qrLabel: string;
  };
}

export interface CriteriaSection {
  title: string;
  lede: string;
  video: VideoPanel;
  items: DetailBlock[];
  inline: InlineCta;
  note: string;
}

export interface FaultSection {
  title: string;
  lede: string;
  big: { figure: string; statement: string; body: string };
  disclosure: Disclosure;
  branchesLabel: string;
  branches: { _key: string; n: string; question: string; answer: string }[];
  scale: { caption: string; start: string; middle: string; end: string };
  source: SourceNote;
  blocks: DetailBlock[];
  foot: PhoneAsk;
  video: VideoPanel;
}

/** The `.ca-ans` two-column shape: heading and video left, blocks right. */
export interface QaSection {
  id?: string;
  title: string;
  lede: string;
  video?: VideoPanel;
  blocks: DetailBlock[];
  figure?: DeclarationsFigure;
  /** Which block the figure sits under. */
  figureAfter?: string;
  inline?: InlineCta;
  source?: SourceNote;
}

export interface DamagesSection {
  title: string;
  lede: string;
  /** `iconKey` into `components/icons/DamageIcon.astro`. */
  tiles: { _key: string; iconKey: string; title: string; body: string }[];
  disclosure: Disclosure;
  columns: {
    _key: string;
    name: string;
    itemsLabel: string;
    items: string[];
    proofLabel: string;
    proof: string;
    capLabel: string;
    cap: string;
    capNote: string;
  }[];
  source: SourceNote;
  noNumber: { title: string; body: string; ask: PhoneAsk };
}

export interface TacticsSection {
  eyebrow: string;
  title: string;
  lede: string;
  cards: DetailBlock[];
  foot: PhoneAsk;
}

/** The `.ca-ans--split` shape: a big one-word answer left, video right. */
export interface BigAnswerSection {
  title: string;
  lede: string;
  big: { figure: string; statement: string; body: string };
  reassure?: { title: string; body: string[] };
  disclosure: Disclosure;
  blocks: DetailBlock[];
  foot: PhoneAsk;
  video: VideoPanel;
}

export interface ProcessSection {
  title: string;
  steps: { _key: string; n: string; title: string; body: string }[];
}

export interface BuildSection {
  eyebrow: string;
  title: string;
  items: DetailBlock[];
  evidence: { title: string; items: string[]; note: string };
}

export interface TileSection {
  id?: string;
  title: string;
  lede: string;
  /** `iconKey` into the shared `PracticeIcon`. */
  tiles: {
    _key: string;
    name: string;
    iconKey: string;
    body: string;
    linkLabel?: string;
    href?: string | null;
  }[];
}

export interface DenverSection {
  title: string;
  stats: { _key: string; big: string; label: string }[];
  body: string[];
  corridorsLabel: string;
  corridors: { _key: string; name: string; body: string }[];
  source: string;
}

export interface FirmDataSection {
  title: string;
  lede: string;
  stats: { _key: string; big: string; label: string }[];
  methodology: string;
  disclaimer: string;
}

export interface VenueSection {
  title: string;
  body: string[];
  courts: { _key: string; n: string; name: string; body: string }[];
}

export interface RelatedSection {
  title: string;
  areasLabel: string;
  areas: { _key: string; label: string; href: string | null }[];
  articlesLabel: string;
  articles: { _key: string; label: string; href: string | null }[];
}

export interface PracticeAreaDetail {
  _key: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  hero: DetailHero;
  nav: { items: { _key: string; label: string; href: string }[]; ctaLabel: string };
  triage: TriageSection;
  lawyers: LawyersSection;
  takeaways: TakeawaysSection;
  results: ResultsSection;
  checklist: ChecklistSection;
  gloveBox: GloveBoxSection;
  criteria: CriteriaSection;
  fault: FaultSection;
  medical: QaSection;
  limits: QaSection;
  damages: DamagesSection;
  offer: QaSection;
  tactics: TacticsSection;
  cost: BigAnswerSection;
  court: BigAnswerSection;
  process: ProcessSection;
  build: BuildSection;
  keyPointsEyebrow: string;
  crashTypes: TileSection;
  injuries: TileSection;
  denver: DenverSection;
  firmData: FirmDataSection;
  venue: VenueSection;
  related: RelatedSection;
}

const anchor = (id: string) => `#${id}`;

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
      credentials: [
        "Founding Partner, Dormer Harpring",
        "Licensed in Colorado since 2006",
        "Dozens of jury trials to verdict, including a $10M crash verdict",
        "Colorado Trial Lawyers Association; American Association for Justice",
        "National Trial Lawyers Top 40 Under 40; Best Lawyers “Ones to Watch”",
      ],
      bioLabel: "Full attorney bio",
      // `k-c-harpring`, not `kc-harpring` — the slug the live site indexes.
      bioHref: attorneyPath("k-c-harpring"),
    },
  },

  nav: {
    items: [
      { _key: "lawyers", label: "Our lawyers", href: anchor(CA_SECTION_IDS.lawyers) },
      { _key: "results", label: "Results", href: anchor(CA_SECTION_IDS.results) },
      {
        _key: "types",
        label: "Types of crashes we handle",
        href: anchor(CA_SECTION_IDS.types),
      },
      {
        _key: "know",
        label: "Colorado car accident laws",
        href: anchor(CA_SECTION_IDS.know),
      },
      { _key: "next", label: "Next steps", href: anchor(CA_SECTION_IDS.next) },
    ],
    ctaLabel: "Speak with a lawyer",
  },

  triage: {
    title: "Recently injured in a Denver car accident?",
    lede:
      "You’re probably in pain and already getting phone calls. Here are the three " +
      "things that actually matter this week — in plain English.",
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
    ],
    moreLabel: "More things to know",
    moreRows: [
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
        { _key: "medpay", label: "C.R.S. 10-4-635" },
        { _key: "sol", label: "13-80-101" },
        { _key: "cgia", label: "24-10-109" },
        { _key: "comparative", label: "13-21-111" },
      ],
    },
  },

  lawyers: {
    title: "Meet our car accident lawyers",
    lede:
      "From investigation to resolution, our auto accident attorneys handle every " +
      "detail of your case. You focus on healing, and we’ll take it from here.",
    leadKeys: ["sean-dormer", "k-c-harpring"],
    otherKeys: [
      "tim-garvey",
      "laura-browne",
      "jessica-mauser",
      "amy-rogers",
      "greg-bentley",
    ],
    moreLabel: "See the full team",
    moreHref: ROUTES.attorneys,
  },

  takeaways: {
    eyebrow: "The short version",
    title: "If you read nothing else on this page",
    lede: "Four things worth knowing about a Colorado crash before you talk to any adjuster.",
    items: [
      {
        _key: "at-fault",
        title: "Colorado is an at-fault state",
        body: [
          "There is no no-fault system here. The driver who caused the crash is " +
            "responsible for your injuries — but their insurer pays once, at the end, in " +
            "a single check. Nothing arrives while you are still treating.",
        ],
      },
      {
        _key: "own-policy",
        title: "Your own policy is what pays right now",
        body: [
          "Medical payments coverage — usually $5,000 — is on your policy unless you " +
            "rejected it in writing. It pays your treatment regardless of who caused the " +
            "crash, and it pays fast.",
        ],
      },
      {
        _key: "partly",
        title: "Partly at fault is still a case",
        body: [
          "Colorado reduces your recovery by your share of the blame instead of erasing " +
            "it. You only lose the claim outright if you were 50% or more responsible, and " +
            "that percentage is argued, not decided at the scene.",
        ],
      },
      {
        _key: "clock",
        title: "The clock is shorter than it looks",
        body: [
          "Three years for most car crashes. But only 182 days to notify a government " +
            "entity if an RTD bus, a city truck, or a road defect was involved — and " +
            "cameras overwrite themselves in days.",
        ],
      },
    ],
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
        title: "Trial win — breach of insurance contract",
        story:
          "Hartkopp v. State Farm. Our client was hit head-on by an uninsured driver in " +
          "Denver. His own insurer told the jury he was owed $60,000. A jury found State " +
          "Farm owed him $2,400,000.",
        changedLabel: "What changed",
        changed:
          "We tried it. The difference between the insurer’s number and the verdict was " +
          "a jury hearing the medical evidence in full.",
        reviewKey: "evelyn",
      },
      {
        _key: "pileup",
        offered: "$50,000",
        recovered: "$2.5 Million",
        title: "Trial win — five-car pileup on the highway",
        story:
          "Our client was injured in a five-car pileup on a Denver-area highway. The " +
          "offer on the table was $50,000.",
        changedLabel: "What changed",
        changed:
          "Liability across five vehicles had to be untangled and proven. The case was " +
          "tried rather than settled at the insurer’s number.",
        reviewKey: "joel",
      },
      {
        _key: "low-speed",
        offered: "$2,543.62",
        recovered: "$750,000",
        title: "Low-speed rear-end crash, no visible damage",
        story:
          "Our clients hurt their neck and back after another vehicle struck their " +
          "trailer hitch. There was no visible property damage, and the opening offer was " +
          "$2,543.62. A large regional TV-advertising firm had fired them for exactly " +
          "that reason.",
        changedLabel: "What changed",
        changed:
          "We proved the injuries with treatment records rather than photographs of " +
          "bumpers, and litigated the case to a settlement roughly 295 times the first " +
          "offer.",
        reviewKey: "kelly",
      },
    ],
    disclaimer: "Past results do not guarantee future outcomes. Every case is different.",
  },

  checklist: {
    title: "What to do after a car accident in Denver",
    lede: "The first week matters more than most people realize.",
    stepLabel: "Step",
    steps: [
      {
        _key: "police",
        iconKey: "police",
        n: 1,
        title: "Call the police",
        body:
          "A report is not required in every crash, but it is the cleanest record of " +
          "what happened.",
      },
      {
        _key: "checked",
        iconKey: "stethoscope",
        n: 2,
        title: "Get checked even if you feel fine",
        body: "Adrenaline masks injury. Gaps in treatment are the first thing an adjuster attacks.",
      },
      {
        _key: "photograph",
        iconKey: "camera",
        n: 3,
        title: "Photograph everything before the vehicles move",
        body: "Position, damage, road conditions, signals, skid marks.",
      },
      {
        _key: "witnesses",
        iconKey: "witnesses",
        n: 4,
        title: "Get witness names and numbers",
        body: "Not just the other driver. Witnesses disappear fast.",
      },
      {
        _key: "insurer",
        iconKey: "shield-check",
        n: 5,
        title: "Report it to your own insurer",
        body:
          "You have a contract with them. You do not have one with the other driver’s " +
          "insurer.",
      },
      {
        _key: "no-statement",
        iconKey: "mic-off",
        n: 6,
        title: "Do not give a recorded statement to the other insurer",
        body: "You are not required to. That call happens early on purpose.",
      },
      {
        _key: "doctor",
        iconKey: "calendar-check",
        n: 7,
        title: "See a doctor within days, not weeks",
        body: "The gap between the crash and the first visit is used against you constantly.",
      },
      {
        _key: "notes",
        iconKey: "pencil",
        n: 8,
        title: "Write down what you remember",
        body: "Details fade within a week.",
      },
    ],
    ctaLabel: "Start your claim",
    ctaHref: anchor(CA_SECTION_IDS.contact),
  },

  gloveBox: {
    eyebrow: "Free printed card",
    title: "Keep this in your glove box",
    body:
      "Exactly what to do at the scene — the six steps in order, the two deadlines " +
      "that catch people out, and a number to call. Nobody remembers this list while " +
      "standing on the shoulder of I-25.",
    ctas: [
      {
        _key: "download",
        label: "Download and print",
        href: anchor(CA_SECTION_IDS.contact),
        tone: "red",
      },
      {
        _key: "mail",
        label: "Mail me a free card",
        href: anchor(CA_SECTION_IDS.contact),
        tone: "ghost",
      },
    ],
    note: "Free · English and Spanish",
    front: {
      faceLabel: "Front",
      title: "At the scene",
      steps: [
        "Call the police",
        "Photograph everything",
        "Get witness numbers",
        "Get checked out",
        "Tell your own insurer",
        "Write down what you remember",
      ],
      footLabel: "Call anytime",
    },
    back: {
      faceLabel: "Back",
      notTitle: "What not to do",
      notItems: [
        "Don't give a recorded statement to their insurer",
        "Don't sign a release or accept a first offer",
        "Don't wait weeks to see a doctor",
      ],
      deadlines: [
        { _key: "claim", big: "3 yrs", label: "Crash claim deadline" },
        { _key: "notice", big: "182 days", label: "Notice to a public entity" },
      ],
      footLabel: "Free, 24/7",
      qrLabel: "Scan: check my deadline",
    },
  },

  criteria: {
    title: "Do I have a case?",
    lede:
      "Three things have to be true. You can usually tell in a couple of minutes — and " +
      "if one is missing, we'll say so.",
    video: {
      poster: kcHarpring,
      alt: "Video: the three things a case needs",
      caption: "“The three things a case needs — and when we say no” — 90 sec",
    },
    items: [
      {
        _key: "hurt",
        title: "You got hurt, and a doctor saw you",
        body: [
          "If you were treated, there's a record of it. Without any record, there's very " +
            "little to prove. Seeing a doctor now still counts.",
        ],
      },
      {
        _key: "blame",
        title: "Someone else was at least partly to blame",
        body: [
          "It does not have to be all their fault. Partly is enough. You can still " +
            "recover money even if some of it was on you.",
        ],
      },
      {
        _key: "insurance",
        title: "There's insurance to pay it",
        body: [
          "Their policy, your own coverage, or the medical coverage on your policy. If " +
            "nobody has insurance, there is usually nothing to collect — and we'd rather " +
            "tell you that early.",
        ],
      },
    ],
    inline: {
      text: "Five questions and a straight answer.",
      label: "Ask if I have a case — free",
      href: anchor(CA_SECTION_IDS.contact),
    },
    note:
      "Free, and no email required. If there isn't a case here, we'll tell you that " +
      "instead of selling you one.",
  },

  fault: {
    title: "Who was at fault?",
    lede:
      "If someone already told you it was your fault, that isn't the final word. Fault " +
      "gets decided a lot later than people think.",
    big: {
      figure: "Still yes",
      statement: "Being partly at fault does not end your case.",
      body:
        "It only reduces the amount. You lose the claim only if you were more than half " +
        "responsible — and that number is argued over, not decided at the scene. If " +
        "someone already told you it was your fault, that is not the final word.",
    },
    disclosure: { label: "How fault actually gets decided" },
    branchesLabel: "The questions that decide it",
    branches: [
      {
        _key: "cited-you",
        n: "01",
        question: "Were you cited?",
        answer:
          "Not decisive. A ticket is evidence, and it can be contested or outweighed by " +
          "the physical evidence.",
      },
      {
        _key: "cited-them",
        n: "02",
        question: "Was the other driver cited?",
        answer:
          "Helpful, not conclusive. It supports the claim but the insurer can still " +
          "dispute liability.",
      },
      {
        _key: "report",
        n: "03",
        question: "Do you disagree with the police report?",
        answer:
          "The report can be corrected and contradicted. It is a starting document, not " +
          "a finding.",
      },
      {
        _key: "both",
        n: "04",
        question: "Were you both partly at fault?",
        answer:
          "You still recover, reduced by your share — unless your share reaches 50%.",
      },
    ],
    scale: {
      caption:
        "Being partly at fault reduces what you get. Being more than half at fault ends it.",
      start: "None of it your fault",
      middle: "Over half your fault — you get nothing",
      end: "All your fault",
    },
    source: {
      label: "Source:",
      items: [{ _key: "comparative", label: "C.R.S. 13-21-111", note: "comparative fault" }],
    },
    blocks: [
      {
        _key: "ticket",
        title: "Does a traffic ticket settle it?",
        body: [
          "No. A ticket is one piece of evidence a jury can look at, not the answer. " +
            "We've won cases where the other driver never got a ticket, and seen cases " +
            "lost where they did.",
        ],
      },
      {
        _key: "report-wrong",
        title: "What if the police report is wrong?",
        body: [
          "It happens all the time, and it can be fixed. Officers mix up which car was " +
            "which, mishear what people said, and draw the diagram from memory afterward. " +
            "What really happened can be proven other ways.",
        ],
      },
      {
        _key: "memory",
        title: "What if I can't remember what happened?",
        body: [
          "That's normal, and it doesn't hurt your case. Memory gaps are expected after " +
            "a hard hit or a head injury. Fault gets pieced together from the cars, the " +
            "damage, nearby cameras and witnesses — not just from what you remember.",
        ],
      },
    ],
    foot: { text: "Someone already told you it was your fault? Get a second opinion." },
    video: {
      poster: seanDormer,
      alt: "Attorney video: who was at fault",
      caption: "“They said it was my fault. Is that it?” — 90 sec",
    },
  },

  medical: {
    id: CA_SECTION_IDS.know,
    title: "Who pays my medical bills while the case is open?",
    lede: "It's the question we hear most, and the answer catches almost everyone off guard.",
    video: {
      poster: kcHarpring,
      alt: "Attorney video: who pays my medical bills",
      caption: "“Who pays my medical bills?” — 90 sec",
    },
    blocks: [
      {
        _key: "not-as-you-go",
        title: "The other driver's insurance will not pay as you go",
        body: [
          "They pay once, at the end. Nothing arrives while you're still treating — no " +
            "matter how obviously the crash was their fault or how big the bills get. Even " +
            "if their insurer admits fault, that doesn't start any payments. It only makes " +
            "the check at the end more likely.",
        ],
      },
      {
        _key: "medpay",
        title: "You may already have $5,000 for medical bills",
        body: [
          "Most people do and don't know it. It's called medical payments coverage, or " +
            "MedPay. Colorado insurers have to offer it, so it's on your policy unless you " +
            "turned it down in writing. It pays your treatment no matter who caused the " +
            "crash, and it pays fast.",
          "To check: find your auto policy paperwork and look for a line that says " +
            "medical payments with its own dollar limit, usually $5,000. If you can't find " +
            "it, call your own insurance agent and ask, “do I have MedPay on this policy?”",
        ],
      },
      {
        _key: "health",
        title: "Health insurance will pay now, but wants it back later",
        body: [
          "Your health plan will cover your care, then ask to be paid back out of " +
            "whatever you recover at the end. That number is negotiable, and it's often too " +
            "high — plans regularly include charges that had nothing to do with the crash. " +
            "Getting it lowered puts money back in your pocket without changing the " +
            "settlement at all.",
        ],
      },
      {
        _key: "none",
        title: "What if you have none of these",
        body: [
          "You still have options. Some doctors will treat you now and wait to be paid " +
            "when the case ends. Most hospitals have financial assistance programs, but " +
            "they rarely mention them unless you ask. Three things worth asking: what's " +
            "your self-pay rate, can this bill be held, and can I get that in writing.",
        ],
      },
    ],
    figureAfter: "medpay",
    figure: {
      caption: "What that line looks like on your insurance paperwork",
      title: "Auto Policy — Declarations",
      meta: "Coverages & limits",
      rows: [
        { _key: "bi", label: "Bodily injury liability", value: "$100,000 / $300,000" },
        { _key: "pd", label: "Property damage liability", value: "$50,000" },
        {
          _key: "medpay",
          label: "Medical payments (MedPay)",
          value: "$5,000",
          highlight: true,
        },
        {
          _key: "um",
          label: "Uninsured / underinsured motorist",
          value: "$100,000 / $300,000",
        },
        { _key: "collision", label: "Collision", value: "$500 deductible" },
      ],
      note: {
        label: "Look here",
        text:
          "Its own line, with its own dollar limit. If your paperwork says “rejected” " +
          "next to it, you turned it down when you bought the policy.",
      },
    },
    inline: {
      text: "Not sure what coverage you have? Send us the paperwork.",
      label: "We'll read it for you",
      href: anchor(CA_SECTION_IDS.contact),
    },
    source: {
      label: "Source:",
      items: [
        { _key: "medpay", label: "C.R.S. 10-4-635", note: "medical payments coverage" },
      ],
    },
  },

  limits: {
    title: "What if their insurance isn’t enough?",
    lede: "Colorado lets drivers carry very little. A serious injury can pass it in the first month.",
    blocks: [
      {
        _key: "minimum",
        title: "The legal minimum is smaller than most people picture",
        body: [
          "Colorado requires every driver to carry liability coverage, but the required " +
            "amount is low. One ambulance ride, one emergency room visit, and one MRI can " +
            "use up the entire bodily injury minimum before you have even seen a " +
            "specialist. When that happens, the at-fault driver’s policy is not the end of " +
            "the search — it is the beginning of it.",
        ],
      },
      {
        _key: "elsewhere",
        title: "Where the rest of the money comes from",
        body: [
          "Your own underinsured motorist coverage is the usual answer, and it exists " +
            "for exactly this situation. Beyond that: other policies in your household, an " +
            "employer’s policy if the other driver was working, a commercial policy behind " +
            "a company vehicle, or a second party who contributed to the crash. Finding " +
            "every layer is often worth more than arguing about fault.",
        ],
      },
      {
        _key: "own-carrier",
        title: "Making that claim turns your insurer into the other side",
        body: [
          "The moment you claim underinsured motorist benefits, your own carrier is the " +
            "one writing the check — and the same adjusters, the same delays, and the same " +
            "low first offers get pointed at you. Being their customer for fifteen years " +
            "does not change how that file gets handled.",
        ],
      },
      {
        _key: "uninsured",
        title: "What if they had no insurance at all",
        body: [
          "Then uninsured motorist coverage is the claim, and it works the same way. " +
            "Colorado has a significant share of uninsured drivers, and hit-and-run crashes " +
            "are treated as uninsured claims too — but most policies require you to report " +
            "the crash promptly, so the timing matters.",
        ],
      },
    ],
    figureAfter: "minimum",
    figure: {
      caption: "What Colorado actually requires, and what is optional",
      title: "Colorado minimum auto coverage",
      meta: "Per C.R.S. 10-4-620",
      rows: [
        { _key: "bi-one", label: "Bodily injury — one person hurt", value: "$25,000" },
        {
          _key: "bi-all",
          label: "Bodily injury — everyone hurt in one crash",
          value: "$50,000",
        },
        { _key: "pd", label: "Property damage", value: "$15,000" },
        {
          _key: "medpay",
          label: "Medical payments (MedPay) on your own policy",
          value: "$5,000",
          highlight: true,
        },
        { _key: "um", label: "Uninsured / underinsured motorist", value: "Optional" },
      ],
      note: {
        label: "Note",
        text:
          "MedPay and uninsured motorist coverage are not required, but insurers must " +
          "offer them — so you have them unless you turned them down in writing.",
      },
    },
    inline: {
      text: "Not sure how much coverage is available to you?",
      label: "Send us the paperwork",
      href: anchor(CA_SECTION_IDS.contact),
    },
    source: {
      label: "Sources:",
      items: [
        { _key: "limits", label: "C.R.S. 10-4-620", note: "required limits" },
        { _key: "um", label: "10-4-609", note: "uninsured motorist" },
        { _key: "medpay", label: "10-4-635", note: "MedPay" },
      ],
    },
  },

  damages: {
    title: "What money can I actually get?",
    lede:
      "Colorado splits it into three buckets, and they don't all work the same way. " +
      "Most people only know about the first one.",
    tiles: [
      {
        _key: "bills",
        iconKey: "bills",
        title: "Medical bills you already have",
        body: "Everything billed so far — ambulance, ER, imaging, therapy.",
      },
      {
        _key: "future-care",
        iconKey: "future-care",
        title: "Care you'll still need",
        body: "Future treatment, surgery, or help at home that a doctor expects.",
      },
      {
        _key: "missed-work",
        iconKey: "clock",
        title: "Work you missed",
        body: "Paychecks lost while you were recovering, including used sick days.",
      },
      {
        _key: "earning",
        iconKey: "earning",
        title: "Work you can no longer do",
        body: "If the injury changes what you're able to earn going forward.",
      },
      {
        _key: "out-of-pocket",
        iconKey: "briefcase",
        title: "Out-of-pocket costs",
        body: "Prescriptions, braces, mileage, childcare.",
      },
      {
        _key: "pain",
        iconKey: "heart",
        title: "Pain",
        body: "What you've physically been through, and still are.",
      },
      {
        _key: "anxiety",
        iconKey: "mind",
        title: "Anxiety, sleep, fear of driving",
        body: "The emotional side. It counts, and it is regularly overlooked.",
      },
      {
        _key: "activities",
        iconKey: "activity",
        title: "Things you can't do anymore",
        body: "Hobbies, sports, picking up your kids, sleeping through the night.",
      },
      {
        _key: "impairment",
        iconKey: "impairment",
        title: "Permanent loss of function",
        body: "A joint, a limb, or a back that will not go back to how it was.",
      },
      {
        _key: "scarring",
        iconKey: "scarring",
        title: "Scarring or disfigurement",
        body: "Visible, permanent changes — a separate category of its own.",
      },
    ],
    disclosure: {
      label: "The legal categories, how each is proven, and the Colorado caps",
    },
    columns: [
      {
        _key: "economic",
        name: "Economic",
        itemsLabel: "What it covers",
        items: [
          "Medical bills already incurred",
          "Future medical and attendant care",
          "Wages lost during recovery",
          "Lost future earning capacity",
          "Out-of-pocket costs and mileage",
        ],
        proofLabel: "How it's proven",
        proof:
          "Records, billing, wage documentation, and an economist or life-care planner " +
          "where future losses are involved.",
        capLabel: "Colorado cap",
        cap: "Not capped",
        capNote: "Limited only by what can be documented and by available coverage.",
      },
      {
        _key: "non-economic",
        name: "Non-economic",
        itemsLabel: "What it covers",
        items: [
          "Pain",
          "Suffering",
          "Inconvenience",
          "Emotional distress",
          "Loss of enjoyment of life",
        ],
        proofLabel: "How it's proven",
        proof:
          "Testimony from you and from people who knew you before — daily-life evidence, " +
          "not paperwork.",
        capLabel: "Colorado cap",
        cap: "Capped by statute",
        capNote:
          "The cap has been raised recently and adjusts over time; which figure applies " +
          "depends on when the claim arose.",
      },
      {
        _key: "impairment",
        name: "Physical impairment and disfigurement",
        itemsLabel: "What it covers",
        items: [
          "Permanent loss of function",
          "Permanent restriction on activity",
          "Scarring",
          "Disfigurement",
          "Amputation or hardware left in place",
        ],
        proofLabel: "How it's proven",
        proof:
          "Medical opinion on permanency plus evidence of what the limitation costs you " +
          "day to day.",
        capLabel: "Colorado cap",
        cap: "Not capped",
        capNote: "A separate Colorado category. It must be pleaded and proven deliberately.",
      },
    ],
    source: {
      label: "Source:",
      items: [{ _key: "caps", label: "C.R.S. 13-21-102.5", note: "damage caps" }],
    },
    noNumber: {
      title: "Why we won’t put a number on it here",
      body:
        "Any number quoted before you finish treating is a guess, and usually a low one. " +
        "Until your medical picture settles, nobody knows what the future care and " +
        "lasting-injury pieces are worth — and those are the parts that move the total. A " +
        "dollar figure on a website is advertising, not an answer.",
      ask: { text: "Want a realistic range for your situation?" },
    },
  },

  offer: {
    title: "The insurance company offered me money. Should I take it?",
    lede: "Sometimes yes, honestly. Here's how to tell which one this is.",
    blocks: [
      {
        _key: "fast",
        title: "Why the first offer comes so fast",
        body: [
          "Because it's cheapest before anyone knows how hurt you are. An offer in the " +
            "first few weeks is built on the bills that exist today — not the scan you " +
            "haven't had, the specialist you haven't seen, or the pain that hasn't gone " +
            "away yet.",
        ],
      },
      {
        _key: "final",
        title: "Once you sign, it's over",
        body: [
          "The paper they send with the check ends your claim for good. It covers " +
            "treatment you haven't had yet and problems that show up next year. If the " +
            "injury turns out worse than it looked, there is no going back and asking for " +
            "more.",
        ],
      },
      {
        _key: "take-it",
        title: "When taking it is the right call",
        body: [
          "More often than you'd expect. If the injury was minor, you're done treating, " +
            "you feel like yourself again, and the offer covers your bills and your missed " +
            "work — take it. Hiring a lawyer would just take a cut of the same money. We " +
            "tell people this every week. It isn't a trick.",
        ],
      },
      {
        _key: "wait",
        title: "When to wait",
        body: [
          "Don't sign while you're still treating, still in pain, or when the number " +
            "only covers the bills you have so far. If a doctor has said the words " +
            "permanent, surgery, or referral, the offer was calculated before anyone knew " +
            "about any of that.",
        ],
      },
    ],
    inline: {
      text: "Have an offer in hand? Read it to us over the phone.",
      label: "We'll tell you if it's fair",
      href: anchor(CA_SECTION_IDS.contact),
    },
  },

  tactics: {
    eyebrow: "What we see from carriers",
    title: "The adjuster is not on your side",
    lede:
      "They are friendly, they call quickly, and they sound like they are helping. Their " +
      "job is to close your file for as little as possible. Four things we deal with " +
      "every week.",
    cards: [
      {
        _key: "fast-offer",
        title: "The fast, friendly offer",
        body: [
          "An early check is cheapest, because nobody knows yet how hurt you are. The " +
            "hope is that you take easy money before the specialist, the imaging, and the " +
            "words “this may be permanent.”",
        ],
      },
      {
        _key: "waiting",
        title: "Waiting you out",
        body: [
          "Especially after a low offer. Bills pile up, the car is gone, work is missed " +
            "— and financial pressure is what makes people accept less than a claim is " +
            "worth. Delay is a strategy, not a backlog.",
        ],
      },
      {
        _key: "recorded",
        title: "The recorded statement",
        body: [
          "The call is recorded for a reason. Say “I’m okay” in week one, or misspeak " +
            "once about how it happened, and the quote comes back months later as an " +
            "argument about fault or severity.",
        ],
      },
      {
        _key: "pre-existing",
        title: "Blaming your back, not the crash",
        body: [
          "Colorado has no injury threshold, so the fight is over cause. Old imaging, a " +
            "prior chiropractor visit, or a two-week gap in therapy all get used to argue " +
            "you were already hurt before the collision.",
        ],
      },
    ],
    foot: {
      text:
        "Have an offer in hand? Read it to us over the phone and we’ll tell you whether " +
        "it’s fair.",
    },
  },

  cost: {
    title: "What does it cost to hire us?",
    lede: "Here is the whole answer in one number.",
    big: {
      figure: "$0",
      statement: "You pay nothing unless we win.",
      body:
        "No retainer. No hourly bills. No invoice ever shows up in your mailbox. If we " +
        "win, our fee comes out of the money we recover for you. If we lose, you owe us " +
        "nothing at all.",
    },
    // The comp renders this one as a plain label over an always-open panel
    // rather than a <summary>. Built as a disclosure like its three siblings:
    // an unlabelled open panel and a closed one differ only by a caret, and
    // four sections behaving three different ways is the kind of inconsistency
    // a visitor reads as a bug.
    disclosure: { label: "The details, if you want them" },
    blocks: [
      {
        _key: "contingency",
        title: "We get paid out of what we recover",
        body: [
          "Our fee is a percentage of the money we actually bring in for you. You agree " +
            "to that percentage in writing before we start, so you know the number on day " +
            "one. You pay nothing when you hire us and nothing while the case is going.",
        ],
      },
      {
        _key: "costs",
        title: "Who pays for records and experts",
        body: [
          "We do, as the case goes along — medical records, expert witnesses, court " +
            "filing fees, all of it. At the end those costs are listed out line by line and " +
            "paid back from the recovery, separate from our fee. You see that list before " +
            "any money is handed out.",
        ],
      },
      {
        _key: "lose",
        title: "If we lose, you owe us nothing",
        body: [
          "No fee, and we eat the costs we already paid out. You will never get a bill " +
            "from us for a case we didn't win. The firm takes that risk, not you.",
        ],
      },
      {
        _key: "free-call",
        title: "The first call is free either way",
        body: [
          "Free whether you hire us or not. If you don't need a lawyer, we'll say so on " +
            "that call and tell you what to do on your own instead.",
        ],
      },
    ],
    foot: { text: "Want it explained out loud before you decide anything?" },
    video: {
      poster: seanDormer,
      alt: "Attorney video: what it costs",
      caption: "“What it costs to hire us” — 60 sec",
    },
  },

  court: {
    title: "Do I have to go to court?",
    lede: "Short answer first.",
    big: {
      figure: "No",
      statement: "Almost certainly not.",
      body:
        "Most of our clients never set foot in a courtroom. The large majority of injury " +
        "cases are settled, and settling is the normal ending — not a lesser one.",
    },
    reassure: {
      title: "The part people worry about most: being asked questions",
      body: [
        "If it comes up, it's called a deposition. You sit in a conference room with " +
          "your lawyer right beside you, the other side's lawyer asks questions, and " +
          "someone types down your answers. No judge. No jury. Nobody watching.",
        "It usually runs two to four hours, we practice with you beforehand, and all you " +
          "have to do is tell the truth about what you remember. “I don't remember” is a " +
          "real answer.",
      ],
    },
    disclosure: { label: "More about how it works" },
    blocks: [
      {
        _key: "filing",
        title: "Filing a lawsuit isn't the same as going to trial",
        body: [
          "Filing is just a step. It puts the case on a schedule with deadlines the " +
            "insurance company can't ignore, which is often what finally gets a stuck claim " +
            "moving. Most cases that get filed still settle before any trial.",
        ],
      },
      {
        _key: "willingness",
        title: "Why being willing to go to trial helps you either way",
        body: [
          "Insurance companies keep track of which firms actually try cases and which " +
            "ones always settle. Firms that never go to trial get low offers, and their " +
            "clients never find out why. Being someone the other side has to take seriously " +
            "is what moves the number — even in a case that never reaches a jury.",
        ],
      },
      {
        _key: "how-long",
        title: "How long will this take?",
        body: [
          "Longer than you want, and no honest lawyer will promise you a date. A simple " +
            "claim often settles a few months after you finish treating. Filing a lawsuit " +
            "usually adds a year or more. A case that goes all the way to trial can take " +
            "two years in a busy Denver court. What we can promise is that you'll always " +
            "know where it stands.",
        ],
      },
    ],
    foot: { text: "Worried about one specific part? Ask about just that." },
    video: {
      poster: kcHarpring,
      alt: "Attorney video: do I have to go to court",
      caption: "“Do I have to go to court?” — 90 sec",
    },
  },

  process: {
    title: "What happens after you call",
    steps: [
      {
        _key: "same-day",
        n: "1",
        title: "Same day, with a lawyer",
        body: "Not a screener.",
      },
      {
        _key: "deadlines",
        n: "2",
        title: "We check deadlines and coverage first",
        body: "Before anything else.",
      },
      {
        _key: "no-case",
        n: "3",
        title: "If it isn't a case, we tell you",
        body: "And point you somewhere useful.",
      },
      {
        _key: "take-it",
        n: "4",
        title: "If it is, we take the insurers",
        body: "You handle recovery.",
      },
    ],
  },

  build: {
    eyebrow: "How we build it",
    title: "What we actually do with your case",
    items: [
      {
        _key: "causation",
        title: "Prove the other driver caused it — not just that they were careless",
        body: [
          "Two different arguments, and insurers concede the first while fighting the " +
            "second. We work the scene, the vehicles, the signal timing, and the witnesses " +
            "so causation is documented rather than assumed.",
        ],
      },
      {
        _key: "losses",
        title: "Tie every loss back to the collision",
        body: [
          "Hospital stays, therapy, missed shifts, the things you have stopped being " +
            "able to do. Each one gets connected to the crash in the record, because " +
            "anything left unconnected is something the carrier gets for free.",
        ],
      },
      {
        _key: "defendants",
        title: "Find everyone who can be held responsible",
        body: [
          "Sometimes it is not only the driver. An employer, a vehicle owner, a bar, or " +
            "a government entity may share liability — and each one brings another policy " +
            "to the table.",
        ],
      },
      {
        _key: "pre-existing",
        title: "Get ahead of the pre-existing condition argument",
        body: [
          "It is coming in nearly every Colorado case. Prior records, a treating " +
            "physician’s opinion, and people who knew you before the crash are what turn " +
            "“he already had a bad back” into a losing argument.",
        ],
      },
    ],
    evidence: {
      title: "Evidence we gather for you",
      items: [
        "Photographs of the scene, the vehicles, and your injuries",
        "The Colorado crash report and any citations issued",
        "Traffic camera, business, and doorbell footage nearby",
        "Statements from passengers and independent witnesses",
        "Vehicle event data, before the car is repaired or scrapped",
        "Your complete medical records, including what came before",
      ],
      note:
        "Some of it disappears within weeks — surveillance footage especially, which is " +
        "usually overwritten in 7 to 30 days. The sooner someone sends a preservation " +
        "letter, the more of it still exists.",
    },
  },

  keyPointsEyebrow: "The firm at a glance",

  crashTypes: {
    id: CA_SECTION_IDS.types,
    title: "Types of car accidents we handle",
    lede:
      "Find the one that sounds like yours. How the crash happened changes what your " +
      "claim looks like.",
    // The comp points all eight at `DH - Practice Areas.html` — its way of
    // saying "somewhere else", not a destination. Six of the eight match a live
    // legacy URL and take it; two do not exist anywhere on the legacy site and
    // carry `href: null`, rendering as plain text rather than a dead link.
    // Same convention as `getPracticeAreaGroups()` and `navigation.ts`.
    tiles: [
      {
        _key: "rear-end",
        name: "Rear-end",
        iconKey: "car-accident",
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
        iconKey: "car-accident",
        body:
          "Right-of-way is contested and often decided by cameras, signal timing, or a " +
          "witness. Evidence disappears within days.",
        linkLabel: "Intersection crashes",
        href: "/denver-side-impact-accident-lawyer",
      },
      {
        _key: "head-on",
        name: "Head-on",
        iconKey: "car-accident",
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
        iconKey: "car-accident",
        body:
          "Vehicle design and roof strength can put a manufacturer in the case alongside " +
          "the driver. Preserve the vehicle.",
        linkLabel: "Rollover crashes",
        href: "/denver-product-liability-lawyer",
      },
      {
        _key: "multi-vehicle",
        name: "Multi-vehicle",
        iconKey: "truck-accident",
        body:
          "Several insurers each pointing at the others, and limits shared among " +
          "claimants. Sequence and speed matter.",
        linkLabel: "Multi-vehicle pileups",
        href: "/denver-distracted-driver-accident-lawyer",
      },
      {
        _key: "hit-and-run",
        name: "Hit-and-run",
        iconKey: "car-accident",
        body:
          "Your own uninsured motorist coverage becomes the claim. Prompt reporting is " +
          "usually a policy condition.",
        linkLabel: "Hit-and-run",
        href: "/denver-uninsured-and-underinsured-motorcyclist-accident-lawyer",
      },
      {
        _key: "rideshare",
        name: "Rideshare",
        iconKey: "car-accident",
        body:
          "Coverage depends on what the app was doing at that moment — offline, waiting, " +
          "en route, or carrying a passenger.",
        linkLabel: "Uber and Lyft crashes",
        href: "/denver-uber-accident-lawyer",
      },
      {
        _key: "commercial",
        name: "Commercial vehicle",
        iconKey: "truck-accident",
        body:
          "Federal rules, driver logs, and telematics apply, and a spoliation letter has " +
          "to go out before data is overwritten.",
        linkLabel: "Commercial vehicles",
        href: "/denver-truck-accident-lawyer",
      },
    ],
  },

  injuries: {
    title: "Injuries we see, and what they mean for your case",
    lede: "This isn't medical advice — just what each injury tends to change about a claim.",
    tiles: [
      {
        _key: "tbi",
        name: "Traumatic brain injury",
        iconKey: "brain-injury",
        body:
          "Frequently missed at the ER and priced as a soft-tissue claim. Neuropsych " +
          "testing and testimony from people who knew you before are what prove it.",
      },
      {
        _key: "spinal",
        name: "Spinal cord and back",
        iconKey: "slip-and-fall",
        body:
          "Degenerative findings on imaging get used to argue the crash changed nothing. " +
          "Prior records and a treating opinion carry the point.",
      },
      {
        _key: "whiplash",
        name: "Whiplash and soft tissue",
        iconKey: "car-accident",
        body:
          "The most disputed category there is. Consistent treatment and a documented " +
          "return-to-baseline timeline are the whole case.",
      },
      {
        _key: "fractures",
        name: "Fractures",
        iconKey: "slip-and-fall",
        body:
          "Objective and hard to dispute, so the fight shifts to future care, hardware " +
          "removal, and permanent limitation.",
      },
      {
        _key: "internal",
        name: "Internal injuries",
        iconKey: "medical-malpractice",
        body:
          "Large early bills and lien exposure. Coordinating health coverage and MedPay " +
          "early protects the eventual recovery.",
      },
      {
        _key: "wrongful-death",
        name: "Wrongful death",
        iconKey: "wrongful-death",
        body:
          "A separate Colorado statute with its own deadlines, its own damage rules, and " +
          "strict limits on who may bring the claim.",
      },
    ],
  },

  denver: {
    title: "Car accidents in Denver",
    // TODO(launch): five figures the firm has to stand behind, and the comp
    // dates them "[year]". Nothing here is sourced to a published CDOT or DPD
    // table yet — they read as the designer's round numbers.
    stats: [
      { _key: "crashes", big: "22,400", label: "Crashes in Denver per year" },
      { _key: "injury", big: "5,900", label: "Injury crashes per year" },
      { _key: "fatal", big: "84", label: "Fatal crashes per year" },
      { _key: "hit-and-run", big: "27%", label: "Hit-and-run share of crashes" },
    ],
    body: [
      "Crashes in Denver aren't spread evenly across the city. They pile up on a handful " +
        "of big roads and highway stretches, and inside those, at traffic lights and " +
        "on-ramps rather than out in the open.",
      "Time of day works the same way — the weekday evening commute produces the most " +
        "crashes, late weekend nights produce the worst ones. Where your crash happened " +
        "often tells us which arguments the insurance company is about to make.",
    ],
    corridorsLabel: "Roads we see most",
    corridors: [
      {
        _key: "i25",
        name: "I-25",
        body:
          "Highest volume in the metro; on-ramp merges and stop-and-go backups through " +
          "the central corridor.",
      },
      {
        _key: "colfax",
        name: "Colfax Avenue",
        body:
          "Long signalized arterial with heavy pedestrian traffic and frequent left-turn " +
          "collisions.",
      },
      {
        _key: "federal",
        name: "Federal Boulevard",
        body:
          "Repeatedly among the most dangerous corridors in the city for pedestrians and " +
          "cyclists.",
      },
      {
        _key: "colorado",
        name: "Colorado Boulevard",
        body: "High-speed arterial with dense commercial driveways and abrupt lane changes.",
      },
      {
        _key: "speer",
        name: "Speer Boulevard",
        body: "Curving one-way segments and short merges, with late-night severity spikes.",
      },
    ],
    source:
      "Colorado Department of Transportation and Denver Police Department, [year]. " +
      "Updated annually.",
  },

  firmData: {
    title: "What we see in our own cases",
    lede: "Our own closed-case data, not industry averages.",
    // TODO(launch): three claims about the firm's own closed files. The comp
    // ships a "[Methodology pending]" placeholder beneath them, which is the
    // designer saying the same thing.
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
        label: "Share of calls we tell to skip hiring a lawyer",
      },
    ],
    methodology:
      "[Methodology pending] — which cases are counted, over what period, and how each " +
      "figure is calculated. Cases still open are excluded.",
    disclaimer: "Past results do not guarantee future outcomes.",
  },

  venue: {
    title: "Where your case gets filed, and why it matters",
    body: [
      "Venue changes what a case is worth. Denver District Court draws a different jury " +
        "pool than Arapahoe or Jefferson, moves at a different pace, and its judges have " +
        "their own habits on motions, expert challenges, and how much trial time a case " +
        "actually gets. Two identical crashes filed in two counties can resolve months " +
        "and a meaningful margin apart.",
      "Trying cases in these specific rooms is what makes that predictable. We know " +
        "roughly how long a docket takes to reach trial, which defense firms settle at " +
        "the courthouse door, and how a particular panel tends to hear impairment " +
        "evidence.",
    ],
    courts: [
      {
        _key: "denver",
        n: "1",
        name: "Denver District Court",
        body: "2nd Judicial District. Urban jury pool and a crowded civil docket.",
      },
      {
        _key: "arapahoe",
        n: "2",
        name: "Arapahoe County District Court",
        body: "18th Judicial District, Centennial. Suburban panel, faster route to a trial date.",
      },
      {
        _key: "jefferson",
        n: "3",
        name: "Jefferson County District Court",
        body: "1st Judicial District, Golden. Conservative pool; damages proof has to be airtight.",
      },
      {
        _key: "adams",
        n: "4",
        name: "Adams County District Court",
        body: "17th Judicial District, Brighton. Heavy commercial-vehicle corridor, distinct venue rules.",
      },
    ],
  },

  related: {
    title: "Related",
    areasLabel: "Other practice areas",
    // All five have a live legacy URL, matched from `getPracticeAreaGroups()`.
    // Same mechanism as the 87 links the Practice Areas directory already
    // ships: live today, and live after cutover only once these pages are built
    // or redirected. This is the first of them.
    areas: [
      { _key: "truck", label: "Truck accidents", href: "/denver-truck-accident-lawyer" },
      {
        _key: "motorcycle",
        label: "Motorcycle accidents",
        href: "/motorcycle-accident-lawyer-denver",
      },
      {
        _key: "pedestrian",
        label: "Pedestrian accidents",
        href: "/denver-pedestrian-accident-lawyer",
      },
      {
        _key: "premises",
        label: "Premises liability",
        href: "/denver-premises-liability-lawyer",
      },
      {
        _key: "wrongful-death",
        label: "Wrongful death",
        href: "/denver-wrongful-death-lawyer",
      },
    ],
    articlesLabel: "Supporting articles",
    /**
     * Five titles with no destinations, and none of them matches a post among
     * the 167 in the scrape — searched by topic as well as by title. The
     * closest real articles are "Statute of Limitations for Personal Injury
     * Claims in Colorado" and "What If the Accident Is a Partially At-Fault Car
     * Accident?", which are different articles with different titles; pointing
     * the comp's label at either would be inventing a link.
     *
     * They ship with `href: null` and render as plain text, the same treatment
     * the Blog index gives its eight card-less entries and the directory gives
     * Legal Malpractice.
     * TODO(launch): commission these five, point them at the nearest real
     * posts under their own titles, or drop the column.
     */
    articles: [
      { _key: "deadlines", label: "Colorado filing deadlines", href: null },
      { _key: "statements", label: "Recorded statements", href: null },
      { _key: "medpay", label: "MedPay explained", href: null },
      {
        _key: "government",
        label: "Suing a government entity in Colorado",
        href: null,
      },
      { _key: "comparative", label: "How comparative fault works", href: null },
    ],
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
