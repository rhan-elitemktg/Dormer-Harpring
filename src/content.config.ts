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
import { defineCollection, z, type SchemaContext } from "astro:content";
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
  /** `link` is the ONLY markDef the renderer maps (see prose/components.ts),
   *  so this matches PortableTextLink exactly rather than staying open. Loose
   *  typing here bought nothing and cost a cast at every read site. */
  markDefs: z
    .array(z.object({ _type: z.literal("link"), _key: z.string(), href: z.string() }))
    .default([]),
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

/**
 * Portable Text with images, as a factory.
 *
 * A factory rather than a const because `image()` exists ONLY inside a
 * `schema: ({ image }) => …` callback — it is the loader's asset resolver, not
 * a free function. Two collections need the same union, so it takes `image` as
 * an argument instead of each declaring its own copy.
 *
 * A union, because both collections carry photographs mid-body. `z.union`
 * discriminates on `_type` well enough here — the two members share no shape —
 * and an entry matching neither fails the build rather than being dropped,
 * which is the behaviour that matters: a silently skipped block is a paragraph
 * that vanishes from a live page.
 */
const portableTextBody = (image: SchemaContext["image"]) =>
  z.array(
    z.union([
      portableTextBlock,
      /* Portable Text's `image` object, as `ptImage()` builds it and
         `ProseImage.astro` renders it. `src` is a PATH relative to the entry
         file; Astro's `image()` resolves it to the ImageMetadata ProseImage
         expects. */
      z.object({
        _type: z.literal("image"),
        _key: z.string(),
        src: image(),
        alt: z.string(),
      }),
    ])
  );

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

      /** Portable Text. The article body, chrome already stripped. 116 of the
       *  167 carry photographs mid-article — see `portableTextBody`. */
      body: portableTextBody(image),
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

/**
 * THE IMPORTED PRACTICE-AREA PAGES — 109 of them, across nine cities.
 *
 * The lightweight template's content, distinct from the heavy hand-authored
 * `PracticeAreaDetail` in `data/carAccidents.ts`, which stays reserved for
 * special cases. Same interim-store reasoning as `blog` above: this lands here
 * rather than in Sanity so it can be reviewed before it is pushed to a CMS.
 *
 * `denver-car-accident-lawyer` is DELIBERATELY ABSENT — the heavy template
 * already serves that slug, and importing it would collide in `[slug].astro`.
 * The exclusion is recorded in `scripts/practice-area-pages.mjs`.
 */
const practiceAreas = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/practice-areas" }),
  schema: ({ image }) =>
    z.object({
      /** No leading slash — `practiceAreaPath()` adds it. The legacy site is
       *  flat at the root, so this slug IS the live URL. */
      slug: z.string(),
      /** The page's own H1, from WordPress. NOT derivable from the slug:
       *  `denver-uber-accident-lawyer` is titled "Denver Rideshare Accident
       *  Lawyer" and `denver-scooter-accident-lawyer` has no city in its H1. */
      title: z.string(),
      /** The SHORT form, for the directory and the city band — "Brain
       *  Injuries", not "Denver Brain Injury Lawyer". Where the page is already
       *  in `getPracticeAreaGroups()` this is that label verbatim, so the two
       *  lists cannot drift. */
      label: z.string(),

      /* city and topic come from `scripts/practice-area-pages.mjs`, which is
         the source of truth. Spelled out here rather than imported because a
         `.mjs` script has no business in the site's type graph — and Zod is the
         drift check: a value the manifest invents that this does not know about
         fails the build rather than rendering an empty band. */
      city: z.enum([
        "denver",
        "aurora",
        "boulder",
        "highlands-ranch",
        "lakewood",
        "thornton",
        "greeley",
        "fort-collins",
        "grand-junction",
      ]),
      topic: z.enum(["motor-vehicle", "premises", "catastrophic", "professional", "other"]),

      /** Subject is Colorado-wide, but the firm files it under a city — the two
       *  `colorado-*` pages sit in the directory's Denver group. */
      statewide: z.boolean().default(false),
      /** Reads as an article rather than a practice area, but the directory
       *  links it AS one, so it has to exist or the hub ships a 404. Five of
       *  these, all slip-and-fall. */
      resource: z.boolean().default(false),

      /** Portable Text, chrome already stripped. */
      body: portableTextBody(image),

      /**
       * THE FAQ ACCORDION, which is NOT part of the WordPress body.
       *
       * It is absent from `content.rendered`, absent from `acf`, and there is
       * no FAQ post type — it lives only in the rendered HTML, so the importer
       * fetches each page twice to get it. 28 of the 109 have one; the rest
       * default to empty, which is normal rather than a failure.
       *
       * `answer` is Portable Text, not a string: the answers carry paragraphs,
       * lists, bold and links. `faqSchema` needs a string, which is what
       * `toPlainText()` in `lib/portableText.ts` is for.
       */
      faqs: z
        .array(
          z.object({
            _key: z.string(),
            question: z.string(),
            answer: z.array(portableTextBlock),
          })
        )
        .default([]),

      /* The live meta, not invented copy — these are what the page already
         ranks with. `/new-seo-setup` makes them editable; until then the
         template reads them straight. */
      metaTitle: z.string(),
      metaDescription: z.string(),

      publishedAt: z.string().datetime({ offset: true }).or(z.string()),
      /** Not rendered. These pages carry no visible date — they are evergreen
       *  service copy, not posts — so this exists only so a re-import can tell
       *  a changed page from an untouched one. */
      modifiedAt: z.string().optional(),
      /** The WordPress page id. Identity for a re-import. */
      legacyId: z.number().int().optional(),
    }),
});

export const collections = { blog, blogCategories, practiceAreas };
