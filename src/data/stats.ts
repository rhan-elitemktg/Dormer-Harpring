// The dark "by the numbers" band, and the homepage hero's figure row.
//
// ONE SET SERVES BOTH SINCE 6c, and that is the whole point of this module now.
// There were two: this band on seven pages and `homePage.hero.stats` on the
// homepage, three of four figures matching on the number and differing only in
// label, the fourth a different claim. Two records meant "$70M+" had two homes
// and confirming it before launch meant editing both.
//
// THE HERO'S WORDING WON, BY REQUEST — the shorter labels. So the homepage did
// not move and the seven band pages did.
//
// SANITY: `sharedSections.firmStats`. It lives there rather than in Site
// Settings because that document is content shown on more than one page and
// changed once, which is exactly this. `firmDetails` stays in Settings for the
// opposite reason: it is data the site DERIVES from — the phone becomes a
// `tel:` href and JSON-LD, the address the footer and the map pin — where this
// is a band the site DISPLAYS.
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
 * first one. ONE PLACE TO CHECK NOW, not two: /admin → Shared Sections → Firm
 * figures.
 */
export async function getFirmStats(): Promise<FirmStat[]> {
  const { stats } = await once("firmStats", async () =>
    required(await sanityClient.fetch(FIRM_STATS_QUERY), "Shared Sections")
  );
  return stats;
}
