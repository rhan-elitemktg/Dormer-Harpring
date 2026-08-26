import { sanityClient } from "sanity:client";
import { CITIES_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
// SANITY SWAP POINT — the cities the firm runs landing pages for.
//
// Nine of them, carrying 104 practice-area pages between them. Until this
// import, only four were named anywhere in the project and five —Aurora,
// Boulder, Highlands Ranch, Lakewood and Thornton — appeared in no data file,
// no comp and no navigation, despite having 41 live pages between them.
//
// In the CMS these become `serviceCity` documents, which is already anticipated
// in `footer/ServiceAreaBand.astro`: its chips "become `serviceCity` references
// (with real landing pages) in the CMS phase". This is that list.
//
// THE VOCABULARY IS DUPLICATED, DELIBERATELY. `scripts/practice-area-pages.mjs`
// holds the same nine keys, because the importer is a plain `.mjs` script and a
// `.ts` module has no business being imported into it — or the reverse. The
// duplication is checked rather than trusted: the `city` enum in
// `content.config.ts` fails the build on a value it does not know.
//
// (The header used to promise an `assertCityCoverage()` "below" that fails on a
// city with no pages. There has never been one. Removed rather than written:
// the schema enum already rejects an unknown city, and a city with no pages is
// not currently an error — it is what a new city looks like before its import.)
//
// NOTHING IMPORTS THIS MODULE ANY MORE. `getCityBandTitles()` and the hero
// eyebrow's city lookup were its two readers and both went when the city band
// was removed by request. Kept, not deleted, because this is the only place the
// nine cities are written down in prose, and `footer/ServiceAreaBand.astro`
// still points at it for the `serviceCity` documents the CMS phase will need.
// Fair game to delete if that phase decides otherwise.

export interface City {
  _key: string;
  name: string;
}

/**
 * Display order.
 *
 * Denver first because it is half the pages; the rest are ordered by page count
 * descending, which is the same rule `getBlogCategories()` uses for the tab row
 * and for the same reason — the biggest sets are where the eye should land.
 *
 * `bandTitle` is gone from this shape: nine strings heading a band that no
 * longer exists.
 */
export async function getCities(): Promise<City[]> {
  return once("cities", async () => required(await sanityClient.fetch(CITIES_QUERY), "Cities"));
}

export interface Topic {
  _key: string;
  /** The group heading a city band would have used. */
  title: string;
}

/**
 * How a city's pages are grouped inside the band.
 *
 * INVENTED HERE — nothing upstream carries a topic. The live site's own sidebar
 * bands are hand-maintained, disagree with each other, and on six of eight
 * Greeley / Fort Collins / Grand Junction pages list a DIFFERENT city's areas
 * entirely. So the grouping is generated from this vocabulary rather than
 * ported, and `scripts/practice-area-pages.mjs` assigns every page to one.
 *
 * NOTHING RENDERS THIS EITHER. The city band grouped by it, then stopped, then
 * the band itself was removed — all by request. Kept for the same reason as
 * `getCities()` above: `topic` is still a required field on every page, the
 * collection schema still validates against this exact vocabulary, and the
 * manifest still assigns one. This is where the five values are written down in
 * prose.
 */
export async function getTopics(): Promise<Topic[]> {
  return [
    { _key: "motor-vehicle", title: "Motor Vehicle Accidents" },
    { _key: "premises", title: "Premises & Property" },
    { _key: "catastrophic", title: "Catastrophic Injury" },
    { _key: "professional", title: "Professional & Insurance Claims" },
    { _key: "other", title: "Other Claims" },
  ];
}
