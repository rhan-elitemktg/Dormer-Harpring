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

/*
 * NO DOCUMENT STORES A PROVIDER ANY MORE, AND THIS TYPE IS WHY THAT IS SAFE.
 *
 * Sanity held a `videoRef` object — `{provider, id}` — on every video field,
 * with `provider` hidden and always "wistia": a control with nothing to decide,
 * wrapped in an accordion around a single input. Phases 6a, 6b and 6e flattened
 * all of them to a bare `videoId` string, and each PROJECTION now emits
 * `{"provider": "wistia", "id": videoId}` as a literal. So every getter and
 * every component still receives the pair, and this module is still the only
 * place a pair becomes a URL.
 *
 * THE `youtube` BRANCH BELOW IS DELIBERATELY KEPT, unused. It is the point of
 * the shape: the next provider swap needs somewhere to land, and it becomes a
 * change to these projections' one literal rather than a hunt through
 * components. If a swap ever needs to be per-record again, the answer is a
 * stored `provider` beside `videoId` — not a URL in a field.
 *
 * That reasoning lived on the `videoRef` schema type, which 6e deleted once
 * nothing declared a field of it. A comment beside a thing does not survive the
 * thing; this project has lost that argument three times, so it moved here
 * rather than going with it.
 */
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
 *   0   in code      every slot is a FIELD now. The constant below is the only
 *                    mention left, and `data/attorneys.ts`, `data/faqs.ts` and
 *                    `data/testimonials.ts` each carry a comment saying so
 *   34  in Sanity    6 testimonial.videoId, 4 teamMember.videoId,
 *                    8 homePage.faqSection.items[].videoId,
 *                    12 featuredPracticeArea.faqSection.items[].videoId,
 *                    2 featuredPracticeArea triage/criteria video.videoId,
 *                    homePage.firmIntro.videoId, homePage.hero.videoCta.videoId
 *
 * 33 OF THOSE 34 ARE PLACEHOLDERS. The hero's is the finished "Dormer Harpring
 * — Who We Are" film, which merely shares the id. Do not count it, and do not
 * strike it.
 *
 * So the full sweep is a grep AND a query:
 *
 *   git grep -n PLACEHOLDER_VIDEO -- src
 *   *[videoId == "b4n3r4pchd"
 *     || hero.videoCta.videoId == "b4n3r4pchd"
 *     || firmIntro.videoId == "b4n3r4pchd"
 *     || triage.video.videoId == "b4n3r4pchd"
 *     || criteria.video.videoId == "b4n3r4pchd"
 *     || count(faqSection.items[videoId == "b4n3r4pchd"]) > 0]{
 *     _type, "name": coalesce(name, label, _id),
 *     "faqSlots": count(faqSection.items[videoId == "b4n3r4pchd"])
 *   }
 *
 * THIS QUERY HAS BEEN STALE TWICE, AND BOTH TIMES IT STILL RETURNED ROWS. Phase
 * 2f moved the FAQs from documents into page arrays, and a version without the
 * `faqSection.items` clause read 10 of 30 and looked complete. Phases 6a/6b/6e
 * then flattened every `video{provider,id}` object to a bare `videoId`, and the
 * version querying `video.id` matched NOTHING — which reads as "no placeholders
 * left". **A sweep that returns nothing is the same shape as a sweep that
 * passes.** Re-run the counts above before trusting a total.
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
const oembeds = new Map<string, Promise<Record<string, unknown> | null>>();

/**
 * ONE oEMBED REQUEST PER ID, shared by everything that needs something from it.
 *
 * The poster frame and the runtime both come out of the same payload, so asking
 * twice would double the build's network for one answer. Memoised per id, which
 * for the 33 un-migrated slots pointing at one stand-in is a single request for
 * the whole build.
 *
 * Returns null rather than throwing when Wistia cannot be reached. Everything
 * built on it is a fallback or an embellishment, and taking the build down
 * because a third party is slow would be the wrong trade.
 */
function wistiaOembed(id: string): Promise<Record<string, unknown> | null> {
  const cached = oembeds.get(id);
  if (cached) return cached;

  const request = (async () => {
    try {
      const response = await fetch(
        `https://fast.wistia.com/oembed?url=${encodeURIComponent(
          `https://home.wistia.com/medias/${id}`
        )}`
      );
      if (!response.ok) return null;
      return (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  oembeds.set(id, request);
  return request;
}

/**
 * The film's runtime, as the FAQ row prints it — "2 min".
 *
 * IT WAS A TYPED FIELD AND IS NOT ANY MORE. Every FAQ carried a hand-entered
 * `videoLength` that nothing checked against the film it labelled, so the two
 * could disagree and only a viewer would notice. oEmbed already tells us, on a
 * request the poster frame is making anyway.
 *
 * Null when Wistia cannot be reached or reports nothing useful; the row then
 * prints "Watch" with no duration, which is the honest degradation — a made-up
 * runtime is worse than none.
 */
export async function wistiaDuration(id: string): Promise<string | null> {
  const seconds = (await wistiaOembed(id))?.duration;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  // Rounded to the minute, never to zero: a 40-second answer still reads "1 min".
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

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
export async function wistiaPosterUrl(id: string): Promise<string | null> {
  const url: unknown = (await wistiaOembed(id))?.thumbnail_url;
  if (typeof url !== "string" || url === "") return null;
  // The URL carries the crop it was rendered at; ask for ours instead.
  return url.replace(
    /image_crop_resized=\d+x\d+/,
    `image_crop_resized=${POSTER.width}x${POSTER.height}`
  );
}

/** The dimensions `wistiaPosterUrl` renders at, for `Picture`'s `remoteSize`. */
export const WISTIA_POSTER_SIZE = POSTER;
