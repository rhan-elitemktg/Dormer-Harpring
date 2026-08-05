// The dark "by the numbers" band.
//
// SANITY SWAP POINT — a `firmStats` singleton. Seven of the fourteen comps
// carry this band with identical figures, which is what makes it a singleton
// rather than page content: four numbers duplicated across seven pages is four
// numbers that will disagree within a year.

export interface FirmStat {
  _key: string;
  /** The figure itself — set in Geist, not the display face. */
  big: string;
  label: string;
}

/**
 * TODO(launch): "$70M+" and "20 Years" are claims the firm has to stand
 * behind — verify both before this goes live. The live site says "over $70
 * million" and Sean Dormer was admitted in 2005, so both check out today, but
 * "20 Years" ages badly in a hardcoded string.
 */
export async function getFirmStats(): Promise<FirmStat[]> {
  return [
    { _key: "recovered", big: "$70M+", label: "Recovered for clients" },
    { _key: "years", big: "20 Years", label: "Trying cases in Denver" },
    { _key: "fee", big: "No Fee", label: "Unless we win" },
    { _key: "caseload", big: "Small", label: "Caseload by design" },
  ];
}
