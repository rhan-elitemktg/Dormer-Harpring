// Phase 4e — the last two page documents' copy.
//
//   npx tsx scripts/migrate-page-copy-4e.ts
//   npx sanity dataset import scratch/page-copy-4e.ndjson --dataset production --replace
//   npx tsx scripts/migrate-page-copy-4e.ts --verify   # BEFORE swapping the getters
//
//   data/practiceAreas.ts   getPracticeAreasPage → practiceAreasPage
//   data/communityPage.ts   getCommunityPage     → communityPage
//
// BOTH DOCUMENTS ALREADY EXIST and both must be read back and merged.
// `practiceAreasPage` carries the featured grid and the 102-entry directory
// from Phase 3d; `communityPage` carries eleven partner cards and the
// sponsorships from Phase 2f. `--replace` replaces a document WHOLE, so a
// payload holding only the copy would delete every one of them. This refuses to
// write unless each read comes back carrying its list.
//
// TWO FIELDS ARE STORED UNDER A DIFFERENT NAME than the interface uses —
// `featuredHeading` / `directoryHeading` on one, `sponsorshipsHeading` /
// `partnersLabel` on the other — because in the Studio each heading sits beside
// the list it heads and wants a name that says so. The projection aliases them
// back. Renaming a field an editor sees to match a component's prop is the
// wrong way round.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/page-copy-4e.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["practiceAreas.ts", "getPracticeAreasPage", "How we help injured Coloradans."],
  ["communityPage.ts", "getCommunityPage", "Showing up for Colorado."],
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

async function load() {
  registerDataModuleHooks({ sanityClient: "live" });
  const areas = await import("../src/data/practiceAreas.ts");
  const community = await import("../src/data/communityPage.ts");
  const [practiceAreas, communityPage] = await Promise.all([
    areas.getPracticeAreasPage(),
    community.getCommunityPage(),
  ]);
  return { practiceAreas, communityPage };
}

/** The copy each document gains, keyed by the id it lands on. */
function copyFor({ practiceAreas, communityPage }: Awaited<ReturnType<typeof load>>) {
  return {
    practiceAreasPage: {
      eyebrow: practiceAreas.eyebrow,
      title: practiceAreas.title,
      lede: practiceAreas.lede,
      ctaLabel: practiceAreas.ctaLabel,
      ctaNote: practiceAreas.ctaNote,
      featuredHeading: { ...practiceAreas.featured },
      directoryHeading: { ...practiceAreas.directory },
    } satisfies Json,
    communityPage: {
      eyebrow: communityPage.eyebrow,
      title: communityPage.title,
      lede: communityPage.lede,
      volunteer: { ...communityPage.volunteer },
      sponsorshipsHeading: { ...communityPage.sponsorships },
      partnersLabel: communityPage.partners.label,
    } satisfies Json,
  };
}

/** What each document must still carry after the merge, and what it means if
 *  it does not. The read-back guard, named per document. */
const MUST_KEEP: Record<string, [field: string, why: string]> = {
  practiceAreasPage: ["directory", "the 102-entry directory Phase 3d built"],
  communityPage: ["partners", "the eleven partner cards Phase 2f moved here"],
};

async function build(): Promise<void> {
  assertSourcePresent();
  const copy = copyFor(await load());

  const docs: Json[] = [];
  for (const [id, fields] of Object.entries(copy)) {
    const existing = writable(
      await query<Json | null>(`*[_type == "${id}" && _id == "${id}"][0]`)
    );
    const [field, why] = MUST_KEEP[id];
    assert(
      Array.isArray(existing[field]) && (existing[field] as unknown[]).length > 0,
      `The live ${id} document has no ${field}[]. Refusing to write: this payload REPLACES the ` +
        `document, and merging onto an empty read would delete ${why}.`
    );
    docs.push({ ...existing, ...fields, _id: id, _type: id });
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, docs.map((doc) => JSON.stringify(doc)).join("\n") + "\n");

  console.log(
    `${docs.length} documents → ${OUT}\n` +
      docs
        .map(
          (doc) =>
            `  ${doc._id}: ${Object.keys(copy[doc._id as keyof typeof copy]).length} copy fields ` +
            `MERGED onto ${Object.keys(doc).length - Object.keys(copy[doc._id as keyof typeof copy]).length - 2} existing`
        )
        .join("\n") +
      `\n\nnpx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();
  const copy = copyFor(await load());

  const live = await query<Record<string, Json | null>>(`{
    "practiceAreasPage": *[_type == "practiceAreasPage"][0]{
      eyebrow, title, lede, ctaLabel, ctaNote,
      featuredHeading{ eyebrow, title, lede },
      directoryHeading{ eyebrow, title },
      "directoryGroups": count(directory),
      "featuredCount": count(featuredAreas)
    },
    "communityPage": *[_type == "communityPage"][0]{
      eyebrow, title, lede,
      volunteer{ eyebrow, title, ctaLabel },
      sponsorshipsHeading{ eyebrow, title },
      partnersLabel,
      "partnerCount": count(partners),
      "sponsorshipCount": count(sponsorships)
    }
  }`);

  const problems: string[] = [];
  for (const [id, want] of Object.entries(copy)) {
    const stored = live[id];
    if (!stored) {
      problems.push(`${id}: not in the dataset.`);
      continue;
    }
    for (const [field, value] of Object.entries(want)) {
      if (canon(stored[field]) !== canon(value)) {
        problems.push(
          `${id}.${field}:\n    live     ${canon(stored[field])}\n    expected ${canon(value)}`
        );
      }
    }
  }

  /* THE MERGES HELD. Each document's lists survived being replaced. */
  const areas = live.practiceAreasPage;
  const community = live.communityPage;
  if (!areas?.directoryGroups) problems.push("practiceAreasPage.directory is empty — the merge dropped Phase 3d.");
  if (!areas?.featuredCount) problems.push("practiceAreasPage.featuredAreas is empty — same.");
  if (!community?.partnerCount) problems.push("communityPage.partners is empty — the merge dropped Phase 2f.");
  if (!community?.sponsorshipCount) problems.push("communityPage.sponsorships is empty — same.");

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ both pages' copy matches the code exactly.\n` +
      `  practiceAreasPage still holds ${areas?.directoryGroups} directory GROUPS (the 102 ` +
      `entries sit inside them) and ` +
      `${areas?.featuredCount} featured cards; communityPage still holds ${community?.partnerCount} ` +
      `partners and ${community?.sponsorshipCount} sponsorships.`
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
