// One-off migration for the attorney-rail simplification.
//
// Four fields go and one is reshaped, all by request:
//
//   railOrder      the rail follows the team page's drag order now. Two
//                  sequences for one list is two that silently disagree.
//   railPlacement  the rail is the rail; both pages show it.
//   location       the city left the card.
//   railVideo      folded into the profile film below — one person's one video
//                  does not want two ids to keep in step.
//   video          was { ref: { provider, id }, poster, alt }; now
//                  { id, poster, alt }. The provider is always Wistia and the
//                  { provider, id } pair is rebuilt in data/team.ts, where that
//                  indirection belongs. Three levels of box for one string is
//                  what made the form look broken.
//
// A railVideo id is carried into the profile film when the person has no film
// of their own — K.C., Tim and Laura each had one there and nowhere else, so
// dropping the field without this would lose three videos.
//
//   npx tsx scripts/simplify-rail.ts
//   npx sanity dataset import scratch/rail-simplify.ndjson --dataset production --replace
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/rail-simplify.ndjson");

function env(name: string): string {
  const m = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!m) throw new Error(`${name} is not set in .env`);
  return m[1].trim();
}

type Doc = Record<string, unknown>;

async function main() {
  const url =
    `https://${env("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v2026-08-01/data/query/` +
    `${env("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent('*[_type == "teamMember"]')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity returned ${res.status}`);
  const people = (await res.json()).result as Doc[];
  if (people.length === 0) throw new Error("No team members found.");

  let carried = 0;
  const out = people.map((person) => {
    const { _rev, _createdAt, _updatedAt, railOrder, railPlacement, location, railVideo, video, ...rest } =
      person;

    const oldFilm = video as { ref?: { id?: string }; poster?: unknown; alt?: string } | undefined;
    const railId = (railVideo as { id?: string } | undefined)?.id;
    const id = oldFilm?.ref?.id ?? railId;
    if (!oldFilm?.ref?.id && railId) carried += 1;

    if (!id) return rest;
    return {
      ...rest,
      video: {
        id,
        ...(oldFilm?.poster ? { poster: oldFilm.poster } : {}),
        ...(oldFilm?.alt ? { alt: oldFilm.alt } : {}),
      },
    };
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out.map((d) => JSON.stringify(d)).join("\n") + "\n");

  const withFilm = out.filter((d) => (d as Doc).video).length;
  console.log(`Wrote ${out.length} team members to ${OUT}`);
  console.log(`  ${withFilm} with a film · ${carried} carried over from the old rail field`);
  console.log(`  removed: railOrder, railPlacement, location, railVideo`);
}

await main();
