// The dark "by the numbers" band.
//
// SANITY: reads the `firmStats` singleton. Seven of the fourteen comps carry
// this band with identical figures, which is what makes it a singleton rather
// than page content — four numbers duplicated across seven pages is four
// numbers that will disagree within a year.
import { sanityClient } from "sanity:client";
import { FIRM_STATS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

export interface FirmStat {
  _key: string;
  /** The figure itself — set in Geist, not the display face. */
  big: string;
  label: string;
}

/**
 * TODO(launch): "$70M+" and "20 Years" are claims the firm has to stand behind
 * — verify both before this goes live. The live site says "over $70 million"
 * and Sean Dormer was admitted in 2005, so both check out today, but "20 Years"
 * ages badly as a typed string, and Colorado's advertising rules care about the
 * first one. Both are editable at /admin → Site Settings → Firm Stats.
 */
export async function getFirmStats(): Promise<FirmStat[]> {
  const { stats } = await once("firmStats", async () =>
    required(await sanityClient.fetch(FIRM_STATS_QUERY), "Firm Stats")
  );
  return stats;
}
