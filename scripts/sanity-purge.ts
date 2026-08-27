// Delete every document of the named types, so a seed can be re-imported.
//
// WHY THIS IS NEEDED. Seeded collection documents get GENERATED `_id`s, which
// is Sanity's own guidance for ordinary content — identity for a re-import
// lives in a field (`legacyKey` here), not in the id. The cost is that
// `dataset import --replace` has nothing to match on, so a second import ADDS
// six more awards rather than replacing the six that are there. Silently.
//
// Singletons are the exception and are not affected: they have fixed ids, so
// `--replace` really does replace them.
//
// DESTRUCTIVE. It takes explicit type names — never a wildcard — prints what it
// found, and does nothing without `--yes`.
//
//   npx tsx scripts/sanity-purge.ts award coreValue --yes
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const API_VERSION = "2026-08-01";

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(
    readFileSync(".env", "utf8")
  );
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes");
  const types = args.filter((a) => !a.startsWith("--"));

  if (types.length === 0) {
    console.error(
      "Name the document types to delete.\n" +
        "  npx tsx scripts/sanity-purge.ts award coreValue --yes\n"
    );
    process.exit(1);
  }

  const projectId = env("PUBLIC_SANITY_PROJECT_ID");
  const dataset = env("PUBLIC_SANITY_DATASET");

  // Drafts too: a draft left behind reappears in the Studio next to the fresh
  // import and looks like a duplicate nobody created.
  const query = `*[_type in [${types.map((t) => JSON.stringify(t)).join(",")}]]._id`;
  const url =
    `https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity returned ${response.status} for the id query.`);
  const ids: string[] = (await response.json()).result ?? [];

  console.log(`${ids.length} document(s) of type ${types.join(", ")} in "${dataset}".`);
  if (ids.length === 0) return;

  if (!confirmed) {
    console.log("Nothing deleted — re-run with --yes to actually delete them.");
    return;
  }

  // Batched: the CLI takes ids as arguments and a few hundred blows the limit.
  const BATCH = 50;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    execFileSync("npx", ["--no-install", "sanity", "documents", "delete", "--dataset", dataset, ...batch], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    console.log(`  deleted ${Math.min(i + BATCH, ids.length)}/${ids.length}`);
  }
}

await main();
