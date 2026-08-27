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
import { inlineText, richText, simpleText } from "./objects/richText";
import { seo } from "./objects/seo";

import { carAccidentsPage } from "./pages/carAccidentsPage";
import { communityPage } from "./pages/communityPage";
import { homePage } from "./pages/homePage";

import { award } from "./collections/award";
import { city } from "./collections/city";
import { caseResult } from "./collections/caseResult";
import { coreValue } from "./collections/coreValue";
import { teamMember } from "./collections/teamMember";
import { testimonial } from "./collections/testimonial";

import { contactSettings } from "./settings/contactSettings";
import { firmDetails } from "./settings/firmDetails";
import { firmStats } from "./settings/firmStats";
import { navigation } from "./settings/navigation";
import { sharedSections } from "./settings/sharedSections";

/** Shared field types. Not documents — these are what documents are built from. */
const objects: SchemaTypeDefinition[] = [
  link,
  navLink,
  videoRef,
  richText,
  simpleText,
  inlineText,
  seo,
];

/**
 * One document per route.
 *
 * Phase 2f put the three below here early, holding only the lists that were
 * wrongly filed as collections. Their COPY is still Phase 4 and lands on these
 * same documents — so a Phase 4 seed must merge rather than replace.
 */
const pages: SchemaTypeDefinition[] = [homePage, communityPage, carAccidentsPage];

/**
 * Repeatable content. Phase 2 (hand-authored) and Phase 3 (imported).
 *
 * A COLLECTION IS FOR CONTENT REUSED IN MORE THAN ONE PLACE. That is the whole
 * point of the group — one record, updated once, correct everywhere. Measured
 * against the build, these six reach 111, 104, 29, 27, 5 and 3 distinct pages.
 *
 * Phase 2f removed seven that reached one page each — FAQs, press mentions,
 * insight teasers, community photos, charity partners, community partners and
 * sponsorships. They are arrays on the page documents above. Before adding a
 * type here, count the pages: one page means a field, not a collection.
 */
const collections: SchemaTypeDefinition[] = [
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
  firmStats,
  sharedSections,
];

export const schemaTypes: SchemaTypeDefinition[] = [
  ...objects,
  ...pages,
  ...collections,
  ...settings,
];
