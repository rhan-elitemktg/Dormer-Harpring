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
 * PAGES — one per route. Phase 4.
 *
 * `[type, title, icon?]`. The two template singletons (`blogPostTemplate`,
 * `practiceAreaTemplate`) belong here rather than in Settings: they hold the
 * chrome that appears ON a page — the fact-check band's wording, the sidebar
 * headings — which is exactly the copy the SEO team will want to reach.
 */
const PAGES: [string, string, ComponentType?][] = [];

/** COLLECTIONS — repeatable content. Phase 2 (hand-authored), Phase 3 (imported). */
const COLLECTIONS: [string, string, ComponentType?][] = [
  ["teamMember", "Team", UsersIcon],
  ["testimonial", "Testimonials", CommentIcon],
  ["caseResult", "Case Results", CaseIcon],
  ["faq", "FAQs", HelpCircleIcon],
  ["award", "Awards", StarIcon],
  ["coreValue", "Core Values", HeartIcon],
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

export const structure: StructureResolver = (S) => {
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
              COLLECTIONS.map(([type, title, icon]) =>
                S.documentTypeListItem(type).title(title).icon(icon)
              )
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
