// Per-document `<head>` metadata.
//
// A STUB THAT ALREADY HAS REAL DATA TO HOLD, which is why it exists this early
// rather than waiting for `/new-seo-setup`. The 104 imported practice-area
// pages carry the live site's own `metaTitle` and `metaDescription` — the meta
// those pages rank with today — and they land in Phase 3, before the SEO run.
// A document type with nowhere to put them would drop them.
//
// The five fields mirror `SeoInput` in `lib/seo.ts` exactly, which already
// threads through `layouts/Layout.astro` and treats every one as optional with
// a deliberate fallback: a page that passes no `seo` block renders exactly what
// it would have rendered without one.
//
// `/new-seo-setup` EXTENDS this — a Global SEO Settings singleton, JSON-LD,
// sitemap.xml, robots.txt and editor-managed redirects. It does not replace it.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { SearchIcon } from "@sanity/icons/Search";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  icon: SearchIcon,
  /* NOT COLLAPSIBLE ANY MORE. It was a collapsed accordion at the foot of every
     page document; it is a TAB on all of them now, and on the four collections
     it shares a tab with dates and provenance. In both places a collapsed
     wrapper meant a second click to reach five fields that are already behind
     one — and the tab is titled "SEO", so the accordion labelled "SEO" inside
     it was saying the same word twice. */
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description:
        "The browser tab and the blue line in a search result. Falls back to the page title " +
        "when empty. Google truncates around 60 characters.",
      validation: (rule) =>
        rule.max(60).warning("Search results usually cut off past about 60 characters."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      description:
        "The grey summary under a search result. Not a ranking factor, but it is what decides " +
        "whether someone clicks. Google truncates around 160 characters.",
      validation: (rule) =>
        rule.max(160).warning("Search results usually cut off past about 160 characters."),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description:
        "Only when this page deliberately points at another as the original. Leave empty " +
        "otherwise — the page's own URL is already the canonical.",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      initialValue: false,
      description:
        "Keeps the page out of Google. Correct for a thank-you page; wrong for anything " +
        "meant to be found.",
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "image",
      options: { hotspot: true },
      description: "Shown when the page is shared. 1200×630 is the shape every platform crops to.",
    }),
  ],
});
