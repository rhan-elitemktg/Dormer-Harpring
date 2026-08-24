// Reading Portable Text as plain text.
//
// `data/faqs.ts` predicted this file by name: "If they ever need rich text,
// `lib/portableText.ts` gets a toPlainText() for the JSON-LD side." The
// imported practice-area FAQs are that case — their answers carry paragraphs,
// lists, bold and links, while `faqSchema` needs one string per answer.
//
// The RENDERED answer stays rich; only the structured-data copy is flattened.
// Those two must say the same thing — Google's FAQPage guidance requires the
// answer to be present on the page — which is why this reads the same blocks
// the component renders rather than a separately stored summary.
//
// `lib/headings.ts` already has `blockText()` for ONE block. This is the
// whole-array form, and it deliberately does not import that one: headings.ts
// is about anchors and this is about serialization, and the two would drift
// toward each other's needs if they shared a helper.

/** The shape both a `pt()` block and an imported block satisfy. */
interface BlockLike {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
}

/**
 * Every block's text, joined.
 *
 * Blocks are joined with a space rather than a newline: this feeds a JSON-LD
 * string attribute, where a newline is just an escape sequence that makes the
 * markup harder to read without changing what Google sees.
 *
 * Non-block entries (images) contribute nothing — an alt attribute is not part
 * of the answer, and including it would put "Motorcycle Accident Lawyer Denver"
 * in the middle of a sentence on four of these pages.
 */
export function toPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";

  return blocks
    .filter((block: BlockLike) => block?._type === "block")
    .map((block: BlockLike) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .map((text) => text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
