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

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  style: "normal";
  markDefs: PortableTextLink[];
  children: PortableTextSpan[];
}

/** `**bold**` or `[label](href)`, whichever comes first. */
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Build Portable Text blocks, one per argument.
 *
 *   pt("Plain, then **bold**, then [a link](/somewhere).")
 *
 * Marks are not nestable — a link's label is plain text. That is a limit of the
 * shim, not of Portable Text, and it has never come up in this copy.
 */
export function pt(...paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, blockIndex) => {
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
      style: "normal" as const,
      markDefs,
      children,
    };
  });
}
