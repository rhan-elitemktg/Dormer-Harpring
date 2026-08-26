// One-off migration for the Team collection's field cleanup.
//
// Four changes, all requested, all of which touch existing documents:
//
//   1. ONE PORTRAIT PER PERSON. `photoLarge` and `railPortrait` go. Where a
//      person has a 600×800 `-lg` version it becomes their `photo`, because it
//      is the LARGEST and WIDEST source — with a Sanity asset every tighter
//      crop can be derived from it through the hotspot, which was not true
//      when these were local imports and is the whole reason one file can now
//      serve three surfaces.
//   2. `order` → `orderRank`, so the four desk groups can be drag-ordered.
//      Ranks are generated in the CURRENT order, so nothing moves on the site.
//   3. `kind` stays (the desk groups filter on it) but is hidden in the form.
//      No data change — recorded here because the field looks unused now.
//   4. Everything else is schema-only conditional visibility.
//
// TWO PEOPLE LOSE A PHOTOGRAPH THEY WERE USING, and it is visible:
//   Sean Dormer  the rail card was `attorney-2.jpg`, a different shot from his
//                team portrait. His single portrait is the 600×800, chosen.
//   Tim Garvey   the rail card was `attorney-3.jpg`, also a different shot. He
//                has no 600×800, and both are 460×580, so there is no
//                resolution tiebreaker — his TEAM portrait wins because it is
//                the one his bio page and the team page already use.
// K.C. and Laura are unaffected: their rail portrait is the same asset.
//
//   npx tsx scripts/migrate-team-fields.ts        # writes the payload
//   npx sanity dataset import scratch/team-migration.ndjson --dataset production --replace
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { LexoRank } from "lexorank";

const OUT = resolve(process.cwd(), "scratch/team-migration.ndjson");

function env(name: string): string {
  const m = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!m) throw new Error(`${name} is not set in .env`);
  return m[1].trim();
}

async function query<T>(groq: string): Promise<T> {
  const url =
    `https://${env("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v2026-08-01/data/query/` +
    `${env("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity returned ${res.status}`);
  return (await res.json()).result as T;
}

type Doc = Record<string, unknown>;

async function main() {
  // Ordered as the site orders them today, so the generated ranks preserve it.
  const people = await query<Doc[]>(`*[_type == "teamMember"] | order(order asc)`);
  if (people.length === 0) throw new Error("No team members found — nothing to migrate.");

  let rank = LexoRank.min();
  const migrated = people.map((person) => {
    const { _rev, _createdAt, _updatedAt, photoLarge, railPortrait, order, ...rest } = person;

    rank = rank.genNext();

    // The widest source wins, so every other crop stays derivable.
    const photo = photoLarge ?? rest.photo;

    return {
      ...rest,
      ...(photo ? { photo } : {}),
      orderRank: rank.toString(),
    };
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, migrated.map((d) => JSON.stringify(d)).join("\n") + "\n");

  const gainedLarge = people.filter((p) => p.photoLarge).length;
  const lostRail = people.filter(
    (p) =>
      p.railPortrait &&
      (p.railPortrait as { asset?: { _ref?: string } })?.asset?._ref !==
        (p.photo as { asset?: { _ref?: string } })?.asset?._ref
  );

  console.log(`Wrote ${migrated.length} team members to ${OUT}`);
  console.log(`  ${gainedLarge} portraits replaced by their 600×800 version`);
  console.log(`  ${lostRail.length} rail cards will change photograph:`);
  for (const p of lostRail) console.log(`      ${p.name}`);
  console.log(`  orderRank ${migrated[0].orderRank} … ${migrated[migrated.length - 1].orderRank}`);
}

await main();
