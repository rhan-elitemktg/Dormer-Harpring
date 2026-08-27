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
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { CommentIcon } from "@sanity/icons/Comment";
import { UsersIcon } from "@sanity/icons/Users";
import { BookIcon } from "@sanity/icons/Book";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { ImageIcon } from "@sanity/icons/Image";
import { PinIcon } from "@sanity/icons/Pin";
import { HomeIcon } from "@sanity/icons/Home";
import { HeartFilledIcon } from "@sanity/icons/HeartFilled";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";

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
  { field: string; groups: [string, string, ComponentType?][] }
> = {
  teamMember: {
    field: "kind",
    groups: [
      ["partner", "Founding Partners", UsersIcon],
      ["attorney", "Attorneys", UsersIcon],
      ["staff", "Staff", UsersIcon],
      ["dog", "Office Dogs", HeartIcon],
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
            orderableDocumentListDeskItem({
              type,
              id: `${type}-${value}`,
              title: groupTitle,
              icon: groupIcon,
              filter: `${spec.field} == $value`,
              params: { value },
              S,
              context,
            })
          )
        )
    );
}

/** COLLECTIONS — repeatable content. Phase 2 (hand-authored), Phase 3 (imported). */
const COLLECTIONS: [string, string, ComponentType?][] = [
  ["teamMember", "Team", UsersIcon],
  ["testimonial", "Testimonials", CommentIcon],
  ["caseResult", "Case Results", CaseIcon],
  ["faq", "FAQs", HelpCircleIcon],
  ["award", "Awards", StarIcon],
  ["coreValue", "Core Values", HeartIcon],
  ["newsMention", "Press Mentions", BookIcon],
  ["insight", "Insight Teasers", BulbOutlineIcon],
  ["communityPartner", "Community Partners", UsersIcon],
  ["communityPhoto", "Community Photos", ImageIcon],
  ["ngoPartner", "Charity Partners", HeartIcon],
  ["sponsorship", "Sponsorships", StarIcon],
  ["city", "Cities", PinIcon],
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
