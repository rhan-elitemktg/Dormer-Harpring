// Authoring shim for hardcoded body copy.
//
// Body fields are typed and rendered as Portable Text from day one, so that
// when Sanity starts supplying them nothing downstream changes — no bespoke
// block format to convert, no renderer to write later. But hand-writing PT
// literals for copy that is still hardcoded is unreadable (every bold run is
// its own span), so this builds the blocks from a plain string in which
// **double asterisks** mark bold and [brackets](href) mark a link.
//
// THIS IS SCAFFOLDING. Every call to it disappears when the matching field
// moves into the CMS; the field's TYPE is already correct, which is the point.
import type { ImageMetadata } from "astro";

export interface PortableTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

/** A `link` mark, matching what `ProseLink.astro` reads. */
export interface PortableTextLink {
  _type: "link";
  _key: string;
  href: string;
}

/**
 * An image placed in the flow of a body.
 *
 * In Sanity this is an `image` field inside the `blockContent` array, and the
 * projection returns an asset reference where `src` holds an `ImageMetadata`
 * today — which is exactly the swap `Picture.astro` already exists to absorb.
 * `alt` is a field on the object rather than on the asset: the same photograph
 * describes differently in two articles.
 */
export interface PortableTextImage {
  _type: "image";
  _key: string;
  src: ImageMetadata; // Sanity phase: | SanityImageSource
  alt: string;
}

/** Anything that can appear in a body field. */
export type PortableTextNode = PortableTextBlock | PortableTextImage;

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  style: "normal" | "blockquote" | "h2" | "h3";
  markDefs: PortableTextLink[];
  children: PortableTextSpan[];
  /** Present only on list items. Consecutive ones are grouped into one <ul> by
   *  the renderer, which is why a list is a run of blocks and not a block. */
  listItem?: "bullet";
  /** Portable Text nests lists by level. Nothing here nests, so it is always 1,
   *  but the field has to be there or the renderer treats the item as loose. */
  level?: number;
}

/** `**bold**` or `[label](href)`, whichever comes first. */
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/** Leading markers, longest first so "### " is not read as "## " plus a hash. */
const PREFIXES = [
  { mark: "### ", style: "h3" as const },
  { mark: "## ", style: "h2" as const },
  { mark: "> ", style: "blockquote" as const },
  { mark: "- ", style: "normal" as const, listItem: "bullet" as const },
];

/**
 * Build Portable Text blocks, one per argument.
 *
 *   pt("Plain, then **bold**, then [a link](/somewhere).")
 *
 * A leading marker sets the block's style, the way the same characters do in
 * Markdown: `## ` and `### ` for headings, `> ` for a pull quote, `- ` for a
 * bullet. Consecutive bullets become one list — that is the renderer's job, not
 * this shim's, because it is also how Sanity stores them.
 *
 * Marks are not nestable — a link's label is plain text. That is a limit of the
 * shim, not of Portable Text, and it has never come up in this copy.
 */
export function pt(...paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((raw, blockIndex) => {
    const prefix = PREFIXES.find((candidate) => raw.startsWith(candidate.mark));
    const text = prefix ? raw.slice(prefix.mark.length) : raw;
    const children: PortableTextSpan[] = [];
    const markDefs: PortableTextLink[] = [];

    // Empty runs are dropped rather than emitted: a span with no text renders
    // nothing but still counts as a child, and Sanity would never produce one.
    const push = (value: string, marks: string[]) => {
      if (!value) return;
      children.push({
        _type: "span",
        _key: `b${blockIndex}s${children.length}`,
        text: value,
        marks,
      });
    };

    let cursor = 0;
    let match: RegExpExecArray | null;
    // A fresh regex per block: a module-level /g literal carries `lastIndex`
    // between calls, so the second paragraph would start matching mid-string.
    const pattern = new RegExp(INLINE.source, "g");

    while ((match = pattern.exec(text)) !== null) {
      push(text.slice(cursor, match.index), []);
      if (match[1] !== undefined) {
        push(match[1], ["strong"]);
      } else {
        const key = `b${blockIndex}m${markDefs.length}`;
        markDefs.push({ _type: "link", _key: key, href: match[3] });
        push(match[2], [key]);
      }
      cursor = match.index + match[0].length;
    }
    push(text.slice(cursor), []);

    return {
      _type: "block" as const,
      _key: `b${blockIndex}`,
      style: prefix?.style ?? ("normal" as const),
      markDefs,
      children,
      ...(prefix?.listItem ? { listItem: prefix.listItem, level: 1 } : {}),
    };
  });
}

/**
 * An image in the flow of a body, composed alongside `pt()` by spreading:
 *
 *   [...pt("…"), ptImage(hero, "Denver attorneys reviewing a case"), ...pt("…")]
 *
 * A sibling helper rather than another `PREFIXES` marker, because `pt()` takes
 * strings and an image is a module import — there is nothing to put in the
 * string that would resolve to one.
 *
 * `_key` is slugified from the alt text. Portable Text only requires it to be
 * unique within its own array, and two images in one body described identically
 * would be the same image; if that ever happens, pass `key` explicitly.
 */
export function ptImage(
  src: ImageMetadata,
  alt: string,
  key?: string
): PortableTextImage {
  return {
    _type: "image",
    _key: key ?? `i-${alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
    src,
    alt,
  };
}
