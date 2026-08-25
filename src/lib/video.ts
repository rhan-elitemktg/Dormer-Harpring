// The single place the site turns a video reference into a URL.
//
// The firm's testimonials are on YouTube today and are moving to Wistia. That
// migration should be a change to DATA — swapping `provider` on each record —
// not a hunt through components for hardcoded youtube.com strings. So nothing
// else in the codebase may build a video URL; everything calls through here.
//
// Wistia has landed for the homepage hero. The rest of the records still say
// "youtube" and flip one at a time as each video is re-hosted.
//
// TODO(launch): set WISTIA_ACCOUNT below once we know the firm's subdomain —
// the media JSON exposes only account IDs (154783 / yrknbv2cuk), never the
// vanity host, so it has to come from the Wistia dashboard. Until then
// `videoWatchUrl` falls back to Wistia's own hosted player, which works but is
// unbranded. That fallback is NOT cosmetic here: it is the href behind every
// popover trigger, and it is what a visitor with JS off actually follows.

export type VideoProvider = "youtube" | "wistia";

export interface VideoRef {
  provider: VideoProvider;
  /** YouTube's 11-character id, or Wistia's hashed id. */
  id: string;
}

/**
 * The firm's Wistia subdomain, i.e. the `dormerharpring` in
 * `dormerharpring.wistia.com`. Empty until we have the account: without it
 * `watchUrl` falls back to Wistia's own hosted player, which works standalone
 * but has no firm branding around it.
 */
const WISTIA_ACCOUNT = "";

/** Where a "play" affordance sends someone who is leaving the page. */
export function videoWatchUrl({ provider, id }: VideoRef): string {
  if (provider === "wistia") {
    return WISTIA_ACCOUNT
      ? `https://${WISTIA_ACCOUNT}.wistia.com/medias/${id}`
      : `https://fast.wistia.net/embed/iframe/${id}`;
  }
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * The `src` for an <iframe>, once the lightbox on the launch list exists.
 *
 * YouTube gets the `-nocookie` host: the normal one drops tracking cookies the
 * moment the iframe loads, which would put every page carrying a video into the
 * consent conversation. Wistia does not set cookies until playback begins.
 */
export function videoEmbedUrl({ provider, id }: VideoRef): string {
  if (provider === "wistia") {
    return `https://fast.wistia.net/embed/iframe/${id}`;
  }
  return `https://www.youtube-nocookie.com/embed/${id}`;
}


/* -------------------------------------------------------------------------
 * Wistia popover embeds
 *
 * Wistia's runtime reads its configuration out of the CLASS NAME — the media
 * id and every option ride on the element as `wistia_async_<id>`,
 * `popover=true` and so on. That is Wistia's own contract, not an invention
 * here, and it is why these look like classes doing a job classes should not
 * do. They are parsed, not matched: no stylesheet may target them.
 * ---------------------------------------------------------------------- */

/** Wistia's player runtime. Idempotent — including it more than once per page
 *  is safe, which is what lets each embed carry its own copy rather than
 *  Layout loading it on all 330 pages for the handful that have a video. */
export const WISTIA_RUNTIME = "https://fast.wistia.net/assets/external/E-v1.js";

/** Per-media config, fetched ahead of the click so the popover opens without a
 *  round trip. Optional to Wistia; the difference is visible on first click. */
export function wistiaMediaScript(id: string): string {
  return `https://fast.wistia.net/embed/medias/${id}.jsonp`;
}

/**
 * The class string that configures a popover whose TRIGGER IS THE LINK INSIDE
 * IT — `popoverContent=link`. The alternative Wistia offers is a thumbnail it
 * renders itself, which would replace the hero's designed CTA with a video
 * still. This way the button stays exactly as drawn and Wistia only binds the
 * click.
 */
export function wistiaPopoverClass(id: string): string {
  return `wistia_embed wistia_async_${id} popover=true popoverContent=link`;
}
