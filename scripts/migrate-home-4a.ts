// Phase 4a — the homepage's COPY, out of five data modules.
//
//   npx tsx scripts/migrate-home-4a.ts
//   npx sanity dataset import scratch/home-4a.ndjson --dataset production --replace
//   npx tsx scripts/migrate-home-4a.ts --verify      # BEFORE swapping the getters
//   …then swap, build, and byte-diff.
//
// `--verify` COMPARES SANITY AGAINST THE CODE, so it only means anything while
// the code still holds the literals. Run it between the import and the swap;
// after the swap it is comparing the dataset with itself.
//
// WHAT MOVES, AND WHERE FROM
//
//   data/home.ts            getHomeHero          → homePage.hero
//                           getHomeStats         → homePage.heroStats
//                           getHomeFirmIntro     → homePage.firmIntro
//                           getHomePromise       → homePage.promise
//                           getHomeWhyUs         → sharedSections.whyUs
//   data/practiceAreas.ts   getPracticeSection   → homePage.practiceSection
//                           getPracticePromise   → homePage.practicePromise
//   data/faqs.ts            getFaqSection        → homePage.faqSection
//   data/news.ts            getFeedSection       → homePage.feedSection
//   data/community.ts       getCommunitySection  → homePage.communitySection
//
// WHY WHY-US GOES TO A DIFFERENT DOCUMENT. It is the only one of the nine that
// two pages render — the homepage and Practice Areas, word for word, which is
// what `sharedSections` exists for. The comment in practice-areas.astro already
// said so: "if they ever diverge the fix is a second document in the CMS, not a
// second copy of the strings."
//
// BOTH DOCUMENTS ARE READ BACK AND MERGED. `--replace` replaces a document
// WHOLE, and `homePage` already carries seven arrays from Phases 2f and 3d
// while `sharedSections` carries three objects from Phase 1. A payload holding
// only the new fields would delete all of them. This refuses to write unless
// each read comes back carrying what it should — the guard `migrate-practice-
// cards-3d.ts` added after 2f nearly lost the homepage's arrays.
//
// THE ONE IMAGE THAT MOVES is the FAQ ask-card's portrait, from a local import
// to a Sanity asset. It is the same file the team roster already uploaded
// (`src/assets/attorneys/attorney-2.jpg`, sha1 223c8c88…), and the importer
// hashes each file, so this reuses that asset rather than uploading a second
// copy. It is also the only reason the homepage will not come back
// byte-identical: the `<img>` src moves from /_astro/ to cdn.sanity.io, which
// `compare-builds.py` classifies as IMAGES rather than CHANGED.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/home-4a.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

/**
 * REFUSE TO RUN ONCE THE SOURCE HAS MOVED, asserted against the source THIS
 * script reads rather than against the module as a whole.
 *
 * A module-shaped check — "does this file import sanity:client?" — stopped
 * meaning anything the moment one getter in a module moved: all five of these
 * files already read Sanity for something else. So each entry names a string
 * that exists only inside the literal being migrated. When the getter is
 * swapped the literal goes with it and this fires.
 */
const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["home.ts", "getHomeHero", "Denver Personal Injury Attorneys"],
  ["home.ts", "getHomeWhyUs", "The Dormer difference"],
  ["home.ts", "getHomePromise", "What you can expect working with us."],
  ["home.ts", "getHomeFirmIntro", "Fewer cases. All in on every one."],
  ["practiceAreas.ts", "getPracticeSection", "When the stakes are highest"],
  ["faqs.ts", "getFaqSection", "Answers, straight from your attorney."],
  ["news.ts", "getFeedSection", "Insights & Resources"],
  ["community.ts", "getCommunitySection", "Rooted in Denver."],
];

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

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

/** System fields must not be written back — `_rev` pins the import to a
 *  revision that is no longer current by the time it lands. */
function writable(doc: Json | null): Json {
  if (!doc) return {};
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

/**
 * Stringify with keys sorted, at every depth.
 *
 * A PLAIN `JSON.stringify` COMPARISON IS WRONG AGAINST SANITY: it returns a
 * stored object's keys alphabetically where an assembled member carries them in
 * schema order, so a deep-compare reports every section as mismatched with
 * every value identical. Phase 2f lost a round trip to this.
 */
function canon(value: unknown): string {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.fromEntries(
        Object.keys(node as Json)
          .sort()
          .map((key) => [key, walk((node as Json)[key])])
      );
    }
    return node;
  };
  return JSON.stringify(walk(value));
}

/**
 * The file with its comments removed.
 *
 * A SENTINEL THAT ALSO APPEARS IN A COMMENT IS A GUARD THAT CANNOT FIRE, and
 * this one caught it in the act: `community.ts` opens on
 * `// "Rooted in Denver." — the homepage's community mosaic`, so after the
 * getter was swapped the plain `includes()` still found the string and the
 * guard reported the literal as present. Seven of the eight fired; the eighth
 * would have let a re-run read a module that no longer holds anything.
 *
 * The same shape has cost this project a wrong number four times over —
 * `TODO(launch)` counted against comments that DISCUSS a marker rather than
 * being one. Strip the comments, then look.
 */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

function assertSourcePresent(): void {
  const missing = SOURCES.filter(([file, , sentinel]) => {
    const path = resolve(process.cwd(), `src/data/${file}`);
    return !code(path).includes(sentinel);
  });
  if (missing.length === 0) return;
  console.error(
    `These getters no longer hold their copy in code, so there is nothing left to seed:\n` +
      missing.map(([file, getter]) => `  src/data/${file} → ${getter}()`).join("\n") +
      `\nThey are already in Sanity. Swapping is a one-way door; re-run this before the swap ` +
      `or not at all.`
  );
  process.exit(1);
}

/**
 * The absolute path behind a LOCAL image import.
 *
 * `FaqSection.ask.portrait` widens to `ImageMetadata | SanityImageSource` at the
 * swap, so reading `.src` off it stops typechecking — and the discrimination
 * that fixes it is a real assertion rather than a type dance: a portrait that is
 * already a Sanity reference means this getter has moved and there is nothing
 * left to seed.
 *
 * Discriminated on a field only one member has, NOT with a type predicate. A
 * predicate over `SanityImageSource` narrows the false branch to `never`,
 * because that union is wide enough to swallow `ImageMetadata` whole.
 */
function localImagePath(image: unknown, what: string): string {
  if (image && typeof image === "object" && "src" in image) {
    return String((image as { src: unknown }).src);
  }
  throw new Error(
    `${what} is not a local import any more, so it is already a Sanity asset. ` +
      `Seeding is a one-way door — this script has nothing left to read.`
  );
}

function assetRef(absolutePath: string): Json {
  assert(existsSync(absolutePath), `Image not found on disk: ${absolutePath}`);
  return { _type: "image", _sanityAsset: `image@file://${absolutePath}` };
}

const video = (ref: { provider: string; id: string }): Json => ({
  _type: "videoRef",
  provider: ref.provider,
  id: ref.id,
});

/**
 * EVERY ARRAY IN THE PAYLOAD, CHECKED FOR DUPLICATE `_key`s BEFORE ANYTHING IS
 * WRITTEN.
 *
 * Sanity requires `_key` uniqueness WITHIN an array, and a collision is a
 * SILENTLY DROPPED item rather than an error — a green import that loses half a
 * list. Phase 3b found `pt()` numbering blocks from zero within each call, so a
 * body assembled from two calls carried every key twice; this payload includes
 * one `pt()` body (the firm introduction) and four hand-keyed arrays.
 */
function assertKeysUnique(node: unknown, path = "$"): void {
  if (Array.isArray(node)) {
    const keys = node
      .map((item) => (item && typeof item === "object" ? (item as Json)._key : undefined))
      .filter((key): key is string => typeof key === "string");
    if (keys.length > 0) {
      const seen = new Set<string>();
      const dupes = keys.filter((key) => (seen.has(key) ? true : (seen.add(key), false)));
      assert(
        dupes.length === 0,
        `${path} has duplicate _key(s): ${[...new Set(dupes)].join(", ")}. Sanity drops the ` +
          `colliding members silently, so this would be a green import that loses content.`
      );
      assert(
        keys.length === node.length,
        `${path} mixes keyed and unkeyed members (${keys.length} of ${node.length} have a _key).`
      );
    }
    node.forEach((item, i) => assertKeysUnique(item, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Json)) {
      assertKeysUnique(value, `${path}.${key}`);
    }
  }
}

async function build(): Promise<void> {
  assertSourcePresent();

  registerDataModuleHooks({ sanityClient: "live" });
  const home = await import("../src/data/home.ts");
  const areas = await import("../src/data/practiceAreas.ts");
  const faqs = await import("../src/data/faqs.ts");
  const news = await import("../src/data/news.ts");
  const community = await import("../src/data/community.ts");

  const [hero, heroStats, firmIntro, promise, whyUs, practiceSection, practicePromise, faqSection, feedSection, communitySection] =
    await Promise.all([
      home.getHomeHero(),
      home.getHomeStats(),
      home.getHomeFirmIntro(),
      home.getHomePromise(),
      home.getHomeWhyUs(),
      areas.getPracticeSection(),
      areas.getPracticePromise(),
      faqs.getFaqSection(),
      news.getFeedSection(),
      community.getCommunitySection(),
    ]);

  const homeCopy: Json = {
    hero: {
      eyebrow: hero.eyebrow,
      headline: hero.headline,
      lede: hero.lede,
      primaryCta: { label: hero.primaryCta.label, href: hero.primaryCta.href },
      videoCta: { label: hero.videoCta.label, video: video(hero.videoCta.video) },
    },
    heroStats: heroStats.map((stat) => ({ _key: stat._key, big: stat.big, label: stat.label })),
    firmIntro: {
      title: firmIntro.title,
      tagline: firmIntro.tagline,
      // Portable Text, verbatim from `pt()`. The blocks already carry the
      // `_key`s and `markDefs` the renderer reads.
      body: firmIntro.body,
      helpTitle: firmIntro.helpTitle,
      helpPoints: firmIntro.helpPoints.map((point) => ({
        _key: point._key,
        lead: point.lead,
        text: point.text,
      })),
      videoLabel: firmIntro.videoLabel,
      video: video(firmIntro.video),
      quote: { ...firmIntro.quote },
      aside: { ...firmIntro.aside },
    },
    practiceSection: {
      eyebrow: practiceSection.eyebrow,
      title: practiceSection.title,
      lede: practiceSection.lede,
      tabsLabel: practiceSection.tabsLabel,
      catastrophicTitle: practiceSection.catastrophicTitle,
      ask: { ...practiceSection.ask },
    },
    practicePromise,
    promise: {
      eyebrow: promise.eyebrow,
      title: promise.title,
      slides: promise.slides.map((slide) => ({
        _key: slide._key,
        label: slide.label,
        body: slide.body,
      })),
      ctaLabel: promise.ctaLabel,
    },
    faqSection: {
      eyebrow: faqSection.eyebrow,
      title: faqSection.title,
      lede: faqSection.lede,
      answerCtaLabel: faqSection.answerCtaLabel,
      ask: {
        title: faqSection.ask.title,
        body: faqSection.ask.body,
        ctaLabel: faqSection.ask.ctaLabel,
        ctaHref: faqSection.ask.ctaHref,
        // A local import under src/assets, so the stub hooks hand back an
        // absolute path. Already in Sanity as the roster's portrait — the
        // importer hashes the file and reuses that asset.
        portrait: assetRef(localImagePath(faqSection.ask.portrait, "The FAQ ask card's portrait")),
        portraitAlt: faqSection.ask.portraitAlt,
      },
    },
    feedSection: {
      tabs: { ...feedSection.tabs },
      news: { ...feedSection.news },
      insights: { ...feedSection.insights },
    },
    communitySection: { ...communitySection },
  };

  const sharedCopy: Json = {
    whyUs: {
      eyebrow: whyUs.eyebrow,
      title: { lead: whyUs.title.lead, accent: whyUs.title.accent },
      lede: whyUs.lede,
      points: whyUs.points.map((point) => ({
        _key: point._key,
        title: point.title,
        body: point.body,
      })),
      ctaLabel: whyUs.ctaLabel,
    },
  };

  assertKeysUnique(homeCopy, "homePage");
  assertKeysUnique(sharedCopy, "sharedSections");

  /* READ BACK AND MERGE — `--replace` replaces a document whole. */
  const [existingHome, existingShared] = await Promise.all([
    query<Json | null>(`*[_type == "homePage" && _id == "homePage"][0]`),
    query<Json | null>(`*[_type == "sharedSections" && _id == "sharedSections"][0]`),
  ]);

  const homeBase = writable(existingHome);
  const sharedBase = writable(existingShared);

  assert(
    Array.isArray(homeBase.faqs) && (homeBase.faqs as unknown[]).length > 0,
    `The live homePage document has no faqs[]. Refusing to write: this payload REPLACES the ` +
      `document, and merging onto an empty read would delete the seven arrays Phases 2f and 3d ` +
      `put there.`
  );
  assert(
    typeof sharedBase.attorneysBand === "object" && sharedBase.attorneysBand !== null,
    `The live sharedSections document has no attorneysBand. Refusing to write for the same ` +
      `reason — Phase 1's three objects would be replaced by one.`
  );

  const docs = [
    { ...homeBase, ...homeCopy, _id: "homePage", _type: "homePage" },
    { ...sharedBase, ...sharedCopy, _id: "sharedSections", _type: "sharedSections" },
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, docs.map((doc) => JSON.stringify(doc)).join("\n") + "\n");

  console.log(
    `2 documents → ${OUT}\n` +
      `  homePage:       9 copy fields MERGED onto ${Object.keys(homeBase).length} existing ` +
      `(${(homeBase.faqs as unknown[]).length} FAQs still there)\n` +
      `  sharedSections: whyUs MERGED onto ${Object.keys(sharedBase).length} existing\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();

  registerDataModuleHooks({ sanityClient: "live" });
  const home = await import("../src/data/home.ts");
  const areas = await import("../src/data/practiceAreas.ts");
  const faqs = await import("../src/data/faqs.ts");
  const news = await import("../src/data/news.ts");
  const community = await import("../src/data/community.ts");

  const [hero, heroStats, firmIntro, promise, whyUs, practiceSection, practicePromise, faqSection, feedSection, communitySection] =
    await Promise.all([
      home.getHomeHero(),
      home.getHomeStats(),
      home.getHomeFirmIntro(),
      home.getHomePromise(),
      home.getHomeWhyUs(),
      areas.getPracticeSection(),
      areas.getPracticePromise(),
      faqs.getFaqSection(),
      news.getFeedSection(),
      community.getCommunitySection(),
    ]);

  const live = await query<Json | null>(`{
    "home": *[_type == "homePage" && _id == "homePage"][0]{
      hero{ eyebrow, headline, lede, primaryCta{ label, href }, videoCta{ label, video{ provider, id } } },
      "heroStats": heroStats[]{ _key, big, label },
      firmIntro{
        title, tagline, body, helpTitle,
        "helpPoints": helpPoints[]{ _key, lead, text },
        videoLabel, video{ provider, id }, quote{ text, name, role }, aside{ title, text, ctaLabel }
      },
      practiceSection{ eyebrow, title, lede, tabsLabel, catastrophicTitle, ask{ text, cta } },
      practicePromise,
      promise{ eyebrow, title, "slides": slides[]{ _key, label, body }, ctaLabel },
      faqSection{ eyebrow, title, lede, answerCtaLabel, ask{ title, body, ctaLabel, ctaHref, portraitAlt, "portrait": portrait.asset->originalFilename } },
      feedSection{ tabs{ news, insights }, news{ eyebrow, title, lede, ctaLabel }, insights{ eyebrow, title, lede, ctaLabel } },
      communitySection{ eyebrow, title, lede, ctaLabel },
      "faqCount": count(faqs),
      "cardCount": count(practiceAreaCards)
    },
    "shared": *[_type == "sharedSections" && _id == "sharedSections"][0]{
      whyUs{ eyebrow, title{ lead, accent }, lede, "points": points[]{ _key, title, body }, ctaLabel },
      "hasAttorneysBand": defined(attorneysBand),
      "hasCoreValues": defined(coreValues)
    }
  }`);

  assert(live !== null, "Sanity returned nothing.");
  const liveHome = live.home as Json | null;
  const liveShared = live.shared as Json | null;
  assert(liveHome !== null, "No homePage document.");
  assert(liveShared !== null, "No sharedSections document.");

  const problems: string[] = [];
  const compare = (what: string, actual: unknown, expected: unknown) => {
    if (canon(actual) !== canon(expected)) {
      problems.push(`${what}:\n    live     ${canon(actual)}\n    expected ${canon(expected)}`);
    }
  };

  compare("hero", liveHome.hero, {
    eyebrow: hero.eyebrow,
    headline: hero.headline,
    lede: hero.lede,
    primaryCta: hero.primaryCta,
    videoCta: { label: hero.videoCta.label, video: hero.videoCta.video },
  });
  compare("heroStats", liveHome.heroStats, heroStats);
  compare("firmIntro", liveHome.firmIntro, {
    title: firmIntro.title,
    tagline: firmIntro.tagline,
    body: firmIntro.body,
    helpTitle: firmIntro.helpTitle,
    helpPoints: firmIntro.helpPoints,
    videoLabel: firmIntro.videoLabel,
    video: firmIntro.video,
    quote: firmIntro.quote,
    aside: firmIntro.aside,
  });
  compare("practiceSection", liveHome.practiceSection, practiceSection);
  compare("practicePromise", liveHome.practicePromise, practicePromise);
  compare("promise", liveHome.promise, promise);
  compare("feedSection", liveHome.feedSection, feedSection);
  compare("communitySection", liveHome.communitySection, communitySection);
  compare("whyUs", liveShared.whyUs, whyUs);

  /* The FAQ section is compared WITHOUT its portrait, because the two sides
     hold different things by design — a local import here, an asset there. The
     asset's original filename is what proves it is the right photograph. */
  const { portrait, ...askRest } = faqSection.ask;
  compare("faqSection", liveHome.faqSection, {
    eyebrow: faqSection.eyebrow,
    title: faqSection.title,
    lede: faqSection.lede,
    answerCtaLabel: faqSection.answerCtaLabel,
    ask: {
      ...askRest,
      portrait: localImagePath(portrait, "The FAQ ask card's portrait").split("/").pop(),
    },
  });

  /* THE MERGE HELD on both documents. */
  if (!liveHome.faqCount) problems.push("homePage.faqs is empty — the merge dropped Phase 2f's arrays.");
  if (!liveHome.cardCount) problems.push("homePage.practiceAreaCards is empty — the merge dropped Phase 3d's rails.");
  if (!liveShared.hasAttorneysBand) problems.push("sharedSections.attorneysBand is gone — the merge replaced Phase 1's objects.");
  if (!liveShared.hasCoreValues) problems.push("sharedSections.coreValues is gone — same.");

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ all nine homepage sections and the shared Why Us band match the code exactly.\n` +
      `  homePage still holds ${liveHome.faqCount} FAQs and ${liveHome.cardCount} cards, and ` +
      `sharedSections still holds its three Phase 1 objects — the merges did not replace them.`
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
