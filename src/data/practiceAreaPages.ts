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
import { practiceAreaPath, ROUTES } from "../lib/routePaths";
import { getCities, getTopics } from "./cities";
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
  body: PortableTextNode[];
  faqs: PracticeAreaFaq[];
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
      href: practiceAreaPath(entry.data.slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** The bodies, for `getStaticPaths`. */
export async function getPracticeAreaArticles(): Promise<PracticeAreaArticle[]> {
  const [entries, claimed] = await Promise.all([getCollection("practiceAreas"), detailSlugs()]);

  return entries
    .filter((entry) => !claimed.has(entry.data.slug))
    .map((entry) => ({
      _key: entry.data.slug,
      slug: entry.data.slug,
      title: entry.data.title,
      city: entry.data.city,
      body: entry.data.body,
      faqs: entry.data.faqs,
      metaTitle: entry.data.metaTitle,
      metaDescription: entry.data.metaDescription,
    }));
}

/**
 * The city band's data — every OTHER practice area in this page's city,
 * grouped by topic.
 *
 * Returns `AreaGroup[]`, the shape `AreaDirectory` already takes, so the band
 * and the Practice Areas directory render through one component instead of two
 * that drift.
 *
 * THE CURRENT PAGE IS DROPPED. The live site's own band does not do this — it
 * links "Motorcycle Accidents" to the motorcycle page you are already on — and
 * that is one of several reasons the band is generated here rather than ported.
 * The others: it is hand-maintained, alphabetised wrong in two places, omits a
 * dozen live Denver pages, and on six of eight Greeley / Fort Collins / Grand
 * Junction pages lists a DIFFERENT city's practice areas entirely.
 *
 * Empty topics are dropped rather than rendered as a heading over nothing.
 */
export async function getCityAreaGroups(city: string, excludeSlug: string): Promise<AreaGroup[]> {
  const [pages, topics] = await Promise.all([getPracticeAreaPages(), getTopics()]);
  const siblings = pages.filter((page) => page.city === city && page.slug !== excludeSlug);

  return topics
    .map((topic) => ({
      _key: topic._key,
      title: topic.title,
      items: siblings
        .filter((page) => page.topic === topic._key)
        // KEYED ON THE SLUG. `AreaLink._key` is not globally unique in the
        // directory data — `"car"` appears in ten groups — so a flattened
        // list keyed the other way collides.
        .map((page) => ({ _key: page.slug, label: page.label, href: page.href }) satisfies AreaLink),
    }))
    .filter((group) => group.items.length > 0);
}

/** How many links the sidebar's Practice Areas card carries.
 *
 *  Denver has 54 siblings. A card listing all of them is not a sidebar — it is
 *  a second page in a 419px column, and it would push the Related-articles card
 *  below it out of reach. Twelve fills the card and stops. */
const SIDEBAR_AREA_LIMIT = 12;

export interface SidebarAreas {
  items: AreaLink[];
  /** Shown when the city has more than the card holds. */
  more: { label: string; href: string } | null;
}

/**
 * The sidebar's Practice Areas card: this city's areas, capped.
 *
 * Same city as the band below, deliberately — the two answer the same question
 * at two scales, and a sidebar advertising Denver while the foot lists Thornton
 * would read as a bug.
 */
export async function getPracticeAreaSidebarLinks(
  city: string,
  excludeSlug: string
): Promise<SidebarAreas> {
  const pages = await getPracticeAreaPages();
  const siblings = pages.filter((page) => page.city === city && page.slug !== excludeSlug);

  return {
    items: siblings
      .slice(0, SIDEBAR_AREA_LIMIT)
      .map((page) => ({ _key: page.slug, label: page.label, href: page.href }) satisfies AreaLink),
    more:
      siblings.length > SIDEBAR_AREA_LIMIT
        ? { label: "All practice areas", href: ROUTES.practiceAreas }
        : null,
  };
}

export interface PracticeAreaPageCopy {
  contentsLabel: string;
  areasLabel: string;
  relatedSidebarLabel: string;
  faqsTitle: string;
  /** Sits over the city band's title. The title itself is per-city and comes
   *  from `getCityBandTitles()`. */
  bandEyebrow: string;
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
 * accident. `areasLabel` is the one that differs — this card lists practice
 * areas where the post's lists categories.
 */
export async function getPracticeAreaPageCopy(): Promise<PracticeAreaPageCopy> {
  return {
    contentsLabel: "On this page",
    areasLabel: "Practice areas",
    relatedSidebarLabel: "Related articles",
    faqsTitle: "Frequently asked questions",
    bandEyebrow: "How else we can help",
    form: {
      title: "Get a free case review",
      lede: "Tell us what happened. An attorney reviews every request personally.",
      submitLabel: "Review my case",
      disclaimer: "Free & confidential",
    },
  };
}

/**
 * Every city band title, keyed by city.
 *
 * Resolved here rather than in the component because no component owns content
 * — the same rule that keeps `bandTitle` a whole string in `cities.ts` instead
 * of a name the template interpolates.
 */
export async function getCityBandTitles(): Promise<Map<string, string>> {
  return new Map((await getCities()).map((city) => [city._key, city.bandTitle]));
}

/**
 * BUILD-TIME JOIN ASSERTION.
 *
 * The Practice Areas directory (`getPracticeAreaGroups()`) and this collection
 * are two hand-maintained lists of the same thing, and drift between them is
 * silent in both directions: a directory entry with no page is a 404 the build
 * happily ships, and a page in no group is a page nothing links to.
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
