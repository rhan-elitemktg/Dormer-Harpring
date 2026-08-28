// Every schema type the Studio knows about.
//
// Grouped the way the DESK is grouped — Pages, Collections, Site Settings — so
// this file and `src/sanity/structure/index.ts` can be read side by side. The
// desk decides what an editor sees and in what order; this decides what exists.
//
// Note the desk's order is not the BUILD order. Page singletons reference
// collection documents, so settings and collections are built first and pages
// last; the desk shows Pages first because that is what a client looks for.
import type { SchemaTypeDefinition } from "sanity";

import { link } from "./objects/link";
import { navLink } from "./objects/navLink";
import { videoRef } from "./objects/videoRef";
import { answerText, inlineText, richText, simpleText } from "./objects/richText";
import { seo } from "./objects/seo";

import { aboutPage } from "./pages/aboutPage";
import { blogIndexPage } from "./pages/blogIndexPage";
import { carAccidentsPage } from "./pages/carAccidentsPage";
import { coCounselPage } from "./pages/coCounselPage";
import { communityPage } from "./pages/communityPage";
import { contactPage } from "./pages/contactPage";
import { homePage } from "./pages/homePage";
import { practiceAreasPage } from "./pages/practiceAreasPage";
import { resultsPage } from "./pages/resultsPage";
import { sitePage } from "./pages/sitePage";
import { teamPage } from "./pages/teamPage";
import { testimonialsPage } from "./pages/testimonialsPage";
import { thankYouPage } from "./pages/thankYouPage";

import { award } from "./collections/award";
import { blogCategory } from "./collections/blogCategory";
import { blogPost } from "./collections/blogPost";
import { city } from "./collections/city";
import { caseResult } from "./collections/caseResult";
import { coreValue } from "./collections/coreValue";
import { practiceArea } from "./collections/practiceArea";
import { teamMember } from "./collections/teamMember";
import { testimonial } from "./collections/testimonial";

import { contactSettings } from "./settings/contactSettings";
import { firmDetails } from "./settings/firmDetails";
import { navigation } from "./settings/navigation";
import { sharedSections } from "./settings/sharedSections";

/** Shared field types. Not documents — these are what documents are built from. */
const objects: SchemaTypeDefinition[] = [
  link,
  navLink,
  videoRef,
  richText,
  answerText,
  simpleText,
  inlineText,
  seo,
];

/**
 * One document per route.
 *
 * Phase 2f put three of these here early, holding only the lists that were
 * wrongly filed as collections, and Phase 3d added `practiceAreasPage` for the
 * directory and the featured grid. Phase 4 added their COPY to those same four
 * documents — which is why every Phase 4 seed reads a document back and merges
 * rather than replacing it — and the rest of the routes with it.
 *
 * IN DESK ORDER, not alphabetical, so this list and `sanity/structure/index.ts`
 * read side by side.
 */
const pages: SchemaTypeDefinition[] = [
  homePage,
  aboutPage,
  teamPage,
  practiceAreasPage,
  carAccidentsPage,
  resultsPage,
  testimonialsPage,
  coCounselPage,
  communityPage,
  blogIndexPage,
  contactPage,
  thankYouPage,
  // Three documents of ONE type — privacy policy, sitemap, 404. See the note on
  // the type for why one type and why still three fixed singletons.
  sitePage,
];

/**
 * Repeatable content. Phase 2 (hand-authored) and Phase 3 (imported).
 *
 * A COLLECTION IS FOR CONTENT REUSED IN MORE THAN ONE PLACE. That is the whole
 * point of the group — one record, updated once, correct everywhere. Measured
 * against the build, these nine reach 294, 187, 111, 107, 104, 29, 27, 5 and 3
 * distinct pages.
 *
 * Phase 2f removed seven that reached one page each — FAQs, press mentions,
 * insight teasers, community photos, charity partners, community partners and
 * sponsorships. They are arrays on the page documents above. Before adding a
 * type here, count the pages: one page means a field, not a collection.
 */
const collections: SchemaTypeDefinition[] = [
  practiceArea,
  blogPost,
  blogCategory,
  teamMember,
  testimonial,
  caseResult,
  award,
  coreValue,
  city,
];

/** Firm-wide singletons. Phase 1. */
const settings: SchemaTypeDefinition[] = [
  firmDetails,
  navigation,
  contactSettings,
  sharedSections,
];

export const schemaTypes: SchemaTypeDefinition[] = [
  ...objects,
  ...pages,
  ...collections,
  ...settings,
];
