// The blog index at /news.
//
// SANITY-BACKED SINCE PHASE 3 — 186 `blogPost` documents and 23 `blogCategory`
// ones, the site's largest collection. Everything below is a projection over
// them: references arrive resolved and flattened to `{ name, href }`, the
// category to `{ title, slug }`.
//
// WHAT IS STILL CODE HERE, and why: the PAGE COPY (`getBlogPage()`,
// `getBlogPostPage()`), which is Phase 4; `FIRM`, the one byline every post
// shares; `reviewedBy()`, the fact-check sentence, which is derived per post
// rather than stored 186 times; and `AREA_TO_BLOG_CATEGORY`, which is an
// inferred lookup rather than content — see the note on it.
//
// Kept apart from `news.ts` deliberately, and for the reason that module
// already states: press coverage points off-site and blog posts point in-site,
// so they are two things rather than one type with a flag. They are not both
// collections, though — Phase 2f made the press mentions and the insight
// teasers arrays on the `homePage` document, because each renders on one page.
// The blog is the half that really is a collection: 186 posts across `/news`,
// every practice-area sidebar and every attorney bio. Phase 3.
//
// `getInsightTeasers()` over there is the homepage's four-card teaser and stays
// the homepage's; four of its records reappear here only because the designer
// used the same placeholder articles in both comps.
//
// WHERE THIS CONTENT CAME FROM. The comp's feed was twelve transcribed cards of
// which only four were real posts; the other eight were titles the designer
// invented and shipped with `href: null` so they rendered unlinked rather than
// dead. The WordPress import replaced all twelve, so every card leads somewhere
// and the tab row filters a real archive. Nothing here carries a null href now.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import {
  BLOG_ARTICLES_QUERY,
  BLOG_CATEGORIES_QUERY,
  BLOG_POSTS_QUERY,
  FEATURED_POST_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import { getTeam } from "./team";
import { pt, type PortableTextBlock, type PortableTextNode } from "./portableText";
import type { ContactBand } from "./contact";
import { ROUTES, blogPath } from "../lib/routePaths";
import { readTime } from "../lib/readTime";

/* THIRTEEN IMPORTS LEFT WITH PHASE 3b, and none of them was reported by
   anything. Twelve were practice-area photographs feeding a per-category
   fallback that had already been deleted — every post in a category got the
   same picture, so the cards looked duplicated because they were — plus
   `consult.jpg`, the featured panel's own art, which is a Sanity asset now.
   `getCollection`, `getFirmDetails` and `ptImage` went with the two
   hand-authored records that used them.

   None of the FILES left `src/assets/`. Eleven are still practice-area card art
   in `home.ts`, and `consult.jpg` is still a local import in `carAccidents.ts` —
   it is a Sanity asset AND a local import, which is exactly what `Picture`'s
   two branches are for. `npm run backup` is `--no-assets`, so git is the only
   copy of these originals outside Sanity either way.

   An unused module-level import is not an error, which is how this module once
   carried 1,054 lines of orphaned bio data for four commits. Sweep after every
   swap; `git grep` the symbol, and check the count is more than one — most of
   these also appear as substrings in `AREA_TO_BLOG_CATEGORY` below. */

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
   * The legacy WordPress category slug — NOT derived from the title. "Auto
   * Insurance & Accident Claims" is `auto-insurance-accident-claims` and "Jury
   * Trial Wins" is `verdicts`, so it cannot be generated from either end.
   *
   * Nothing links to `/category/<slug>` (those pages are not built), but 24
   * redirects in `redirects.ts` land on it and the tab filter matches on it.
   * That is why the schema's field carries a description saying so and
   * deliberately offers no "Generate from title" button.
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
  /**
   * THE post's category — one, not a list.
   *
   * WordPress lets a post carry several and 28 of the imported 186 do, but by
   * Rhan's direction a post belongs to exactly one here: the first its source
   * record lists. The content files keep every slug, because the getter is
   * where a projection narrows — see `getImportedPosts`.
   */
  category: BlogCategory;
  /**
   * Card art — the post's own featured image, or `null`.
   *
   * NULL FOR 125 OF THE 186, which have no featured image on the legacy site at
   * all. `PostThumb.astro` draws the branded placeholder for those. It used to
   * fall back to a practice-area photograph chosen by category, which gave every
   * post in a category the same picture — the cards looked duplicated because
   * they were.
   *
   * A SANITY ASSET SINCE PHASE 3b. `ImageMetadata` stays in the union because
   * `Picture` accepts either and a page-header photograph is still a local
   * import; nothing in this module produces one any more.
   *
   * Decorative either way, so the cards render it with an empty `alt`.
   */
  image: ImageMetadata | SanityImageSource | null;
  author: PostByline;
  reviewer: PostByline;
  /** `null` for a post with no page. The card then renders without a link. */
  href: string | null;
}

export interface FeaturedPost extends BlogPost {
  /** NARROWED from BlogPost's nullable: the featured panel is a photograph with
   *  copy over it, so there is no version of it without art. `getFeaturedPost()`
   *  throws rather than narrowing by cast. */
  image: ImageMetadata | SanityImageSource;
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
 * The tab row: every category a post actually LEADS with, ordered by how many
 * posts each holds.
 *
 * 22 TABS FROM 23 CATEGORY DOCUMENTS, NOT THE COMP'S SIX. `CategoryTabs.astro`
 * was already built to overflow into a horizontal scroll for exactly this — the
 * comp draws six and an editor will add more. Rhan's direction is that the row
 * scrolls rather than being capped or grouped.
 *
 * THE MISSING ONE IS `auto-insurance-accident-claims`, and it is structural
 * rather than a bug here. A post belongs to exactly ONE category — the first its
 * record lists — so a category no post leads with has no posts to filter to and
 * can never be reached. Thirteen posts carry that one second and none first.
 * Rendering a tab for it would open an empty panel, so the count follows the
 * leading category, not the collection. Give one of those 13 that category first
 * and the tab returns on its own; nothing here needs editing.
 *
 * ORDERED BY POST COUNT, DESCENDING. In a row that scrolls, order decides what a
 * reader meets before they interact: Auto Accident (63) and Personal Injury (34)
 * sit where the eye lands, and the single-post categories are the ones you
 * scroll for. Alphabetical would lead with Awards and Bike Accidents and bury
 * the two covering half the archive.
 *
 * THE COUNT IS GROQ'S; THE DECISIONS ARE HERE. `count()` per category is one
 * subquery in the same round trip and beats pulling 186 records back to length
 * an array. Dropping the empties and choosing the order are judgements with
 * their reasoning written above them, and a projection is the wrong home for a
 * decision explained somewhere else.
 *
 * `all` is not here — it is the sentinel the component renders itself, and there
 * is no `/category/all` behind it.
 *
 * `required()` cannot throw on a collection query: GROQ returns `[]` for a type
 * with no documents, never null. Kept for the shape every other collection
 * getter uses; the loud failure for a missing category is `getBlogPosts()`,
 * whose projection would hand a card no category at all.
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const rows = await once("blogCategories", async () =>
    required(await sanityClient.fetch(BLOG_CATEGORIES_QUERY), "Blog Categories", "Collections")
  );

  return rows
    .filter((row) => row.posts > 0)
    .sort((a, b) => b.posts - a.posts || a.title.localeCompare(b.title))
    // `posts` is a count for ordering, not something a tab renders. Dropped
    // here rather than left on the object: a field that reaches a component
    // gets used by one eventually.
    .map(({ posts: _count, ...category }) => category);
}

/**
 * The byline. Both halves are references in the CMS, so both are resolved here
 * rather than typed as strings on each post — which also means the reviewer's
 * name can never drift from the roster. It does already: the comp writes
 * "KC Harpring" and the live site "KC Harping", where the firm's own roster
 * says "K.C. Harpring". The roster wins.
 */
async function byline(memberKey: string): Promise<PostByline> {
  return (await credits())(memberKey);
}

/**
 * The roster as a lookup, read once and reused for every row of a projection.
 *
 * A Map rather than a `.find()` per post: `getBlogPosts()` resolves 185 bylines
 * and is itself called 372 times building the site, so a linear scan of 26
 * people is ~1.8 million comparisons for an answer that does not change.
 */
async function credits(): Promise<(memberKey: string) => PostByline> {
  const roster = new Map(
    (await getTeam())
      .filter((person) => person.href)
      .map((person) => [person._key, { name: person.name, href: person.href! }])
  );
  return (memberKey: string) => {
    const found = roster.get(memberKey);
    if (!found) throw new Error(`blog: no team member with a profile for "${memberKey}"`);
    return found;
  };
}

/** Every post is written by the firm and reviewed by an attorney — the live
 *  site's byline convention, which the comp reproduces on all thirteen cards.
 *
 *  EXPORTED because the practice-area template's meta line credits the same
 *  author, and this is one byline the whole site shares. Imported by
 *  `practiceAreaPages.ts` rather than re-typed there: two copies of the firm's
 *  own name and profile link is two places to rename it and one to forget. */
export const FIRM: PostByline = { name: "Dormer Harpring", href: ROUTES.attorneys };

/**
 * The reviewed-by band at the foot of an article — and now at the foot of a
 * practice-area page too, with the SAME copy, by request.
 *
 * ONE SOURCE FOR ONE SENTENCE, across both templates. It is per-document data —
 * in Sanity it becomes a field an editor can rewrite for a page reviewed by
 * someone else — but everything that exists today is reviewed by the same
 * person, and two hand-copied versions of this would drift the moment one is
 * edited. `practiceAreaPages.ts` imports it rather than repeating it.
 *
 * "This page", not "this article", on both — the requested wording, and the
 * one string has to serve 104 service pages as well as 186 posts.
 *
 * THE NAME IS INTERPOLATED, NOT TYPED. The roster is the source: the comp
 * writes "KC Harpring" and the live site "KC Harping", and `byline()` takes
 * whatever `team.ts` says.
 *
 * WHAT THIS COPY DROPPED, deliberately: "who has tried personal injury cases to
 * verdict in Colorado courts for more than 20 years." That was a `TODO(launch)`
 * — one of README's unverified stat claims, and the new wording makes no
 * numeric claim at all, so the marker goes with it.
 *
 * "our comprehensive editorial guidelines" is NOT A LINK, and that is not an
 * oversight. `/editorial-guidelines/` is in `RESERVED_PATHS` and is not built;
 * linking it would ship a 404 on 290 pages. Make it a link when the page lands.
 */
function reviewedBy(reviewer: PostByline): PortableTextBlock[] {
  return pt(
    "This page has been written, edited, and reviewed by a team of legal " +
      "writers following our comprehensive editorial guidelines. This page was " +
      `approved by attorney, [${reviewer.name}](${reviewer.href}), a Denver ` +
      "personal injury attorney with extensive legal expertise."
  );
}

/** The same band, resolved. For `practiceAreaPages.ts`, which has no reviewer
 *  of its own and no reason to know which roster key to look up. */
export async function getReviewedBy(): Promise<PortableTextBlock[]> {
  return reviewedBy(await byline("k-c-harpring"));
}

/**
 * One row of a card projection, turned into a `BlogPost`.
 *
 * The two things a projection deliberately does NOT return are resolved here:
 * `href`, because `blogPath()` is the only thing allowed to build a URL and
 * three layers already agree on the trailing slash; and the byline, because
 * `credits()` is the one place a roster entry becomes `{ name, href }`.
 *
 * SYNCHRONOUS, AND IT TAKES ITS RESOLVER. It used to `await byline()` per row,
 * which meant one roster lookup per post — 185 of them per call to
 * `getBlogPosts()`, and that getter is called 372 times in one `getStaticPaths`
 * run. `once()` collapses those to a single fetch, so it was never 185 REQUESTS,
 * but it was 185 promise hops each time and it showed: dropping them took a dev
 * request's blog branch from 13 seconds to under two.
 */
function toPost(
  row: {
    _key: string;
    slug: string | null;
    title: string | null;
    excerpt: string | null;
    publishedAt: string | null;
    category: BlogCategory | null;
    image: unknown;
    reviewerKey: string | null;
  },
  credit: (memberKey: string) => PostByline
): BlogPost {
  const slug = row.slug;
  if (!slug) throw new Error(`blog: a post has no slug — "${row.title ?? "untitled"}".`);
  if (!row.category) {
    throw new Error(
      `blog: post "${slug}" has no category. Open it at /admin under Collections › ` +
        `Blog Posts and choose one — the card and the tab row both need it.`
    );
  }
  if (!row.reviewerKey) {
    throw new Error(`blog: post "${slug}" has no reviewer. Every post names the attorney who approved it.`);
  }

  return {
    _key: slug,
    title: row.title ?? "",
    excerpt: row.excerpt ?? "",
    publishedAt: row.publishedAt ?? "",
    category: row.category,
    // A post with no card art gets the branded placeholder, drawn by
    // PostThumb.astro — 125 of the 186 land here, so it is the common case.
    image: (row.image as BlogPost["image"]) ?? null,
    author: FIRM,
    reviewer: credit(row.reviewerKey),
    href: blogPath(slug),
  };
}

/**
 * The one post in the large panel at the top of /news.
 *
 * IT IS A DOCUMENT LIKE ANY OTHER, with a boolean. Until Phase 3b it was a
 * literal here and its body a second one below — the last two hand-authored
 * records in a module that otherwise read an archive of 185. Merging them
 * settled a disagreement neither side could see: the file filed this post under
 * Personal Injury while this panel had always printed Premises Liability, so the
 * tab row was ordering by a category the card did not show. The document carries
 * both, hand-authored first.
 *
 * THE COUNT IS CHECKED HERE BECAUSE NOTHING ELSE CAN. A boolean on 186 documents
 * cannot express "exactly one", and a Studio validator would have to query its
 * siblings on every keystroke to answer a question this can answer once per
 * build. Two featured posts is not a cosmetic problem: the feed excludes every
 * one of them, so the second silently disappears from /news.
 */
export async function getFeaturedPost(): Promise<FeaturedPost> {
  const [rows, credit] = await Promise.all([
    once("featuredPost", async () => sanityClient.fetch(FEATURED_POST_QUERY)),
    credits(),
  ]);

  if (rows.length !== 1) {
    throw new Error(
      `blog: ${rows.length} posts are marked "Feature this post", and exactly one must be.\n` +
        (rows.length === 0
          ? `Open a post at /admin under Collections › Blog Posts, tick it, and PUBLISH.`
          : `These are: ${rows.map((row) => row.slug ?? "?").join(", ")}. ` +
            `Untick all but one — the feed hides every featured post, so the others have ` +
            `vanished from /news entirely.`)
    );
  }

  const row = rows[0];
  const post = toPost(row, credit);
  if (!post.image) {
    throw new Error(
      `blog: the featured post "${post._key}" has no card image. The panel is a photograph ` +
        `with copy over it, so there is no version of it without one.`
    );
  }

  return {
    ...post,
    image: post.image,
    // Described, unlike every other card's art: this one is large, above the
    // fold and the page's own photograph rather than a thumbnail.
    imageAlt: row.imageAlt ?? "",
  };
}

/**
 * The feed below the featured panel, newest first — 185 cards.
 *
 * THE WHOLE LEGACY ARCHIVE, not the comp's twelve. Those were transcribed cards
 * of which only four were real posts; the other eight were titles the designer
 * invented and shipped with `href: null` so they rendered unlinked rather than
 * dead. The import replaced them, and every card now leads somewhere.
 *
 * The featured post is excluded by the query rather than filtered here — see
 * `BLOG_POSTS_QUERY` on why the test is `featured != true` and not `!featured`.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const [rows, credit] = await Promise.all([
    once("blogPosts", async () => sanityClient.fetch(BLOG_POSTS_QUERY)),
    credits(),
  ]);
  return rows.map((row) => toPost(row, credit));
}

// ---------------------------------------------------------------------------
// The post PAGE — /<slug>, one per article.
//
// Split from `BlogPost` rather than folded into it, the same way
// `getTeamProfiles()` is split from `getTeam()`: the feed is 185 card records
// and the bodies are 1,800 words each, and a card grid should not be pulling an
// archive of prose into memory to render a title. One document type, two
// projections.

export interface BlogPostArticle {
  /** The `_key` of this post's record in the feed. The route joins on it. */
  _key: string;
  /** No leading slash — `blogPath()` adds it. */
  slug: string;
  /** Portable Text, straight from the document. */
  body: PortableTextNode[];
  /** "8 min read" — DERIVED from `body`, never typed. See lib/readTime.ts. */
  readTime: string;
  /**
   * The band at the foot of the article. Per-post rather than template chrome
   * because it names a specific reviewer and makes a specific claim about them,
   * and the next post's reviewer is a different person.
   */
  factCheck: PortableTextBlock[];
}

/**
 * Every article's body, for `getStaticPaths`.
 *
 * `factCheck` COALESCES RATHER THAN ALWAYS DERIVING, and that is the whole
 * reason it is a field at all. WordPress has no equivalent, so all 186 arrive
 * empty and the standard band is written from the reviewer here. A document that
 * DOES carry one keeps it — which is the path an editor takes for an article
 * reviewed differently, and the reason a seeded copy of the derived sentence
 * would have been a mistake: it would have frozen the wording on 186 documents
 * the moment `reviewedBy()` changed.
 */
export async function getBlogPostArticles(): Promise<BlogPostArticle[]> {
  const [rows, credit] = await Promise.all([
    once("blogArticles", async () => sanityClient.fetch(BLOG_ARTICLES_QUERY)),
    credits(),
  ]);

  return rows.map((row) => {
    const slug = row.slug;
    if (!slug) throw new Error("blog: an article has no slug.");
    if (!row.reviewerKey) {
      throw new Error(`blog: article "${slug}" has no reviewer.`);
    }

    const body = (row.body ?? []) as PortableTextNode[];
    return {
      _key: slug,
      slug,
      body,
      // DERIVED, never stored — a saved figure goes stale the moment a
      // paragraph is added, silently.
      readTime: readTime(body),
      factCheck:
        row.factCheck.length > 0
          ? (row.factCheck as PortableTextBlock[])
          : reviewedBy(credit(row.reviewerKey)),
    } satisfies BlogPostArticle;
  });
}

export async function getRelatedPosts(key: string, limit: number): Promise<BlogPost[]> {
  const [featured, posts] = await Promise.all([getFeaturedPost(), getBlogPosts()]);
  const feed: BlogPost[] = [featured, ...posts];

  const current = feed.find((post) => post._key === key);
  const candidates = feed.filter((post) => post._key !== key && post.href !== null);
  const sameCategory = (post: BlogPost) =>
    post.category._key === current?.category._key;

  return [...candidates.filter(sameCategory), ...candidates.filter((p) => !sameCategory(p))]
    .slice(0, limit);
}

/**
 * Practice-area slug fragment -> blog category slug, for the light practice-area
 * template's "Related articles" card.
 *
 * MATCHED ON THE AREA SLUG, NOT ITS TOPIC. Topic is five buckets, so keying on
 * it would put car-accident posts on the motorcycle page — the exact failure the
 * live site ships, where every practice area gets the same five car-accident
 * articles regardless of subject. The fragments are ordered longest-first below
 * so `truck-accident` cannot be claimed by a shorter substring.
 *
 * TODO(launch): this mapping is inferred, not authored. The shape an editor
 * will actually want is a per-page list of chosen posts, which is what it
 * becomes in Sanity — a `relatedPosts` reference array on the practice-area
 * document. Until then, subject matching beats recency.
 */
const AREA_TO_BLOG_CATEGORY: ReadonlyArray<readonly [string, string]> = [
  ["motorcycle", "motorcycle-accidents"],
  ["truck-accident", "truck-accidents"],
  ["bicycle", "bike-accidents"],
  ["pedestrian", "pedestrian-accident"],
  ["slip-and-fall", "slip-and-fall"],
  ["premises", "premises-liability"],
  ["negligent-", "premises-liability"],
  ["dog-bite", "dog-bites"],
  ["product-liability", "product-liability"],
  ["medical-malpractice", "medical-malpractice"],
  ["wrongful-death", "wrongful-death"],
  ["burn-injury", "burn-injury"],
  ["ski-accident", "ski-accident"],
  ["trampoline", "trampoline-park-injuries"],
  ["daycare", "daycare-injury"],
  ["insurance-bad-faith", "auto-insurance-accident-claims"],
  // Everything else with wheels. Last, so the specific vehicles above win.
  ["accident", "auto-accident"],
  ["car-", "auto-accident"],
];

/**
 * Posts for a practice-area page's sidebar.
 *
 * Falls back to the newest posts when the area matches no category — better a
 * card of real recent writing than an empty one. `PostSidebar` already treats a
 * zero-length list as "render nothing", and that guard still holds here for the
 * theoretical case of an empty archive.
 */
export async function getRelatedPostsForArea(areaSlug: string, limit: number): Promise<BlogPost[]> {
  const posts = (await getBlogPosts()).filter((post) => post.href !== null);
  const match = AREA_TO_BLOG_CATEGORY.find(([fragment]) => areaSlug.includes(fragment));
  if (!match) return posts.slice(0, limit);

  const [, categorySlug] = match;
  const onTopic = posts.filter((post) => post.category.slug === categorySlug);
  // Topped up rather than truncated: a thin category still fills the card.
  return [...onTopic, ...posts.filter((post) => post.category.slug !== categorySlug)].slice(0, limit);
}

export interface BlogPostPageCopy {
  /** Heads the box above the body. NOT "Key takeaways": the article's own
   *  first section is an H2 by that name, and two of them on one page reads as
   *  a bug. The box is a map of the article, so it says so. */
  contentsLabel: string;
  categoriesLabel: string;
  relatedSidebarLabel: string;
  relatedTitle: string;
  factCheckLabel: string;
  readMoreLabel: string;
  /** The sidebar's consultation card. Same shape as the page-foot form's copy
   *  because it is the same component — see ContactForm's `variant` prop. */
  form: ContactBand["form"];
}

export async function getBlogPostPage(): Promise<BlogPostPageCopy> {
  return {
    contentsLabel: "In this article",
    categoriesLabel: "Categories",
    relatedSidebarLabel: "Related articles",
    relatedTitle: "Related blog posts",
    factCheckLabel: "Fact-checked",
    readMoreLabel: "Read more",
    form: {
      title: "Get a free case review",
      lede: "Tell us what happened. An attorney reviews every request personally.",
      // Shortened from the comp's "Request my case review" at Rhan's request.
      // Sentence case like its two siblings in contact.ts / coCounsel.ts; `.btn`
      // uppercases it, so the case here is the data's convention, not the design.
      submitLabel: "Review my case",
      // The comp draws this as a small gold note under the button rather than
      // the sentence the page-foot form carries. Same field, same slot; the
      // sidebar variant styles it as the label it is.
      disclaimer: "Free & confidential",
    },
  };
}
