import type { StudioTheme } from "sanity";
import { theme as generated } from "./eliteTheme";

// Elite Legal Marketing Studio theme.
//
// Generated with Themer (themer.sanity.build) from the brand palette sampled at
// elitelegalmarketing.com — teal #0199A6 accent, navy #0C143A neutrals, gold
// #EBB60E caution. The generated module is ./eliteTheme.js (typed via .d.ts).
//
// We lock the Studio to the LIGHT scheme: the generated theme ships both light
// and dark schemes and would otherwise follow the OS setting. Pointing the dark
// scheme at the light one makes the Studio render light regardless of the OS.
// (This is the modern @sanity/ui theme — buildLegacyTheme is deprecated and only
// force-flattened the palette.)
export const eliteTheme: StudioTheme = {
  ...generated,
  color: { ...generated.color, dark: generated.color.light },
};
