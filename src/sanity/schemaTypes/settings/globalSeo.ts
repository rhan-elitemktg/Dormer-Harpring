// Site-wide SEO fallbacks — the knobs that exist only to serve search.
//
// DELIBERATELY NOT PART OF `firmDetails`. That singleton is who the firm IS —
// name, address, phone, socials — and it feeds the `LegalService` JSON-LD,
// which is a claim about the business rather than a search setting. Mixing the
// two would put a crawl switch beside the office address and make neither
// document's job obvious.
//
// EVERYTHING HERE IS A FALLBACK, NEVER AN OVERRIDE. A page's own `seo` block
// wins over `defaultOgImage` — see `resolveSeo` in `lib/seo.ts`, which is the
// one place that precedence is expressed. The single exception is
// `discourageCrawling`, which is deliberately the other way round: it is a
// master switch and has to beat a page that says it wants to be indexed, or it
// would not be a master switch.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { SearchIcon } from "@sanity/icons/Search";

export const globalSeo = defineType({
  name: "globalSeo",
  title: "Global SEO Settings",
  type: "document",
  icon: SearchIcon,
  fields: [
    defineField({
      name: "discourageCrawling",
      title: "Discourage this site from being crawled",
      type: "boolean",
      initialValue: false,
      description:
        "When ON, the whole site is hidden from Google and every other search engine — every " +
        "page gets a 'noindex' tag and robots.txt blocks crawlers outright. Correct while the " +
        "site is still on its temporary address. ⚠️ TURN THIS OFF AT LAUNCH, or the real site " +
        "will never appear in search.",
    }),
    defineField({
      name: "defaultOgImage",
      title: "Default social share image",
      type: "image",
      options: { hotspot: true },
      description:
        "Shown when a page is shared on social media and has no share image of its own. " +
        "1200×630 is the shape every platform crops to. Any page can override this in its own " +
        "SEO section.",
    }),
  ],
  preview: {
    select: { discouraged: "discourageCrawling" },
    prepare: ({ discouraged }) => ({
      title: "Global SEO Settings",
      /* The one setting on this site that can silently undo the launch, so it
         is surfaced on the row rather than only inside the form. */
      subtitle: discouraged ? "⚠️ Hidden from search engines" : undefined,
    }),
  },
});
