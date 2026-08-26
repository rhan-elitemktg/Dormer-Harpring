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

/**
 * The shape both a `pt()` block and an astro-portabletext `node` satisfy.
 *
 * `_type` IS WHAT FIXES THE TYPE ERROR. `text: unknown` is a separate choice.
 * Keeping the two apart matters, because only one of them is load-bearing.
 *
 * The error was TYPESCRIPT'S WEAK TYPE DETECTION: a target whose properties are
 * ALL optional rejects any source sharing none of its property names, and
 * `ArbitraryTypedObject` is `TypedObject & { [key: string]: any }` — an index
 * signature does not count as a shared name. So `{ text?: string }[]` and
 * `{ text?: unknown }[]` both failed with "has no properties in common"; only
 * adding a REQUIRED `_type` cleared it. That name is the one every child has:
 * both arms extend `TypedObject`, `pt()` writes `_type: "span"`, and
 * `content.config.ts` requires it.
 *
 * `text` is `unknown` because it is TRUE, not because it is needed — with
 * `_type` present, `text?: string` also compiles, since that index signature
 * makes `text` `any` on the object arm. But a block's children are spans, which
 * carry `text`, and inline objects, which do not, so `string` would be a
 * declaration this module cannot honour. Narrowing it back would typecheck and
 * lie.
 *
 * Nothing about the runtime changed: `blockText` already discarded anything
 * without usable text. The types were describing a stricter world than the
 * format allows.
 */
interface BlockLike {
  style?: string;
  children?: { _type: string; text?: unknown }[];
}

/** A block's plain text — every span concatenated, marks and inline objects
 *  discarded. The `typeof` guard is what drops the objects; `?? ""` could not,
 *  because a non-string `text` is not nullish. */
export function blockText(node: BlockLike | undefined): string {
  return (node?.children ?? [])
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("");
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
