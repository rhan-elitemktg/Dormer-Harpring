// Phase 6a — the homepage sweep's data moves, in one payload.
//
//   npx tsx scripts/migrate-home-sweep-6a.ts
//   npx sanity dataset import scratch/home-sweep-6a.ndjson --dataset production --replace
//   npx tsx scripts/migrate-home-sweep-6a.ts --verify   # BEFORE swapping the projections
//
// ELEVEN CHANGES ACROSS THREE DOCUMENTS, and they are not all the same kind, so
// the leaf-multiset guard that carried Phase 5 does not apply: values are ADDED
// here (three bands that had no editable copy at all) and REMOVED (each video's
// `provider`, each FAQ's typed `videoLength`). Every one is asserted on its own
// terms instead, and the seeded strings are asserted EQUAL TO THE LITERALS THE
// COMPONENTS CURRENTLY RENDER — that is what keeps the byte-diff meaningful.
//
// THREE BANDS OWNED THEIR OWN COPY, which this codebase's first rule forbids:
// "Outstanding results." was in `home/RecentResults.astro`, the awards bar's
// label was a prop DEFAULT in `AwardsBar.astro` that no caller overrode, and
// the testimonial rail's heading and button were in `TestimonialRail.astro`.
// The Sanity readiness sweep missed all three because it looked for content
// ARRAYS in component frontmatter; these are bare strings in markup.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/home-sweep-6a.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

/**
 * THE STRINGS THE COMPONENTS RENDER TODAY, and the migration refuses to seed
 * anything else. If someone edits the markup before this runs, the assertion
 * below fails rather than quietly publishing a different homepage.
 */
const HARDCODED = {
  resultsTitle: "Outstanding results.",
  resultsCta: "See all results",
  awardsEyebrow: "Recognized & awarded",
  railEyebrow: "Testimonials",
  railTitle: "We do it for these moments.",
  railCta: "Read all reviews",
};

/** Where each literal still lives, so the assertion can read it back. */
const SOURCES: [file: string, literal: string][] = [
  ["src/components/home/RecentResults.astro", HARDCODED.resultsTitle],
  ["src/components/home/RecentResults.astro", HARDCODED.resultsCta],
  ["src/components/AwardsBar.astro", HARDCODED.awardsEyebrow],
  ["src/components/TestimonialRail.astro", HARDCODED.railEyebrow],
  ["src/components/TestimonialRail.astro", HARDCODED.railTitle],
  ["src/components/TestimonialRail.astro", HARDCODED.railCta],
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

function writable(doc: Json): Json {
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

/** `{provider, id}` → the bare id, asserting the provider was what we think. */
function flatten(video: unknown, where: string): string {
  assert(!!video && typeof video === "object", `${where}: no video object to flatten.`);
  const { provider, id } = video as { provider?: string; id?: string };
  assert(provider === "wistia", `${where}: provider is "${provider}", not "wistia".`);
  assert(typeof id === "string" && id.length > 0, `${where}: no video id.`);
  return id;
}

/**
 * Each FAQ row: the video becomes a bare id, the typed length goes, and the
 * band's one button label becomes this row's own.
 *
 * `videoLength` IS DROPPED RATHER THAN MOVED. It is derived from Wistia's
 * oEmbed now, beside the poster frame that already comes from there.
 */
function faqItem(item: Json, ctaLabel: string, where: string): Json {
  const { video, videoLength, ...rest } = item;
  assert(typeof videoLength === "string", `${where}: no videoLength to drop.`);
  return { ...rest, videoId: flatten(video, where), ctaLabel };
}

async function main(): Promise<void> {
  const verify = process.argv.includes("--verify");

  if (!verify) {
    const missing = SOURCES.filter(([file, literal]) => !readFileSync(file, "utf8").includes(literal));
    assert(
      missing.length === 0,
      `These literals are no longer in the components they are being seeded from:\n` +
        missing.map(([f, l]) => `  ${f}: ${JSON.stringify(l)}`).join("\n")
    );
  }

  const home = await query<Json | null>(`*[_id == "homePage"][0]`);
  const car = await query<Json | null>(`*[_id == "carAccidentsPage"][0]`);
  const shared = await query<Json | null>(`*[_id == "sharedSections"][0]`);
  assert(!!home && !!car && !!shared, "one of the three documents is missing.");

  if (verify) {
    const h = home as Json;
    const intro = h.firmIntro as Json;
    const practice = h.practiceSection as Json;
    const faq = h.faqSection as Json;
    const cards = practice.cards as Json[];
    const items = faq.items as Json[];
    const caItems = ((car as Json).faqSection as Json).items as Json[];
    const s = shared as Json;

    assert(!!h.resultsStrip, "homePage: resultsStrip is missing — did the import run?");
    assert(!("video" in ((h.hero as Json).videoCta as Json)), "hero.videoCta.video is still nested.");
    assert(!("video" in intro), "firmIntro.video is still nested.");
    assert(!("name" in (intro.quote as Json)), "firmIntro.quote.name is still a string.");
    assert(!!(intro.quote as Json).attorney, "firmIntro.quote.attorney reference is missing.");
    assert(!("closing" in practice), "practiceSection.closing is still on the band.");
    assert(!("answerCtaLabel" in faq), "faqSection.answerCtaLabel is still on the band.");
    assert(cards.every((c) => typeof c.closing === "string"), "a card has no closing line.");
    assert(items.every((i) => typeof i.ctaLabel === "string" && !("videoLength" in i)), "a home FAQ row is unmigrated.");
    assert(caItems.every((i) => typeof i.ctaLabel === "string" && !("videoLength" in i)), "a Car Accidents FAQ row is unmigrated.");
    assert(!!s.awardsBar && !!s.testimonialRail, "sharedSections: the two new bands are missing.");
    console.log("  ✓ homePage         resultsStrip, videoId ×2, quote reference, per-card closing, per-question button");
    console.log("  ✓ carAccidentsPage videoId ×12, per-question button");
    console.log("  ✓ sharedSections   awardsBar, testimonialRail");
    console.log("\n6a: the dataset matches the new shape.");
    return;
  }

  // ── homePage ───────────────────────────────────────────────────────────────
  const h = writable(home);
  const hero = h.hero as Json;
  const videoCta = hero.videoCta as Json;
  const { video: heroVideo, ...heroCtaRest } = videoCta;
  hero.videoCta = { ...heroCtaRest, videoId: flatten(heroVideo, "hero.videoCta") };

  h.resultsStrip = { title: HARDCODED.resultsTitle, ctaLabel: HARDCODED.resultsCta };

  const intro = h.firmIntro as Json;
  const { video: introVideo, ...introRest } = intro;
  const quote = introRest.quote as Json;

  /*
   * THE QUOTE JOINS ON NAME AND ROLE, AND BOTH ARE ASSERTED. Phase 2 hit the
   * trap where three of four card records matched the roster and the fourth did
   * not; a join that silently misses is how the wrong person ends up quoted.
   */
  const attorney = await query<{ _id: string; name: string; role: string } | null>(
    `*[_type == "teamMember" && name == ${JSON.stringify(quote.name)}][0]{_id, name, role}`
  );
  assert(!!attorney, `firmIntro.quote: no team member named ${JSON.stringify(quote.name)}.`);
  assert(
    attorney.role === quote.role,
    `firmIntro.quote: the roster says ${JSON.stringify(attorney.role)} but the card says ` +
      `${JSON.stringify(quote.role)}. Reconcile them before joining.`
  );
  const { name: _n, role: _r, ...quoteRest } = quote;
  h.firmIntro = {
    ...introRest,
    videoId: flatten(introVideo, "firmIntro"),
    quote: { ...quoteRest, attorney: { _type: "reference", _ref: attorney._id } },
  };

  const practice = h.practiceSection as Json;
  const { closing, ...practiceRest } = practice;
  assert(typeof closing === "string", "practiceSection.closing is not a string.");
  const cards = practiceRest.cards as Json[];
  assert(Array.isArray(cards) && cards.length > 0, "practiceSection.cards is empty.");
  h.practiceSection = { ...practiceRest, cards: cards.map((c) => ({ ...c, closing })) };

  const faq = h.faqSection as Json;
  const { answerCtaLabel, ...faqRest } = faq;
  assert(typeof answerCtaLabel === "string", "faqSection.answerCtaLabel is not a string.");
  const items = faqRest.items as Json[];
  h.faqSection = {
    ...faqRest,
    items: items.map((i, n) => faqItem(i, answerCtaLabel, `homePage faq[${n}]`)),
  };

  // ── carAccidentsPage ───────────────────────────────────────────────────────
  const c = writable(car);
  const caFaq = c.faqSection as Json;
  /*
   * CAR ACCIDENTS HAD NO LABEL OF ITS OWN — it read the homepage's, which is
   * why its twelve rows seed from `answerCtaLabel` above rather than from
   * anything on this document.
   */
  assert(!("answerCtaLabel" in caFaq), "carAccidentsPage grew its own answerCtaLabel — check before seeding.");
  const caItems = caFaq.items as Json[];
  c.faqSection = {
    ...caFaq,
    items: caItems.map((i, n) => faqItem(i, answerCtaLabel, `carAccidentsPage faq[${n}]`)),
  };

  // ── sharedSections ─────────────────────────────────────────────────────────
  const s = writable(shared);
  assert(!!s.whyUs && !!s.attorneysBand, "sharedSections came back without its existing bands.");
  s.awardsBar = { eyebrow: HARDCODED.awardsEyebrow };
  s.testimonialRail = {
    eyebrow: HARDCODED.railEyebrow,
    title: HARDCODED.railTitle,
    ctaLabel: HARDCODED.railCta,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, [h, c, s].map((d) => JSON.stringify(d)).join("\n") + "\n");
  console.log(`  homePage           resultsStrip, videoId ×2, quote → ${attorney._id}, ${cards.length} cards gain a closing line, ${items.length} questions gain a button`);
  console.log(`  carAccidentsPage   ${caItems.length} questions: videoId, button, videoLength dropped`);
  console.log(`  sharedSections     awardsBar, testimonialRail`);
  console.log(`\n3 documents → ${OUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
