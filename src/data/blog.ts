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
import { getCollection } from "astro:content";
import { getTeam } from "./team";
import { getFirmDetails } from "./site";
import {
  pt,
  ptImage,
  type PortableTextBlock,
  type PortableTextNode,
} from "./portableText";
import type { ContactBand } from "./contact";
import { ROUTES, blogPath } from "../lib/routePaths";
import { readTime } from "../lib/readTime";
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
  /**
   * THE post's category — one, not a list.
   *
   * WordPress lets a post carry several and 28 of the imported 167 do, but by
   * Rhan's direction a post belongs to exactly one here: the first its source
   * record lists. The content files keep every slug, because the getter is
   * where a projection narrows — see `getImportedPosts`.
   */
  category: BlogCategory;
  /**
   * Card art — the post's own featured image, or `null`.
   *
   * NULL FOR 107 OF THE 167 IMPORTED POSTS, which have no featured image on the
   * legacy site at all. `PostThumb.astro` draws the branded placeholder for
   * those. It used to fall back to a practice-area photograph chosen by
   * category, which gave every post in a category the same picture — the cards
   * looked duplicated because they were.
   *
   * Decorative either way, so the cards render it with an empty `alt`.
   */
  image: ImageMetadata | null;
  author: PostByline;
  reviewer: PostByline;
  /** `null` for a post with no page. The card then renders without a link. */
  href: string | null;
}

export interface FeaturedPost extends BlogPost {
  /** NARROWED from BlogPost's nullable: the featured panel is a photograph with
   *  copy over it, so there is no version of it without art. */
  image: ImageMetadata;
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
 * The tab row: EVERY category the blog has, ordered by how many posts each
 * holds.
 *
 * ALL 23, NOT THE COMP'S SIX. `CategoryTabs.astro` was already built to
 * overflow into a horizontal scroll for exactly this — the comp draws six, the
 * live blog has twenty-three, and an editor will add more. Rhan's direction is
 * that the row scrolls rather than being capped or grouped.
 *
 * ORDERED BY POST COUNT, DESCENDING. In a row that scrolls, order decides what
 * a reader meets before they interact: Auto Accident (54) and Personal Injury
 * (49) sit where the eye lands, and the single-post categories are the ones you
 * scroll for. Alphabetical would lead with Awards and Bike Accidents and bury
 * the two covering two thirds of the archive.
 *
 * `all` is not here — it is the sentinel the component renders itself, and
 * there is no `/category/all` behind it.
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const [categories, posts] = await Promise.all([
    getCollection("blogCategories"),
    getCollection("blog"),
  ]);

  // PRIMARY ONLY, matching what a card carries and therefore what a tab can
  // find. Counting a post under its secondaries would order the row by a
  // number no tab can produce.
  const counts = new Map<string, number>();
  for (const post of posts) {
    const primary = post.data.categories[0];
    if (primary) counts.set(primary, (counts.get(primary) ?? 0) + 1);
  }

  return categories
    // A TAB THAT FINDS NOTHING IS WORSE THAN NO TAB. With one category per
    // post, any category no post LEADS with can never be reached — today that
    // is "Auto Insurance & Accident Claims", which 13 posts carry second and
    // none carry first. It is dropped from the row rather than shipped as an
    // empty state. Give one of those 13 that category first and it returns on
    // its own; nothing here needs editing.
    .filter((entry) => (counts.get(entry.data.slug) ?? 0) > 0)
    .map((entry) => ({ _key: entry.data.slug, title: entry.data.title, slug: entry.data.slug }))
    .sort(
      (a, b) =>
        (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0) ||
        a.title.localeCompare(b.title)
    );
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

/**
 * The reviewed-by band at the foot of an article.
 *
 * ONE SOURCE FOR ONE SENTENCE. It is per-post data — in Sanity it becomes a
 * field an editor can rewrite for a post reviewed by someone else — but every
 * post that exists today is reviewed by the same person, and two hand-copied
 * versions of this would drift the moment one is edited.
 *
 * TODO(launch): "more than 20 years" is one of the unverified stat claims in
 * README's table. It was already on the one built article; deriving the
 * imported posts from the same sentence puts it on every post the import
 * brings, so it needs confirming before launch rather than after.
 */
function reviewedBy(reviewer: PostByline): PortableTextBlock[] {
  return pt(
    "This article was written and reviewed by the team at Dormer Harpring " +
      `and approved by founding partner [${reviewer.name}](${reviewer.href}), who has ` +
      "tried personal injury cases to verdict in Colorado courts for more " +
      "than 20 years."
  );
}

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
 * The feed below the featured panel, newest first.
 *
 * THIS IS THE IMPORTED ARCHIVE NOW. It used to be twelve cards transcribed from
 * the comp, of which only four were real posts — the other eight were titles
 * the designer invented, shipped with `href: null` so their cards rendered
 * unlinked rather than dead. All twelve are gone: the import brings the actual
 * 166 (167 less the featured post, which is hand-authored and shown above), so
 * every card leads somewhere and the tab row filters a real archive instead of
 * a placeholder.
 *
 * That settles three of README's launch items at once — the eight cards with no
 * post behind them, the four pointing at legacy URLs this build did not serve,
 * and the index's dependence on the old site staying up.
 *
 * The featured post is NOT here: `getImportedPosts()` drops any slug a
 * hand-authored article claims, and the trampoline post is the one that does,
 * so it cannot appear twice.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return getImportedPosts();
}

// ---------------------------------------------------------------------------
// The post PAGE — /<slug>, one per article.
//
// Split from `BlogPost` rather than folded into it, the same way
// `getTeamProfiles()` is split from `getTeam()`: the feed is thirteen card
// records and the bodies are one long document each, and a card grid should not
// be pulling 1,800 words per item into memory to render a title. In Sanity the
// two are one document and this is two projections.
//
// ONE ARTICLE EXISTS. That is the scope decision, not an unfinished job: the
// CMS phase imports all 167 legacy posts from the scrape by script, so
// hand-transcribing the other four real ones buys four pages that the importer
// replaces a phase later — and hand transcription cannot be diffed against the
// source the way a script can. The four keep the treatment they already have on
// the index: a legacy `href` that resolves against the live WordPress site
// until it is cut over. See README.md's launch table.

export interface BlogPostArticle {
  /** The `_key` of this post's record in the feed. The route joins on it. */
  _key: string;
  /** No leading slash — `blogPath()` adds it. */
  slug: string;
  /**
   * Portable Text. `pt()` and `ptImage()` are the authoring shims; the source
   * is the live article's own markup, so the words on this page are the words
   * that rank at this URL today.
   */
  body: PortableTextNode[];
  /** "8 min read" — DERIVED from `body`, never typed. See lib/readTime.ts. */
  readTime: string;
  /**
   * The band at the foot of the article. Per-post rather than a template
   * singleton because it names a specific reviewer and makes a specific claim
   * about them, and the next post's reviewer is a different person.
   */
  factCheck: PortableTextBlock[];
}

/**
 * The one built article, "Can you sue a trampoline park if you signed a
 * waiver?".
 *
 * WHAT IS NOT HERE, and why. The comp writes its OWN ~600-word body for this
 * post — different headings, different copy, a pull quote. It was not adopted:
 * the comp and the live article share a URL, and serving the shorter one there
 * would drop roughly 1,200 words of copy that ranks today. The comp is still
 * the source for everything AROUND the body, which is what it was drawing.
 *
 * The legacy body also carries two theme-injected CTA widgets mid-article ("Get
 * In Touch With Us", "Get A Free Consultation"). Both are dropped — they are
 * the same thing as the comp's four in-body CTA blocks, and both become
 * Portable Text object types in the Sanity phase. See the note in
 * components/prose/components.ts.
 */
export async function getBlogPostArticles(): Promise<BlogPostArticle[]> {
  const [kc, firm] = await Promise.all([byline("k-c-harpring"), getFirmDetails()]);

  const body: PortableTextNode[] = [
    ...pt(
      "## Key Takeaways",
      "- In Colorado, a signed waiver does not close the door on every injury claim.",
      "- Colorado courts will not enforce waivers that shield operators from grossly negligent conduct.",
      "- A waiver that is unclear, poorly worded, or rushed at check-in may not hold up in court.",
      "- Operators, staff, equipment manufacturers, and property owners may each share fault for an injury.",
      "- Colorado’s statute of limitations restricts how long an injured person has to file a claim.",

      "Every weekend, Denver families fill trampoline parks looking for a few " +
        "hours of fun. What they do not expect is a serious injury followed by a " +
        "waiver form that staff insist strips them of all legal rights. If you or " +
        "a family member was hurt at one of these facilities, a critical question " +
        "follows: **Can you sue a trampoline park** in Colorado even after signing " +
        "a waiver?",
      // The live article's version of this sentence stops mid-clause — it ends
      // "…understand what those waivers." with no object. Completed here rather
      // than reproduced: a sentence that breaks off reads as our bug on our
      // page. TODO(launch): confirm the intended wording with the firm.
      "Signing a waiver does not mean you give up all your rights. Colorado " +
        "courts generally uphold well-drafted liability waivers for ordinary " +
        "negligence, but those waivers have limits. If an operator acted with " +
        "gross negligence or reckless disregard for your safety, a waiver may not " +
        "protect them from legal accountability. At **Dormer Harpring**, our " +
        `[Denver Personal Injury Lawyers](${ROUTES.home}) help injured Denver ` +
        "residents understand what those waivers do and do not cover.",

      "## Causes of Trampoline Park Accidents",
      "Many serious trampoline park accidents trace back to conditions the " +
        "facility created or failed to correct, not to the ordinary risks of " +
        "recreational activity. Common causes may include the following:",
      "- **Inadequate Supervision:** Understaffed facilities or poorly trained " +
        "attendants fail to enforce weight limits, age restrictions, or " +
        "single-jumper rules.",
      "- **Equipment Failure:** Worn padding, defective spring systems, or " +
        "improperly maintained frames can cause sudden, severe falls.",
      "- **Unsafe Facility Design:** Insufficient spacing between trampolines or " +
        "unpadded landing surfaces directly leads to collision injuries.",
      "- **Overcrowding:** Too many jumpers in one area increases the likelihood " +
        "of mid-air collisions and falls onto other guests.",
      "- **Failure to Warn:** When facilities do not clearly communicate hazards " +
        "or restrictions, guests face risks they cannot anticipate or avoid.",
      "Most of these failures do not happen in isolation. When worn padding or a " +
        "defective spring system is to blame, the case may also involve a " +
        `[product defect](${blogPath("what-are-common-types-of-product-defects")}) ` +
        "claim against the equipment maker. They reflect a pattern of negligence, " +
        "and that pattern carries significant weight when determining whether a " +
        "waiver can protect the operator from accountability.",

      "## Types of Injuries at Trampoline Parks",
      "Because participants repeatedly land, collide, and fall from height, the " +
        "body absorbs forces it was not designed to withstand in rapid " +
        "succession. Those forces produce a wide range of injuries:",
      "- **Fractures:** Broken wrists, ankles, and legs are among the most common " +
        "outcomes, particularly when jumpers land off-center or collide with others.",
      "- **Spinal Cord Injuries:** Landings on the neck or back can cause partial " +
        "or complete paralysis with long-term consequences.",
      "- **Traumatic Brain Injuries (TBI):** Falls and collisions can result in " +
        "concussions or more severe brain trauma. According to the " +
        "[National Institute of Neurological Disorders and Stroke]" +
        "(https://www.ninds.nih.gov/health-information/disorders/traumatic-brain-injury-tbi), " +
        "TBI symptoms range from brief disorientation to permanent cognitive " +
        "impairment.",
      "- **Soft Tissue Damage:** Torn ligaments, muscle strains, and joint " +
        "injuries frequently accompany hard landings or collisions.",
      "- **Neck Injuries:** Hyperextension and compression injuries affect both " +
        "children and adults, sometimes with delayed symptom onset.",
      "The severity of these injuries shapes the full scope of a legal claim, " +
        "from immediate medical costs to long-term rehabilitation and lost " +
        "earning capacity. Reviewing the " +
        `[trampoline park injury stats](${blogPath("understanding-trampoline-park-injury-stats-and-liability")}) ` +
        "and how liability is established gives families a clearer picture of " +
        "what a case may involve. When a facility’s negligence contributed to " +
        "harm of this magnitude, the waiver question carries real financial weight.",

      "## What If I Signed a Trampoline Park Waiver?",
      "Signing a waiver at a trampoline park does not mean you have given up your " +
        "right to pursue a claim. These documents exist to protect the business, " +
        "but Colorado law places real limits on what they can accomplish. A court " +
        "will generally enforce a waiver when it is clearly written and presented " +
        "in a way that gives the signer a fair opportunity to read it before " +
        "agreeing.",
      "Not every waiver withstands legal scrutiny, and the circumstances " +
        "surrounding how it was presented matter as much as what it says. A form " +
        "presented hurriedly at check-in, buried within unrelated terms, or " +
        "drafted to obscure its true scope, may not hold up in court. More " +
        "importantly, no waiver in Colorado can protect an operator from gross " +
        "negligence or reckless disregard for the safety of guests on their " +
        "premises.",
      "If a waiver is a concern, an attorney can look at the document itself, the " +
        "conditions under which it was signed, and whether it actually holds up " +
        "under Colorado law."
    ),

    // The live article puts a photograph here, at the foot of this section.
    // It is NOT that photograph: the file the live site serves is a stock shot
    // of someone signing a contract beside a car, captioned "can you sue a
    // trampoline park" — a car-accident image in a premises article, with a
    // keyword string where the alt text should be. The comp puts its own image
    // in the same slot and picks the premises-liability photo, which is this
    // one; that is the choice worth keeping.
    ptImage(
      slipAndFall,
      "A caution wet floor sign standing on a tiled walkway",
      "premises-hazard"
    ),

    ...pt(
      "## Can You Sue a Trampoline Park in Colorado Even After Signing a Waiver?",
      "Yes, and a signed waiver carries less weight than most people assume. " +
        "Colorado law distinguishes between ordinary negligence and " +
        "[gross negligence](https://www.law.cornell.edu/wex/gross_negligence), and " +
        "the distinction matters. When an operator’s conduct reflects a reckless " +
        "disregard for others’ safety, no release form can bar a claim against them.",
      "Whether **you can sue a trampoline park** after signing a release depends " +
        "heavily on what caused the injury. If a mat was reported as torn days " +
        "before your fall and management did nothing about it, this is not an " +
        "oversight. If a facility routinely understaffed the floor and guests had " +
        "been hurt before, the pattern tells a story. In both situations, a signed " +
        "release may not protect the operator, and you may still have a valid claim.",
      "The line between ordinary and gross negligence is not always visible from " +
        "the outside. It lives in maintenance logs, staffing records, and incident " +
        "reports. The strength of a waiver ultimately depends on what the evidence " +
        "reveals.",

      "## Are There Factors That Can Impact the Enforceability of a Signed Waiver?",
      "Even when gross negligence is not at issue, several circumstances can " +
        "weaken or invalidate a waiver under Colorado law:",
      "- **Ambiguous or Unclear Language:** If the waiver uses vague terms that a " +
        "reasonable person could interpret differently, a court may decline to " +
        "enforce it.",
      "- **Failure to Disclose Specific Hazards:** Waivers referencing only " +
        "general recreational risks may not cover injuries caused by known " +
        "defects at that specific facility.",
      "- **Minors and Parental Signatures:** Colorado law permits parents to sign " +
        "waivers on behalf of minor children, but those waivers cannot cover gross " +
        "negligence or reckless conduct and must still meet the same clarity " +
        "requirements as any adult waiver.",
      "- **Procedural Defects:** A waiver presented after payment, buried in a " +
        "stack of documents, or signed under time pressure may face serious " +
        "challenges.",
      "- **Unconscionability:** Courts have found waivers unenforceable when the " +
        "imbalance of power between the operator and the guest renders the " +
        "agreement effectively involuntary.",
      "What voids a waiver in one situation may not apply in another. The document " +
        "itself and the conditions under which you signed it both deserve careful " +
        "review.",

      "## Who Is Liable for a Trampoline Park Accident?",
      "Liability rarely rests with a single party. Multiple defendants may share " +
        "responsibility depending on how the injury occurred:",
      "- **Facility Operators:** The company running the park owes a duty to " +
        "maintain safe conditions, train staff, enforce safety rules, and respond " +
        "to known hazards.",
      "- **Individual Staff Members:** Employees who failed to enforce rules, " +
        "intervene in unsafe situations, or report equipment problems may be held " +
        "personally responsible.",
      "- **Equipment Manufacturers:** When equipment was defective by design or " +
        "manufacture, the product’s maker may face a product liability claim " +
        "independent of the waiver.",
      "- **Property Owners:** If the facility leases its space, the property " +
        "owner’s maintenance obligations may create independent liability for " +
        "certain hazards.",
      "Colorado’s modified comparative fault rule means compensation may still be " +
        "available even if an injured person is found partially at fault, as long " +
        "as their share of fault does not exceed 50 percent. Identifying every " +
        "responsible party is what makes a claim complete.",

      "## Steps for Filing a Personal Injury Lawsuit Against Trampoline Parks",
      "Acting quickly after a trampoline park injury protects both your health and " +
        "your legal options:",
      "- **Seek Immediate Medical Care:** Get a full evaluation even if injuries " +
        "seem minor. Medical records establish the connection between the accident " +
        "and your harm, and some conditions worsen without treatment.",
      "- **Document the Scene:** Photograph the equipment and the area where the " +
        "injury occurred. Collect witness names and contact information before " +
        "they leave.",
      "- **Request and Preserve Records:** Ask the facility for an incident report " +
        "and keep your copy of any waiver you signed. Note the date, time, " +
        "staffing conditions, and any employee statements.",
      "- **Avoid Statements to the Facility’s Insurer:** Insurance adjusters may " +
        "contact you quickly. Anything you say can be used to reduce or deny your " +
        "claim.",
      "- **Consult a Personal Injury Attorney Promptly:** An attorney can review " +
        "the waiver, assess liability, and protect your ability to recover " +
        "compensation before Colorado’s two-year filing window closes.",
      "Evidence disappears, memories fade, and facilities may repair the very " +
        "condition that caused your injury before it can be documented. What you " +
        "do in the days following the accident often determines what is " +
        "recoverable.",

      "## Contact a Personal Injury Lawyer Today",
      // The live article closes on (303) 747-4404, a third number after the
      // (303) 756-3812 its own widgets use. Neither is the number this site
      // publishes, and `site.ts` is the only place a phone number may live —
      // so it is read from there rather than transcribed.
      "A signed waiver does not have to be the final word after a trampoline park " +
        "injury in Denver. At **Dormer Harpring**, we can review the waiver, the " +
        "facility’s conduct, and the facts of what happened to determine what " +
        "claims remain available. If you are asking, “**Can you sue a trampoline " +
        "park** after what happened?”, call " +
        `[${firm.phone}](tel:${firm.phoneE164}) to schedule a ` +
        `[free consultation](${ROUTES.contact}) and discuss your legal options.`
    ),
  ];

  return [
    {
      _key: "trampoline-waiver",
      slug: "can-you-sue-a-trampoline-park-if-you-signed-a-waiver",
      body,
      readTime: readTime(body),
      // TODO(launch): "more than 20 years" is the same unverified claim as the
      // homepage's `20 Years` stat. The comp asserts it; nobody has confirmed it.
      factCheck: reviewedBy(kc),
    },
  ];
}

/**
 * The posts to offer beside an article: same category first, then the rest,
 * each half already newest-first because the feed is.
 *
 * ONLY POSTS WITH A PAGE. The eight the designer invented carry `href: null`
 * and are filtered out — a "related articles" list is a list of links, and one
 * made of unlinked titles is worse than a shorter list. The comp's own five
 * are all among those eight, which is why none of them appear here.
 *
 * Serves both surfaces at different limits: the sidebar takes 5 (and gets the
 * four that exist), the band at the foot takes 3. They overlap, and will stop
 * overlapping as soon as the blog has more than five real posts in it.
 */
/* ---------------------------------------------------------------------------
 * THE IMPORTED LEGACY BLOG.
 *
 * Everything above this line is hand-authored copy from the comps. Everything
 * below reads the `blog` content collection, which `scripts/import-blog-posts.mjs`
 * fills from the live WordPress site.
 *
 * THE TWO ARE DELIBERATELY NOT MERGED INTO THE INDEX YET. `getBlogPosts()` is
 * still the comp's twelve cards, because the index's tab row ships five
 * categories and the import brings twenty-three — how that row handles
 * twenty-three is an open design question, and answering it by quietly
 * lengthening the feed would decide it by accident. So imported posts get a
 * PAGE (the route unions them in) without yet getting a CARD. When the tab row
 * is settled, `getBlogPosts()` returns these too and this comment goes.
 * ------------------------------------------------------------------------- */


/** The taxonomy, straight from the `blogCategories` collection rather than the
 *  hand-written CATEGORIES map above — the imported posts carry the live
 *  site's 23 slugs, and only the collection knows all of them. */
async function importedCategories(): Promise<Map<string, BlogCategory>> {
  const entries = await getCollection("blogCategories");
  return new Map(
    entries.map((entry) => [
      entry.data.slug,
      { _key: entry.data.slug, title: entry.data.title, slug: entry.data.slug },
    ])
  );
}

/**
 * Imported posts in the FEED shape, newest first.
 *
 * `_key` is the slug: the route joins an article to its feed entry on `_key`,
 * and for an imported post the slug is the only identifier that exists on both
 * sides. The hand-authored posts use short keys like `trampoline-waiver`, so
 * the two namespaces cannot collide unless a legacy slug is exactly that.
 */
/**
 * Slugs a hand-authored article already claims.
 *
 * HAND-AUTHORED WINS. The import brings all 167 legacy posts including any that
 * were already transcribed by hand, and the hand-authored version is not merely
 * a duplicate — it is the legacy article WITH corrections: the live copy's
 * truncated sentence completed, the firm's real phone number in place of the
 * article's third one. Both are asserted in diff-comp-blog-post.py. Letting the
 * import win would silently revert them.
 *
 * The route's own collision check would throw on this rather than pick one,
 * which is how it surfaced. Filtering here keeps that check meaning what it
 * says: a genuine conflict, not an expected overlap.
 */
async function handAuthoredSlugs(): Promise<Set<string>> {
  return new Set((await getBlogPostArticles()).map((article) => article.slug));
}

export async function getImportedPosts(): Promise<BlogPost[]> {
  const [entries, categories, kc, claimed] = await Promise.all([
    getCollection("blog"),
    importedCategories(),
    byline("k-c-harpring"),
    handAuthoredSlugs(),
  ]);

  return entries
    .filter((entry) => !claimed.has(entry.data.slug))
    .map((entry) => {
      const primary = entry.data.categories[0];
      const category = categories.get(primary);
      if (!category) {
        throw new Error(
          `blog: imported post "${entry.data.slug}" has category "${primary}", ` +
            `which is not in the blogCategories collection.`
        );
      }
      return {
        _key: entry.data.slug,
        title: entry.data.title,
        excerpt: entry.data.excerpt,
        publishedAt: entry.data.publishedAt,
        category,
        // No fallback: a post without a featured image gets the placeholder,
        // drawn by PostThumb.astro. Substituting a stock photograph here is
        // what made every card in a category look identical.
        image: entry.data.image ?? null,
        author: FIRM,
        reviewer: kc,
        href: blogPath(entry.data.slug),
      } satisfies BlogPost;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Imported posts in the ARTICLE shape — the body the page renders. */
export async function getImportedArticles(): Promise<BlogPostArticle[]> {
  const [entries, kc, claimed] = await Promise.all([
    getCollection("blog"),
    byline("k-c-harpring"),
    handAuthoredSlugs(),
  ]);

  return entries
    .filter((entry) => !claimed.has(entry.data.slug))
    .map((entry) => ({
    _key: entry.data.slug,
    slug: entry.data.slug,
    body: entry.data.body,
    // DERIVED, never stored — same rule the hand-authored article follows.
    readTime: readTime(entry.data.body),
    /* WordPress has no field for this, so the import leaves it empty and the
       band is derived from the reviewer here. A post whose file DOES carry one
       keeps it — that is the path an editor's override takes once these move
       into Sanity, and it is why this coalesces rather than always deriving. */
    factCheck: entry.data.factCheck.length > 0 ? entry.data.factCheck : reviewedBy(kc),
  }));
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
