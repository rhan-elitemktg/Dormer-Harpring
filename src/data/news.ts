// The homepage's two-tab feed.
//
// DELIBERATELY TWO EXPORTS rather than one merged list. The comp merges them
// behind one tab switch, which makes them look like one type with a flag; they
// are not. Press mentions point off-site to somebody else's publication and
// insight teasers point in-site at articles the firm writes.
//
// BOTH ARE ARRAYS ON THE `homePage` DOCUMENT since Phase 2f, not collections.
// They render on one page, and a Collection is for content reused in more than
// one place. The header here used to predict `newsMention` and `blogPost` as
// two collections; the blog half of that still holds — those 186 posts are
// genuinely reusable — and is Phase 3.
import type { ImageMetadata } from "astro";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import { blogPath } from "../lib/routePaths";
import type { BlogPost } from "./blog";
import {
  HOME_FEED_SECTION_QUERY,
  INSIGHT_TEASERS_QUERY,
  PRESS_MENTIONS_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

// THE ASSET IMPORTS THAT USED TO SIT HERE ARE GONE — the getters have read
// Sanity since Phase 2e and nothing referenced them; an unused module-level
// import is not an error, so nothing reported them for four commits. The FILES
// stay in `src/assets/`: `npm run backup` runs `--no-assets`, so git is the only
// copy of those originals outside Sanity's asset store.

export interface PressMention {
  _key: string;
  outlet: string;
  logo: ImageMetadata | SanityImageSource;
  /** Display string, not a date object — editors type "Mar 2026". */
  date: string;
  headline: string;
  href: string;
}

export interface InsightTeaser {
  /** The post's slug — its stable identity, not the array member's key. */
  _key: string;
  /** The post's category NAME, for the card's meta line. */
  category: string;
  title: string;
  href: string;
  /**
   * The post's own card image, or null.
   *
   * NULL FOR 125 OF THE 186 POSTS, so the empty case is the common one and the
   * card draws `PostThumb`'s branded placeholder — the same art every other
   * post card on the site falls back to. This replaced a tinted icon plate
   * chosen by a hand-typed `iconKey`, which meant a fifth field to fill in and
   * a card that looked nothing like the post it linked to.
   */
  image: BlogPost["image"];
}

export interface FeedSection {
  tabs: { news: string; insights: string };
  /* `ctaHref` on the news tab only. Its button leaves this site — the firm's
     accident-news WordPress install — where the Insights button goes to /news/
     through ROUTES. */
  news: { eyebrow: string; title: string; lede: string; ctaLabel: string; ctaHref: string };
  insights: { eyebrow: string; title: string; lede: string; ctaLabel: string };
}

export async function getFeedSection(): Promise<FeedSection> {
  return once("homePage:feedSection", async () =>
    required(await sanityClient.fetch(HOME_FEED_SECTION_QUERY), "Homepage", "Pages")
  );
}

/**
 * ~~TODO(content)~~ CLOSED. Every `href` was "#" — the comp pointed them all at
 * #news — and all four now carry the article they name. Unlike the Insight
 * Teasers below, these stay hand-typed: a press mention lives on somebody
 * else's site, so there is nothing here to reference.
 */
export async function getPressMentions(): Promise<PressMention[]> {
  return once("pressMentions", async () =>
    required(await sanityClient.fetch(PRESS_MENTIONS_QUERY), "Homepage", "Pages")
  );
}

/**
 * Four published posts, chosen in the Studio.
 *
 * EVERYTHING SHOWN COMES OFF THE POST, so there is nothing here to keep in step
 * with the article and nothing an editor can leave half-filled. The old shape
 * stored a title, a category, an icon key, a read time and a URL per card, and
 * all four shipped with `href: "#"` — the link being the field you finish
 * later is what that shape produces.
 *
 * `href` is built here through `blogPath()` rather than projected, because
 * `lib/routePaths.ts` owns URLs on this site. The schema filters the reference
 * to posts with a body, so every one of these has a page.
 */
export async function getInsightTeasers(): Promise<InsightTeaser[]> {
  const rows = await once("insightTeasers", async () =>
    required(await sanityClient.fetch(INSIGHT_TEASERS_QUERY), "Homepage", "Pages")
  );
  return rows.map((row) => {
    if (!row.slug) {
      throw new Error(
        "homepage: an Insight Teaser points at a post with no slug. Open the Homepage " +
          "at /admin under Pages and re-pick it."
      );
    }
    return {
      _key: row._key ?? row.slug,
      category: row.category ?? "",
      title: row.title ?? "",
      href: blogPath(row.slug),
      image: (row.image as BlogPost["image"]) ?? null,
    } satisfies InsightTeaser;
  });
}
