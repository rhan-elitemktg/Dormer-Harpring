// Homepage content.
//
// SANITY SWAP POINT. Every export here is shaped as the future
// `src/sanity/lib/homePage.ts` will project it: flat, pre-coalesced, and free
// of presentation. When the CMS phase lands, each function body becomes a
// `sanityClient.fetch(...)` and index.astro's import line changes — nothing
// else moves.
//
// Two rules this file follows, both learned the hard way on the last build:
//  - No component holds its own copy of any of this. Components take props;
//    the page fetches. Private component-level arrays drift out of sync with
//    the data module and nobody notices until migration.
//  - Nothing here is a hex code, a style string, or SVG markup. The comps'
//    `renderVals()` carried plenty of those on its derived view-models; they
//    are re-derived in CSS instead, because no editor will ever type one.

export interface HomeHero {
  eyebrow: string;
  /** One entry per rendered line — the comp breaks after "All in." */
  headline: string[];
  lede: string;
  primaryCta: { label: string; href: string };
  videoCta: { label: string };
}

export interface HomeStat {
  _key: string;
  big: string;
  label: string;
}

export async function getHomeHero(): Promise<HomeHero> {
  return {
    eyebrow: "Denver Personal Injury Attorneys",
    headline: ["All in.", "Every case."],
    lede:
      "When you're hurt, everything changes. We take on fewer cases — so yours " +
      "gets our full attention, and our full fight.",
    primaryCta: { label: "Talk to a lawyer", href: "/contact" },
    videoCta: { label: "Watch our video" },
  };
}

export async function getHomeStats(): Promise<HomeStat[]> {
  return [
    { _key: "recovered", big: "$70M+", label: "Recovered" },
    { _key: "years", big: "20 Years", label: "in Denver" },
    { _key: "fee", big: "No Fee", label: "Unless we win" },
    { _key: "travel", big: "We Come", label: "To you" },
  ];
}
