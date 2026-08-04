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
import ProseList from "./ProseList.astro";
import ProseListItem from "./ProseListItem.astro";

export const proseComponents = {
  block: {
    normal: ProseParagraph,
    h2: ProseH2,
    h3: ProseH3,
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
