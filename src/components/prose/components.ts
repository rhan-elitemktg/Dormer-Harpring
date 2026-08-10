/**
 * The shared Portable Text renderer map.
 *
 * Everything an editor can produce in a body field is mapped to a `.prose__*`
 * class. The indirection matters because astro-portabletext defaults an
 * unmapped block to a bare element — and the site's reset sets `margin: 0` on
 * headings, lists and paragraphs, so an unmapped h2 would render with no
 * spacing at all rather than looking merely unstyled.
 */
import ProseParagraph from "./ProseParagraph.astro";
import ProseStrong from "./ProseStrong.astro";
import ProseLink from "./ProseLink.astro";
import ProseH2 from "./ProseH2.astro";
import ProseH3 from "./ProseH3.astro";
import ProseQuote from "./ProseQuote.astro";
import ProseList from "./ProseList.astro";
import ProseListItem from "./ProseListItem.astro";
import ProseImage from "./ProseImage.astro";

export const proseComponents = {
  /**
   * OBJECTS an editor drops into a body, as opposed to text they type.
   *
   * WHERE THE BLOG POST'S FOUR CTA BLOCKS GO. The Blog Post comp draws a dark
   * "Hurt at a trampoline park?" callout, a get-in-touch phone band, an
   * attorney card, and a pull quote inside the article. None are built: they
   * are content an editor should be able to place anywhere in any post, which
   * makes each one an object type here — `callout`, `phoneBand`,
   * `attorneyCard`, `pullQuote` — rather than a fixed section of the template.
   * Deferred to the Sanity phase by request, since authoring them against the
   * `pt()` shim would mean inventing a literal syntax that gets deleted the
   * moment the real schema lands. Not an oversight; do not rebuild them as
   * page sections from the comp.
   *
   * `type`, singular — astro-portabletext's key. `@portabletext/react` calls
   * the same map `types`, and the plural silently renders nothing here: an
   * unmatched key is not an error, the block just falls through to
   * `unknownType`, which draws a warning nobody reads.
   */
  type: {
    image: ProseImage,
  },
  block: {
    normal: ProseParagraph,
    h2: ProseH2,
    h3: ProseH3,
    blockquote: ProseQuote,
  },
  list: {
    bullet: ProseList,
  },
  listItem: {
    bullet: ProseListItem,
  },
  mark: {
    strong: ProseStrong,
    link: ProseLink,
  },
};
