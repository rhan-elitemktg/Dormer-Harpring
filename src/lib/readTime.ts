// "8 min read", derived from a body rather than typed beside it.
//
// `InsightTeaser` in data/news.ts carries a hand-written `readTime` because those
// four records have no body to measure — they are teasers pointing at articles
// that live elsewhere. A blog post has its body right there, and a hand-written
// figure on one of those is wrong the first time a paragraph is added and
// nobody remembers to re-count. So the field keeps its name and its type, and
// the value is computed.
//
// Survives the Sanity swap unchanged: it reads Portable Text, which is what the
// GROQ projection will return.

/** Words per minute. 225 is the usual figure for adult reading of general
 *  non-technical prose; the comp's "7 min read" on ~1,790 words implies ~255,
 *  which rounds this post up by one minute rather than down. */
const WPM = 225;

interface BlockLike {
  _type?: string;
  children?: { text?: string }[];
}

export function readTime(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";

  // Non-block nodes (an image) contribute no words but do cost the reader
  // time. Not modelled: one photograph inside 1,800 words cannot move a figure
  // rounded to the minute.
  const words = (blocks as BlockLike[])
    .flatMap((block) => (block?.children ?? []).map((child) => child.text ?? ""))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(1, Math.round(words / WPM))} min read`;
}
