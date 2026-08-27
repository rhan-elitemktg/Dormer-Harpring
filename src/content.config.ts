// CONTENT COLLECTIONS — the 104 imported practice-area pages, and only those.
//
// THE LAST OF THREE. This file held the blog's 186 posts and its 23 categories
// as well; Phase 3 moved both into Sanity and deleted them here in the same
// commits, because a content collection nothing reads is a dead literal and
// nothing reports one. `practiceAreas` follows in 3c and then this file goes.
//
// SANITY SWAP POINT, one step earlier than the rest. `src/data/*.ts` holds the
// getters; this file holds the SHAPE of what they read from. The collection is
// an interim store, by request: the import lands here rather than in Sanity so
// the content can be reviewed, corrected and version controlled before any of
// it is pushed to a CMS. Nothing about the getters' contract changed when the
// blog moved, and nothing will when this does — see `data/blog.ts` for what
// that swap actually looked like.
//
// WHY PORTABLE TEXT JSON AND NOT MARKDOWN. The site already renders Portable
// Text: `Prose.astro` → astro-portabletext, with `pt()` / `ptImage()` in
// `data/portableText.ts` as the authoring shims. Markdown here would mean a
// second renderer now AND a re-conversion at the Sanity swap, with two chances
// to lose formatting. Portable Text stored as-is renders through the existing
// path today and uploads to Sanity unchanged later. That bet paid: the blog's
// 17,494 blocks uploaded with every `_key` intact and not one byte of prose
// changed on any of the 186 pages.
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
 * a free function. It served two collections until the blog left; kept as a
 * factory for the one remaining because the constraint that forced it has not
 * changed, and un-factoring it would be churn on a file that retires in 3c.
 *
 * A union, because these pages carry photographs mid-body. `z.union`
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

/**
 * THE IMPORTED PRACTICE-AREA PAGES — 109 of them, across nine cities.
 *
 * The lightweight template's content, distinct from the heavy hand-authored
 * `PracticeAreaDetail` in `data/carAccidents.ts`, which stays reserved for
 * special cases. Interim store, as the header says: this landed here rather
 * than in Sanity so it could be reviewed before being pushed to a CMS.
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

/* TWO OF THE THREE ARE GONE. Phase 3a moved the 23 categories into Sanity as
   `blogCategory` documents and 3b moved the 186 posts as `blogPost` ones; both
   directories were deleted with the collections that read them, because a
   content collection nothing reads is a dead literal and nothing reports one.
   `practiceAreas` follows in 3c, and then this file retires entirely. */
export const collections = { practiceAreas };
