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
      factCheck: pt(
        "This article was written and reviewed by the team at Dormer Harpring " +
          `and approved by founding partner [${kc.name}](${kc.href}), who has ` +
          "tried personal injury cases to verdict in Colorado courts for more " +
          "than 20 years."
      ),
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
      submitLabel: "Request my case review",
      // The comp draws this as a small gold note under the button rather than
      // the sentence the page-foot form carries. Same field, same slot; the
      // sidebar variant styles it as the label it is.
      disclaimer: "Free & confidential",
    },
  };
}
