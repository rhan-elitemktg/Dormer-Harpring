// Phase 3d — the directory and the three card rails, out of `data/practiceAreas.ts`.
//
//   npx tsx scripts/migrate-practice-cards-3d.ts
//   npx sanity dataset import scratch/practice-cards-3d.ndjson --dataset production --replace
//   npx tsx scripts/migrate-practice-cards-3d.ts --verify
//
// `--replace` IS CORRECT HERE AND NOWHERE ELSE IN PHASE 3. These are singletons
// at fixed ids, so `--replace` really does replace the right document. The three
// collection migrations had to purge first, because their documents get
// generated ids and `--replace` has nothing to match on.
//
// WHICH MEANS `homePage` MUST BE READ BACK AND MERGED. It already carries five
// arrays from Phase 2f — the FAQs, press mentions, insight teasers, community
// photos and charity partners — and `--replace` replaces a document WHOLE. A
// payload holding only the two new card rails would delete all five. That
// failure has a name here: it is what `scripts/migrate-pages-2f.ts` was written
// to avoid, and this reuses its shape, `canon()` included.
//
// WHAT MOVES
//
//   getPracticeAreaGroups()      102 entries, 9 groups → practiceAreasPage.directory
//   getFeaturedPracticeAreas()   9 cards              → practiceAreasPage.featuredAreas
//   getHomePracticeAreas()       6 cards              → homePage.practiceAreaCards
//   getCatastrophicAreas()       4 panels             → homePage.catastrophicAreas
//
// THE DIRECTORY BECOMES REFERENCES; THE CARDS DO NOT, and the data decided both.
// 99 of the directory's 100 page rows print the referenced page's own short
// name, so the reference carries the label and nothing can drift. A card's name
// is its own copy — this rail says "Bicycle Accidents" where the page is filed
// as "Bike Accidents" — so a card stores its name and links by href.
//
// TWO ROWS CANNOT BE REFERENCES and both are real: the "Personal Injury" row
// points at the HOMEPAGE, which doubles as the firm's Denver PI overview, and
// "Car Accidents" points at `/denver-car-accident-lawyer/`, which the heavy
// hand-authored template serves and which is therefore not a `practiceArea`
// document. They import as `customEntry` rows. The script asserts there are
// EXACTLY these two — a third means something has changed that wants a look.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/practice-cards-3d.ndjson");
const API_VERSION = "2026-08-01";

const EXPECTED = {
  groups: 9,
  entries: 102,
  custom: 2,
  featured: 9,
  home: 6,
  catastrophic: 4,
} as const;

type Json = Record<string, unknown>;

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

/** System fields must not be written back — `_rev` pins the import to a revision
 *  that is no longer current by the time it lands. */
function writable(doc: Json | null): Json {
  if (!doc) return {};
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

/**
 * Stringify with keys sorted, at every depth.
 *
 * A PLAIN `JSON.stringify` COMPARISON IS WRONG AGAINST SANITY. It returns a
 * stored object's keys in its own order — alphabetically — where an assembled
 * member carries them in schema order, so a deep-compare reports every group as
 * mismatched with every value identical. Phase 2f lost a round trip to this.
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

/** Refuse to run once the source has moved. */
function assertSourcePresent(): void {
  const file = resolve(process.cwd(), "src/data/practiceAreas.ts");
  const text = readFileSync(file, "utf8");
  if (text.includes("export async function getPracticeAreaGroups")) return;
  console.error(
    `src/data/practiceAreas.ts no longer holds getPracticeAreaGroups(), so there is nothing ` +
      `left in the code to seed. The directory is already in Sanity.`
  );
  process.exit(1);
}

function assetRef(absolutePath: string): Json {
  assert(existsSync(absolutePath), `Image not found on disk: ${absolutePath}`);
  return { _sanityAsset: `image@file://${absolutePath}` };
}

interface Summary {
  _key: string;
  name: string;
  iconKey: string;
  blurb?: string;
  insight?: string;
  href: string;
  image?: { src: string };
}

/** A card, with its photograph queued for upload. `_key` is the literal's own —
 *  short and stable, and nothing outside this module reads it. */
function card(entry: Summary, copy: "blurb" | "insight"): Json {
  const out: Json = {
    _key: entry._key,
    name: entry.name,
    iconKey: entry.iconKey,
    [copy]: entry[copy],
    href: entry.href,
  };
  // A local import under src/assets, so the hooks hand back an absolute path.
  if (entry.image) out.image = { _type: "image", ...assetRef(String(entry.image.src)) };
  return out;
}

async function build(): Promise<void> {
  assertSourcePresent();

  registerDataModuleHooks({ sanityClient: "live" });
  const areas = await import("../src/data/practiceAreas.ts");
  const pages = await import("../src/data/practiceAreaPages.ts");

  const [groups, featured, home, catastrophic, built] = await Promise.all([
    areas.getPracticeAreaGroups(),
    areas.getFeaturedPracticeAreas(),
    areas.getHomePracticeAreas(),
    areas.getCatastrophicAreas(),
    pages.getPracticeAreaPages(),
  ]);

  assert(groups.length === EXPECTED.groups, `Expected ${EXPECTED.groups} groups, found ${groups.length}.`);
  assert(featured.length === EXPECTED.featured, `Expected ${EXPECTED.featured} featured cards.`);
  assert(home.length === EXPECTED.home, `Expected ${EXPECTED.home} home cards.`);
  assert(catastrophic.length === EXPECTED.catastrophic, `Expected ${EXPECTED.catastrophic} panels.`);

  /* THE JOIN, ASSERTED BEFORE ANYTHING IS WRITTEN. Every directory row either
     resolves to a practiceArea document or is one of the two known exceptions.
     A seed that silently dropped the rows it could not match is how a whole
     column disappears from a page nobody re-reads. */
  const ids = new Map(
    (await query<{ slug: string; _id: string; label: string }[]>(
      `*[_type == "practiceArea"]{ "slug": slug.current, _id, label }`
    )).map((row) => [row.slug, row])
  );
  /* The two counts are equal, not off by one: `denver-car-accident-lawyer` was
     never imported — `EXCLUDED_SLUGS` in the importer keeps it out, because the
     heavy template already serves that slug and `[slug].astro` would build it
     twice. `detailSlugs()` in the getter filters the same slug and so removes
     nothing today; it stays because the two files can drift and only one of
     them fails loudly. */
  assert(
    ids.size === built.length,
    `Sanity holds ${ids.size} practiceArea documents; the site builds ${built.length}. ` +
      `They should be equal — the one slug the heavy template serves was never imported.`
  );

  const custom: string[] = [];
  let entries = 0;
  let overrides = 0;

  const directory = groups.map((group) => ({
    _key: group._key,
    _type: "areaGroup",
    title: group.title,
    items: group.items.map((item) => {
      entries += 1;
      const slug = (item.href ?? "").replace(/^\/+|\/+$/g, "");
      const page = ids.get(slug);

      if (!page) {
        custom.push(`${group.title} › ${item.label} → ${item.href ?? "(null)"}`);
        assert(
          item.href !== null,
          `${group.title} › ${item.label} has no href and no page. A directory row must lead ` +
            `somewhere or be removed.`
        );
        return { _key: item._key, _type: "customEntry", label: item.label, href: item.href };
      }

      /* The label is stored ONLY where it differs from the page's own. 99 of
         100 match, so writing all of them would be 99 chances to drift. */
      const differs = page.label !== item.label;
      if (differs) overrides += 1;
      return {
        _key: item._key,
        _type: "areaEntry",
        page: { _type: "reference", _ref: page._id },
        ...(differs ? { label: item.label } : {}),
      };
    }),
  }));

  assert(entries === EXPECTED.entries, `Expected ${EXPECTED.entries} directory entries, found ${entries}.`);
  assert(
    custom.length === EXPECTED.custom,
    `Expected exactly ${EXPECTED.custom} directory rows that are not practiceArea documents — ` +
      `the homepage-as-Denver-PI-overview row and the heavy Car Accidents page. Found ` +
      `${custom.length}:\n  ${custom.join("\n  ")}`
  );

  /* READ BACK AND MERGE. `--replace` replaces a document whole, and homePage
     already holds five arrays from Phase 2f. */
  const existing = writable(
    await query<Json | null>(`*[_type == "homePage" && _id == "homePage"][0]`)
  );
  assert(
    Array.isArray(existing.faqs) && (existing.faqs as unknown[]).length > 0,
    `The live homePage document has no faqs[]. Refusing to write: this payload REPLACES the ` +
      `document, and merging onto an empty read would delete everything Phase 2f put there.`
  );

  const homeDoc: Json = {
    ...existing,
    _id: "homePage",
    _type: "homePage",
    practiceAreaCards: home.map((entry) => card(entry as Summary, "blurb")),
    catastrophicAreas: catastrophic.map((entry) => card(entry as Summary, "insight")),
  };

  const areasDoc: Json = {
    _id: "practiceAreasPage",
    _type: "practiceAreasPage",
    featuredAreas: featured.map((entry) => card(entry as Summary, "blurb")),
    directory,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, [JSON.stringify(areasDoc), JSON.stringify(homeDoc)].join("\n") + "\n");

  console.log(
    `2 documents → ${OUT}\n` +
      `  practiceAreasPage: ${featured.length} featured cards, ${entries} directory entries ` +
      `in ${groups.length} groups (${custom.length} not references, ${overrides} label override)\n` +
      `  homePage: ${home.length} practice-area cards + ${catastrophic.length} panels, MERGED onto ` +
      `${Object.keys(existing).length} existing fields\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  registerDataModuleHooks({ sanityClient: "live" });
  const areas = await import("../src/data/practiceAreas.ts");

  const [groups, featured, home, catastrophic] = await Promise.all([
    areas.getPracticeAreaGroups(),
    areas.getFeaturedPracticeAreas(),
    areas.getHomePracticeAreas(),
    areas.getCatastrophicAreas(),
  ]);

  const live = await query<{
    directory: { title: string; items: { label: string; href: string }[] }[] | null;
    featured: { name: string; href: string }[] | null;
    home: { name: string; href: string }[] | null;
    catastrophic: { name: string; href: string }[] | null;
    faqs: number;
  } | null>(`{
    "directory": *[_type == "practiceAreasPage"][0].directory[]{
      title,
      "items": items[]{ "label": coalesce(label, page->label), "href": coalesce(href, "/" + page->slug.current + "/") }
    },
    "featured": *[_type == "practiceAreasPage"][0].featuredAreas[]{ name, href },
    "home": *[_type == "homePage"][0].practiceAreaCards[]{ name, href },
    "catastrophic": *[_type == "homePage"][0].catastrophicAreas[]{ name, href },
    "faqs": count(*[_type == "homePage"][0].faqs)
  }`);

  assert(live !== null, "Sanity returned nothing.");

  const shrink = (list: { name?: string; label?: string; href: string }[] | null | undefined) =>
    (list ?? []).map((row) => ({ label: row.name ?? row.label, href: row.href }));

  const problems: string[] = [];
  const compare = (what: string, actual: unknown, expected: unknown) => {
    if (canon(actual) !== canon(expected)) problems.push(`${what}:\n    live     ${canon(actual)}\n    expected ${canon(expected)}`);
  };

  compare("featured cards", shrink(live.featured), shrink(featured as never));
  compare("home cards", shrink(live.home), shrink(home as never));
  compare("catastrophic panels", shrink(live.catastrophic), shrink(catastrophic as never));
  compare(
    "directory",
    (live.directory ?? []).map((group) => ({ title: group.title, items: shrink(group.items) })),
    groups.map((group) => ({
      title: group.title,
      items: group.items.map((item) => ({ label: item.label, href: item.href })),
    }))
  );

  /* THE MERGE HELD. Phase 2f's five arrays are still on the homepage document —
     this is the assertion that `--replace` did not eat them. */
  if (!live.faqs) problems.push("homePage.faqs is empty — the merge dropped Phase 2f's arrays.");

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ directory, featured grid and both homepage rails match the code exactly.\n` +
      `  homePage still holds ${live.faqs} FAQs, so the merge did not replace Phase 2f's arrays.`
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
