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

/**
 * Fail loudly on a video record that is missing or half-filled.
 *
 * WHY THIS EXISTS. A `videoRef` that came back null from a projection produced
 * `TypeError: Cannot destructure property 'provider' of 'object null'` from the
 * line below — during a page render, naming no field, no document and no
 * person. It took a dataset comparison to work out which of thirty team members
 * had lost their film.
 *
 * Every play affordance on the site routes through this module, so one check
 * here covers all nine of them.
 */
function assertVideo(ref: VideoRef | null | undefined): VideoRef {
  if (!ref || !ref.id) {
    throw new Error(
      `A video record is missing its id, so no play link can be built for it.\n` +
        `Every video is a { provider, id } pair — find the record with an empty ` +
        `"Video ID" in the Studio at /admin and fill it in, or remove the field.\n` +
        `Received: ${JSON.stringify(ref)}`
    );
  }
  return ref;
}

/** Where a "play" affordance sends someone who is leaving the page. */
export function videoWatchUrl(ref: VideoRef): string {
  const { provider, id } = assertVideo(ref);
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
export function videoEmbedUrl(ref: VideoRef): string {
  const { provider, id } = assertVideo(ref);
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


/**
 * THE STAND-IN every un-migrated slot points at.
 *
 * By request, so every play affordance on the site is a working popover today
 * rather than an inert control, with the real ids arriving per record once the
 * Sanity phase gives an editor somewhere to type them. It is the firm's "Who We
 * Are" film — a real, published video, so nothing 404s and nothing plays a
 * dead embed.
 *
 * IT IS ALSO THE HOMEPAGE HERO'S GENUINE VIDEO, and that collision is the one
 * thing to know here. `home.ts` writes its id as a LITERAL rather than
 * importing this, deliberately: the hero is correct and finished, the others
 * are placeholders that happen to share an id today.
 *
 * GREPPING `PLACEHOLDER_VIDEO` NO LONGER FINDS THEM ALL, and that changed
 * quietly when the content moved. Most slots are FIELDS in Sanity now, holding
 * the stand-in id as data. Today it is:
 *
 *   3   in code      carAccidents.ts (two panels), home.ts (the FAQ band)
 *   30  in Sanity    20 in faqs[].video.id — 8 on homePage, 12 on carAccidentsPage
 *                    6 testimonial.video.id, 4 teamMember.videoId
 *
 * So the full sweep is a grep AND a query:
 *
 *   git grep -n PLACEHOLDER_VIDEO -- src
 *   *[video.id == "b4n3r4pchd" || videoId == "b4n3r4pchd"
 *     || count(faqs[video.id == "b4n3r4pchd"]) > 0]{
 *     _type, "name": coalesce(name, _id), "faqSlots": count(faqs[video.id == "b4n3r4pchd"])
 *   }
 *
 * THE `faqs[]` CLAUSE IS NOT OPTIONAL and was added in Phase 2f. The FAQs used
 * to be documents with their own `video.id`, which the first two clauses found;
 * they are array members on two page documents now, so a query without the third
 * clause returns 10 slots and looks complete. It should total 30.
 *
 * Do NOT grep the id in code to find them: `home.ts` writes it as a literal for
 * the hero, whose video is correct and finished, and that would wrongly include
 * it.
 *
 * TODO(video): 33 slots. `YOUTUBE_ORIGINS` below carries the id each maps to,
 * where one is known.
 */
/**
 * THE YOUTUBE MAPPING, AND WHY IT LIVES HERE NOW.
 *
 * Every record used to carry a `TODO(video): was YouTube <id>` comment beside
 * it, which was the ONLY record of which film belonged in which slot. Moving
 * those records into Sanity deleted their comments with them — six in the
 * testimonials slice and two more with the attorney bios — and nobody noticed
 * for four commits, because a comment disappearing is not a test failure.
 *
 * FIVE OF THESE EIGHT ARE UNLISTED. Nothing public can enumerate an unlisted
 * video: yt-dlp, the RSS feed and the channel page all return only the 15
 * public ones. These five were found by working backwards from ids in the
 * codebase, so losing this table means losing them for good — a re-derivation
 * is not available. Only YouTube Studio's Content list holds the true total,
 * and nobody has checked whether there are more than five.
 *
 * A code comment beside a literal cannot survive that literal moving to a CMS.
 * A table in the module that owns video URLs can, which is the whole point of
 * putting it here rather than beside the records again.
 *
 * Keyed by the record's own key in Sanity. TODO(video): as each film is
 * re-hosted, set the Wistia id on that record and strike its row.
 */
export const YOUTUBE_ORIGINS: Record<string, { id: string; title: string; listed: boolean }> = {
  // testimonial
  evelyn: { id: "kFdrOgblr6A", title: "Client Testimonial - Evelyn", listed: false },
  ben: { id: "sMGtyzxGaxY", title: "Client Testimonial - Ben", listed: true },
  joel: { id: "AhfhEBczLcY", title: "Client Testimonial: Joel", listed: false },
  elijah: { id: "aqX7B7vu1ZI", title: "Client Testimonial - Elijah", listed: false },
  kelly: { id: "B3-hJPujs0U", title: "Client Testimonial", listed: false },
  "sean-client": { id: "-cSgLpR2TfA", title: "DORMER HARPRING TESTIMONIAL", listed: true },
  // teamMember — Sean's profile film
  "sean-dormer": { id: "LT-oU3yqtmA", title: "Sean Dormer 2024 Profile", listed: false },
  // a LINK on Sean's bio, not an embed — the "About Dormer Harpring" row
  "sean-dormer:about-film": {
    id: "OUGOMAWgrmc",
    title: "About Dormer Harpring",
    listed: true,
  },
};

export const PLACEHOLDER_VIDEO: VideoRef = { provider: "wistia", id: "b4n3r4pchd" };


/* -------------------------------------------------------------------------
 * Poster frames, when nobody uploaded one
 * ---------------------------------------------------------------------- */

/** What a Wistia poster is asked for at. 16:9, and big enough for the widest
 *  slot that renders one (the bio page's film, at 1280). */
const POSTER = { width: 1280, height: 720 };

/**
 * One request per video id, however many pages ask.
 *
 * The 33 un-migrated slots all point at the SAME stand-in id today, so this is
 * one request for the whole build rather than 33 — the same reasoning as `once()`
 * in sanity/lib/fetch.ts, and it matters for the same reason.
 */
const posters = new Map<string, Promise<string | null>>();

/**
 * The film's own thumbnail, for when an editor uploads no poster frame.
 *
 * WHY oEMBED AND NOT A PREDICTABLE URL. Wistia's thumbnails live under a
 * per-delivery hash that cannot be derived from the media id — the obvious
 * guess, `embed-ssl.wistia.com/deliveries/<id>.jpg`, is a 404. oEmbed is the
 * documented way to turn an id into a thumbnail and it needs no account or key.
 *
 * Returns null rather than throwing when Wistia cannot be reached: a poster is
 * a fallback for a fallback, and taking the whole build down because a third
 * party is slow would be the wrong trade. Callers fall back again, to the
 * person's own portrait, so there is always something to render.
 */
export function wistiaPosterUrl(id: string): Promise<string | null> {
  const cached = posters.get(id);
  if (cached) return cached;

  const request = (async () => {
    try {
      const response = await fetch(
        `https://fast.wistia.com/oembed?url=${encodeURIComponent(
          `https://home.wistia.com/medias/${id}`
        )}`
      );
      if (!response.ok) return null;
      const url: unknown = (await response.json())?.thumbnail_url;
      if (typeof url !== "string" || url === "") return null;
      // The URL carries the crop it was rendered at; ask for ours instead.
      return url.replace(
        /image_crop_resized=\d+x\d+/,
        `image_crop_resized=${POSTER.width}x${POSTER.height}`
      );
    } catch {
      return null;
    }
  })();

  posters.set(id, request);
  return request;
}

/** The dimensions `wistiaPosterUrl` renders at, for `Picture`'s `remoteSize`. */
export const WISTIA_POSTER_SIZE = POSTER;
