// Phase 5 — every page document's fields move into SECTION objects, so the
// Studio form is an accordion of bands rather than one long scroll.
//
//   npx tsx scripts/migrate-sections-5.ts 5a
//   npx sanity dataset import scratch/sections-5a.ndjson --dataset production --replace
//   npx tsx scripts/migrate-sections-5.ts 5a --verify   # BEFORE swapping the projections
//
// THIS IS A SANITY-TO-SANITY RESHAPE, which makes it a different animal from
// every Phase 4 migration in this directory. Those read a literal out of
// `src/data/` and asserted the literal was still there; there is no code-side
// source here, so the guard has to be different: this reads the document, moves
// fields into their section, and REFUSES TO WRITE UNLESS EVERY LEAF VALUE
// SURVIVES THE MOVE, compared as a sorted multiset before and after. A reshape
// that silently drops a field is the failure being guarded against, and it is
// invisible to a schema check because the old field simply stops being read.
//
// `--replace` REPLACES A DOCUMENT WHOLE, so the payload must be the complete
// document, not the moved fields. Everything is read back and re-emitted.
//
// THREE PAGES ARE DELIBERATELY NOT HERE. `resultsPage` is four fields that draw
// ONE band — an accordion holding the page's only section is a click that buys
// nothing. `blogPostTemplate` and `practiceAreaTemplate` are label sets rather
// than sections: six strings apiece that no band owns, which is why they were
// the two documents Phase 4 gave no groups either.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

/**
 * A section that GAINS fields — the only kind that needs a data move.
 *
 * `into` is the new object field; `fields` are the top-level names that become
 * its children, mapped old → new. A section that is ALREADY an object (About's
 * `whoWeAre`, every one of Car Accidents' seventeen) needs no entry here at
 * all: it becomes an accordion by gaining `collapsible` in the schema, and its
 * stored shape does not change by a byte.
 */
type Move = { into: string; fields: Record<string, string>; merge?: boolean };

/** Read `a.b` off a document. Returns undefined for any missing step. */
function at(doc: Json, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => {
    if (!node || typeof node !== "object") return undefined;
    return (node as Json)[key];
  }, doc);
}

/**
 * Delete `a.b`, then delete `a` itself if that emptied it.
 *
 * The pruning is the point: 5b flattens three heading objects INTO the section
 * that now holds their list, and a `featuredHeading: {}` left behind would be a
 * field the schema no longer declares, sitting in the document forever. Sanity
 * does not mind; the next person reading the JSON does.
 */
function drop(doc: Json, path: string): void {
  const steps = path.split(".");
  const last = steps.pop() as string;
  const parent = steps.reduce<Json | undefined>(
    (node, key) => (node && typeof node[key] === "object" ? (node[key] as Json) : undefined),
    doc
  );
  if (!parent) return;
  delete parent[last];
  if (steps.length && Object.keys(parent).length === 0) drop(doc, steps.join("."));
}

/**
 * THE DOCUMENTS OF A TYPE, when they are not one document at an id of the same
 * name. Only `sitePage` is like this — three utility pages sharing one type at
 * three pinned ids, which is exactly why the desk needed a second helper for it.
 */
const IDS: Record<string, string[]> = {
  sitePage: ["privacy", "sitemap", "notFound"],
};

const SLICES: Record<string, Record<string, Move[]>> = {
  /*
   * 5a — SEVEN PAGES WHOSE SECTIONS ARE ALREADY OBJECTS.
   *
   * Each carries a handful of loose strings that ARE a section — the page
   * header band — sitting at the top level beside the objects that draw every
   * other band. They are the reason these forms read as a scroll: the accordion
   * cannot be uniform while five fields float above it.
   *
   * `ctaLabel` / `ctaNote` go in with them because they are the header's own
   * button and the line under it, not a section of their own.
   */
  "5a": {
    aboutPage: [
      { into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede", ctaLabel: "ctaLabel", ctaNote: "ctaNote" } },
    ],
    teamPage: [{ into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede" } }],
    testimonialsPage: [
      { into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede", ctaLabel: "ctaLabel", ctaNote: "ctaNote" } },
    ],
    coCounselPage: [
      { into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede", ctaLabel: "ctaLabel", ctaNote: "ctaNote" } },
    ],
    contactPage: [{ into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede" } }],
    thankYouPage: [{ into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede" } }],
    /*
     * THE BLOG INDEX IS TWO SECTIONS AND SIX OF ITS NINE FIELDS ARE BUTTON
     * LABELS. They belong together and they are not the page header: an editor
     * changing "Load more" is not editing the band at the top of the page.
     */
    blogIndexPage: [
      { into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede" } },
      {
        into: "feed",
        fields: {
          categoryLabel: "categoryLabel",
          allLabel: "allLabel",
          featuredBadge: "featuredBadge",
          readMoreLabel: "readMoreLabel",
          loadMoreLabel: "loadMoreLabel",
          emptyLabel: "emptyLabel",
        },
      },
    ],
  },

  /*
   * 5b — THREE PAGES WHERE A SECTION IS A HEADING OBJECT BESIDE ITS LIST.
   *
   * Phase 2f and 3d stored each band as two top-level fields — `featuredHeading`
   * next to `featuredAreas`, `sponsorshipsHeading` next to `sponsorships` — and
   * the pairing was only ever a naming convention. Here the heading is FLATTENED
   * INTO the section and the list joins it as `items`, so a band is one object
   * and one accordion row.
   *
   * THE SECTION IS ROUTINELY NAMED AFTER THE ARRAY IT SWALLOWS, which is why
   * `reshape` collects before it deletes. `partners[]` becomes `partners.items`
   * on the community page and `directory[]` becomes `directory.entries`.
   */
  "5b": {
    communityPage: [
      { into: "header", fields: { eyebrow: "eyebrow", title: "title", lede: "lede" } },
      {
        into: "partners",
        fields: {
          "volunteer.eyebrow": "eyebrow",
          "volunteer.title": "title",
          "volunteer.ctaLabel": "ctaLabel",
          partnersLabel: "label",
          partners: "items",
        },
      },
      {
        into: "sponsorships",
        fields: {
          "sponsorshipsHeading.eyebrow": "eyebrow",
          "sponsorshipsHeading.title": "title",
          sponsorships: "items",
        },
      },
    ],
    practiceAreasPage: [
      {
        into: "header",
        fields: { eyebrow: "eyebrow", title: "title", lede: "lede", ctaLabel: "ctaLabel", ctaNote: "ctaNote" },
      },
      {
        into: "featured",
        fields: {
          "featuredHeading.eyebrow": "eyebrow",
          "featuredHeading.title": "title",
          "featuredHeading.lede": "lede",
          featuredAreas: "areas",
        },
      },
      {
        into: "directory",
        fields: {
          "directoryHeading.eyebrow": "eyebrow",
          "directoryHeading.title": "title",
          directory: "entries",
        },
      },
    ],
    /*
     * `kind` STAYS AT THE TOP LEVEL, outside every accordion. It is read-only
     * and it is how an editor knows which of the three documents they opened —
     * the schema's own comment says hiding it would be tidier and wrong, and
     * folding it into a collapsed section is the same mistake one step softer.
     *
     * `updated` and `links` are conditional on `kind`, so two of the three
     * documents show two accordion rows and the 404 shows three.
     */
    sitePage: [
      { into: "content", fields: { title: "title", "lede?": "lede", "body?": "body" } },
      { into: "links", fields: { "linksTitle?": "title", "links?": "items" } },
    ],
  },

  /*
   * 5c — THE TWO BIG ONES, AND THEY NEED THE LEAST.
   *
   * Both already store every band as an object; the only thing standing between
   * them and an accordion is that a band's LIST sits beside it at the top level
   * rather than inside it. So every move here MERGES into a section that
   * already exists, and not one existing field is renamed — which is why these
   * two pages' projections change by one path apiece.
   *
   * Car Accidents is nearly a no-op: seventeen of its nineteen fields are
   * already the right shape and become accordion rows in the schema alone. Only
   * `faqs[]` moves. Its six field GROUPS come off in the same change — see
   * `section.ts` for why tabs and accordions do not go together.
   */
  "5c": {
    homePage: [
      { into: "hero", merge: true, fields: { heroStats: "stats" } },
      {
        into: "practiceSection",
        merge: true,
        fields: {
          practiceAreaCards: "cards",
          practicePromise: "closing",
          catastrophicAreas: "catastrophic",
        },
      },
      { into: "faqSection", merge: true, fields: { faqs: "items" } },
      {
        into: "feedSection",
        merge: true,
        fields: { pressMentions: "mentions", insightTeasers: "teasers" },
      },
      {
        into: "communitySection",
        merge: true,
        fields: { communityPhotos: "photos", charityPartners: "charities" },
      },
    ],
    carAccidentsPage: [{ into: "faqSection", merge: true, fields: { faqs: "items" } }],
  },
};

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

/**
 * EVERY LEAF IN A DOCUMENT, SORTED — the reshape's proof.
 *
 * A move is correct exactly when the set of values the document holds is the
 * same before and after; only their PATHS change. Comparing paths would report
 * every move as a difference, and comparing a serialised document would too, so
 * this walks to the leaves and sorts. `_key`s ride along as leaves, which is
 * what catches an array quietly losing a member.
 */
function leaves(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => leaves(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value as Json).forEach((item) => leaves(item, out));
  } else {
    out.push(JSON.stringify(value));
  }
  return out.sort();
}

/**
 * Move `fields` into `into`, leaving everything else where it is.
 *
 * A source may be a DOTTED PATH, which is what lets a section absorb a heading
 * object that used to sit beside its list: `"featuredHeading.title": "title"`.
 *
 * COLLECT, THEN DELETE, THEN ASSIGN — in that order, because a section is
 * routinely named after the array it swallows (`partners[]` becomes
 * `partners.items`). Assigning before deleting would drop the value that was
 * just read; asserting the name is free before starting would reject the most
 * ordinary case in the slice.
 */
function reshape(doc: Json, moves: Move[]): Json {
  const next: Json = structuredClone(doc);
  for (const { into, fields, merge } of moves) {
    /*
     * `merge` ADDS TO A SECTION THAT ALREADY EXISTS, which is the whole of 5c.
     * The homepage and Car Accidents already store each band as an object; what
     * they get wrong for an accordion is only that the band's LIST sits beside
     * it at the top level. Merging keeps every existing field name — so those
     * two pages' projections change by one path each, rather than wholesale.
     */
    const existing = merge ? (at(next, into) as Json | undefined) : undefined;
    assert(
      !merge || (existing !== undefined && typeof existing === "object" && !Array.isArray(existing)),
      `${doc._type as string}: "${into}" is not an existing object to merge into.`
    );
    const section: Json = { ...(existing ?? {}) };
    for (const [from, to] of Object.entries(fields)) {
      /*
       * A TRAILING "?" MARKS A SOURCE THAT MAY BE ABSENT, and only the three
       * utility pages need it: `links` exists on the 404 alone, `lede` on two
       * of the three. Everywhere else a missing source is a mistake worth
       * throwing on, which is why absence is opt-in rather than tolerated.
       */
      const optional = from.endsWith("?");
      const path = optional ? from.slice(0, -1) : from;
      const value = at(next, path);
      assert(
        optional || value !== undefined,
        `${doc._type as string} ${doc._id as string}: "${path}" is not on the document.`
      );
      assert(
        !(to in section) || existing === undefined,
        `${doc._type as string}: merging "${path}" would overwrite "${into}.${to}".`
      );
      if (value !== undefined) section[to] = value;
    }
    Object.keys(fields).forEach((from) => drop(next, from.replace(/\?$/, "")));
    if (merge) delete next[into];
    assert(
      !(into in next),
      `${doc._type as string}: "${into}" still exists after its sources were moved — ` +
        `has this slice already run?`
    );
    // A section none of whose optional sources were present is not written as an
    // empty object — the 404's links block has no business on the privacy page.
    if (Object.keys(section).length > 0) next[into] = section;
  }
  return next;
}

async function main(): Promise<void> {
  const slice = process.argv[2];
  const verify = process.argv.includes("--verify");
  assert(slice in SLICES, `Unknown slice "${slice}". Known: ${Object.keys(SLICES).join(", ")}`);
  const plan = SLICES[slice];

  const out: Json[] = [];
  for (const [type, moves] of Object.entries(plan)) {
    for (const id of IDS[type] ?? [type]) {
    const doc = await query<Json | null>(`*[_type == "${type}" && _id == "${id}"][0]`);
    assert(doc !== null, `${type}: no document at _id "${id}".`);

    if (verify) {
      /*
       * --verify COMPARES THE DATASET AGAINST THE NEW SHAPE, so it only means
       * anything AFTER the import and BEFORE the projections are swapped. It
       * asserts each section exists and carries every field the move put there.
       */
      for (const { into, fields } of moves) {
        const optionalSection = Object.keys(fields).every((from) => from.endsWith("?"));
        const section = doc[into] as Json | undefined;
        if (!section && optionalSection) continue;
        assert(!!section, `${id}: "${into}" is missing — did the import run?`);
        for (const [from, to] of Object.entries(fields)) {
          assert(from.endsWith("?") || to in section, `${id}: "${into}.${to}" is missing.`);
        }
        for (const from of Object.keys(fields)) {
          const path = from.replace(/\?$/, "");
          /*
           * A SECTION IS ROUTINELY NAMED AFTER THE SOURCE IT SWALLOWED —
           * `partners[]` became `partners.items`, `directory[]` became
           * `directory.entries`. Asserting that name is gone reports every one
           * of those as a failed import when the reshape was perfect, which is
           * exactly what it did the first time this ran. Only a source that is
           * NOT the section itself, or inside it, must have disappeared.
           */
          if (path === into || path.startsWith(`${into}.`)) continue;
          // A dotted source whose parent was pruned reads as undefined, which
          // is the same assertion one level in.
          assert(
            at(doc, path) === undefined,
            `${id}: "${from}" is STILL on the document — the import did not replace.`
          );
        }
      }
      console.log(`  ✓ ${id.padEnd(20)} ${moves.map((m) => m.into).join(", ")}`);
      continue;
    }

    const before = leaves(writable(doc));
    const next = reshape(writable(doc), moves);
    const after = leaves(next);
    assert(
      JSON.stringify(before) === JSON.stringify(after),
      `${type}: the reshape changed ${Math.abs(before.length - after.length)} value(s). ` +
        `Before ${before.length}, after ${after.length}. Nothing written.`
    );
    out.push(next);
    console.log(
      `  ${id.padEnd(20)} ` +
        `${moves.map((m) => `${m.into}(${Object.keys(m.fields).length})`).join(" ")}  ` +
        `${before.length} leaves intact`
    );
    }
  }

  if (verify) {
    console.log(`\n${slice}: the dataset matches the new shape.`);
    return;
  }

  const file = resolve(process.cwd(), `scratch/sections-${slice}.ndjson`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out.map((doc) => JSON.stringify(doc)).join("\n") + "\n");
  console.log(`\n${out.length} document(s) → ${file}`);
  console.log(`npx sanity dataset import ${file} --dataset production --replace`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
