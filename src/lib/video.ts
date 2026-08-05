// The single place the site turns a video reference into a URL.
//
// The firm's testimonials are on YouTube today and are moving to Wistia. That
// migration should be a change to DATA — swapping `provider` on each record —
// not a hunt through components for hardcoded youtube.com strings. So nothing
// else in the codebase may build a video URL; everything calls through here.
//
// TODO(launch): when Wistia lands, set WISTIA_ACCOUNT below and flip the
// `provider` on each record in `src/data/testimonials.ts`. Nothing else has to
// change — and once no record says "youtube" any more, that branch can go.

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
