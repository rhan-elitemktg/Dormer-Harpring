// Practice areas surfaced on the homepage.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/practiceAreas.ts`.
// These become `practiceArea` documents (46 of them, per the legacy site); the
// homepage selector projects the six the firm leads with.
//
// Three fields in the comp's `primaryAreasData` are NOT ported, because no
// markup on the page consumes them: `stat`, `statContext`, and a `bullets`
// array whose three entries are all the literal string "Placeholder detail
// point about this practice area." Same story as the promise accordion — data
// built for a layout that was cut. `caseTypes` and `relatedInjuries` are dead
// for the same reason.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import {
  HOME_CATASTROPHIC_QUERY,
  HOME_PRACTICE_AREAS_QUERY,
  HOME_PRACTICE_SECTION_QUERY,
  PRACTICE_AREAS_COPY_QUERY,
  PRACTICE_AREAS_PAGE_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";
import { practiceAreaPath } from "../lib/routePaths";
import heroPhoto from "../assets/team/skyline.jpg";
import heroCrop from "../assets/team/skyline-crop.jpg";

/* ELEVEN PRACTICE-AREA PHOTOGRAPHS LEFT WITH PHASE 3d and nothing reported it.
   They fed the three card rails, which are arrays on `homePage` and
   `practiceAreasPage` now, so their images are Sanity assets. The FILES stay in
   `src/assets/home/` — `home.ts` still imports several of them, `npm run backup`
   is `--no-assets`, and git is the only copy of these originals outside Sanity.

   One of them was imported TWICE under two names, `slipAndFall` and
   `premisesLiability`, because the package ships one premises photograph that
   the homepage labels Slip & Fall and /practice-areas labels Premises
   Liability. Both cards now carry their own asset reference and the aliasing is
   gone with them.

   `locationPath` went too. It built the SAME `/${slug}/` shape
   `practiceAreaPath` does — the directory used one for Denver and the other for
   the eight other cities, which was a distinction with no difference once the
   site went flat at the root. 55 call sites, all in the list that is now a
   reference array — so `routePaths.ts` still exports it and NOTHING calls it.
   Left there rather than pruned here: it is one of five identical helpers that
   exist to name the kinds of URL this site has, and deciding whether that set
   should shrink is a routing question, not a migration one. */

export interface PracticeSection {
  eyebrow: string;
  /** One entry per rendered line, as with the hero headline. */
  title: string[];
  lede: string;
  /** Label above the tab list. */
  tabsLabel: string;
  catastrophicTitle: string;
  ask: { text: string; cta: string };
}

/**
 * The practice band's heading, and the reassurance under its cards.
 *
 * BOTH READ THE `homePage` DOCUMENT, not `practiceAreasPage`. The band is the
 * homepage's; this module owns it because it owns the cards underneath it, and
 * a heading filed away from its list is how the two drift. `homeSection()`
 * fetches the pair once, the way `practiceAreasDocument()` below serves two
 * getters off the other page.
 */
function homeSection() {
  return once("homePage:practiceSection", async () =>
    required(await sanityClient.fetch(HOME_PRACTICE_SECTION_QUERY), "Homepage", "Pages")
  );
}

export async function getPracticeSection(): Promise<PracticeSection> {
  const { practiceSection } = await homeSection();
  return practiceSection;
}

export interface PracticeAreaSummary {
  _key: string;
  name: string;
  /** Must match an entry in components/icons/PracticeIcon.astro. */
  iconKey: string;
  blurb: string;
  href: string;
  /** Panels without one fall back to an icon plate.
   *
   *  The same union `Picture` takes. A card's photograph is a Sanity asset since
   *  Phase 3d; `ImageMetadata` stays because a local import is still a valid
   *  thing to hand a card, and narrowing here would push the widening onto the
   *  component instead. */
  image?: ImageMetadata | SanityImageSource;
}

/**
 * The `/practice-areas` document, read once per build.
 *
 * Two getters draw from it — the featured grid and the directory — and
 * `assertDirectoryJoin()` runs over the second on the same page. `once()` is
 * what keeps that one round trip rather than three.
 */
async function practiceAreasDocument() {
  return once("practiceAreasPage", async () =>
    required(await sanityClient.fetch(PRACTICE_AREAS_PAGE_QUERY), "Practice Areas", "Pages")
  );
}

/**
 * A card row from a projection, with the URL rule kept where it belongs.
 *
 * The card's own copy — name, icon, blurb, photograph — is stored per card,
 * because these rails rename most of what they link to: "Bicycle Accidents" for
 * a page filed as "Bike Accidents", "Slip & Fall" for "Slip and Fall Accidents".
 * That is why they are not references to a `practiceArea` with the name read
 * off it, and why the homepage's blurbs and /practice-areas' can differ for the
 * same area — four of them do.
 */
function toSummary(row: {
  _key: string;
  name: string | null;
  iconKey: string | null;
  blurb: string | null;
  href: string | null;
  image: unknown;
}): PracticeAreaSummary {
  if (!row.href) throw new Error(`practice areas: card "${row.name ?? row._key}" has no destination.`);
  return {
    _key: row._key,
    name: row.name ?? "",
    iconKey: row.iconKey ?? "",
    blurb: row.blurb ?? "",
    href: row.href,
    // Coalesced on its own line rather than in a cast: the projection returns
    // null where this interface says undefined, and the two are not the same to
    // a component doing `{card.image && …}`.
    ...(row.image ? { image: row.image as SanityImageSource } : {}),
  };
}

/** The homepage's six-card rail. */
export async function getHomePracticeAreas(): Promise<PracticeAreaSummary[]> {
  const rows = await once("homePracticeAreas", async () =>
    required(await sanityClient.fetch(HOME_PRACTICE_AREAS_QUERY), "Homepage", "Pages")
  );
  return rows.map(toSummary);
}

/**
 * The Practice Areas page's featured grid — the comp's own `featured` array,
 * in its order, with its copy and its photography.
 *
 * NOT a projection of the homepage's six, though six names overlap. The two
 * comps ship DIFFERENT COPY for the same area: the homepage's Car Accidents
 * reads "How we handle car accident cases in Denver…", this one "Denver
 * crashes are rarely as simple as the insurer claims…". The homepage blurb is
 * a one-line label, this one is a two-sentence pitch. In the CMS these are two
 * fields on one `practiceArea` document, not one field read twice — so they
 * are two lists here, not one list sliced twice.
 *
 * The sets differ too: this page carries Premises Liability and Dog Bites
 * where the homepage carries Slip & Fall and Pedestrian Accidents.
 */
/**
 * The `/practice-areas` featured grid.
 *
 * ONE READ FOR THIS PAGE, shared with the directory below — both live on the
 * same document, and `once()` means the page fetches it once however many
 * getters ask.
 */
export async function getFeaturedPracticeAreas(): Promise<PracticeAreaSummary[]> {
  return (await practiceAreasDocument()).featuredAreas.map(toSummary);
}

/**
 * The line that closes every panel. It reads as per-area copy in the comp but is
 * the same string for all six, so it is one field on the section rather than
 * six copies an editor could let drift apart.
 */
export async function getPracticePromise(): Promise<string> {
  const { practicePromise } = await homeSection();
  return practicePromise;
}

export interface CatastrophicArea {
  _key: string;
  name: string;
  iconKey: string;
  insight: string;
  href: string;
}

export async function getCatastrophicAreas(): Promise<CatastrophicArea[]> {
  const rows = await once("catastrophicAreas", async () =>
    required(await sanityClient.fetch(HOME_CATASTROPHIC_QUERY), "Homepage", "Pages")
  );
  return rows.map((row) => {
    if (!row.href) throw new Error(`practice areas: panel "${row.name ?? row._key}" has no destination.`);
    return {
      _key: row._key,
      name: row.name ?? "",
      iconKey: row.iconKey ?? "",
      insight: row.insight ?? "",
      href: row.href,
    } satisfies CatastrophicArea;
  });
}

export interface PracticeAreasPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  photoMobile: ImageMetadata;
  photoAlt: string;
  ctaLabel: string;
  ctaNote: string;
  /** The featured-panel grid's opener. */
  featured: { eyebrow: string; title: string; lede: string };
  /** The by-location directory's opener. */
  directory: { eyebrow: string; title: string };
}

export async function getPracticeAreasPage(): Promise<PracticeAreasPage> {
  const copy = await once("practiceAreasPage:copy", async () =>
    required(await sanityClient.fetch(PRACTICE_AREAS_COPY_QUERY), "Practice Areas", "Pages")
  );
  return {
    ...copy,
    lede: copy.lede as PortableTextBlock[],
    // The page header's art is a local import, like every other page's — see
    // the note in `aboutPage.ts`.
    photo: heroPhoto,
    photoMobile: heroCrop,
    photoAlt: "The Dormer Harpring attorneys above the Denver skyline",
  };
}

export interface AreaLink {
  _key: string;
  label: string;
  /**
   * `null` where the firm advertises the area but no page exists to send anyone
   * to — same convention as `NavItem.href` in `navigation.ts`. The entry still
   * renders, as plain text rather than a dead link.
   */
  href: string | null;
}

export interface AreaGroup {
  _key: string;
  title: string;
  items: AreaLink[];
}

/**
 * The full directory. Its skeleton is the comp's own `groupsData`, in its
 * order, with its group titles and its item order — read out of the
 * `data-dc-script` block at the foot of `DH - Practice Areas.html`, which is
 * where the comps keep the content behind their `sc-for` placeholders.
 *
 * The comp's links are all `href="#"`, so the URLs are the one thing it does
 * NOT specify. Those come from the live `denvertrial.com/practice-areas` hub,
 * matched to each label — which is also what makes them resolve after cutover
 * (see `routePaths.ts` on preserving the flat shape).
 *
 * THE COMP IS NOT AN INVENTORY, and this list is now synced to that live hub
 * rather than to the comp: the hub carries 110 entries in 11 groups, the comp
 * 90 in 8. Every entry the hub has and the comp lacks is one the firm links
 * today and would have lost at cutover. The gap was three whole city groups
 * and six Denver pages; all nineteen destinations were already built and
 * served, just unlinked from here. `scripts/diff-comp-practice-areas.py`
 * declares each addition, so the diff against the comp stays strict.
 *
 * Every entry now resolves. Legal Malpractice, Life Insurance Bad Faith and
 * Pet Insurance Bad Faith used to carry `href: null` and render as plain text,
 * on the belief that no page existed — the legacy hub links them relative
 * without a `../`, so they 404 under /practice-areas/ and looked absent. All
 * three are in fact live, and the practice-area import now serves them.
 * `assertDirectoryJoin()` fails the build if any entry here loses its page
 * again, so this list cannot silently rot back.
 *
 * Departures from the comp, all about scope or consistency, none presentation:
 *  - ITS LAST TWO GROUPS ARE GONE. "Premises Liability" and "Other Legal
 *    Services" are topical rather than geographic, which the section heading
 *    ("by location") does not describe — a mismatch this comment flagged and
 *    tolerated for a long time. Folded into the Denver column by request, which
 *    is where every one of their entries pointed anyway: all eight are Denver
 *    pages. The heading is now true of the whole section.
 *
 *    THE FOLD DROPPED TWO ENTRIES AS DUPLICATES of Denver's own —
 *    `denver-premises-liability-lawyer` and
 *    `denver-negligent-ice-snow-removal-attorneys` were listed twice on the
 *    page, once per group. Dropping the first is also the requested relabel:
 *    the surviving entry is Denver's plain "Premises Liability", not the
 *    topical group's "Premises Liability Overview".
 *    `diff-comp-practice-areas.py` now fails on ANY duplicate within a group,
 *    because folding is how one gets introduced and reading is not how one gets
 *    found.
 *  - Greeley, Fort Collins and Grand Junction are added from the live hub. See
 *    the comment on the Greeley group.
 *  - Six Denver entries are added from the live hub — five branded-truck pages
 *    and Daycare Injury.
 *  - FIVE ARE REMOVED from the Premises Liability group, which the hub and the
 *    comp both carry: "Premises Liability Factors", "Slip and Fall Accident
 *    Laws in Colorado", "Slip and Fall Case Types", "Slip and Fall Injury Cases
 *    – Hiring a Lawyer" and "10 Things To Do After a Slip and Fall Accident".
 *    They are articles and moved to the blog by request. Their slugs are
 *    unchanged, so the URLs still resolve — the blog template serves them now,
 *    and `/news` lists them. The group is four entries.
 *    NOTE this is the ONLY place the directory drops something the hub links.
 *    Removing an entry here does not remove the page; check the collection
 *    before assuming a slug is gone.
 *  - Grand Junction reads car → truck → motorcycle. The hub has that one group
 *    the other way round and its two siblings this way; normalised, by request.
 *
 * EVERY LABEL IS THE LIVE HUB'S, with one exception. The comp shortens twelve
 * of them — "E-Scooter Accidents" for "Dockless Bike / E-Scooter Accidents",
 * "10 Things to Do After a Fall" for "10 Things To Do After a Slip and Fall
 * Accident" — and the hub's longer wording is the firm's own, so it wins. The
 * exception is the personal-injury row, which reads "Personal Injury" in every
 * group: the hub says "Personal Injury Overview" in four of them, "Personal
 * Injuries" in Denver and "Personal Injury" in the rest, and the column read as
 * a mistake. By request.
 *
 * A LABEL LIVES IN THREE PLACES and they must not drift: here, the manifest in
 * `scripts/practice-area-pages.mjs`, and the page's own content JSON, which the
 * importer writes from the manifest. Change all three or re-run the import.
 * One slug breaks the one-to-one: `denver-premises-liability-lawyer` is
 * "Premises Liability" in the Denver column and "Premises Liability Overview"
 * in the topical group — both the hub's. The manifest holds the topical form,
 * which is the one the city bands want.
 *
 * NOT synced from the hub: its "Privacy Policy/Disclaimer" entry. No privacy
 * page exists in this build (`ROUTES.privacy` is reserved, not built), and an
 * href to a page that does not exist is the one thing this codebase will not
 * ship. Add the entry when the page lands.
 */
export async function getPracticeAreaGroups(): Promise<AreaGroup[]> {
  const doc = await practiceAreasDocument();

  return doc.directory.map((group) => ({
    _key: group._key,
    title: group.title ?? "",
    items: group.items.map((item) => {
      /* A ROW EITHER NAMES A PAGE OR CARRIES ITS OWN HREF, never both. Two of
         the 102 are the second kind and both are real: "Personal Injury" points
         at the homepage, which doubles as the firm's Denver PI overview, and
         "Car Accidents" at the one slug the heavy hand-authored template serves,
         which is not a `practiceArea` document at all.

         `practiceAreaPath()` builds the path rather than the projection, so the
         trailing slash stays decided in one place — three layers already agree
         on it and a GROQ string concat must not become a fourth. */
      const href = item.href ?? (item.slug ? practiceAreaPath(item.slug) : null);
      if (!href) {
        throw new Error(
          `practice areas: directory row "${item.label ?? item._key}" in "${group.title}" ` +
            `points at nothing. Open /admin under Pages › Practice Areas and either pick a ` +
            `page for it or give it a destination.`
        );
      }
      return { _key: item._key, label: item.label ?? "", href };
    }),
  }));
}
