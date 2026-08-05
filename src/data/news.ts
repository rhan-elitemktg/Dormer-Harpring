// The homepage's two-tab feed.
//
// SANITY SWAP POINT — and deliberately TWO exports rather than one merged list,
// because these become two separate collections: `newsMention` (press coverage,
// pointing off-site) and `blogPost` (167 of them on the legacy site, pointing
// in-site). The comp merges them behind one tab switch, which makes them look
// like one type with a flag; they are not. Keeping them apart means the CMS
// swap is two clean substitutions rather than an unpicking job.
import type { ImageMetadata } from "astro";
import denver7 from "../assets/news/denver7.webp";
import fox31 from "../assets/news/fox31-cw2.webp";
import mountainMail from "../assets/news/mountain-mail.webp";
import outthere from "../assets/news/outthere.webp";

export interface NewsMention {
  _key: string;
  outlet: string;
  logo: ImageMetadata;
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
  return [
    {
      _key: "adventure-park",
      outlet: "FOX31 / CW2",
      logo: fox31,
      date: "Mar 2026",
      headline:
        "Family files lawsuit after child fell 20 feet, broke spine at adventure park in Denver",
      href: "#",
    },
    {
      _key: "dating-app",
      outlet: "Denver7 ABC",
      logo: denver7,
      date: "Feb 2026",
      headline:
        "Denver cardiologist convicted of drugging, assaulting women; victims file suit against dating app",
      href: "#",
    },
    {
      _key: "tinder-hinge",
      outlet: "OutThere Colorado",
      logo: outthere,
      date: "Jan 2026",
      headline: "Six victims of Denver rapist sue the parent company of Tinder and Hinge",
      href: "#",
    },
    {
      _key: "saguache-jail",
      outlet: "The Mountain Mail",
      logo: mountainMail,
      date: "Nov 2025",
      headline:
        "Jurors find Saguache County jail liable, award $4 million to victim's family",
      href: "#",
    },
  ];
}

/**
 * The comp stores a `tint` hex and a built SVG on each post. Both are derived
 * from the category, so only `iconKey` survives here — a hex is not a field an
 * editor can fill in, and the tint is picked in CSS off the same key.
 */
export async function getInsightPosts(): Promise<InsightPost[]> {
  return [
    {
      _key: "claim-worth",
      category: "Your case",
      iconKey: "value",
      readTime: "5 min read",
      title: "What is my personal injury claim worth?",
      href: "#",
    },
    {
      _key: "first-48",
      category: "After a crash",
      iconKey: "clock",
      readTime: "4 min read",
      title: "What to do in the first 48 hours after an accident",
      href: "#",
    },
    {
      _key: "adjusters",
      category: "Insurance",
      iconKey: "shield",
      readTime: "3 min read",
      title: "Talking to adjusters: what not to say",
      href: "#",
    },
    {
      _key: "how-long",
      category: "The process",
      iconKey: "steps",
      readTime: "2 min read",
      title: "How long will my personal injury case take?",
      href: "#",
    },
  ];
}
