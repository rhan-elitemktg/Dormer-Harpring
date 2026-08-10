// Anchor ids for prose headings, and the contents list built from them.
//
// ONE slugifier for both sides. The blog post's contents box links to `#<id>`
// and ProseH2/ProseH3 render that id — deriving them separately is how an
// anchor silently stops resolving the first time a heading gains an apostrophe
// and the two implementations disagree about what to do with it.
//
// Nothing here is Sanity-specific: it reads the Portable Text a body field
// already holds, so it keeps working unchanged when the body arrives from GROQ
// instead of from `pt()`.

/** The shape both a `pt()` block and an astro-portabletext `node` satisfy. */
interface BlockLike {
  style?: string;
  children?: { text?: string }[];
}

/** A block's plain text — every span concatenated, marks discarded. */
export function blockText(node: BlockLike | undefined): string {
  return (node?.children ?? []).map((child) => child.text ?? "").join("");
}

/**
 * "Who Is Liable for a Trampoline Park Accident?" → "who-is-liable-for-a-
 * trampoline-park-accident".
 *
 * Apostrophes are DELETED rather than treated as separators, so "Colorado's
 * deadline" gives `colorados-deadline` and not `colorado-s-deadline`. Both
 * straight and curly forms, because `pt()` copy carries the curly one.
 */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface HeadingEntry {
  id: string;
  text: string;
}

/**
 * The headings a contents list should offer, in document order.
 *
 * H2 only by default: the blog post's box is a map of the article's sections,
 * and folding in every H3 turns a nine-line list into a twenty-line one. Pass
 * `["h2", "h3"]` if a page ever wants the deeper form.
 *
 * A heading that slugifies to nothing — punctuation only — is skipped rather
 * than emitted with an empty id, which would link to the top of the page.
 */
export function extractHeadings(
  blocks: unknown,
  styles: readonly string[] = ["h2"]
): HeadingEntry[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.flatMap((block: BlockLike) => {
    if (!block?.style || !styles.includes(block.style)) return [];
    const text = blockText(block);
    const id = headingId(text);
    return id ? [{ id, text }] : [];
  });
}
