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
import { INSIGHTS_QUERY, NEWS_MENTIONS_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

// THE ASSET IMPORTS THAT USED TO SIT HERE ARE GONE — the getters have read
// Sanity since Phase 2e and nothing referenced them; an unused module-level
// import is not an error, so nothing reported them for four commits. The FILES
// stay in `src/assets/`: `npm run backup` runs `--no-assets`, so git is the only
// copy of those originals outside Sanity's asset store.

export interface NewsMention {
  _key: string;
  outlet: string;
  logo: ImageMetadata | SanityImageSource;
  /** Display string, not a date object — editors type "Mar 2026". */
  date: string;
  headline: string;
  href: string;
}

export interface InsightPost {
  _key: string;
  /** Category name; also picks the card's tint and icon. */
  category: string;
  /** Must match an entry in components/icons/InsightIcon.astro. */
  iconKey: string;
  readTime: string;
  title: string;
  href: string;
}

export interface FeedSection {
  tabs: { news: string; insights: string };
  news: { eyebrow: string; title: string; lede: string; ctaLabel: string };
  insights: { eyebrow: string; title: string; lede: string; ctaLabel: string };
}

export async function getFeedSection(): Promise<FeedSection> {
  return {
    tabs: { news: "In the News", insights: "Insights & Resources" },
    news: {
      eyebrow: "Press & recognition",
      title: "In the news.",
      lede:
        "Recent press coverage and recognition of our attorneys and the results we " +
        "win for Denver families.",
      ctaLabel: "View all news",
    },
    insights: {
      eyebrow: "Learn your rights",
      title: "Insights & resources.",
      lede:
        "Plain-English articles to guide you through your options and help you make " +
        "informed decisions after an accident.",
      ctaLabel: "View more helpful articles",
    },
  };
}

/** TODO(content): every `href` is a placeholder — the comp points them all at #news. */
export async function getNewsMentions(): Promise<NewsMention[]> {
  return once("newsMentions", async () =>
    required(await sanityClient.fetch(NEWS_MENTIONS_QUERY), "Homepage", "Pages")
  );
}

/**
 * The comp stores a `tint` hex and a built SVG on each post. Both are derived
 * from the category, so only `iconKey` survives here — a hex is not a field an
 * editor can fill in, and the tint is picked in CSS off the same key.
 */
export async function getInsightPosts(): Promise<InsightPost[]> {
  return once("insights", async () =>
    required(await sanityClient.fetch(INSIGHTS_QUERY), "Homepage", "Pages")
  );
}
