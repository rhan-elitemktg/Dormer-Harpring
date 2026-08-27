// Phase 2f — move sixty documents off seven collections onto three page documents.
//
//   npx tsx scripts/migrate-pages-2f.ts
//   npx sanity dataset import scratch/pages-2f.ndjson --dataset production --replace
//   npx tsx scripts/migrate-pages-2f.ts --verify
//
// IT READS THE HTTP API, NOT `src/data/`, so it needs NEITHER the schema NOR
// `scripts/lib/stub-vite-modules.ts`. Every earlier seed in this project stubbed
// Vite because it imported a data module for its literals; there are no literals
// left to import — this content exists only in Sanity — so the source here is the
// dataset itself. The next person will assume otherwise; they shouldn't.
//
// `--verify` re-queries both sides and deep-compares. It only works BEFORE the
// purge retires the seven collections, which is the point: verify, then purge.
//
// WHAT MOVES
//
//   faq (shownOn == "home")      8  → homePage.faqs
//   faq (shownOn == "car-…")    12  → carAccidentsPage.faqs
//   newsMention                  4  → homePage.pressMentions
//   insight                      4  → homePage.insightTeasers
//   communityPhoto               7  → homePage.communityPhotos
//   ngoPartner                   7  → homePage.charityPartners
//   communityPartner            11  → communityPage.partners
//   sponsorship                  7  → communityPage.sponsorships
//
// `order` and `shownOn` are NOT carried across — array position is the order now.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/pages-2f.ndjson");
const API_VERSION = "2026-08-01";
const EXPECTED_TOTAL = 312;

type Doc = Record<string, unknown>;

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

/** System fields must not be written back — `_rev` pins the import to a revision
 *  that is no longer current by the time it lands. */
function writable(doc: Doc | null): Doc {
  if (!doc) return {};
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * Stringify with keys sorted, at every depth.
 *
 * A PLAIN `JSON.stringify` COMPARISON IS WRONG HERE, and it reported all eight
 * groups as mismatched on the first run. Sanity returns a stored object's keys
 * in its own order — alphabetical for what it wrote — while the assembled member
 * carries them in the order the schema declares. Every value was identical and
 * every comparison failed. Sorting the keys is what makes the deep-compare
 * compare content rather than field order.
 */
function canon(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canon).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canon(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * One collection, and the array on the page document it becomes.
 *
 * `required` is checked field-by-field on every source document before a byte is
 * written — the schema's `required()` only ever constrained the Studio, and this
 * is the last moment anything can look at these documents as documents.
 */
interface Group {
  type: string;
  /** Extra GROQ predicate, for the two halves of `faq`. */
  where?: string;
  label: string;
  target: "homePage" | "communityPage" | "carAccidentsPage";
  field: string;
  required: string[];
  /** Carried only when present — never written as null. */
  optional?: string[];
  /** Fields holding an image object, deep-compared after assembly. */
  images: string[];
  expect: number;
}

const GROUPS: Group[] = [
  {
    type: "faq",
    where: 'shownOn == "home"',
    label: "FAQs (homepage)",
    target: "homePage",
    field: "faqs",
    required: ["question", "answer", "video", "videoLength"],
    images: [],
    expect: 8,
  },
  {
    type: "faq",
    where: 'shownOn == "car-accidents"',
    label: "FAQs (car accidents)",
    target: "carAccidentsPage",
    field: "faqs",
    required: ["question", "answer", "video", "videoLength"],
    images: [],
    expect: 12,
  },
  {
    type: "newsMention",
    label: "Press Mentions",
    target: "homePage",
    field: "pressMentions",
    required: ["outlet", "logo", "date", "headline", "href"],
    images: ["logo"],
    expect: 4,
  },
  {
    type: "insight",
    label: "Insight Teasers",
    target: "homePage",
    field: "insightTeasers",
    required: ["title", "category", "iconKey", "readTime", "href"],
    images: [],
    expect: 4,
  },
  {
    type: "communityPhoto",
    label: "Community Photos",
    target: "homePage",
    field: "communityPhotos",
    required: ["image", "org", "caption", "span"],
    images: ["image"],
    expect: 7,
  },
  {
    type: "ngoPartner",
    label: "Charity Partners",
    target: "homePage",
    field: "charityPartners",
    required: ["name", "logo"],
    images: ["logo"],
    expect: 7,
  },
  {
    type: "communityPartner",
    label: "Community Partners",
    target: "communityPage",
    field: "partners",
    required: ["org", "logo", "body"],
    optional: ["photo"],
    images: ["logo", "photo"],
    expect: 11,
  },
  {
    type: "sponsorship",
    label: "Sponsorships",
    target: "communityPage",
    field: "sponsorships",
    required: ["name", "body"],
    images: [],
    expect: 7,
  },
];

/** Every field this group reads, projected explicitly so the shape is on the page. */
function projection(group: Group): string {
  return ["_id", "order", ...group.required, ...(group.optional ?? [])].join(", ");
}

function fetchGroup(group: Group): Promise<Doc[]> {
  const where = group.where ? ` && ${group.where}` : "";
  return query<Doc[]>(
    `*[_type == "${group.type}"${where} && !(_id in path("drafts.**"))]` +
      ` | order(order asc){ ${projection(group)} }`
  );
}

const empty = (v: unknown) => v === null || v === undefined || v === "";

/**
 * Turn one source document into an array member.
 *
 * `_key` IS THE SOURCE DOCUMENT'S `_id`, VERBATIM. These keys are not content:
 * unlike award / testimonial / teamMember, whose `key` slugs are named from code
 * and fail the build when renamed, nothing references these and none of them
 * reaches the DOM. Using the `_id` keeps the projected `_key` byte-identical to
 * today's `"_key": _id`, and leaves every member naming the document it came
 * from — auditable against the pre-migration export after the purge.
 */
function member(group: Group, doc: Doc): Doc {
  const out: Doc = { _key: String(doc._id) };
  for (const field of group.required) out[field] = doc[field];
  // OMITTED, NOT NULL, when absent. Four of the eleven partners have no photo,
  // and the projection has to keep reading `null` for them so the getter's
  // `?? undefined` map goes on working.
  for (const field of group.optional ?? []) {
    if (!empty(doc[field])) out[field] = doc[field];
  }
  return out;
}

/** Every image object reachable inside an assembled member. */
function imagesOf(group: Group, doc: Doc): [string, Doc][] {
  return group.images
    .filter((f) => !empty(doc[f]))
    .map((f) => [f, doc[f] as Doc] as [string, Doc]);
}

async function collect(): Promise<{ groups: [Group, Doc[]][]; members: Map<string, Doc[]> }> {
  // ---------------------------------------------------------- dataset assertions
  const total = await query<number>('count(*[!(_id in path("drafts.**"))])');
  assert(
    total === EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} published documents, found ${total}. ` +
      `Wrong dataset, or the dataset moved on — stop and re-read before migrating.`
  );

  // A DRAFT CARRIES AN EDIT SOMEBODY EXPECTS TO PUBLISH. This reads published
  // documents, so a draft would be discarded silently by the purge that follows.
  const drafts = await query<number>('count(*[_id in path("drafts.**")])');
  assert(
    drafts === 0,
    `${drafts} draft(s) exist. Publish or discard them in the Studio first — ` +
      `this migration reads published documents and the purge deletes drafts too.`
  );

  const faqTotal = await query<number>('count(*[_type == "faq" && !(_id in path("drafts.**"))])');
  const faqStray = await query<number>(
    'count(*[_type == "faq" && !(shownOn in ["home", "car-accidents"])' +
      ' && !(_id in path("drafts.**"))])'
  );
  assert(faqTotal === 20, `Expected 20 FAQs, found ${faqTotal}.`);
  assert(faqStray === 0, `${faqStray} FAQ(s) carry a shownOn outside home/car-accidents.`);

  const withPhoto = await query<number>(
    'count(*[_type == "communityPartner" && defined(photo) && !(_id in path("drafts.**"))])'
  );
  assert(withPhoto === 7, `Expected 7 community partners with a photo, found ${withPhoto}.`);

  // ------------------------------------------------------------- per-group reads
  const groups: [Group, Doc[]][] = [];
  for (const group of GROUPS) groups.push([group, await fetchGroup(group)]);

  const readRefs = new Set<string>();
  let imageValues = 0;

  for (const [group, docs] of groups) {
    assert(
      docs.length === group.expect,
      `${group.label}: expected ${group.expect} documents, found ${docs.length}.`
    );

    // ORDER. Strictly increasing is the real invariant — a tie makes GROQ's
    // ordering non-deterministic and the array would come out differently on
    // two runs. The (i+1)*10 shape is only WARNED about: an editor who
    // reorders in the Studio before this runs is doing nothing wrong.
    const orders = docs.map((d) => Number(d.order));
    for (let i = 1; i < orders.length; i++) {
      assert(
        orders[i] > orders[i - 1],
        `${group.label}: order ${orders[i]} does not follow ${orders[i - 1]} — ` +
          `duplicate or unsorted positions make the result non-deterministic.`
      );
    }
    const canonical = orders.every((o, i) => o === (i + 1) * 10);
    console.log(
      `  ${group.label.padEnd(24)} ${String(docs.length).padStart(2)}  ` +
        `orders ${orders.join(",")}${canonical ? "" : "   ← not (i+1)*10, check it is intended"}`
    );

    for (const doc of docs) {
      for (const field of group.required) {
        assert(
          !empty(doc[field]),
          `${group.label}: document ${doc._id} has no "${field}".`
        );
      }
      for (const [field, image] of imagesOf(group, doc)) {
        const ref = (image.asset as Doc | undefined)?._ref;
        assert(
          typeof ref === "string" && ref.startsWith("image-"),
          `${group.label}: ${doc._id}.${field} is not an image reference (${JSON.stringify(ref)}).`
        );
        readRefs.add(ref);
        imageValues++;
      }
    }
  }

  // ------------------------------------------------------------------- assembly
  const members = new Map<string, Doc[]>();
  const writtenRefs = new Set<string>();

  for (const [group, docs] of groups) {
    const rows = docs.map((doc) => member(group, doc));

    // `_key` uniqueness. Document ids are unique by construction, so this cannot
    // fail today — but Sanity drops a colliding array member SILENTLY rather
    // than erroring, which is the one failure mode worth an assertion nobody
    // expects to see fire.
    const keys = new Set(rows.map((r) => String(r._key)));
    assert(keys.size === rows.length, `${group.label}: duplicate _key among ${rows.length} rows.`);
    assert(rows.length === group.expect, `${group.label}: assembled ${rows.length} rows.`);

    // DEEP EQUALITY ON THE WHOLE IMAGE OBJECT, not on asset._ref. There are no
    // hotspots or crops in this dataset today, so asserting they survive would
    // assert nothing; comparing the object covers them the day an editor sets one.
    for (let i = 0; i < rows.length; i++) {
      for (const [field, image] of imagesOf(group, docs[i])) {
        assert(
          canon(rows[i][field]) === canon(image),
          `${group.label}: ${docs[i]._id}.${field} changed shape in assembly.`
        );
        writtenRefs.add(String((image.asset as Doc)._ref));
      }
    }

    members.set(`${group.target}.${group.field}`, [
      ...(members.get(`${group.target}.${group.field}`) ?? []),
      ...rows,
    ]);
  }

  assert(
    readRefs.size === writtenRefs.size && [...readRefs].every((r) => writtenRefs.has(r)),
    `Asset references read (${readRefs.size}) and written (${writtenRefs.size}) differ.`
  );
  console.log(
    `\n  ${imageValues} image values across ${readRefs.size} distinct assets, all carried through.`
  );

  return { groups, members };
}

async function main() {
  console.log("Reading the seven collections:\n");
  const { members } = await collect();

  // READ BACK AND MERGE, NEVER EMIT BARE. `dataset import --replace` replaces a
  // document WHOLE — Phase 2e learned this by nearly deleting 25 biographies.
  // Nothing exists on these three today so the merge is a no-op, but Phase 4
  // adds this copy to these same documents and a re-run then must not wipe it.
  const documents: Doc[] = [];
  for (const type of ["homePage", "communityPage", "carAccidentsPage"] as const) {
    const existing = writable(await query<Doc | null>(`*[_id == "${type}"][0]`));
    const arrays: Doc = {};
    for (const [path, rows] of members) {
      const [target, field] = path.split(".");
      if (target === type) arrays[field] = rows;
    }
    documents.push({ ...existing, _id: type, _type: type, ...arrays });
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, documents.map((d) => JSON.stringify(d)).join("\n") + "\n");

  console.log(`\nWrote ${documents.length} documents to ${OUT}`);
  for (const doc of documents) {
    const fields = Object.keys(doc).filter((k) => !k.startsWith("_"));
    console.log(
      `  ${doc._id}: ` +
        fields.map((f) => `${f}[${(doc[f] as unknown[]).length}]`).join(", ")
    );
  }
  console.log(
    `\nNext:\n` +
      `  npx sanity dataset import ${OUT} --dataset ${env("PUBLIC_SANITY_DATASET")} --replace\n` +
      `  npx tsx scripts/migrate-pages-2f.ts --verify\n`
  );
}

/**
 * Re-query BOTH sides and deep-compare.
 *
 * A separate invocation on purpose: a query issued straight after a write can be
 * stale, and reading the import's own echo would prove nothing. This is also the
 * only check that looks at `_key` values — `compare-builds.py` cannot see them,
 * because they never reach the markup.
 */
async function verify() {
  let failures = 0;
  console.log("Comparing the three page documents against the seven collections:\n");

  for (const group of GROUPS) {
    const source = await fetchGroup(group);
    const live = await query<Doc[] | null>(
      `*[_type == "${group.target}" && _id == "${group.target}"][0].${group.field}`
    );

    if (!live) {
      console.log(`  ✗ ${group.label}: ${group.target}.${group.field} is missing.`);
      failures++;
      continue;
    }

    // One group per array — the two `faqs` fields sit on different documents —
    // so this is a whole-array comparison, not a slice.
    const expected = source.map((doc) => member(group, doc));
    const same =
      live.length === expected.length &&
      expected.every((row, i) => canon(row) === canon(live[i]));

    if (same) {
      console.log(`  ✓ ${group.label.padEnd(24)} ${expected.length} rows, byte-identical and in order`);
    } else {
      failures++;
      console.log(`  ✗ ${group.label}: ${expected.length} expected, ${live.length} live`);
      for (let i = 0; i < Math.max(expected.length, live.length); i++) {
        const a = canon(expected[i]);
        const b = canon(live[i]);
        if (a !== b) console.log(`      [${i}]\n        source: ${a}\n        live:   ${b}`);
      }
    }
  }

  if (failures) throw new Error(`${failures} group(s) do not match. Do NOT purge.`);
  console.log("\nAll eight groups match. Safe to swap the getters.");
}

await (process.argv.includes("--verify") ? verify() : main());
