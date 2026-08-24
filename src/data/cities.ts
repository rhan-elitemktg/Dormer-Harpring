// SANITY SWAP POINT — the cities the firm runs landing pages for.
//
// Nine of them, carrying 109 practice-area pages between them. Until this
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
// `content.config.ts` fails the build on a value it does not know, and
// `assertCityCoverage()` below fails on a city with no pages.

export interface City {
  _key: string;
  name: string;
  /** Heads the "other practice areas here" band. Written as a whole string
   *  rather than interpolated at the component, because no component owns
   *  content — same rule the rest of the data layer follows. */
  bandTitle: string;
}

/**
 * Display order, and the order the city band's groups are read in.
 *
 * Denver first because it is half the pages; the rest are ordered by page count
 * descending, which is the same rule `getBlogCategories()` uses for the tab row
 * and for the same reason — the biggest sets are where the eye should land.
 */
export async function getCities(): Promise<City[]> {
  return [
    { _key: "denver", name: "Denver", bandTitle: "More Denver practice areas" },
    { _key: "thornton", name: "Thornton", bandTitle: "More Thornton practice areas" },
    { _key: "boulder", name: "Boulder", bandTitle: "More Boulder practice areas" },
    { _key: "highlands-ranch", name: "Highlands Ranch", bandTitle: "More Highlands Ranch practice areas" },
    { _key: "aurora", name: "Aurora", bandTitle: "More Aurora practice areas" },
    { _key: "lakewood", name: "Lakewood", bandTitle: "More Lakewood practice areas" },
    { _key: "greeley", name: "Greeley", bandTitle: "More Greeley practice areas" },
    { _key: "fort-collins", name: "Fort Collins", bandTitle: "More Fort Collins practice areas" },
    { _key: "grand-junction", name: "Grand Junction", bandTitle: "More Grand Junction practice areas" },
  ];
}

export interface Topic {
  _key: string;
  /** The group heading inside a city band. */
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
 * Five groups: enough to keep Denver's 54 siblings readable, few enough that a
 * four-page city does not shatter into singletons.
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
