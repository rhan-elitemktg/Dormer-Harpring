// The firm's core values, and the heading above them.
//
// SANITY: the six cards are `coreValue` documents; the heading is on the
// `sharedSections` singleton, because it is IDENTICAL on all five pages that
// render the band — About, Co-Counsel, the homepage, Meet Our Attorneys and
// News. A band whose heading differs per page keeps it on that page instead;
// see the note on the `sharedSections` schema type for why that distinction had
// to be measured rather than assumed.
//
// NO SVG IN THE DATA. The comps store a raw SVG string on each record. Here a
// record carries only an `iconKey` and `components/icons/ValueIcon.astro` owns
// the markup — markup in a content field is not something an editor can fill
// in, and it becomes an injection surface the moment the field is CMS-backed.
// The Studio offers the six keys that have a glyph and nothing else.
import { sanityClient } from "sanity:client";
import { CORE_VALUES_QUERY, SHARED_SECTIONS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

export interface CoreValue {
  _key: string;
  title: string;
  body: string;
  /** Must match an entry in components/icons/ValueIcon.astro. */
  iconKey: string;
}

export interface CoreValuesSection {
  eyebrow: string;
  title: string;
}

/** The `sharedSections` singleton. Shared with whatever else lands on it. */
function shared() {
  return once("sharedSections", async () =>
    required(await sanityClient.fetch(SHARED_SECTIONS_QUERY), "Shared Sections")
  );
}

export async function getCoreValuesSection(): Promise<CoreValuesSection> {
  const { coreValues } = await shared();
  return { eyebrow: coreValues?.eyebrow ?? "", title: coreValues?.title ?? "" };
}

export async function getCoreValues(): Promise<CoreValue[]> {
  return once("coreValues", async () =>
    required(await sanityClient.fetch(CORE_VALUES_QUERY), "Core Values")
  );
}
