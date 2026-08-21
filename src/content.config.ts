// CONTENT COLLECTIONS — the imported legacy blog.
//
// SANITY SWAP POINT, one step earlier than the rest. `src/data/*.ts` holds the
// getters; this file holds the SHAPE of the 167 imported posts they read from.
// The collection is an interim store, by request: the import lands here rather
// than in Sanity so the content can be reviewed, corrected and version
// controlled before any of it is pushed to a CMS. Nothing about the getters'
// contract changes when it moves — see `data/blog.ts`.
//
// WHY PORTABLE TEXT JSON AND NOT MARKDOWN. The site already renders Portable
// Text: `Prose.astro` → astro-portabletext, with `pt()` / `ptImage()` in
// `data/portableText.ts` as the authoring shims. Markdown here would mean a
// second renderer now AND a re-conversion at the Sanity swap, with two chances
// to lose formatting. Portable Text stored as-is renders through the existing
// path today and uploads to Sanity unchanged later.
//
// FAITHFUL TO THE SOURCE, NOT TO THE CARD. Where the live WordPress data and
// the built site's shape disagree, these files keep WordPress's version and the
// GETTER coalesces — which is the same division of labour the architecture
// already uses, since a GROQ projection is what does the coalescing after the
// swap. The two places that happens are documented on the fields below.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Portable Text, as `data/portableText.ts` defines it. Kept deliberately loose
 * on `children` and `markDefs` — this validates the SHAPE the renderer needs,
 * not every mark the format allows, so an imported post carrying a mark the
 * hand-authored shim never emitted is not rejected at build time.
 */
const portableTextBlock = z.object({
  _type: z.literal("block"),
  _key: z.string(),
  style: z.enum(["normal", "blockquote", "h2", "h3", "h4"]),
  markDefs: z.array(z.record(z.string(), z.unknown())).default([]),
  children: z.array(
    z.object({
      _type: z.literal("span"),
      _key: z.string(),
      text: z.string(),
      marks: z.array(z.string()).default([]),
    })
  ),
  listItem: z.enum(["bullet", "number"]).optional(),
  // Always 1 — nothing nests. The field has to be present or the renderer
  // treats the item as loose. See the note in portableText.ts.
  level: z.number().int().positive().optional(),
});

/** A person or the firm, credited in a byline. */
const byline = z.object({
  name: z.string(),
  href: z.string(),
});

const blogCategories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/blog-categories" }),
  schema: z.object({
    /** Decoded — WordPress returns `Auto Insurance &amp; Accident Claims`. */
    title: z.string(),
    /**
     * The legacy WordPress slug, which is NOT derivable from the title:
     * `Auto Insurance & Accident Claims` is `auto-insurance-accident-claims`.
     * 167 posts' archive URLs depend on it.
     */
    slug: z.string(),
    /** The WordPress term id. Kept so a re-import can match on identity rather
     *  than on a title someone has since edited. */
    legacyId: z.number().int().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      /** No leading slash — `blogPath()` adds it. The file's id matches. */
      slug: z.string(),
      title: z.string(),
      excerpt: z.string(),
      /** ISO. Orders the feed; JSON-LD and the sitemap both need it machine
       *  readable. Formatted for display by `formatPostDate`. */
      publishedAt: z.string().datetime({ offset: true }).or(z.string()),
      /** Last edit on the legacy site. Not rendered — it is how a re-import
       *  tells a changed post from an untouched one. */
      modifiedAt: z.string().optional(),

      /**
       * ALL of the post's categories, in the live site's own order.
       *
       * `BlogPost.category` on the card is SINGULAR, and 29 of the 167 posts
       * carry more than one — up to four. Storing only the first here would
       * throw away data the CMS phase wants and make the choice unreviewable.
       * So the file keeps every one and `getBlogPosts()` picks the primary,
       * which is the first that is not `uncategorized`.
       *
       * One post has NO category at all
       * (`news-pedestrian-seriously-hurt-after-hit-and-run-collision-in-glendale`),
       * so this may be empty and the getter falls back.
       */
      categories: z.array(z.string()).default([]),

      /** Portable Text. The article body, chrome already stripped. */
      body: z.array(portableTextBlock),
      /** The reviewed-by band at the foot. Per-post: it names a specific
       *  person and makes a specific claim about them. */
      factCheck: z.array(portableTextBlock).default([]),

      author: byline,
      reviewer: byline,

      /**
       * Card art. OPTIONAL because 107 of the 167 legacy posts have no
       * featured image at all — WordPress `featured_media` is 0. The design
       * already treats card art as decorative and renders it with an empty
       * `alt`, so the getter falls back to the practice-area photograph that
       * matches the primary category rather than the import inventing one.
       */
      image: image().optional(),
      /** Set only when the image is a real photograph rather than decorative
       *  card art — the featured block describes its own. */
      imageAlt: z.string().optional(),

      /** The WordPress post id. Identity for a re-import, and the only way to
       *  trace a record back to the source after a slug is corrected. */
      legacyId: z.number().int().optional(),
    }),
});

export const collections = { blog, blogCategories };
