// Phase 6c — one set of firm figures, in the hero's wording.
//
//   npx tsx scripts/migrate-firm-stats-6c.ts
//   npx sanity dataset import scratch/firm-stats-6c.ndjson --dataset production --replace
//   npx tsx scripts/migrate-firm-stats-6c.ts --verify   # BEFORE swapping the getters
//   npx tsx scripts/sanity-purge.ts firmStats --yes     # AFTER the swap
//
// THERE WERE TWO SETS OF FOUR AND THEY NEARLY AGREED, which is the worst of
// both: `firmStats` drew the band on seven pages, `homePage.hero.stats` drew
// the homepage hero, three of four figures matched on the number and differed
// only in label, and the fourth was a different claim ("Small · Caseload by
// design" against "We Come · To you"). Two of them meant "$70M+" had two homes
// and confirming it before launch meant editing both.
//
// THE HERO'S WORDING WINS, BY REQUEST — the shorter labels ("Recovered", "in
// Denver") rather than the band's ("Recovered for clients", "Trying cases in
// Denver"). So the HOMEPAGE IS UNCHANGED and the SEVEN BAND PAGES CHANGE, which
// is the opposite of what the direction of the move suggests and is worth
// knowing when reading the byte-diff.
//
// It lands on `sharedSections` rather than staying its own singleton because
// that document is content shown on more than one page and changed once, which
// is what this is. `firmDetails` stays where it is: it is data the site DERIVES
// from — the phone becomes a `tel:` href and JSON-LD, the address becomes the
// footer and the map pin — where this is a band the site DISPLAYS.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/firm-stats-6c.ndjson");
const API_VERSION = "2026-08-01";

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

function writable(doc: Json): Json {
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

async function main(): Promise<void> {
  const verify = process.argv.includes("--verify");

  const home = await query<Json | null>(`*[_id == "homePage"][0]`);
  const shared = await query<Json | null>(`*[_id == "sharedSections"][0]`);
  assert(!!home && !!shared, "homePage or sharedSections is missing.");

  if (verify) {
    const band = (shared as Json).firmStats as Json | undefined;
    assert(!!band, "sharedSections.firmStats is missing — did the import run?");
    const rows = band.stats as Json[];
    assert(Array.isArray(rows) && rows.length === 4, `expected 4 figures, found ${rows?.length}`);
    assert(
      !("stats" in ((home as Json).hero as Json)),
      "homePage.hero.stats is still there — the import did not replace."
    );
    console.log(`  ✓ sharedSections.firmStats — ${rows.map((r) => r.big).join(", ")}`);
    console.log("  ✓ homePage.hero.stats is gone");
    console.log("\n6c: the dataset matches the new shape.");
    return;
  }

  const h = writable(home);
  const hero = h.hero as Json;
  const heroStats = hero.stats as Json[];
  assert(Array.isArray(heroStats) && heroStats.length > 0, "homePage.hero.stats is empty.");

  /*
   * THE OLD BAND IS READ ONLY TO BE COUNTED AGAINST. Its wording is being
   * discarded, but a set of a different SIZE means the two were not the near
   * duplicates this change assumes and somebody should look before four labels
   * are thrown away.
   */
  const old = await query<Json[] | null>(`*[_id == "firmStats"][0].stats`);
  assert(Array.isArray(old), "the firmStats document has no stats array.");
  assert(
    old.length === heroStats.length,
    `the band has ${old.length} figures and the hero has ${heroStats.length}. ` +
      `They were near-duplicates when this was written; they are not now. Nothing written.`
  );

  const { stats: _dropped, ...heroRest } = hero;
  h.hero = heroRest;

  const s = writable(shared);
  assert(!!s.whyUs && !!s.awardsBar, "sharedSections came back without its existing bands.");
  assert(!("firmStats" in s), "sharedSections.firmStats already exists — has this run?");
  s.firmStats = { stats: heroStats };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, [h, s].map((d) => JSON.stringify(d)).join("\n") + "\n");
  console.log(`  the hero's wording becomes the one set:`);
  for (const row of heroStats) console.log(`     ${String(row.big).padEnd(10)} ${row.label}`);
  console.log(`\n  replacing the band's, which is discarded:`);
  for (const row of old) console.log(`     ${String(row.big).padEnd(10)} ${row.label}`);
  console.log(`\n2 documents → ${OUT}`);
  console.log(`Purge the old singleton AFTER the getters swap:`);
  console.log(`  npx tsx scripts/sanity-purge.ts firmStats --yes`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
