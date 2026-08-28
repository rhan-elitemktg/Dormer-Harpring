// The Studio desk — what an editor sees when they open /admin.
//
// FIVE GROUPS AND ONE LOOSE DOCUMENT, IN THIS ORDER, BY REQUEST:
//
//   Pages           one document per route, plus a utility sub-list
//   Practice Areas  the hand-built Car Accidents page, then 104 by city
//   Blog            186 posts and the 23 categories above them
//   Collections     everything else reused across pages — team, awards, results
//   Shared Sections a single document, not a group: the headings for bands that
//                   appear on more than one page
//   Site Settings   firm-wide facts that appear on every page
//
// PRACTICE AREAS AND BLOG WERE ROWS INSIDE COLLECTIONS until the client asked
// for this. Between them they are the great majority of the site's content, and
// they sat two clicks down a list beside five-record lookup tables.
//
// This is the CLIENT'S order and it is not the build order. Page singletons
// reference collection documents, so the build fills Settings, then Collections,
// then Pages — see the phase plan. The desk shows Pages first because that is
// where someone looking for "the About page" starts.
import type { StructureBuilder, StructureResolver } from "sanity/structure";
import type { ConfigContext } from "sanity";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { ComponentType } from "react";
// ONE SUBPATH PER ICON, AND THE OBVIOUS IMPORT IS THE BROKEN ONE.
// `import { CogIcon } from "@sanity/icons"` is what the docs say and it
// TYPECHECKS — `index.d.ts` declares every named icon. The runtime barrel does
// not export them: it exports a lazy `icons` map instead, so the build dies at
// bundle time with "CogIcon is not exported by dist/index.js" long after
// `check:types` has gone green. The package's types lie about its own runtime.
// Import each icon from its own file (@sanity/icons 5.2.1).
import { CogIcon } from "@sanity/icons/Cog";
import { DocumentIcon } from "@sanity/icons/Document";
import { DocumentsIcon } from "@sanity/icons/Documents";
import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { MenuIcon } from "@sanity/icons/Menu";
import { BlockElementIcon } from "@sanity/icons/BlockElement";
import { StarIcon } from "@sanity/icons/Star";
import { HeartIcon } from "@sanity/icons/Heart";
import { CaseIcon } from "@sanity/icons/Case";
import { CommentIcon } from "@sanity/icons/Comment";
import { UsersIcon } from "@sanity/icons/Users";
import { PinIcon } from "@sanity/icons/Pin";
import { HomeIcon } from "@sanity/icons/Home";
import { HeartFilledIcon } from "@sanity/icons/HeartFilled";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { TagIcon } from "@sanity/icons/Tag";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { ThLargeIcon } from "@sanity/icons/ThLarge";

/**
 * SINGLETONS ARE ENFORCED HERE, NOT IN THE SCHEMA. There is no `singleton: true`
 * option: what makes a document a singleton is `documentId()` pinning it to a
 * fixed id, plus keeping its type out of any generic list so a second one
 * cannot be created from the "＋" menu.
 *
 * This is also the one case where an explicit `_id` is right. Ordinary content
 * documents let Sanity generate theirs.
 */
function singleton(
  S: StructureBuilder,
  type: string,
  title: string,
  icon?: ComponentType
) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .id(type)
    .child(S.document().schemaType(type).documentId(type).title(title));
}

/**
 * ONE OF THREE DOCUMENTS THAT SHARE A TYPE.
 *
 * `singleton()` above pins a type to an id of the same name, which is right
 * when the two are one thing. The utility pages are three documents of ONE type
 * (`sitePage`), so the id and the type differ and the schema name cannot stand
 * in for both.
 */
function fixedDocument(
  S: StructureBuilder,
  type: string,
  id: string,
  title: string,
  icon?: ComponentType
) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .id(id)
    .child(S.document().schemaType(type).documentId(id).title(title));
}

/**
 * PAGES — one per route, in the order of the main nav.
 *
 * `[type, title, icon?]`.
 *
 * AN EDITOR READS DOWN THIS LIST THE WAY A VISITOR READS ACROSS THE HEADER,
 * then the pages the nav does not reach. Alphabetical would put Thank You
 * between Results and Testimonials and Contact above everything.
 *
 * TWO THINGS THAT WERE HERE ARE NOT ANY MORE, both by request:
 *
 *   the two TEMPLATES     their chrome is twelve interface labels ("In this
 *                         article", "Posted", "Read more") that no editor was
 *                         going to open a document to change. Constants in
 *                         `blog.ts` and `practiceAreaPages.ts` now, and the
 *                         documents are deleted.
 *   Car Accidents         it is a practice-area page — the one served by the
 *                         heavy hand-authored template rather than the imported
 *                         one — so it leads the Practice Areas group rather than
 *                         sitting among the routes.
 *
 * The three utility pages are a sub-list at the foot; see `UTILITY_PAGES`.
 */
const PAGES: [string, string, ComponentType?][] = [
  ["homePage", "Homepage", HomeIcon],
  ["aboutPage", "About", InfoOutlineIcon],
  ["teamPage", "Meet Our Attorneys", UsersIcon],
  ["practiceAreasPage", "Practice areas index", ThLargeIcon],
  ["resultsPage", "Results", CaseIcon],
  ["testimonialsPage", "Testimonials", CommentIcon],
  ["coCounselPage", "Co-Counsel", UsersIcon],
  ["communityPage", "Community Involvement", HeartFilledIcon],
  ["blogIndexPage", "Blog index", DocumentTextIcon],
  ["contactPage", "Contact", EnvelopeIcon],
  ["thankYouPage", "Thank You", CheckmarkCircleIcon],
];

/**
 * THE THREE UTILITY PAGES — one `sitePage` document each, at fixed ids.
 *
 * They open into a sub-list rather than sitting in `PAGES` beside the routes,
 * because a client looking for "the About page" should not have to read past a
 * 404 to find it. Same singleton machinery: each is pinned to its own id, so
 * the type never appears as a generic list and a fourth cannot be created —
 * there is no route that would serve one.
 *
 * `[id, title]`. The id is also the document's `kind`, which is what the form
 * keys its two conditional fields on.
 */
const UTILITY_PAGES: [string, string][] = [
  ["privacy", "Privacy Policy"],
  ["sitemap", "Sitemap"],
  ["notFound", "404"],
];

/**
 * COLLECTIONS THAT OPEN INTO SUB-LISTS RATHER THAN ONE LONG LIST.
 *
 * Keyed by document type: the field to split on, and the groups in the order an
 * editor should meet them. Thirty people in one alphabetical list is a list you
 * scroll; four named groups is a list you navigate.
 *
 * THE GROUPS MUST COVER EVERY POSSIBLE VALUE, because a document matching none
 * of them is invisible in the desk — content that exists and cannot be reached,
 * which is the silent-failure shape this project's four linters exist to catch.
 * That holds here because each `field` below is a CLOSED list in its schema and
 * is `required()`, so a published document must carry one of these values. If a
 * fifth option is ever added to one of those lists, it has to be added here in
 * the same change.
 *
 * Each group also carries an initial-value template, so "＋" inside Staff
 * creates a staff member rather than one with no group at all. The templates
 * are registered in `sanity.config.ts`; without them the field would be blank
 * on creation and the new document would land nowhere.
 */
const GROUPED: Record<
  string,
  {
    field: string;
    /**
     * Whether the group's rows can be DRAGGED into order.
     *
     * True only where something actually reads that order. The team page renders
     * `orderRank`, so Team is orderable. The practice areas are sorted by their
     * short name in `getPracticeAreaPages()` and nothing stores a position —
     * offering a drag handle there would be a control that appears to work,
     * saves a field, and changes nothing on the site. That is worse than no
     * control at all.
     */
    orderable: boolean;
    groups: [string, string, ComponentType?][];
  }
> = {
  teamMember: {
    field: "kind",
    orderable: true,
    groups: [
      ["partner", "Founding Partners", UsersIcon],
      ["attorney", "Attorneys", UsersIcon],
      ["staff", "Staff", UsersIcon],
      ["dog", "Office Dogs", HeartIcon],
    ],
  },
  /*
   * NINE CITIES, AND DENVER HOLDS HALF OF THEM. 104 pages in one alphabetical
   * list is a list you scroll; grouped by city it is the same shape the sidebar
   * card and the /practice-areas directory already have, so an editor looking
   * for "the Thornton dog bite page" opens Thornton.
   *
   * The order is the directory's own, which leads with the firm's city. As with
   * `kind`, these MUST cover every value the schema's list allows: a page whose
   * city matches no group is invisible here.
   */
  practiceArea: {
    field: "city",
    orderable: false,
    groups: [
      ["denver", "Denver", PinIcon],
      ["aurora", "Aurora", PinIcon],
      ["boulder", "Boulder", PinIcon],
      ["highlands-ranch", "Highlands Ranch", PinIcon],
      ["lakewood", "Lakewood", PinIcon],
      ["thornton", "Thornton", PinIcon],
      ["greeley", "Greeley", PinIcon],
      ["fort-collins", "Fort Collins", PinIcon],
      ["grand-junction", "Grand Junction", PinIcon],
    ],
  },
};

/**
 * One collection's desk entry — a plain list, or drag-orderable sub-lists.
 *
 * `orderableDocumentListDeskItem` is the plugin's own list. It replaces a
 * `documentTypeList` entirely rather than decorating one: it renders its own
 * drag-and-drop pane, writes the `orderRank` field as rows move, and sets the
 * group's field on anything created inside it — which is why the separate
 * initial-value template this used to need is gone.
 *
 * That last part is load-bearing. A document with no `kind` matches none of the
 * four filters and is INVISIBLE in the desk — content that exists and cannot be
 * reached — so every creation path has to set it. `sanity.config.ts` closes the
 * other one by taking this type out of the global "create new" menu.
 */
/**
 * One grouped type's sub-lists, as an array.
 *
 * SEPARATE FROM `collection()` SO TWO CALLERS CAN SHARE THEM. Practice Areas is
 * its own top-level group now and needs these nine city lists placed BESIDE the
 * Car Accidents singleton rather than nested one level further down — reaching
 * into a built list item to get them back out is the alternative, and it
 * depends on the shape the builder happens to serialise to.
 */
function groupItems(S: StructureBuilder, context: ConfigContext, type: string) {
  const spec = GROUPED[type];
  if (!spec) return [];
  return spec.groups.map(([value, groupTitle, groupIcon]) =>
    spec.orderable
      ? orderableDocumentListDeskItem({
          type,
          id: `${type}-${value}`,
          title: groupTitle,
          icon: groupIcon,
          filter: `${spec.field} == $value`,
          params: { value },
          S,
          context,
        })
      : /*
         * A PLAIN FILTERED LIST, and it has to set the group's field on
         * anything created inside it the way the orderable one does for
         * free. Without the initial value a page created inside Denver
         * would have no city, match none of the nine filters, and be
         * invisible in the desk — the same silent-failure shape the
         * four `check:` linters exist to catch.
         */
        S.listItem()
          .title(groupTitle)
          .icon(groupIcon)
          .id(`${type}-${value}`)
          .child(
            S.documentTypeList(type)
              .title(groupTitle)
              .filter(`_type == $type && ${spec.field} == $value`)
              .params({ type, value })
              .initialValueTemplates([
                S.initialValueTemplateItem(`${type}-by-${spec.field}`, { value }),
              ])
          )
  );
}

function collection(
  S: StructureBuilder,
  context: ConfigContext,
  type: string,
  title: string,
  icon?: ComponentType
) {
  if (!GROUPED[type]) return S.documentTypeListItem(type).title(title).icon(icon);
  return S.listItem()
    .title(title)
    .icon(icon)
    .id(type)
    .child(S.list().title(title).items(groupItems(S, context, type)));
}

/**
 * COLLECTIONS — repeatable content that is not a practice area or a blog post.
 *
 * A COLLECTION IS FOR CONTENT REUSED IN MORE THAN ONE PLACE, which is what this
 * group is FOR from an editor's side: change the record once and every page that
 * shows it follows. Phase 2f took out seven that reached one page each; they are
 * arrays on the Pages documents now.
 *
 * THE TWO BIGGEST LEFT THIS LIST IN PHASE 6b. Practice Areas (104 documents) and
 * the blog (186 posts, 23 categories) are top-level groups of their own — see
 * above. What remains is the six an editor reaches for occasionally, ordered by
 * how often: the roster first, Cities last.
 *
 * SHARED SECTIONS IS NOT IN THIS ARRAY and is not inside this group — it is a
 * top-level row of its own, directly below Collections. A singleton rather than
 * a collection, sitting beside the lists whose bands it heads.
 */
const COLLECTIONS: [string, string, ComponentType?][] = [
  ["teamMember", "Team", UsersIcon],
  ["testimonial", "Testimonials", CommentIcon],
  ["caseResult", "Case Results", CaseIcon],
  ["award", "Awards", StarIcon],
  ["coreValue", "Core Values", HeartIcon],
  ["city", "Cities", PinIcon],
];

/**
 * PRACTICE AREAS — its own top-level group, not a row inside Collections.
 *
 * 104 documents across nine cities, the largest thing on the site after the
 * blog and the one an editor reaches for most. Burying it under Collections put
 * the firm's core content two clicks from the front door, beside five-record
 * lookup lists.
 *
 * CAR ACCIDENTS LEADS IT, above a divider. It is a practice-area page that is
 * not a `practiceArea` DOCUMENT — its content is eighteen typed sections on its
 * own singleton, because it is the one page served by the heavy hand-authored
 * template. An editor looking for the car accident page looks here, which is
 * the whole argument for the placement.
 */
const PRACTICE_AREAS: [string, string, ComponentType?] = ["practiceArea", "Practice Areas", CaseIcon];

/**
 * BLOG — the posts and the taxonomy above them, together.
 *
 * They are one editorial job: a post belongs to exactly one category, and the
 * category list exists to serve the posts. Splitting them across a Collections
 * list meant scrolling past Case Results to find the categories that the thing
 * two rows up depends on.
 */
const BLOG: [string, string, ComponentType?][] = [
  ["blogPost", "Blog Posts", DocumentTextIcon],
  ["blogCategory", "Blog Categories", TagIcon],
];

/**
 * SITE SETTINGS — firm-wide singletons.
 *
 * Firm Details first: it is the one every other document borrows from, and the
 * one a client is most likely to have come here to change.
 *
 * SHARED SECTIONS LEFT THIS GROUP, by request — it is a top-level row below
 * Collections now, beside the lists whose bands it heads. FIRM STATS went with
 * it, into that document: the four figures are a band the site DISPLAYS on
 * eight pages, where what is left here is data the site DERIVES from.
 */
const SETTINGS: [string, string, ComponentType?][] = [
  ["firmDetails", "Firm Details", EarthGlobeIcon],
  ["navigation", "Navigation", MenuIcon],
  ["contactSettings", "Contact & Consultation", EnvelopeIcon],
];

/**
 * Every type pinned to a fixed document id. Anything in here must be kept out
 * of a generic document list, or the editor sees the singleton twice: once at
 * its fixed id and once as "all documents of this type", and edits to the
 * second one never reach the site.
 */
export const SINGLETON_TYPES = [
  ...[...PAGES, ...SETTINGS].map(([type]) => type),
  // TWO SINGLETONS ARE PLACED BY HAND AND SO MUST BE NAMED HERE. This list is
  // built from PAGES and SETTINGS, so a type moved OUT of either drops out of
  // it silently — which puts a generic list beside the pinned document, with
  // edits to the second copy going nowhere, AND makes the type read as
  // unplaced to the catch-all below. Car Accidents leads Practice Areas;
  // Shared Sections sits under Collections.
  "carAccidentsPage",
  "sharedSections",
  // `sitePage` is three fixed documents rather than one, but the reason it must
  // stay out of a generic list is identical: an editor seeing "all utility
  // pages" alongside the three pinned ones would edit a fourth copy that no
  // route reads.
  "sitePage",
];

/**
 * EVERY TYPE THIS DESK PLACES — the one list the catch-all measures against.
 *
 * DERIVED FROM THE GROUP DEFINITIONS, NOT MAINTAINED BESIDE THEM. It read
 * `[...PAGES, ...COLLECTIONS, ...SETTINGS]` while those were the only three
 * groups. Splitting Practice Areas and Blog out left FOUR types placed on
 * screen and missing from here — `practiceArea`, `blogPost`, `blogCategory`
 * and `carAccidentsPage` — so the Studio drew each of them twice: once in its
 * group and once under the catch-all divider at the foot.
 *
 * `sitePage` had been doing exactly that since the utility pages arrived, and
 * nobody noticed until the other four joined it.
 *
 * A CATCH-ALL CANNOT CATCH THIS. It exists so a type placed NOWHERE is still
 * reachable, and a type placed TWICE is indistinguishable to it — both are
 * simply "not in the set". So this is written to be un-forgettable rather than
 * guarded by a check that would have to be remembered too.
 */
const PLACED = new Set<string>([
  // Every Pages row and every Site Settings row, plus the two placed by hand:
  // `carAccidentsPage`, which leads Practice Areas, and `sitePage`, which is
  // the three utility documents.
  ...SINGLETON_TYPES,
  PRACTICE_AREAS[0],
  ...BLOG.map(([type]) => type),
  ...COLLECTIONS.map(([type]) => type),
]);

export const structure: StructureResolver = (S, context) => {

  /**
   * ANYTHING NOT PLACED IN A GROUP, so a new document type is never invisible.
   *
   * Adding a type to `schemaTypes` and forgetting to list it above would
   * otherwise leave it with no way in — the Studio would be missing content
   * with nothing reporting it, which is the same silent-failure shape the four
   * `check:` linters exist to catch. Once every type is placed this renders
   * nothing and the desk shows exactly the five groups asked for.
   */
  const unplaced = S.documentTypeListItems().filter(
    (item) => !PLACED.has(item.getId() as string)
  );

  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Pages")
        .icon(DocumentIcon)
        .id("pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              ...PAGES.map(([type, title, icon]) => singleton(S, type, title, icon)),
              S.listItem()
                .title("Utility pages")
                .icon(DocumentIcon)
                .id("utility-pages")
                .child(
                  S.list()
                    .title("Utility pages")
                    .items(
                      UTILITY_PAGES.map(([id, title]) =>
                        fixedDocument(S, "sitePage", id, title, DocumentIcon)
                      )
                    )
                ),
            ])
        ),

      /*
       * PRACTICE AREAS — the hand-built page, then the nine cities.
       *
       * The divider is doing real work: Car Accidents is a page singleton and
       * everything under it is a `practiceArea` document, which are two
       * different kinds of thing that happen to belong in one list.
       */
      S.listItem()
        .title("Practice Areas")
        .icon(CaseIcon)
        .id("practice-areas")
        .child(
          S.list()
            .title("Practice Areas")
            .items([
              singleton(S, "carAccidentsPage", "Car Accidents", WarningOutlineIcon),
              S.divider(),
              ...groupItems(S, context, PRACTICE_AREAS[0]),
            ])
        ),

      S.listItem()
        .title("Blog")
        .icon(DocumentTextIcon)
        .id("blog")
        .child(
          S.list()
            .title("Blog")
            .items(BLOG.map(([type, title, icon]) => collection(S, context, type, title, icon)))
        ),

      S.listItem()
        .title("Collections")
        .icon(DocumentsIcon)
        .id("collections")
        .child(
          S.list()
            .title("Collections")
            .items(
              COLLECTIONS.map(([type, title, icon]) => collection(S, context, type, title, icon))
            )
        ),

      /*
       * SHARED SECTIONS — A TOP-LEVEL ROW, NOT A GROUP, by request.
       *
       * It opens the document directly rather than a list, because it is one
       * pinned singleton: the headings for the bands that appear on more than
       * one page. It sits below Collections and above Site Settings because
       * every band it heads draws its items from a list in that group — an
       * editor changing the testimonials finds the rail's heading on the next
       * row down, not two clicks into Settings, which is where it used to be.
       *
       * IT IS STILL A SINGLETON AND STILL NEEDS ITS ENTRY IN `SINGLETON_TYPES`.
       * That list is built from PAGES and SETTINGS, so leaving SETTINGS dropped
       * it out — see the note there.
       */
      singleton(S, "sharedSections", "Shared Sections", BlockElementIcon),

      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .id("settings")
        .child(
          S.list()
            .title("Site Settings")
            .items(SETTINGS.map(([type, title, icon]) => singleton(S, type, title, icon)))
        ),

      // Guarded rather than unconditional: a divider with nothing after it
      // draws a line across the bottom of the desk for no reason.
      ...(unplaced.length > 0 ? [S.divider(), ...unplaced] : []),
    ]);
};
