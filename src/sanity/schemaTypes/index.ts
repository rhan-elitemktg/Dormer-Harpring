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
import { inlineText, richText, simpleText } from "./objects/richText";
import { seo } from "./objects/seo";

/** Shared field types. Not documents — these are what documents are built from. */
const objects: SchemaTypeDefinition[] = [link, richText, simpleText, inlineText, seo];

/** One document per route. Phase 4. */
const pages: SchemaTypeDefinition[] = [];

/** Repeatable content. Phase 2 (hand-authored) and Phase 3 (imported). */
const collections: SchemaTypeDefinition[] = [];

/** Firm-wide singletons. Phase 1. */
const settings: SchemaTypeDefinition[] = [];

export const schemaTypes: SchemaTypeDefinition[] = [
  ...objects,
  ...pages,
  ...collections,
  ...settings,
];
