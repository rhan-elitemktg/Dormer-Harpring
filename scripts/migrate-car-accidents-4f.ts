// Phase 4f — the heavy Car Accidents page, out of `data/carAccidents.ts`.
//
//   npx tsx scripts/migrate-car-accidents-4f.ts
//   npx sanity dataset import scratch/car-accidents-4f.ndjson --dataset production --replace
//   npx tsx scripts/migrate-car-accidents-4f.ts --verify   # BEFORE swapping the getters
//
// 837 lines of literal, fifteen named sections, 89 array members and 270 strings
// onto `carAccidentsPage` — which already carries the twelve FAQs from Phase 2f,
// so this is a read-back-and-merge like 4a and 4e.
//
// THREE KEY-STRINGS BECOME REAL REFERENCES, which closes the `TODO(sanity)` the
// `award` and `testimonial` schemas have carried since Phase 2:
//
//   credentials.badges[].awardKey    → reference to an `award`
//   results.stories[].reviewKey      → reference to a `testimonial`
//   lawyers.attorneys[].key          → reference to a `teamMember`
//   hero.reviewer.name / role        → read off a `teamMember` reference
//
// EVERY ONE OF THOSE JOINS IS ASSERTED BEFORE ANYTHING IS WRITTEN. A seed that
// silently drops the rows it could not match is how a whole band disappears from
// a page nobody re-reads — and these keys are exactly the ones HANDOFF records as
// content rather than bookkeeping, because renaming one used to render the wrong
// badge.
//
// WHICH PHOTOGRAPHS MOVE, in one rule: a photograph belonging to a CARD whose
// copy is editable moves with that card; a photograph that is the page's or a
// band's backdrop stays a local import. So the two video posters, the two
// feature-card posters and the reviewer's portrait become assets, and the hero,
// the art-directed "why us" pair and the timeline's backdrop do not.
//
// `consult.jpg` LANDS ON BOTH SIDES OF THAT LINE — it is the timeline's backdrop
// and a feature card's poster. That is fine and worth knowing: the importer
// hashes each file, so the asset is uploaded once and the local import is
// unaffected.
//
// WHAT STAYS IN CODE BESIDES THE ART: the page's slug and join key (routing),
// the section anchors (`CA_SECTION_IDS`, read by the nav AND the sections' own
// ids), the reviewer's bio href (`attorneyPath()`), and the map's title (built
// from the firm's name — the literal carried a second copy of it).
//
// SPENT, AND IT HAS BEEN EDITED TWICE SINCE. Its swap happened, so `--verify`
// compares the dataset with itself; and Phase 6d deleted the `carAccidentsPage`
// TYPE outright — this page is a `featuredPracticeArea` document now — so this
// could not run even if the literals were back. The getter rename it calls was
// followed here rather than left dangling, because `check:types` gates the
// whole repo and a spent migration must not be what turns it red.
//
// THAT IS THE THIRD PHASE 4 SCRIPT THIS HAS HAPPENED TO. They read data-layer
// getters, later phases change those getters, and the gate goes red on a file
// nobody can run. Worth deciding whether they are documentation (delete them;
// git has them, and the commits are the real record) or code.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/car-accidents-4f.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["carAccidents.ts", "getPracticeAreaDetails", "Denver Car Accident Lawyers"],
  ["faqs.ts", "getCarAccidentFaqSection", "Other questions people ask us"],
];

/** Every count this page must still have after the move. Re-measured, not
 *  guessed — a section that quietly lost a row is what this catches. */
const EXPECTED = {
  trail: 3,
  proof: 3,
  navItems: 6,
  triageRows: 5,
  triageSources: 4,
  takeaways: 4,
  criteria: 3,
  attorneys: 5,
  badges: 6,
  whyStats: 3,
  whyColumns: 3,
  stories: 4,
  steps: 4,
  phases: 5,
  points: 3,
  tiles: 8,
  denverStats: 3,
  corridors: 5,
  checklistSteps: 5,
  faultSources: 1,
  features: 2,
  cards: 6,
} as const;

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

function writable(doc: Json | null): Json {
  if (!doc) return {};
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

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

function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

function assertSourcePresent(): void {
  const missing = SOURCES.filter(
    ([file, , sentinel]) => !code(resolve(process.cwd(), `src/data/${file}`)).includes(sentinel)
  );
  if (missing.length === 0) return;
  console.error(
    `These getters no longer hold their copy in code, so there is nothing left to seed:\n` +
      missing.map(([file, getter]) => `  src/data/${file} → ${getter}()`).join("\n") +
      `\nThey are already in Sanity. Swapping is a one-way door.`
  );
  process.exit(1);
}

function assertKeysUnique(node: unknown, path: string): void {
  if (Array.isArray(node)) {
    const keys = node
      .map((item) => (item && typeof item === "object" ? (item as Json)._key : undefined))
      .filter((key): key is string => typeof key === "string");
    if (keys.length > 0) {
      assert(
        new Set(keys).size === keys.length,
        `${path} has duplicate _key(s): ${keys.join(", ")}. Sanity drops the colliding members ` +
          `silently, so this would be a green import that loses content.`
      );
      assert(
        keys.length === node.length,
        `${path} mixes keyed and unkeyed members (${keys.length} of ${node.length}).`
      );
    }
    node.forEach((item, i) => assertKeysUnique(item, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Json)) assertKeysUnique(value, `${path}.${key}`);
  }
}

/**
 * The absolute path behind a LOCAL image import.
 *
 * Discriminated on a field only one member has, not with a type predicate: a
 * predicate over `SanityImageSource` narrows the false branch to `never`. It is
 * also a real assertion — an image that is already a reference means this getter
 * has moved and there is nothing left to read.
 */
function localImagePath(image: unknown, what: string): string {
  if (image && typeof image === "object" && "src" in image) {
    return String((image as { src: unknown }).src);
  }
  throw new Error(`${what} is not a local import any more, so it is already a Sanity asset.`);
}

function assetRef(absolutePath: string, what: string): Json {
  assert(existsSync(absolutePath), `${what}: image not found on disk — ${absolutePath}`);
  return { _type: "image", _sanityAsset: `image@file://${absolutePath}` };
}

const image = (source: unknown, what: string): Json =>
  assetRef(localImagePath(source, what), what);

/** A reference by document id, with the join asserted by the caller. */
const ref = (id: string): Json => ({ _type: "reference", _ref: id });

async function load() {
  registerDataModuleHooks({ sanityClient: "live" });
  const ca = await import("../src/data/carAccidents.ts");
  const faqs = await import("../src/data/faqs.ts");
  const [details, faqSection] = await Promise.all([
    ca.getPracticeAreaDetails(),
    // The anchor argument only sets `ask.ctaHref`, which is not stored — this
    // page renders the homepage's ask card with its own scroll target.
    faqs.getFeaturedFaqSection("car-accidents", "#contact"),
  ]);
  assert(details.length === 1, `Expected exactly one detail page, found ${details.length}.`);
  return { detail: details[0], faqSection };
}

/** The three collections this page names, keyed the way the literal names them. */
async function joins() {
  const rows = await query<{
    awards: { key: string; _id: string }[];
    testimonials: { key: string; _id: string }[];
    team: { key: string; _id: string }[];
  }>(`{
    "awards": *[_type == "award"]{ "key": key.current, _id },
    "testimonials": *[_type == "testimonial"]{ "key": key.current, _id },
    "team": *[_type == "teamMember"]{ "key": key.current, _id }
  }`);
  const index = (list: { key: string; _id: string }[]) =>
    new Map(list.filter((row) => row.key).map((row) => [row.key, row._id]));
  return {
    awards: index(rows.awards),
    testimonials: index(rows.testimonials),
    team: index(rows.team),
  };
}

/** Resolve one key, or throw naming the key, the collection and the field. */
function resolve1(map: Map<string, string>, key: string, what: string): string {
  const id = map.get(key);
  assert(
    id !== undefined,
    `${what}: nothing in that collection has the key "${key}". These keys are CONTENT — ` +
      `renaming one used to render the wrong record silently, which is why they become ` +
      `references here. Known keys: ${[...map.keys()].sort().join(", ")}`
  );
  return id;
}

function buildDocument(
  { detail, faqSection }: Awaited<ReturnType<typeof load>>,
  index: Awaited<ReturnType<typeof joins>>
): Json {
  const d = detail;
  const count = (label: keyof typeof EXPECTED, actual: number) =>
    assert(
      actual === EXPECTED[label],
      `${label}: expected ${EXPECTED[label]}, found ${actual}. A section has gained or lost a ` +
        `row since these counts were measured — look before re-measuring.`
    );

  count("trail", d.hero.trail.length);
  count("proof", d.hero.proof.length);
  count("navItems", d.nav.items.length);
  count("triageRows", d.triage.rows.length);
  count("triageSources", d.triage.sources.items.length);
  count("takeaways", d.takeaways.items.length);
  count("criteria", d.criteria.items.length);
  count("attorneys", d.lawyers.attorneys.length);
  count("badges", d.credentials.badges.length);
  count("whyStats", d.whyFirm.stats.length);
  count("whyColumns", d.whyFirm.columns.length);
  count("stories", d.results.stories.length);
  count("steps", d.timeline.steps.length);
  count("phases", d.timeline.phases.length);
  count("points", d.timeline.points.length);
  count("tiles", d.crashTypes.tiles.length);
  count("denverStats", d.denver.stats.length);
  count("corridors", d.denver.corridors.length);
  count("checklistSteps", d.checklistTeaser.steps?.length ?? 0);
  count("faultSources", d.faultTeaser.source?.items.length ?? 0);
  count("features", d.more.features.length);
  count("cards", d.more.cards.length);

  /* THE REVIEWER IS JOINED BY NAME, because the literal stores a name and a bio
     href rather than a key — and the href is the authoritative half. Same trap
     Phase 2 hit joining a card list to the roster: three of four matched on the
     key and the fourth did not, and it was the href that settled it. */
  const reviewerKey = d.hero.reviewer.bioHref.replace(/^.*\/([^/]+)\/$/, "$1");
  const reviewerId = resolve1(index.team, reviewerKey, `hero.reviewer (from ${d.hero.reviewer.bioHref})`);

  const video = (panel: typeof d.triage.video, what: string): Json => ({
    poster: image(panel.poster, `${what} poster`),
    alt: panel.alt,
    title: panel.title,
    length: panel.length,
    film: { _type: "videoRef", provider: panel.video.provider, id: panel.video.id },
  });

  return {
    _id: "carAccidentsPage",
    _type: "carAccidentsPage",
    seo: { _type: "seo", metaTitle: d.metaTitle, metaDescription: d.metaDescription },

    hero: {
      trail: d.hero.trail.map((c) => ({ _key: c._key, label: c.label, ...(c.href ? { href: c.href } : {}) })),
      title: d.hero.title,
      lede: d.hero.lede,
      proof: d.hero.proof.map((p) => ({
        _key: p._key,
        big: p.big,
        label: p.label,
        ...(p.href ? { href: p.href } : {}),
        ...(p.google ? { google: true } : {}),
      })),
      ctaLabel: d.hero.ctaLabel,
      telLabel: d.hero.telLabel,
      photoAlt: d.hero.photoAlt,
      reviewer: {
        member: ref(reviewerId),
        portrait: image(d.hero.reviewer.photo, "hero.reviewer portrait"),
        updated: d.hero.reviewer.updated,
      },
    },

    /* THE NAV STORES THE SECTION, NOT THE HREF. `CA_SECTION_IDS` owns the
       anchors because the sections' own `id` attributes read the same object;
       the `_key` in the literal IS that section id, which is what makes this a
       lookup rather than a guess. */
    nav: {
      items: d.nav.items.map((item) => {
        assert(
          item.href === `#${item._key}`,
          `nav item "${item._key}" points at ${item.href}, not at its own section. The section ` +
            `key is what is stored, so the two have to agree.`
        );
        return { _key: item._key, section: item._key, label: item.label };
      }),
      ctaLabel: d.nav.ctaLabel,
    },

    triage: {
      title: d.triage.title,
      lede: d.triage.lede,
      video: video(d.triage.video, "triage"),
      help: { text: d.triage.help.text },
      rows: d.triage.rows.map((row) => ({
        _key: row._key,
        ...(row.tone ? { tone: row.tone } : {}),
        ...(row.tag ? { tag: row.tag } : {}),
        question: row.question,
        body: row.body,
        ctaLabel: row.ctaLabel,
        ctaHref: row.ctaHref,
        stat: { big: row.stat.big, label: row.stat.label },
      })),
      sources: {
        label: d.triage.sources.label,
        items: d.triage.sources.items.map((s) => ({
          _key: s._key,
          label: s.label,
          ...(s.note ? { note: s.note } : {}),
          ...(s.href ? { href: s.href } : {}),
        })),
      },
    },

    takeaways: {
      eyebrow: d.takeaways.eyebrow,
      title: d.takeaways.title,
      lede: d.takeaways.lede,
      items: d.takeaways.items.map((i) => ({ _key: i._key, title: i.title, body: i.body })),
    },

    criteria: {
      title: d.criteria.title,
      lede: d.criteria.lede,
      video: video(d.criteria.video, "criteria"),
      items: d.criteria.items.map((i) => ({ _key: i._key, title: i.title, body: i.body })),
      note: d.criteria.note,
    },

    lawyers: {
      title: d.lawyers.title,
      lede: d.lawyers.lede,
      attorneys: d.lawyers.attorneys.map((a) => ({
        _key: a._key,
        member: ref(resolve1(index.team, a.key, `lawyers.attorneys["${a._key}"]`)),
        cred: a.cred,
      })),
      moreLabel: d.lawyers.moreLabel,
      moreHref: d.lawyers.moreHref,
    },

    credentials: {
      eyebrow: d.credentials.eyebrow,
      badges: d.credentials.badges.map((b) => ({
        _key: b._key,
        ...ref(resolve1(index.awards, b.awardKey, `credentials.badges["${b._key}"]`)),
      })),
      disclaimer: d.credentials.disclaimer,
    },

    whyFirm: {
      eyebrow: d.whyFirm.eyebrow,
      title: d.whyFirm.title,
      stats: d.whyFirm.stats.map((s) => ({ _key: s._key, big: s.big, label: s.label })),
      disclaimer: d.whyFirm.disclaimer,
      columns: d.whyFirm.columns.map((c) => ({ _key: c._key, n: c.n, title: c.title, body: c.body })),
      ctaLabel: d.whyFirm.ctaLabel,
      ctaHref: d.whyFirm.ctaHref,
      photoAlt: d.whyFirm.photoAlt,
    },

    results: {
      eyebrow: d.results.eyebrow,
      title: d.results.title,
      offeredLabel: d.results.offeredLabel,
      recoveredLabel: d.results.recoveredLabel,
      stories: d.results.stories.map((s) => ({
        _key: s._key,
        offered: s.offered,
        recovered: s.recovered,
        title: s.title,
        ...(s.story ? { story: s.story } : {}),
        ...(s.changed ? { changed: s.changed } : {}),
        ...(s.reviewKey
          ? { review: ref(resolve1(index.testimonials, s.reviewKey, `results.stories["${s._key}"]`)) }
          : {}),
      })),
      disclaimer: d.results.disclaimer,
    },

    timeline: {
      title: d.timeline.title,
      lede: d.timeline.lede,
      steps: d.timeline.steps.map((s) => ({ _key: s._key, n: s.n, title: s.title, body: s.body })),
      phases: d.timeline.phases.map((p) => ({
        _key: p._key,
        title: p.title,
        when: p.when,
        body: p.body,
      })),
      photoAlt: d.timeline.photoAlt,
      points: d.timeline.points,
    },

    crashTypes: {
      title: d.crashTypes.title,
      lede: d.crashTypes.lede,
      tiles: d.crashTypes.tiles.map((t) => ({
        _key: t._key,
        name: t.name,
        body: t.body,
        linkLabel: t.linkLabel,
        ...(t.href ? { href: t.href } : {}),
      })),
    },

    denver: {
      title: d.denver.title,
      lede: d.denver.lede,
      stats: d.denver.stats.map((s) => ({ _key: s._key, big: s.big, label: s.label, body: s.body })),
      corridors: d.denver.corridors.map((c) => ({ _key: c._key, name: c.name, body: c.body })),
    },

    checklistTeaser: {
      title: d.checklistTeaser.title,
      body: d.checklistTeaser.body,
      ctaLabel: d.checklistTeaser.ctaLabel,
      ...(d.checklistTeaser.ctaHref ? { ctaHref: d.checklistTeaser.ctaHref } : {}),
      steps: (d.checklistTeaser.steps ?? []).map((s) => ({
        _key: s._key,
        iconKey: s.iconKey,
        label: s.label,
      })),
    },

    faultTeaser: {
      title: d.faultTeaser.title,
      body: d.faultTeaser.body,
      ctaLabel: d.faultTeaser.ctaLabel,
      ...(d.faultTeaser.ctaHref ? { ctaHref: d.faultTeaser.ctaHref } : {}),
      ...(d.faultTeaser.scale ? { scale: { ...d.faultTeaser.scale } } : {}),
      ...(d.faultTeaser.source
        ? {
            source: {
              label: d.faultTeaser.source.label,
              items: d.faultTeaser.source.items.map((s) => ({
                _key: s._key,
                label: s.label,
                ...(s.note ? { note: s.note } : {}),
                ...(s.href ? { href: s.href } : {}),
              })),
            },
          }
        : {}),
    },

    more: {
      title: d.more.title,
      features: d.more.features.map((f) => ({
        _key: f._key,
        title: f.title,
        body: f.body,
        length: f.length,
        poster: image(f.poster, `more.features["${f._key}"] poster`),
        ctaLabel: f.ctaLabel,
        ...(f.href ? { href: f.href } : {}),
      })),
      cards: d.more.cards.map((c) => ({
        _key: c._key,
        title: c.title,
        body: c.body,
        ctaLabel: c.ctaLabel,
        ...(c.href ? { href: c.href } : {}),
      })),
    },

    closing: {
      title: d.closing.title,
      lede: d.closing.lede,
      officeLabel: d.closing.officeLabel,
    },

    faqSection: {
      eyebrow: faqSection.eyebrow,
      title: faqSection.title,
      lede: faqSection.lede,
    },
  };
}

async function build(): Promise<void> {
  assertSourcePresent();
  const loaded = await load();
  const doc = buildDocument(loaded, await joins());
  assertKeysUnique(doc, "carAccidentsPage");

  /* READ BACK AND MERGE — the twelve FAQs have been on this document since 2f. */
  const existing = writable(
    await query<Json | null>(`*[_type == "carAccidentsPage" && _id == "carAccidentsPage"][0]`)
  );
  assert(
    Array.isArray(existing.faqs) && (existing.faqs as unknown[]).length > 0,
    `The live carAccidentsPage document has no faqs[]. Refusing to write: this payload REPLACES ` +
      `the document, and merging onto an empty read would delete the twelve questions Phase 2f ` +
      `put there.`
  );

  const merged = { ...existing, ...doc };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(merged) + "\n");

  const sections = Object.keys(doc).filter((k) => !k.startsWith("_")).length;
  console.log(
    `1 document → ${OUT}\n` +
      `  carAccidentsPage: ${sections} sections MERGED onto ${Object.keys(existing).length} ` +
      `existing fields (${(existing.faqs as unknown[]).length} FAQs still there)\n` +
      `  joins resolved: 6 awards, 1 testimonial, 6 team members (5 on the rail + the reviewer)\n` +
      `  images uploaded: 2 video posters, 2 feature posters, 1 reviewer portrait\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();
  const { detail: d, faqSection } = await load();

  const live = await query<Json | null>(`*[_type == "carAccidentsPage"][0]{
    "metaTitle": seo.metaTitle,
    "heroTitle": hero.title,
    "reviewer": hero.reviewer{ "name": member->name, "key": member->key.current, updated },
    "nav": nav.items[]{ label, section },
    "triageRows": triage.rows[]{ question, ctaHref, "tone": tone },
    "takeaways": takeaways.items[]{ title },
    "attorneys": lawyers.attorneys[]{ "key": member->key.current, cred },
    "awardKeys": credentials.badges[]->key.current,
    "stories": results.stories[]{ title, "reviewKey": review->key.current },
    "tiles": crashTypes.tiles[]{ name, href },
    "corridors": denver.corridors[]{ name },
    "features": more.features[]{ title, href },
    "cards": more.cards[]{ title },
    "closing": closing{ title, officeLabel },
    "faqSection": faqSection{ eyebrow, title, lede },
    "faqCount": count(faqs)
  }`);

  assert(live !== null, "Sanity returned nothing for carAccidentsPage.");

  const problems: string[] = [];
  const compare = (what: string, actual: unknown, expected: unknown) => {
    if (canon(actual) !== canon(expected)) {
      problems.push(`${what}:\n    live     ${canon(actual)}\n    expected ${canon(expected)}`);
    }
  };

  compare("seo.metaTitle", live.metaTitle, d.metaTitle);
  compare("hero.title", live.heroTitle, d.hero.title);
  compare("hero.reviewer", live.reviewer, {
    name: d.hero.reviewer.name,
    key: d.hero.reviewer.bioHref.replace(/^.*\/([^/]+)\/$/, "$1"),
    updated: d.hero.reviewer.updated,
  });
  compare(
    "nav",
    live.nav,
    d.nav.items.map((i) => ({ label: i.label, section: i._key }))
  );
  compare(
    "triage.rows",
    live.triageRows,
    d.triage.rows.map((r) => ({ question: r.question, ctaHref: r.ctaHref, tone: r.tone ?? null }))
  );
  compare("takeaways", live.takeaways, d.takeaways.items.map((i) => ({ title: i.title })));
  compare(
    "lawyers.attorneys",
    live.attorneys,
    d.lawyers.attorneys.map((a) => ({ key: a.key, cred: a.cred }))
  );
  compare("credentials.badges", live.awardKeys, d.credentials.badges.map((b) => b.awardKey));
  compare(
    "results.stories",
    live.stories,
    d.results.stories.map((s) => ({ title: s.title, reviewKey: s.reviewKey ?? null }))
  );
  compare(
    "crashTypes.tiles",
    live.tiles,
    d.crashTypes.tiles.map((t) => ({ name: t.name, href: t.href ?? null }))
  );
  compare("denver.corridors", live.corridors, d.denver.corridors.map((c) => ({ name: c.name })));
  compare(
    "more.features",
    live.features,
    d.more.features.map((f) => ({ title: f.title, href: f.href ?? null }))
  );
  compare("more.cards", live.cards, d.more.cards.map((c) => ({ title: c.title })));
  compare("closing", live.closing, { title: d.closing.title, officeLabel: d.closing.officeLabel });
  compare("faqSection", live.faqSection, {
    eyebrow: faqSection.eyebrow,
    title: faqSection.title,
    lede: faqSection.lede,
  });

  /* THE MERGE HELD. */
  if (!live.faqCount) problems.push("carAccidentsPage.faqs is empty — the merge dropped Phase 2f.");

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ every section matches the code, and all three key-to-reference joins resolve.\n` +
      `  carAccidentsPage still holds ${live.faqCount} FAQs, so the merge did not replace them.`
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
