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

import { award } from "./collections/award";
import { city } from "./collections/city";
import { communityPartner } from "./collections/communityPartner";
import { communityPhoto } from "./collections/communityPhoto";
import { insight } from "./collections/insight";
import { newsMention } from "./collections/newsMention";
import { ngoPartner } from "./collections/ngoPartner";
import { sponsorship } from "./collections/sponsorship";
import { caseResult } from "./collections/caseResult";
import { coreValue } from "./collections/coreValue";
import { faq } from "./collections/faq";
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

/** One document per route. Phase 4. */
const pages: SchemaTypeDefinition[] = [];

/** Repeatable content. Phase 2 (hand-authored) and Phase 3 (imported). */
const collections: SchemaTypeDefinition[] = [
  teamMember,
  testimonial,
  caseResult,
  faq,
  award,
  coreValue,
  newsMention,
  insight,
  communityPartner,
  communityPhoto,
  ngoPartner,
  sponsorship,
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
