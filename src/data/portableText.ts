// Authoring shim for hardcoded body copy.
//
// Body fields are typed and rendered as Portable Text from day one, so that
// when Sanity starts supplying them nothing downstream changes — no bespoke
// block format to convert, no renderer to write later. But hand-writing PT
// literals for copy that is still hardcoded is unreadable (every bold run is
// its own span), so this builds the blocks from a plain string in which
// **double asterisks** mark bold.
//
// THIS IS SCAFFOLDING. Every call to it disappears when the matching field
// moves into the CMS; the field's TYPE is already correct, which is the point.

export interface PortableTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  style: "normal";
  markDefs: never[];
  children: PortableTextSpan[];
}

/**
 * Build Portable Text blocks, one per argument.
 *
 *   pt("Plain, then **bold**, then plain.")
 */
export function pt(...paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, blockIndex) => ({
    _type: "block" as const,
    _key: `b${blockIndex}`,
    style: "normal" as const,
    markDefs: [] as never[],
    children: text
      .split("**")
      // Boldness comes from the position in the ORIGINAL split — odd indices
      // sit between delimiters. It has to be captured before any filtering,
      // and it cannot be recovered by looking the text back up, since the same
      // words may appear both bold and plain in one paragraph.
      .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
      .filter((part) => part.text !== "")
      .map((part, spanIndex) => ({
        _type: "span" as const,
        _key: `b${blockIndex}s${spanIndex}`,
        text: part.text,
        marks: part.bold ? ["strong"] : [],
      })),
  }));
}
