// SANITY SWAP POINT — the 109 imported practice-area pages.
//
// The LIGHT template's content. Distinct from `carAccidents.ts`, which holds
// the one hand-authored `PracticeAreaDetail` behind the heavy 17-section kit;
// that stays reserved for special cases. These two never merge: a heavy detail
// page is seventeen typed sections of authored content, and this is a title, a
// body and a FAQ.
//
// The reading split below mirrors `getBlogPosts()` vs `getBlogPostArticles()`,
// and for the same reason recorded there: the city band renders up to 54 links,
// and pulling each one's 1,500-word body into memory to print its label would
// be absurd. `getPracticeAreaPages()` is the link shape; the body is fetched
// once, for the page being built.
import { getCollection } from "astro:content";
import { getCities } from "./cities";
import { practiceAreaPath, ROUTES } from "../lib/routePaths";
import { readTime } from "../lib/readTime";
import { FIRM, getReviewedBy, type PostByline } from "./blog";
import { getPracticeAreaDetails } from "./carAccidents";
import type { AreaGroup, AreaLink } from "./practiceAreas";
import type { PortableTextBlock, PortableTextNode } from "./portableText";

export interface PracticeAreaPage {
  _key: string;
  slug: string;
  /** The page's own H1. */
  title: string;
  /** The short directory form — "Brain Injuries", not "Denver Brain Injury
   *  Lawyer". What the bands and the sidebar print. */
  label: string;
  city: string;
  topic: string;
  /**
   * Reads as an ARTICLE, but the firm's own directory lists it as a practice
   * area — so it is imported as one and linked from the hub. Five of these, all
   * slip-and-fall. Carried on the link shape because the sidebar has to filter
   * on it and the directory must not.
   */
  resource: boolean;
  href: string;
}

export interface PracticeAreaFaq {
  _key: string;
  question: string;
  /** Portable Text, not a string — these answers carry lists and links. */
  answer: PortableTextBlock[];
}

/** The body shape, fetched only for the page being rendered. */
export interface PracticeAreaArticle {
  _key: string;
  slug: string;
  title: string;
  city: string;
  /** WordPress's body, with the two chrome sections below dropped. */
  body: PortableTextNode[];
  faqs: PracticeAreaFaq[];
  /** The reviewed-by band at the foot. Identical on all 109 today and DERIVED,
   *  not stored — the collection has no field for it, the same way WordPress
   *  has none for the blog's. In Sanity it becomes an overridable field, which
   *  is why it sits on the article rather than on the page copy. */
  factCheck: PortableTextBlock[];
  /** ISO, both. `updatedAt` is WordPress's `modified` and is what the meta line
   *  prints when it exists — see `AreaArticle`. */
  publishedAt: string;
  updatedAt?: string;
  /** "8 min read" — DERIVED from the body AFTER the sections above are dropped,
   *  never typed. See lib/readTime.ts. */
  readTime: string;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Slugs the heavy detail template already serves.
 *
 * SAME GUARD, SAME REASON as `handAuthoredSlugs()` in `blog.ts`. Both templates
 * route through `src/pages/[slug].astro`, and `denver-car-accident-lawyer`
 * would otherwise be claimed twice — the route throws on that rather than
 * picking one, which is correct and is exactly why this filters here. Keeping
 * the collision check meaning "a genuine conflict" is worth one extra getter.
 *
 * The importer ALSO excludes the slug (see `scripts/practice-area-pages.mjs`),
 * so today this is belt and braces. It stays because the two files can drift
 * and only one of them fails loudly.
 */
async function detailSlugs(): Promise<Set<string>> {
  return new Set((await getPracticeAreaDetails()).map((detail) => detail.slug));
}

/** Every imported page, in the link shape. Ordered by label so any slice of it
 *  reads alphabetically without a second sort at the call site. */
export async function getPracticeAreaPages(): Promise<PracticeAreaPage[]> {
  const [entries, claimed] = await Promise.all([getCollection("practiceAreas"), detailSlugs()]);

  return entries
    .filter((entry) => !claimed.has(entry.data.slug))
    .map((entry) => ({
      _key: entry.data.slug,
      slug: entry.data.slug,
      title: entry.data.title,
      label: entry.data.label,
      city: entry.data.city,
      topic: entry.data.topic,
      resource: entry.data.resource,
      href: practiceAreaPath(entry.data.slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * TWO BODY SECTIONS THE TEMPLATE DROPS, because the page already says both
 * things somewhere better:
 *
 *   "<City> <Area> Lawyer Near Me"  — the office address, phone and
 *                                     GeoCoordinates. The footer carries the
 *                                     address on every page. On three pages it
 *                                     is instead a list of sibling practice
 *                                     areas, which the sidebar and the city
 *                                     band both already carry.
 *   "<City> <Area> Resources"       — a bullet list of the firm's own blog
 *                                     articles. The sidebar's Related articles
 *                                     card is that list.
 *
 * DROPPED IN THE GETTER, NOT IN THE CONTENT FILES. `content.config.ts` states
 * the rule: where the live WordPress data and the built site's shape disagree,
 * the files keep WordPress's version and the getter coalesces — because a GROQ
 * projection is what does the coalescing after the swap. It also means
 * re-running the importer cannot quietly put them back.
 *
 * WRITTEN DOWN, NOT MATCHED BY PATTERN, and that is the whole point. A pattern
 * on "Near Me" and "Resources" catches fourteen headings, and one of them —
 * `thornton-bicycle-accident-lawyer`'s "Bicycle Accident Resources in Thornton,
 * Colorado" — is not this chrome at all. It is unique editorial copy pointing
 * at Bike Thornton and Bicycle Colorado, with their addresses and phone
 * numbers, and neither reason above covers it. Dropping it would delete real
 * content on a word match. So candidates are listed explicitly and a candidate
 * in neither list THROWS, the same guarantee `PRACTICE_AREA_PAGES` gives the
 * importer.
 *
 * A section runs from its h2 to the next h2, or to the end of the body.
 */
const DROPPED_SECTIONS: Record<string, string[]> = {
  "denver-bicycle-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
  "denver-brain-injury-lawyer": ["Brain Injury Resources", "Denver Medical Malpractice Lawyer Near Me"],
  "denver-burn-injury-attorney": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-drunk-driving-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
  "denver-medical-malpractice-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-pedestrian-accident-lawyer": ["Denver Personal Injury Lawyer Near Me"],
  "denver-spinal-cord-injury-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
  "denver-truck-accident-lawyer": ["Denver Truck Accident Lawyer Near Me", "Denver Truck Accident Resources"],
  "thornton-car-accident-attorney": ["Thornton Car Accident Resources"],
  "thornton-personal-injury-attorney": ["Thornton Personal Injury Resources"],
  "thornton-wrongful-death-lawyer": ["Thornton Wrongful Death Resources"],
};

/**
 * A heading dropped on EVERY page that carries it, matched in full rather than
 * by pattern — which is why it needs no per-slug list.
 *
 * "Awards and Accolades" is the firm's six award badges, byte-identical on all
 * 30 pages that have it: an h2 and six `<img>`s, no prose. **`AwardsBar` now
 * renders those same six badges under the article**, so leaving them in the
 * body shows them twice on the same page. That band is what replaced them.
 *
 * SAFE TO MATCH GLOBALLY, where "Near Me" and "Resources" were not: this is an
 * exact whole-heading match on a string with one meaning, not two words that
 * happen to appear in unrelated editorial copy. If a page ever heads real
 * content with this exact phrase, that is the day it goes back to a per-slug
 * list.
 */
const DROPPED_EVERYWHERE = ["Awards and Accolades"];

/** Headings the pattern below flags that are NOT chrome, with the reason. */
const KEPT_SECTIONS: Record<string, string[]> = {
  "thornton-bicycle-accident-lawyer": [
    // Bike Thornton and Bicycle Colorado, with addresses and phone numbers.
    // Third-party civic resources, not the firm's own article list.
    "Bicycle Accident Resources in Thornton, Colorado",
  ],
};

/** What makes a heading a CANDIDATE. Never what makes it droppable. */
const CHROME_HEADING = /\bnear me\b|\bresources\b/i;

const headingText = (node: PortableTextNode): string =>
  node._type === "block" && (node as PortableTextBlock).style === "h2"
    ? ((node as PortableTextBlock).children ?? []).map((child) => child.text).join("").trim()
    : "";

function dropChromeSections(slug: string, body: PortableTextNode[]): PortableTextNode[] {
  const drop = DROPPED_SECTIONS[slug] ?? [];
  const keep = KEPT_SECTIONS[slug] ?? [];
  const out: PortableTextNode[] = [];
  const hit = new Set<string>();

  let dropping = false;
  for (const node of body) {
    const heading = headingText(node);
    if (heading) {
      dropping = false;
      if (DROPPED_EVERYWHERE.includes(heading)) {
        dropping = true;
      } else if (CHROME_HEADING.test(heading)) {
        if (drop.includes(heading)) {
          dropping = true;
          hit.add(heading);
        } else if (!keep.includes(heading)) {
          throw new Error(
            `${slug}: body heading "${heading}" looks like the "Near Me" / ` +
              `"Resources" chrome the template drops, but is in neither ` +
              `DROPPED_SECTIONS nor KEPT_SECTIONS in data/practiceAreaPages.ts. ` +
              `Add it to one — silently keeping it ships chrome, silently ` +
              `dropping it deletes content.`
          );
        }
      }
    }
    if (!dropping) out.push(node);
  }

  // A declared section that is not there any more means the source changed and
  // the list did not. Louder than leaving a stale entry to rot.
  const missing = drop.filter((heading) => !hit.has(heading));
  if (missing.length) {
    throw new Error(
      `${slug}: DROPPED_SECTIONS names ${missing.map((m) => `"${m}"`).join(", ")}, ` +
        `which the body no longer contains. Remove the entry, or fix the heading.`
    );
  }

  return out;
}

/** The bodies, for `getStaticPaths`. */
export async function getPracticeAreaArticles(): Promise<PracticeAreaArticle[]> {
  const [entries, claimed, factCheck] = await Promise.all([
    getCollection("practiceAreas"),
    detailSlugs(),
    getReviewedBy(),
  ]);

  return entries
    .filter((entry) => !claimed.has(entry.data.slug))
    .map((entry) => {
      const body = dropChromeSections(entry.data.slug, entry.data.body);

      return {
        _key: entry.data.slug,
        slug: entry.data.slug,
        title: entry.data.title,
        city: entry.data.city,
        body,
        faqs: entry.data.faqs,
        factCheck,
        publishedAt: entry.data.publishedAt,
        updatedAt: entry.data.modifiedAt,
        // AFTER the drop, so the figure describes what the reader actually gets.
        readTime: readTime(body),
        metaTitle: entry.data.metaTitle,
        metaDescription: entry.data.metaDescription,
      };
    });
}

/** How many links the sidebar's Practice Areas card carries.
 *
 *  Denver has 54 siblings. A card listing all of them is not a sidebar — it is
 *  a second page in a 419px column, and it would push the Related-articles card
 *  below it out of reach. Twelve fills the card and stops. */
const SIDEBAR_AREA_LIMIT = 12;

/** A sidebar row. `current` marks the page being rendered, which the card now
 *  includes rather than drops — see the getter. */
export type SidebarAreaLink = AreaLink & { current: boolean };

export interface SidebarAreas {
  /** "Denver Practice Areas" — the city's name in front, so the card says which
   *  city's list this is. Whole string, not a name the template interpolates. */
  title: string;
  items: SidebarAreaLink[];
  /** ALWAYS present, by request. It used to appear only when the city had more
   *  areas than the card holds, which meant the four-page cities offered no way
   *  to the full directory at all. */
  more: { label: string; href: string };
}

/**
 * The sidebar's Practice Areas card: this city's areas, capped, centred on the
 * page you are reading.
 *
 * `resource` PAGES ARE FILTERED OUT, and that is why the flag is on the link
 * shape. Five imported pages read as articles and were practice areas ONLY
 * because the firm's directory filed them so; they have since moved to the
 * blog, so nothing sets the flag today. The filter stays because the SHAPE
 * recurs and the next import may bring another.
 *
 * THE CURRENT PAGE IS IN THE LIST, HIGHLIGHTED, not dropped — by request. It
 * used to be excluded, which is what the live site does NOT do and what most
 * "related" modules do.
 *
 * WHICH FORCED A WINDOW RATHER THAN A HEAD. The card holds twelve and Denver
 * has 48: a plain `.slice(0, 12)` would drop the current page out of its own
 * card on 36 of them, and highlighting something that is not on screen is not a
 * highlight. So the slice is CENTRED on the current page and clamped at both
 * ends — the reader sees where they sit among the city's areas, with neighbours
 * either side, and `more` carries the rest. A city with twelve or fewer shows
 * all of them and the window never moves.
 */
export async function getPracticeAreaSidebarLinks(
  city: string,
  currentSlug: string
): Promise<SidebarAreas> {
  const [pages, cities] = await Promise.all([getPracticeAreaPages(), getCities()]);
  const inCity = pages.filter((page) => page.city === city && !page.resource);

  const cityName = cities.find((entry) => entry._key === city)?.name;
  if (!cityName) {
    throw new Error(
      `practice areas: city "${city}" is not in getCities(). Add it there or ` +
        `fix the manifest in scripts/practice-area-pages.mjs.`
    );
  }

  /* Clamped so the window never runs off either end: at the head it starts at
     0, at the tail it ends on the last entry, and in between the current page
     sits in the middle. `Math.max(0, …)` covers the city that is shorter than
     the cap, where `length - LIMIT` is negative. */
  const at = inCity.findIndex((page) => page.slug === currentSlug);
  const half = Math.floor((SIDEBAR_AREA_LIMIT - 1) / 2);
  const last = Math.max(0, inCity.length - SIDEBAR_AREA_LIMIT);
  const start = at < 0 ? 0 : Math.min(Math.max(0, at - half), last);

  return {
    title: `${cityName} Practice Areas`,
    items: inCity
      .slice(start, start + SIDEBAR_AREA_LIMIT)
      .map((page) => ({
        _key: page.slug,
        label: page.label,
        href: page.href,
        current: page.slug === currentSlug,
      }) satisfies SidebarAreaLink),
    more: { label: "View All Practice Areas", href: ROUTES.practiceAreas },
  };
}

export interface PracticeAreaPageCopy {
  /**
   * The line above the H1, in the slot where the post page prints its category.
   *
   * A CONSTANT — the firm's tagline, the same on all 109 — and it has been three
   * other things first: the city, then "Practice Area", then the city again.
   * The city went because it stays in the H1 as well, so the two stuttered on
   * the 84 titles that open with it; trimming the TITLE instead was declined as
   * an SEO change on 109 ranking pages. See HANDOFF.
   *
   * NOT A CATEGORY, which is what this slot holds on the post page — these are
   * service pages and have no taxonomy above them.
   */
  eyebrow: string;
  /** The meta line above the contents box. `author` is the firm — the same
   *  byline every post carries; see `FIRM` in `blog.ts`. */
  meta: {
    author: PostByline;
    writtenByLabel: string;
    /** Which one prints depends on whether the page has a `modified` date. */
    updatedLabel: string;
    postedLabel: string;
  };
  contentsLabel: string;
  relatedSidebarLabel: string;
  faqsTitle: string;
  /** Over the reviewed-by band at the foot. The body is per-page — see
   *  `PracticeAreaArticle.factCheck`. */
  factCheckLabel: string;
  form: {
    title: string;
    lede: string;
    submitLabel: string;
    disclaimer: string;
  };
}

/**
 * The template's fixed copy.
 *
 * Mirrors `getBlogPostPage()` including its form block, because the two
 * sidebars are the same affordance and their labels should not diverge by
 * accident. The Practice Areas card's heading is NOT here — it names the city
 * ("Denver Practice Areas"), so it is per-page and comes from
 * `getPracticeAreaSidebarLinks()` with the links it heads.
 *
 * The hero and the meta line are this template's, not the post's: the post page
 * has no hero at all, and its byline names a reviewer these pages do not have.
 */
export async function getPracticeAreaPageCopy(): Promise<PracticeAreaPageCopy> {
  return {
    eyebrow: "Tough lawyers for tough cases",
    meta: {
      author: FIRM,
      writtenByLabel: "Written by",
      updatedLabel: "Updated",
      postedLabel: "Posted",
    },
    contentsLabel: "On this page",
    relatedSidebarLabel: "Related articles",
    faqsTitle: "Frequently asked questions",
    factCheckLabel: "Fact-checked",
    form: {
      title: "Get a free case review",
      lede: "Tell us what happened. An attorney reviews every request personally.",
      submitLabel: "Review my case",
      disclaimer: "Free & confidential",
    },
  };
}

/**
 * BUILD-TIME JOIN ASSERTION.
 *
 * The Practice Areas directory (`getPracticeAreaGroups()`) and this collection
 * are two hand-maintained lists of the same thing, and drift between them is
 * silent in both directions: a directory entry with no page is a 404 the build
 * happily ships, and a page in no group is a page the directory does not list.
 *
 * THIS CHECKS ONE OF THOSE DIRECTIONS. It walks directory entries looking for a
 * missing page. It does NOT walk pages looking for a missing group, and this
 * comment used to claim it did — four built pages are absent from the directory
 * today (Defective Helmets, Autonomous Vehicle Accidents, Drunk Driving
 * Accidents, Taxi Accidents, all Denver) and this function has never had a word
 * to say about them.
 *
 * The reverse check is NOT simply missing: the directory is deliberately synced
 * to the firm's live hub rather than to this collection, so a page the hub does
 * not list is a content decision, not a bug — and a check that threw on it
 * would fail the build on the firm's own choice. `src/pages/sitemap.astro`
 * covers the gap where it actually matters, by listing the collection rather
 * than the directory. TODO(launch): the four want a ruling.
 *
 * Throwing at build time is the established pattern here — `[slug].astro`
 * already does it for a missing team member, award and video review, each with
 * a message naming both files.
 *
 * Slugs are derived from the href rather than stored on `AreaLink`, because
 * `practiceAreaPath(slug)` is `/${slug}/` and adding a redundant field to all
 * 109 directory entries would be 109 chances to mistype one.
 */
export async function assertDirectoryJoin(groups: AreaGroup[]): Promise<void> {
  const [pages, claimed] = await Promise.all([getPracticeAreaPages(), detailSlugs()]);
  const built = new Set(pages.map((page) => page.slug));

  const dangling: string[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.href) continue; // deliberately unlinked, renders as plain text
      if (item.href === ROUTES.home) continue; // the Denver PI overview is the homepage
      const slug = item.href.replace(/^\/+|\/+$/g, "");
      if (!built.has(slug) && !claimed.has(slug)) dangling.push(`${group.title} › ${item.label} → ${item.href}`);
    }
  }

  if (dangling.length) {
    throw new Error(
      `practice areas: ${dangling.length} directory entr${dangling.length === 1 ? "y" : "ies"} ` +
        `point at a page this build does not serve:\n  ${dangling.join("\n  ")}\n` +
        `Either add the slug to PRACTICE_AREA_PAGES in scripts/practice-area-pages.mjs and re-import, ` +
        `or set its href to null in src/data/practiceAreas.ts.`
    );
  }
}
