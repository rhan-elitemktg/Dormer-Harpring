// The blog index at /news.
//
// SANITY SWAP POINT — and the one that introduces the site's first real
// COLLECTION with its own detail pages. `blogPost` becomes a document type with
// a slug, a datetime, a reference to the team member who reviewed it, and a
// reference to a `blogCategory`; `getBlogPosts()` becomes one GROQ projection
// ordered by `publishedAt desc`. The shapes below are already what that
// projection returns: references arrive resolved and flattened to
// `{ name, href }`, the category to `{ title, slug }`.
//
// Kept apart from `news.ts` deliberately, and for the reason that module
// already states: `newsMention` (press coverage, pointing off-site) and
// `blogPost` (167 of them on the legacy site, pointing in-site) are two
// collections, not one type with a flag. `getInsightPosts()` over there is the
// homepage's four-card teaser and stays the homepage's; four of its records
// reappear here only because the designer used the same placeholder articles in
// both comps.
//
// WHERE THIS CONTENT COMES FROM. The Blog comp's feed is not invented — its
// featured post and first four cards are the real top of the live blog, with
// the same titles, dates and reviewer as `/news` pages 1–2 in the scrape. Those
// five carry their legacy slugs, so their links resolve. The remaining eight
// the designer wrote: no post with those titles or dates exists anywhere in the
// 167, so they have no destination and carry `href: null` — the same treatment
// the Practice Areas directory gives the three entries with no page. See the
// TODO(launch) on `getBlogPosts()`.
import type { ImageMetadata } from "astro";
import { getTeam } from "./team";
import { pt, type PortableTextBlock } from "./portableText";
import { ROUTES, blogPath } from "../lib/routePaths";
import consult from "../assets/blog/consult.jpg";
import boardroom from "../assets/about/boardroom.jpg";
import bicycle from "../assets/home/practice-bicycle.jpg";
import brainInjury from "../assets/home/practice-brain-injury.jpg";
import burns from "../assets/home/practice-burns.jpg";
import carAccident from "../assets/home/practice-car-accident.jpg";
import dogBite from "../assets/home/practice-dog-bite.jpg";
import motorcycle from "../assets/home/practice-motorcycle.jpg";
import personalInjury from "../assets/home/practice-personal-injury.jpg";
import slipAndFall from "../assets/home/practice-slip-and-fall.jpg";
import truck from "../assets/home/practice-truck.jpg";
import wrongfulDeath from "../assets/home/practice-wrongful-death.jpg";

/** A person or the firm, credited in a post's byline. Pre-resolved, because in
 *  Sanity these are references and the projection dereferences them. */
export interface PostByline {
  name: string;
  href: string;
}

export interface BlogCategory {
  _key: string;
  title: string;
  /**
   * The legacy WordPress category slug, read off the scrape's `/category/*`
   * directories rather than derived from the title — `Auto Insurance` is
   * `auto-insurance-accident-claims` there, and 167 posts' archive URLs depend
   * on it. Nothing links to `/category/<slug>` yet (those pages are not built),
   * but the tab filter keys off it and the CMS phase will.
   */
  slug: string;
}

export interface BlogPost {
  _key: string;
  title: string;
  excerpt: string;
  /**
   * ISO date, NOT the display string `news.ts` uses for press mentions. A press
   * mention's date is a label an editor types; a post's is real data — it
   * orders the feed, and the post template's JSON-LD and the sitemap both need
   * it machine-readable. Formatted for display by `formatPostDate`.
   */
  publishedAt: string;
  category: BlogCategory;
  /**
   * Card art. The comp draws these from the practice-area photography and picks
   * them loosely — the uninsured-motorist card gets the dog-bite photograph —
   * so they are decorative, and the cards render them with an empty `alt`.
   */
  image: ImageMetadata;
  author: PostByline;
  reviewer: PostByline;
  /** `null` for a post with no page. The card then renders without a link. */
  href: string | null;
}

export interface FeaturedPost extends BlogPost {
  /** The featured block shows a real photograph, so this one is described. */
  imageAlt: string;
}

export interface BlogPageCopy {
  eyebrow: string;
  title: string;
  /** Portable Text because that is what `PageHeader` takes — these ledes carry
   *  inline links on other pages, and the field type is shared. */
  lede: PortableTextBlock[];
  /** Above the category tabs. */
  categoryLabel: string;
  allLabel: string;
  featuredBadge: string;
  readMoreLabel: string;
  loadMoreLabel: string;
  /** Shown when a category filter matches nothing in the feed. */
  emptyLabel: string;
}

export async function getBlogPage(): Promise<BlogPageCopy> {
  return {
    eyebrow: "News & insights",
    title: "Our blog.",
    lede: pt(
      "Plain-English answers on insurance, injuries, and what actually happens " +
        "after a crash in Colorado — written by the lawyers who try these cases."
    ),
    categoryLabel: "Select category",
    allLabel: "All posts",
    featuredBadge: "Featured post",
    readMoreLabel: "Read more",
    loadMoreLabel: "Load more posts",
    emptyLabel: "No posts in this category yet.",
  };
}

/**
 * The tab row, in the comp's order. Six entries, of which the first is the
 * unfiltered state — it carries no slug because there is no `/category/all`.
 *
 * These are the SITE's categories, not a summary of the twelve posts below:
 * Premises Liability is here because the blog has that archive, and matches
 * only the featured post in the current feed. That is an artifact of a
 * placeholder feed, not of the tab row — the real archive has posts in all six.
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  return [
    { _key: "auto-accident", title: "Auto Accident", slug: "auto-accident" },
    { _key: "personal-injury", title: "Personal Injury", slug: "personal-injury" },
    { _key: "product-liability", title: "Product Liability", slug: "product-liability" },
    { _key: "premises-liability", title: "Premises Liability", slug: "premises-liability" },
    { _key: "trials", title: "Trials", slug: "trials" },
  ];
}

const CATEGORIES: Record<string, BlogCategory> = {
  autoAccident: { _key: "auto-accident", title: "Auto Accident", slug: "auto-accident" },
  autoInsurance: {
    _key: "auto-insurance",
    title: "Auto Insurance",
    slug: "auto-insurance-accident-claims",
  },
  bike: { _key: "bike-accidents", title: "Bike Accidents", slug: "bike-accidents" },
  daycare: { _key: "daycare-injury", title: "Daycare Injury", slug: "daycare-injury" },
  laws: { _key: "laws", title: "Laws", slug: "laws" },
  personalInjury: {
    _key: "personal-injury",
    title: "Personal Injury",
    slug: "personal-injury",
  },
  premises: {
    _key: "premises-liability",
    title: "Premises Liability",
    slug: "premises-liability",
  },
  product: {
    _key: "product-liability",
    title: "Product Liability",
    slug: "product-liability",
  },
  trials: { _key: "trials", title: "Trials", slug: "trials" },
};

/**
 * The byline. Both halves are references in the CMS, so both are resolved here
 * rather than typed as strings on each post — which also means the reviewer's
 * name can never drift from the roster. It does already: the comp writes
 * "KC Harpring" and the live site "KC Harping", where the firm's own roster
 * says "K.C. Harpring". The roster wins.
 */
async function byline(memberKey: string): Promise<PostByline> {
  const member = (await getTeam()).find((person) => person._key === memberKey);
  if (!member?.href) {
    throw new Error(`blog: no team member with a profile for "${memberKey}"`);
  }
  return { name: member.name, href: member.href };
}

/** Every post is written by the firm and reviewed by an attorney — the live
 *  site's byline convention, which the comp reproduces on all thirteen cards. */
const FIRM: PostByline = { name: "Dormer Harpring", href: ROUTES.attorneys };

export async function getFeaturedPost(): Promise<FeaturedPost> {
  return {
    _key: "trampoline-waiver",
    title: "Can you sue a trampoline park if you signed a waiver?",
    excerpt:
      "In Colorado a signed waiver does not close the door on every injury " +
      "claim. Courts will not enforce a waiver that shields grossly negligent " +
      "conduct, and one that is unclear or rushed at check-in may not hold up " +
      "at all.",
    publishedAt: "2026-06-23",
    category: CATEGORIES.premises,
    image: consult,
    imageAlt: "Attorney meeting with a client",
    author: FIRM,
    reviewer: await byline("k-c-harpring"),
    href: blogPath("can-you-sue-a-trampoline-park-if-you-signed-a-waiver"),
  };
}

/**
 * The twelve cards below the featured block, newest first.
 *
 * TODO(launch): THE LAST EIGHT HAVE NO PAGE AND NO SOURCE. Posts 1–4 are real —
 * they are the live blog's June 17 → June 1 entries and keep their legacy
 * slugs, so those four links resolve today and keep resolving after cutover.
 * Posts 5–12 are copy the designer wrote for the comp: their titles appear
 * nowhere in the 167 legacy posts, and their dates (May 22 → Feb 11, 2026)
 * belong to different real posts. Four of them are the same placeholder
 * articles the homepage's insights tab carries. They ship with `href: null`,
 * so their cards render without a link rather than as dead ones. Replace them
 * with real posts, or drop them, before launch.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const kc = await byline("k-c-harpring");
  const sean = await byline("sean-dormer");

  return [
    {
      _key: "daycare-injuries",
      title: "Common daycare injuries",
      excerpt:
        "Daycare injuries range from scrapes to broken bones and head trauma. " +
        "Playground equipment, poor supervision, and unsecured furniture drive " +
        "most of the serious ones — and Denver families often have legal options.",
      publishedAt: "2026-06-17",
      category: CATEGORIES.daycare,
      image: personalInjury,
      author: FIRM,
      reviewer: kc,
      href: blogPath("common-daycare-injuries"),
    },
    {
      _key: "dropped-helmets",
      title: "Are helmets safe to use after they have been dropped?",
      excerpt:
        "A helmet’s foam liner compresses permanently once it absorbs impact, " +
        "and the outer shell rarely shows it. Any crash is reason enough to " +
        "replace it, no matter how minor it felt.",
      publishedAt: "2026-06-11",
      category: CATEGORIES.bike,
      image: bicycle,
      author: FIRM,
      reviewer: kc,
      href: blogPath("are-helmets-safe-to-use-after-theyve-been-dropped"),
    },
    {
      _key: "pressure-cookers",
      title: "Are pressure cookers dangerous?",
      excerpt:
        "When a safety mechanism fails, built-up steam has nowhere to go. " +
        "Burns, lacerations, and permanent scarring follow — and Colorado gives " +
        "you two years to bring a claim.",
      publishedAt: "2026-06-05",
      category: CATEGORIES.product,
      image: burns,
      author: FIRM,
      reviewer: kc,
      href: blogPath("dangers-of-pressure-cookers"),
    },
    {
      _key: "product-defects",
      title: "What are common types of product defects?",
      excerpt:
        "Design, manufacturing, and marketing defects are the three categories " +
        "courts recognize. Liability can reach designers, assemblers, " +
        "wholesalers, and retailers alike — and preserving the product matters.",
      publishedAt: "2026-06-01",
      category: CATEGORIES.product,
      image: slipAndFall,
      author: FIRM,
      reviewer: kc,
      href: blogPath("what-are-common-types-of-product-defects"),
    },
    {
      _key: "adjusters",
      title: "Talking to adjusters: what not to say",
      excerpt:
        "The first call from an insurer is evidence gathering, not a courtesy. " +
        "Here is what a recorded statement is really for, the questions built " +
        "to shrink your claim, and what to say instead.",
      publishedAt: "2026-05-22",
      category: CATEGORIES.autoInsurance,
      image: carAccident,
      author: FIRM,
      reviewer: sean,
      href: null,
    },
    {
      _key: "claim-worth",
      title: "What is my personal injury claim worth?",
      excerpt:
        "Medical bills are only the starting point. Lost wages, future care, " +
        "and pain and suffering all carry value — and the first offer is almost " +
        "never that number.",
      publishedAt: "2026-05-08",
      category: CATEGORIES.personalInjury,
      image: truck,
      author: FIRM,
      reviewer: kc,
      href: null,
    },
    {
      _key: "first-48",
      title: "What to do in the first 48 hours after a crash",
      excerpt:
        "The evidence that decides your case disappears fast. A short, " +
        "practical checklist for the two days that matter most — even if you " +
        "feel fine.",
      publishedAt: "2026-04-24",
      category: CATEGORIES.autoAccident,
      image: motorcycle,
      author: FIRM,
      reviewer: sean,
      href: null,
    },
    {
      _key: "will-it-go-to-trial",
      title: "Will my case actually go to trial?",
      excerpt:
        "Most cases settle. But a firm that is genuinely willing to try one is " +
        "exactly what makes an insurer pay full value — here is how that " +
        "leverage works.",
      publishedAt: "2026-04-09",
      category: CATEGORIES.trials,
      image: boardroom,
      author: FIRM,
      reviewer: kc,
      href: null,
    },
    {
      _key: "how-long-to-file",
      title: "How long do I have to file a claim in Colorado?",
      excerpt:
        "Two years for most injuries, three for motor vehicle crashes — with " +
        "exceptions that shorten the window sharply when a government entity is " +
        "involved.",
      publishedAt: "2026-03-26",
      category: CATEGORIES.laws,
      image: wrongfulDeath,
      author: FIRM,
      reviewer: sean,
      href: null,
    },
    {
      _key: "invisible-brain-injury",
      title: "Proving a brain injury insurers say is not there",
      excerpt:
        "Concussions rarely show on a scan. Here is the medical and " +
        "testimonial evidence that makes an invisible injury undeniable to a " +
        "jury.",
      publishedAt: "2026-03-12",
      category: CATEGORIES.personalInjury,
      image: brainInjury,
      author: FIRM,
      reviewer: kc,
      href: null,
    },
    {
      _key: "um-uim",
      title: "Uninsured and underinsured motorist coverage, explained",
      excerpt:
        "The driver who hit you may carry the state minimum. Your own policy " +
        "may cover the gap — and most people never realize they can use it.",
      publishedAt: "2026-02-26",
      category: CATEGORIES.autoInsurance,
      image: dogBite,
      author: FIRM,
      reviewer: sean,
      href: null,
    },
    {
      _key: "who-pays-medical-bills",
      title: "Who pays my medical bills while the case is pending?",
      excerpt:
        "Health insurance, MedPay, and treatment on a lien. The options that " +
        "let you get care now instead of waiting on a settlement.",
      publishedAt: "2026-02-11",
      category: CATEGORIES.personalInjury,
      image: consult,
      author: FIRM,
      reviewer: kc,
      href: null,
    },
  ];
}
