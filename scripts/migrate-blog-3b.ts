// Phase 3b — the 186 blog posts, from the interim content store into Sanity.
//
//   npx tsx scripts/migrate-blog-3b.ts
//   npx sanity dataset import scratch/blog-posts-3b.ndjson --dataset production
//   npx tsx scripts/migrate-blog-3b.ts --verify
//
// TWO SOURCES, NOT ONE, and that is the whole shape of this script.
//
//   185 posts   `src/content/blog/*.json`, straight off disk.
//   1 post      `data/blog.ts`'s `getFeaturedPost()` + `getBlogPostArticles()`.
//
// The second is the trampoline-park article. It exists in BOTH places and the
// hand-authored one is not a duplicate — it is the legacy article WITH
// corrections: the live copy's truncated sentence completed, the firm's real
// phone number in place of the article's third one, and a different category.
// `handAuthoredSlugs()` is what keeps the import from overwriting it today, and
// this script is the moment the two finally become one document.
//
// SO IT LOADS `data/blog.ts` IN NODE, with a LIVE Sanity client. That module's
// hand-authored records resolve their reviewer off the team roster, the firm's
// phone off Firm Details and their category off the taxonomy — all three already
// in Sanity from earlier phases. Reading them through the getter rather than
// transcribing them is the only way the document is guaranteed to hold what the
// site renders today. See `scripts/lib/stub-vite-modules.ts`.
//
// MERGING THE TWO SURFACES A DISAGREEMENT, and it is a visible one. The file
// says the post is Personal Injury; the hand-authored record says Premises
// Liability, and Premises Liability is what the featured panel has been printing
// all along. So the tab row has been ordering by a category the card does not
// show. The document carries BOTH, hand-authored first — which is what the field
// means — and the row reorders as a result: Premises Liability moves from 13th
// to 10th, and Ski Accident, Wrongful Death and Awards each shift down one. That
// is the merge doing its job, not a regression. Nothing else about /news moves.
//
// WHAT IS DELIBERATELY NOT CARRIED ACROSS
//
//   author      All 186 are the firm. `FIRM` in `data/blog.ts` is its one home.
//   readTime    Derived from the body, after this.
//   href        `blogPath(slug)`.
//   factCheck   EMPTY on all 186 — including the hand-authored one, whose band
//               is also derived. The field exists as an editor's override; a
//               seeded copy of the derived sentence would freeze it.
//
// Re-running means purging first — these get generated ids, so `--replace` has
// nothing to match on and a second import silently ADDS 186 more:
//
//   npx tsx scripts/sanity-purge.ts blogPost --yes
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const SOURCE = resolve(process.cwd(), "src/content/blog");
const OUT = resolve(process.cwd(), "scratch/blog-posts-3b.ndjson");
const API_VERSION = "2026-08-01";

/** Counted, not guessed. Both are asserted before anything is written. */
const EXPECTED_POSTS = 186;

/** The one slug `data/blog.ts` still owns. Its file on disk is superseded. */
const HAND_AUTHORED_SLUG = "can-you-sue-a-trampoline-park-if-you-signed-a-waiver";

/** Whose Team record the byline points at. Asserted to resolve to exactly one. */
const REVIEWER_KEY = "k-c-harpring";

type Json = Record<string, unknown>;

interface SourcePost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  modifiedAt?: string;
  categories: string[];
  body: Json[];
  factCheck: Json[];
  image?: string;
  imageAlt?: string;
  legacyId?: number;
}

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

/** Run a GROQ query against the live dataset. Public-read, so no credentials. */
async function query<T>(groq: string): Promise<T> {
  const url =
    `https://${env("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v${API_VERSION}/data/query/` +
    `${env("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity returned ${res.status} for: ${groq}`);
  return (await res.json()).result as T;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * REFUSE TO RUN ONCE THE SOURCE HAS MOVED — checked against the SOURCE, not the
 * module.
 *
 * The old per-module guard read `src/data/blog.ts` for an import of
 * `sanity:client` and refused if it found one. That stopped meaning anything the
 * moment ONE getter in that module moved: Phase 3a swapped the categories, so
 * the module reads Sanity today while the posts this script seeds are still
 * entirely in the code. A module-shaped question cannot answer a getter-shaped
 * one.
 *
 * These two can. The 186 files either exist or they don't, and the hand-authored
 * record either is still a literal or it isn't.
 */
function assertSourcesPresent(): void {
  if (!existsSync(SOURCE)) {
    console.error(
      `${SOURCE} does not exist, so there is nothing to seed. The posts are already in ` +
        `Sanity — seeding is one-way. Recover the directory from git if you need to re-run.`
    );
    process.exit(1);
  }
  const blog = readFileSync(resolve(process.cwd(), "src/data/blog.ts"), "utf8");
  if (!blog.includes(`_key: "trampoline-waiver"`)) {
    console.error(
      `src/data/blog.ts no longer holds the hand-authored featured post, so this script ` +
        `cannot read it. It has already been migrated.`
    );
    process.exit(1);
  }
}

/** WordPress's offset-less wall clock, made explicit. See `lib/dates.ts` — the
 *  calendar date is the fixed thing, and an offset-less string parses as the
 *  reading machine's local time. A date-only value gains a midnight so Sanity's
 *  `datetime` accepts it; it already meant UTC midnight to `new Date()`. */
function asUtc(iso: string): string {
  if (!iso.includes("T")) return `${iso}T00:00:00Z`;
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
}

/**
 * An asset the importer uploads from disk.
 *
 * `sanity dataset import` hashes each file and reuses an existing asset for a
 * repeat, so the 174 references across 151 files land as 151 assets without any
 * deduplication here. The path must be ABSOLUTE.
 */
function assetRef(absolutePath: string): Json {
  assert(existsSync(absolutePath), `Image not found on disk: ${absolutePath}`);
  return { _sanityAsset: `image@file://${absolutePath}` };
}

/**
 * A body, with its image blocks re-pointed at uploads.
 *
 * EVERY `_key` IS PRESERVED VERBATIM. Sanity requires uniqueness within each
 * array and a collision is a silently dropped item, not an error — so
 * regenerating them would be 17,494 chances to lose a paragraph with nothing
 * reporting it. They were checked unique at source and are checked again here.
 */
function convertBody(body: Json[], baseDir: string, where: string): Json[] {
  const keys = new Set<string>();
  return body.map((node) => {
    const key = node._key;
    assert(typeof key === "string" && key !== "", `${where}: a body block has no _key.`);
    assert(!keys.has(key), `${where}: duplicate _key "${key}" in body.`);
    keys.add(key);

    if (node._type !== "image") return node;

    /* TWO SHAPES OF `src`, because the two sources write it differently.
       An imported post carries a PATH relative to its own file. The
       hand-authored body carries what `ptImage()` was handed — an image import,
       which under these hooks is a stub whose `src` is the file's absolute path
       on disk. Both end up as an upload; only the way to the path differs. */
    const src = node.src;
    const path =
      typeof src === "string"
        ? resolve(baseDir, src)
        : (src as { src?: unknown } | null)?.src;
    assert(
      typeof path === "string" && path !== "",
      `${where}: image block ${key} has no resolvable src (${JSON.stringify(src)}).`
    );
    const { src: _dropped, ...rest } = node;
    return { ...rest, ...assetRef(path) };
  });
}

/** The 185 files, minus the one the code still owns, in slug order. */
function readSource(): SourcePost[] {
  const files = readdirSync(SOURCE)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const posts = files.map((name) => JSON.parse(readFileSync(join(SOURCE, name), "utf8")) as SourcePost);

  assert(
    posts.length === EXPECTED_POSTS,
    `Expected ${EXPECTED_POSTS} posts in ${SOURCE}, found ${posts.length}. ` +
      `If that is deliberate, update EXPECTED_POSTS and say why.`
  );
  assert(
    posts.some((post) => post.slug === HAND_AUTHORED_SLUG),
    `${HAND_AUTHORED_SLUG} is not in ${SOURCE}. The hand-authored override has nothing ` +
      `to supersede, which means the assumption behind this script has changed.`
  );

  const slugs = new Set<string>();
  for (const post of posts) {
    assert(!slugs.has(post.slug), `Duplicate post slug: ${post.slug}`);
    slugs.add(post.slug);
  }
  return posts;
}

/** The hand-authored featured post, read through the getters that render it. */
async function readHandAuthored() {
  registerDataModuleHooks({ sanityClient: "live" });
  const blog = await import("../src/data/blog.ts");

  const featured = await blog.getFeaturedPost();
  const articles = await blog.getBlogPostArticles();

  assert(
    articles.length === 1,
    `data/blog.ts now holds ${articles.length} hand-authored articles, not 1. ` +
      `Each one needs a decision, so this script will not guess.`
  );
  const article = articles[0];
  assert(
    article.slug === HAND_AUTHORED_SLUG && featured.href === `/${HAND_AUTHORED_SLUG}/`,
    `The hand-authored article is "${article.slug}", not "${HAND_AUTHORED_SLUG}".`
  );
  return { featured, article };
}

async function build(): Promise<void> {
  assertSourcesPresent();

  const posts = readSource();
  const { featured, article } = await readHandAuthored();

  /* THE JOINS, ASSERTED BEFORE ANYTHING IS WRITTEN. A seed that silently drops
     the rows it could not match is how a founding partner vanishes from two
     pages — see the note in the modelling notes. Both of these have failed for
     real on other projects. */
  const categoryIds = new Map(
    (await query<{ slug: string; _id: string }[]>(
      `*[_type == "blogCategory"]{ "slug": slug.current, _id }`
    )).map((row) => [row.slug, row._id])
  );
  assert(
    categoryIds.size === 23,
    `Expected 23 blogCategory documents, found ${categoryIds.size}. Run migrate-blog-3a first.`
  );

  const reviewers = await query<{ _id: string }[]>(
    `*[_type == "teamMember" && key.current == "${REVIEWER_KEY}"]{ _id }`
  );
  assert(
    reviewers.length === 1,
    `Expected exactly one teamMember with key "${REVIEWER_KEY}", found ${reviewers.length}.`
  );
  const reviewerId = reviewers[0]._id;

  const missing = new Set<string>();
  for (const post of posts) {
    for (const slug of post.categories) if (!categoryIds.has(slug)) missing.add(slug);
  }
  assert(
    missing.size === 0,
    `${missing.size} category slug(s) on posts are not in Sanity: ${[...missing].join(", ")}`
  );

  /* The hand-authored record's category leads, and the file's is kept behind it.
     Two sources disagreed and both facts are worth keeping — see the header. */
  const mergedCategories = [
    featured.category.slug,
    ...posts.find((post) => post.slug === HAND_AUTHORED_SLUG)!.categories.filter(
      (slug) => slug !== featured.category.slug
    ),
  ];

  const lines = posts.map((post) => {
    const hand = post.slug === HAND_AUTHORED_SLUG;

    const categories = (hand ? mergedCategories : post.categories).map((slug) => ({
      _type: "reference",
      _ref: categoryIds.get(slug),
      // Slug, not a generated key: stable between runs, and unique within an
      // array that cannot hold the same category twice anyway.
      _key: slug,
    }));

    /* `alt` RIDES ON THE IMAGE, and only the featured post has one. On a card
       this art is decorative and announced as nothing; on the featured panel it
       is the page's own photograph. None of the 61 imported posts carries a
       description, so the field is empty on 60 of 61 by rights. */
    const image = hand
      ? // A local import under src/assets, so the stub hands back an absolute path.
        { ...assetRef(String((featured.image as unknown as { src: string }).src)), alt: featured.imageAlt }
      : post.image
        ? assetRef(resolve(SOURCE, post.image))
        : undefined;

    const doc: Json = {
      _type: "blogPost",
      title: hand ? featured.title : post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: hand ? featured.excerpt : post.excerpt,
      categories,
      body: hand
        ? convertBody(article.body as unknown as Json[], SOURCE, post.slug)
        : convertBody(post.body, SOURCE, post.slug),
      reviewer: { _type: "reference", _ref: reviewerId },
      publishedAt: asUtc(hand ? featured.publishedAt : post.publishedAt),
      featured: hand,
    };

    if (image) doc.image = { _type: "image", ...image };
    if (post.modifiedAt) doc.modifiedAt = asUtc(post.modifiedAt);
    if (post.legacyId !== undefined) doc.legacyId = post.legacyId;

    return JSON.stringify(doc);
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join("\n") + "\n");

  /* The hand-authored post supplies its OWN card art, so its file's image is
     not one of these — counting both would report 62 where 61 documents carry
     one. */
  const withArt =
    posts.filter((post) => post.image && post.slug !== HAND_AUTHORED_SLUG).length + 1;
  console.log(
    `${lines.length} blogPost documents → ${OUT}\n` +
      `  1 featured (${HAND_AUTHORED_SLUG}, hand-authored, ${mergedCategories.join(" + ")})\n` +
      `  ${withArt} with card art, ${lines.length - withArt} without\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")}`
  );
}

async function verify(): Promise<void> {
  const posts = readSource();

  const live = await query<
    {
      slug: string;
      title: string;
      excerpt: string;
      publishedAt: string;
      featured: boolean | null;
      legacyId: number | null;
      categories: string[] | null;
      blocks: number;
      images: number;
      hasImage: boolean;
      reviewer: string | null;
    }[]
  >(`*[_type == "blogPost"] | order(slug.current asc){
      "slug": slug.current, title, excerpt, publishedAt, featured, legacyId,
      "categories": categories[]->slug.current,
      "blocks": count(body),
      "images": count(body[_type == "image"]),
      "hasImage": defined(image.asset),
      "reviewer": reviewer->key.current
    }`);

  assert(
    live.length === posts.length,
    `Sanity holds ${live.length} blogPost documents; the source has ${posts.length}. ` +
      `A second import ADDS rather than replaces — purge and re-import.`
  );

  const bySlug = new Map(live.map((row) => [row.slug, row]));
  const problems: string[] = [];

  for (const post of posts) {
    const row = bySlug.get(post.slug);
    if (!row) {
      problems.push(`${post.slug}: missing from Sanity`);
      continue;
    }
    const hand = post.slug === HAND_AUTHORED_SLUG;

    // The hand-authored post's title, excerpt, date and lead category are
    // deliberately NOT the file's, so only the shared facts are compared on it.
    if (!hand) {
      if (row.title !== post.title) problems.push(`${post.slug}: title differs`);
      if (row.excerpt !== post.excerpt) problems.push(`${post.slug}: excerpt differs`);
      if (row.publishedAt !== asUtc(post.publishedAt)) {
        problems.push(`${post.slug}: publishedAt ${row.publishedAt} ≠ ${asUtc(post.publishedAt)}`);
      }
      if ((row.categories ?? []).join(",") !== post.categories.join(",")) {
        problems.push(
          `${post.slug}: categories ${(row.categories ?? []).join(",")} ≠ ${post.categories.join(",")}`
        );
      }
      if (row.blocks !== post.body.length) {
        problems.push(`${post.slug}: ${row.blocks} body blocks ≠ ${post.body.length}`);
      }
      const sourceImages = post.body.filter((node) => node._type === "image").length;
      if (row.images !== sourceImages) {
        problems.push(`${post.slug}: ${row.images} body images ≠ ${sourceImages}`);
      }
      if (row.hasImage !== Boolean(post.image)) {
        problems.push(`${post.slug}: card art present=${row.hasImage}, source=${Boolean(post.image)}`);
      }
    }

    if (row.reviewer !== REVIEWER_KEY) problems.push(`${post.slug}: reviewer ${row.reviewer}`);
    if ((row.legacyId ?? undefined) !== post.legacyId) {
      problems.push(`${post.slug}: legacyId ${row.legacyId} ≠ ${post.legacyId}`);
    }
    if (Boolean(row.featured) !== hand) {
      problems.push(`${post.slug}: featured=${row.featured}, expected ${hand}`);
    }
  }

  const featuredCount = live.filter((row) => row.featured).length;
  if (featuredCount !== 1) problems.push(`${featuredCount} posts are marked featured, not 1`);

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ ${live.length} blogPost documents match the source.\n` +
      `  1 featured · ${live.filter((r) => r.hasImage).length} with card art · ` +
      `${live.reduce((n, r) => n + r.images, 0)} body images`
  );
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) return verify();
  await build();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
