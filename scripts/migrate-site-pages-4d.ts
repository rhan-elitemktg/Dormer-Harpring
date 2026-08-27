// Phase 4d — the three utility pages, out of `data/sitePages.ts`.
//
//   npx tsx scripts/migrate-site-pages-4d.ts
//   npx sanity dataset import scratch/site-pages-4d.ndjson --dataset production --replace
//   npx tsx scripts/migrate-site-pages-4d.ts --verify   # BEFORE swapping the getters
//
//   getPrivacyPolicyPage  → sitePage/privacy
//   getSitemapPage        → sitePage/sitemap
//   getNotFoundPage       → sitePage/notFound
//
// THREE DOCUMENTS OF ONE TYPE, at fixed ids that are also their `kind`. All
// three are new, so nothing is read back and merged.
//
// THE PRIVACY POLICY'S BODY CARRIES THE FIRM'S PHONE NUMBER, as text and inside
// a `tel:` link, the same way the Thank You lede does. It is seeded from the
// same `firmDetails` the site reads, and `scripts/check-phone.py` is what stops
// the stored copy and the firm's real number drifting apart — the live page it
// was transcribed from closes on `(303) 747-4404`, which is one of the six
// numbers this site was normalised off.
//
// THE STORED POLICY IS THE CORRECTED ONE, not the live page's text. Three
// departures, all recorded in `data/sitePages.ts` and all preserved here: the
// phone number, the dropped duplicate `<h2>`, and `modified` rather than `date`
// as the stamp. That module's header is the record of them; this script only
// moves what it produced.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/site-pages-4d.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["sitePages.ts", "getPrivacyPolicyPage", "Personal Information Collection"],
  ["sitePages.ts", "getSitemapPage", "Every page on this site, in one place."],
  ["sitePages.ts", "getNotFoundPage", "We couldn't find that page"],
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

/**
 * `_key` uniqueness within every array, checked before anything is written.
 *
 * THE PRIVACY POLICY IS THE REASON THIS MATTERS HERE. Its body is one `pt()`
 * call of nine blocks — which is safe — but `pt()` numbered its keys from zero
 * WITHIN EACH CALL until Phase 3b, and a body assembled from more than one call
 * carried every key twice. Sanity drops a colliding array member silently, so
 * half a privacy policy would have vanished behind a green import.
 */
function assertKeysUnique(node: unknown, path: string): void {
  if (Array.isArray(node)) {
    const keys = node
      .map((item) => (item && typeof item === "object" ? (item as Json)._key : undefined))
      .filter((key): key is string => typeof key === "string");
    if (keys.length > 0) {
      assert(
        new Set(keys).size === keys.length,
        `${path} has duplicate _key(s). Sanity drops the colliding members silently.`
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

async function load() {
  registerDataModuleHooks({ sanityClient: "live" });
  const pages = await import("../src/data/sitePages.ts");
  const [privacy, sitemap, notFound] = await Promise.all([
    pages.getPrivacyPolicyPage(),
    pages.getSitemapPage(),
    pages.getNotFoundPage(),
  ]);
  return { privacy, sitemap, notFound };
}

function documents({ privacy, sitemap, notFound }: Awaited<ReturnType<typeof load>>): Json[] {
  /* The sitemap and the 404 have no body — their content is generated and four
     links respectively. Asserted rather than assumed: a body that appeared here
     would be copy nothing renders. */
  assert(
    sitemap.body.length === 0 && notFound.body.length === 0,
    `The sitemap or the 404 has grown a body. Neither template renders one — the sitemap's ` +
      `groups are composed from the collection getters and the 404 is four links.`
  );

  return [
    {
      _id: "privacy",
      _type: "sitePage",
      kind: "privacy",
      title: privacy.title,
      body: privacy.body,
      updated: { at: privacy.updatedAt, label: privacy.updatedLabel },
    },
    {
      _id: "sitemap",
      _type: "sitePage",
      kind: "sitemap",
      title: sitemap.title,
      lede: sitemap.lede,
    },
    {
      _id: "notFound",
      _type: "sitePage",
      kind: "notFound",
      title: notFound.title,
      lede: notFound.lede,
      linksTitle: notFound.linksTitle,
      links: notFound.links.map((link) => ({
        _key: link._key,
        label: link.label,
        description: link.description,
        href: link.href,
      })),
    },
  ];
}

async function build(): Promise<void> {
  assertSourcePresent();
  const docs = documents(await load());
  docs.forEach((doc) => assertKeysUnique(doc, String(doc._id)));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, docs.map((doc) => JSON.stringify(doc)).join("\n") + "\n");

  console.log(
    `${docs.length} documents → ${OUT}\n` +
      docs.map((doc) => `  ${doc._id}: ${Object.keys(doc).length - 3} fields`).join("\n") +
      `\n\nnpx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();
  const expected = new Map(documents(await load()).map((doc) => [String(doc._id), doc]));
  const live = await query<Json[]>(
    `*[_type == "sitePage" && _id in ${JSON.stringify([...expected.keys()])}]`
  );

  const problems: string[] = [];
  for (const [id, want] of expected) {
    const stored = live.find((doc) => doc._id === id);
    if (!stored) {
      problems.push(`${id}: not in the dataset.`);
      continue;
    }
    const { _rev, _createdAt, _updatedAt, ...rest } = stored;
    if (canon(rest) !== canon(want)) {
      const fields = new Set([...Object.keys(rest), ...Object.keys(want)]);
      problems.push(
        `${id}: ${[...fields]
          .filter((f) => canon((rest as Json)[f]) !== canon((want as Json)[f]))
          .join(", ")}`
      );
    }
  }

  assert(problems.length === 0, `${problems.length} document(s) differ:\n  ${problems.join("\n  ")}`);
  console.log(`✓ all three utility pages match the code exactly.`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) return verify();
  await build();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
