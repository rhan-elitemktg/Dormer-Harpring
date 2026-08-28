// The practice-area DETAIL page — Car Accidents.
//
// SANITY: reads the `carAccidentsPage` singleton, fifteen named sections of it.
// `getPracticeAreaDetails()` returns an ARRAY of one because `[slug].astro`
// walks it to build paths — the same contract `getBlogPostArticles()` holds, and
// the shape a second detail page would slot into.
//
// BUILT FROM THE SECOND DESIGN OF THIS PAGE. The first was 31 sections, 23
// `sc-for` loops and 105 placeholders; this one is 17 sections, 10 loops and 75.
// Nine sections were cut outright (the glove-box card, the four long insurance
// Q&As, the damages grid, the adjuster-tactics band, the cost and court
// answers, the evidence band, the venue list), three were replaced by teasers
// pointing at articles, and two are new.
//
// ITS `renderVals()` STILL DEFINES FIFTEEN ARRAYS THE MARKUP NEVER USED —
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
//
// WHAT THIS MODULE STILL OWNS AFTER PHASE 4, and why each one is here rather
// than in the Studio:
//
//   CA_SECTION_IDS       the in-page anchors. Read by the nav's hrefs AND by the
//                        sections' own `id` attributes — two things that must
//                        agree get one source, so the Studio stores which
//                        SECTION a nav item jumps to and this turns it into a
//                        href.
//   the slug and _key    routing. `routePaths.ts` owns URLs on this site, and a
//                        slug an editor could change is ~300 legacy redirects
//                        pointing at nothing.
//   four photographs     the hero, the art-directed "why us" pair and the
//                        timeline's backdrop. Band art, like every other page's
//                        — see the note in `aboutPage.ts`. The photographs that
//                        belong to CARDS (the two video posters, the two
//                        feature posters, the reviewer's portrait) did move.
//   the map's title      built from the firm's name. The literal carried a
//                        second copy of it, which is how a site ends up
//                        publishing two.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { CAR_ACCIDENTS_PAGE_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import { attorneyPath } from "../lib/routePaths";
import { getFirmDetails } from "./site";
import type { VideoRef } from "../lib/video";
// FOUR PHOTOGRAPHS THAT DID NOT MOVE — band art and an art-directed pair. The
// five that belong to cards are Sanity assets; see the header.
import heroPhoto from "../assets/practice/car-accident-hero.jpg";
import whyPhoto from "../assets/practice/why-attorneys-desktop.jpg";
import whyPhotoMobile from "../assets/practice/why-attorneys-mobile.jpg";
import consultPhoto from "../assets/blog/consult.jpg";

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

/** A video panel. Its poster is a card image and so a Sanity asset. */
export interface VideoPanel {
  poster: ImageMetadata | SanityImageSource;
  alt: string;
  title: string;
  length: string;
  /** Both panels still carry the stand-in id. The marker for that lives on the
   *  field in `schemaTypes/pages/carAccidentsPage.ts`, where it is edited — a
   *  second copy here is how closing one leaves the other behind. */
  video: VideoRef;
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
   * The "last reviewed" date is a field on the page document now, and its
   * `TODO(launch)` went with it — a marker belongs where the thing it marks is
   * edited, and carrying a second copy here is how closing one leaves the other
   * behind.
   */
  reviewer: {
    name: string;
    role: string;
    /** A larger crop than the roster's, so it is this page's own asset. */
    photo: ImageMetadata | SanityImageSource;
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
  /**
   * One paragraph. The comp drew two — a scene-setter ("Most people have never
   * done this before…") over this one — and the first is gone at Rhan's
   * request. This field was `ledeStrong`, which only meant anything in contrast
   * to the paragraph above it, and named a colour besides; the data layer does
   * not carry presentation.
   */
  lede: string;
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
    poster: ImageMetadata | SanityImageSource;
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
 * The one detail page there is.
 *
 * ITS SLUG AND ITS JOIN KEY ARE HERE, NOT IN SANITY. `[slug].astro` builds this
 * page's path from the slug and joins the two halves of the page on the key —
 * both are routing rather than content, and `routePaths.ts` owns URLs on this
 * site. A slug an editor could edit is ~300 legacy redirects pointing at
 * nothing, with a green build.
 */
const PAGE = {
  key: "car-accidents",
  // The live URL. `practiceAreaPath()` is `/${slug}` — see `routePaths.ts` on
  // why the flat WordPress shape is preserved.
  slug: "denver-car-accident-lawyer",
} as const;

export async function getPracticeAreaDetails(): Promise<PracticeAreaDetail[]> {
  const [page, firm] = await Promise.all([
    once("carAccidentsPage", async () =>
      required(await sanityClient.fetch(CAR_ACCIDENTS_PAGE_QUERY), "Car Accidents", "Pages")
    ),
    getFirmDetails(),
  ]);

  const seo = required(page.seo, "Car Accidents → Search listing");
  const reviewer = page.hero.reviewer;
  const reviewerKey = required(reviewer.memberKey, "the Car Accidents reviewer's team member");

  return [
    {
      _key: PAGE.key,
      slug: PAGE.slug,
      // The live page's own <title> is "Denver Car Accident Lawyer | Start Your
      // Claim | Available 24/7" — a WordPress SEO plugin string. `lib/seo.ts`
      // appends the firm name, so the suffix there would be a third clause.
      metaTitle: required(seo.metaTitle, "Car Accidents → meta title"),
      metaDescription: required(seo.metaDescription, "Car Accidents → meta description"),

      hero: {
        ...page.hero,
        trail: page.hero.trail.map((crumb) => ({ ...crumb, href: crumb.href ?? null })),
        proof: page.hero.proof.map(({ google, ...row }) => ({
          ...row,
          href: row.href ?? null,
          // Destructured out and re-added only when true: `google` is optional
          // on the interface and the projection returns null, and `{google &&
          // …}` in the component treats those two differently.
          ...(google ? { google: true } : {}),
        })),
        photo: heroPhoto,
        reviewer: {
          name: required(reviewer.name, "the Car Accidents reviewer's name"),
          role: required(reviewer.role, "the Car Accidents reviewer's role"),
          photo: reviewer.portrait,
          updated: reviewer.updated,
          // `k-c-harpring`, not `kc-harpring` — the slug the live site indexes,
          // and it comes off the roster rather than being typed twice.
          bioHref: attorneyPath(reviewerKey),
        },
      },

      /* THE NAV'S HREFS ARE BUILT HERE, from the section each item names. Both
         this and the sections' own `id` attributes read `CA_SECTION_IDS`, which
         is the whole reason the anchors are not stored: a projection must not
         become a second source for something two things have to agree about. */
      nav: {
        items: page.nav.items.map((item) => {
          const id = CA_SECTION_IDS[item.section as keyof typeof CA_SECTION_IDS];
          if (!id) {
            throw new Error(
              `carAccidents: the section nav has an item pointing at "${item.section}", which is ` +
                `not one of this page's sections. Known: ${Object.keys(CA_SECTION_IDS).join(", ")}.`
            );
          }
          return { _key: item._key, label: item.label, href: anchor(id) };
        }),
        ctaLabel: page.nav.ctaLabel,
      },

      triage: {
        ...page.triage,
        video: videoPanel(page.triage.video),
        rows: page.triage.rows.map((row) => ({
          ...row,
          tone: row.tone ?? undefined,
          tag: row.tag ?? undefined,
        })),
        sources: sourceNote(
          required(page.triage.sources, "the Recently-injured band's citations")
        ),
      },
      takeaways: page.takeaways,
      criteria: {
        ...page.criteria,
        video: videoPanel(page.criteria.video),
      },
      lawyers: {
        ...page.lawyers,
        attorneys: page.lawyers.attorneys.map((row) => ({
          _key: row._key,
          key: required(row.key, `the crash-lawyer card "${row._key}"'s team member`),
          cred: row.cred,
        })),
      },
      credentials: {
        ...page.credentials,
        badges: page.credentials.badges.map((badge) => ({
          _key: badge._key,
          awardKey: required(badge.awardKey, `the award badge "${badge._key}"`),
        })),
      },
      whyFirm: {
        ...page.whyFirm,
        photo: whyPhoto,
        photoMobile: whyPhotoMobile,
      },
      results: {
        ...page.results,
        stories: page.results.stories.map((story) => ({
          ...story,
          story: story.story ?? undefined,
          changed: story.changed ?? undefined,
          reviewKey: story.reviewKey ?? undefined,
        })),
      },
      timeline: {
        ...page.timeline,
        photo: consultPhoto,
      },
      crashTypes: {
        ...page.crashTypes,
        tiles: page.crashTypes.tiles.map((tile) => ({ ...tile, href: tile.href ?? null })),
      },
      denver: page.denver,
      checklistTeaser: {
        ...page.checklistTeaser,
        ctaHref: page.checklistTeaser.ctaHref ?? null,
      },
      faultTeaser: {
        ...page.faultTeaser,
        ctaHref: page.faultTeaser.ctaHref ?? null,
        scale: page.faultTeaser.scale ?? undefined,
        source: page.faultTeaser.source ? sourceNote(page.faultTeaser.source) : undefined,
      },
      more: {
        ...page.more,
        features: page.more.features.map((f) => ({ ...f, href: f.href ?? null })),
        cards: page.more.cards.map((c) => ({ ...c, href: c.href ?? null })),
      },
      closing: {
        ...page.closing,
        // Built from the firm's name, not stored. The literal carried a second
        // copy of it, which is how a site ends up publishing two.
        mapTitle: `${firm.name} — Denver office`,
      },
    },
  ];
}

/** Coalesce the optional halves of a citation on their own lines — a cast over
 *  the whole object would hide a projection returning null where the interface
 *  says undefined, and the two are not the same to `{note && …}`. */
function sourceNote(note: {
  label: string;
  items: { _key: string; label: string; note: string | null; href: string | null }[];
}): SourceNote {
  return {
    label: note.label,
    items: note.items.map((item) => ({
      _key: item._key,
      label: item.label,
      note: item.note ?? undefined,
      href: item.href ?? undefined,
    })),
  };
}

/** The projection nests the film one level deeper than the interface does. */
function videoPanel(panel: {
  poster: unknown;
  alt: string | null;
  title: string;
  length: string;
  video: { provider: "wistia"; id: string };
}): VideoPanel {
  return {
    poster: panel.poster as SanityImageSource,
    alt: panel.alt ?? "",
    title: panel.title,
    length: panel.length,
    video: panel.video,
  };
}

/** One page by slug, for a caller that already knows which it wants. */
export async function getPracticeAreaDetail(
  slug: string
): Promise<PracticeAreaDetail | undefined> {
  const details = await getPracticeAreaDetails();
  return details.find((detail) => detail.slug === slug);
}
