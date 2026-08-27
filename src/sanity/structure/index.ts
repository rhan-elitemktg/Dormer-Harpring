// The Studio desk — what an editor sees when they open /admin.
//
// THREE GROUPS, IN THIS ORDER, BY REQUEST:
//
//   Pages          one document per route, plus the two template singletons
//   Collections    repeatable content — posts, attorneys, results, testimonials
//   Site Settings  firm-wide facts that appear on every page
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
import { BarChartIcon } from "@sanity/icons/BarChart";
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
import { TagIcon } from "@sanity/icons/Tag";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";

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
 * PAGES — one per route.
 *
 * `[type, title, icon?]`. The two template singletons (`blogPostTemplate`,
 * `practiceAreaTemplate`) belong here rather than in Settings: they hold the
 * chrome that appears ON a page — the fact-check band's wording, the sidebar
 * headings — which is exactly the copy the SEO team will want to reach.
 *
 * The three below arrived in Phase 2f holding only the lists that had been
 * filed as collections without being shared by anything. Their copy is Phase 4,
 * and the rest of the routes with it — this is three of an eventual sixteen.
 */
const PAGES: [string, string, ComponentType?][] = [
  ["homePage", "Homepage", HomeIcon],
  ["communityPage", "Community Involvement", HeartFilledIcon],
  ["carAccidentsPage", "Car Accidents", WarningOutlineIcon],
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
function collection(
  S: StructureBuilder,
  context: ConfigContext,
  type: string,
  title: string,
  icon?: ComponentType
) {
  const spec = GROUPED[type];
  if (!spec) return S.documentTypeListItem(type).title(title).icon(icon);

  return S.listItem()
    .title(title)
    .icon(icon)
    .id(type)
    .child(
      S.list()
        .title(title)
        .items(
          spec.groups.map(([value, groupTitle, groupIcon]) =>
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
          )
        )
    );
}

/**
 * COLLECTIONS — repeatable content. Phase 2 (hand-authored), Phase 3 (imported).
 *
 * A COLLECTION IS FOR CONTENT REUSED IN MORE THAN ONE PLACE — which is what this
 * group is FOR, from an editor's side: change the record once and every page
 * that shows it follows. These nine reach 294, 187, 111, 107, 104, 29, 27, 5
 * and 3 built pages.
 *
 * Phase 2f took out seven that reached one page each. They are arrays on the
 * Pages documents now, where an editor looking for the sponsorships finds them
 * on the page that renders them rather than hunting a global list.
 *
 * ORDERED BY HOW OFTEN AN EDITOR REACHES FOR IT, not alphabetically. The two
 * lookup tables — Cities and Blog Categories — sit at the bottom: they are read
 * by other documents far more often than they are edited.
 */
const COLLECTIONS: [string, string, ComponentType?][] = [
  ["practiceArea", "Practice Areas", CaseIcon],
  ["blogPost", "Blog Posts", DocumentTextIcon],
  ["teamMember", "Team", UsersIcon],
  ["testimonial", "Testimonials", CommentIcon],
  ["caseResult", "Case Results", CaseIcon],
  ["award", "Awards", StarIcon],
  ["coreValue", "Core Values", HeartIcon],
  ["city", "Cities", PinIcon],
  ["blogCategory", "Blog Categories", TagIcon],
];

/**
 * SITE SETTINGS — firm-wide singletons.
 *
 * Firm Details first: it is the one every other document borrows from, and the
 * one a client is most likely to have come here to change.
 */
const SETTINGS: [string, string, ComponentType?][] = [
  ["firmDetails", "Firm Details", EarthGlobeIcon],
  ["navigation", "Navigation", MenuIcon],
  ["contactSettings", "Contact & Consultation", EnvelopeIcon],
  ["firmStats", "Firm Stats", BarChartIcon],
  ["sharedSections", "Shared Sections", BlockElementIcon],
];

/**
 * Every type pinned to a fixed document id. Anything in here must be kept out
 * of a generic document list, or the editor sees the singleton twice: once at
 * its fixed id and once as "all documents of this type", and edits to the
 * second one never reach the site.
 */
export const SINGLETON_TYPES = [...PAGES, ...SETTINGS].map(([type]) => type);

export const structure: StructureResolver = (S, context) => {
  const placed = new Set([...PAGES, ...COLLECTIONS, ...SETTINGS].map(([type]) => type));

  /**
   * ANYTHING NOT PLACED IN A GROUP, so a new document type is never invisible.
   *
   * Adding a type to `schemaTypes` and forgetting to list it above would
   * otherwise leave it with no way in — the Studio would be missing content
   * with nothing reporting it, which is the same silent-failure shape the four
   * `check:` linters exist to catch. Once every type is placed this renders
   * nothing and the desk shows exactly the three groups asked for.
   */
  const unplaced = S.documentTypeListItems().filter(
    (item) => !placed.has(item.getId() as string)
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
            .items(PAGES.map(([type, title, icon]) => singleton(S, type, title, icon)))
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
