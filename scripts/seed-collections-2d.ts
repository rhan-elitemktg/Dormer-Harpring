// Seed for Phase 2d — the team. 30 people, 25 with bio pages, 42 images.
//
// JOINS THE ROSTER TO THE PROFILES. The codebase held them as two lists keyed
// by slug, and every one of the 25 profiles matches a roster entry — verified
// before merging, not assumed. They are the same person.
//
//   npx tsx scripts/seed-collections-2d.ts
//   npx tsx scripts/sanity-purge.ts teamMember --yes
//   npx sanity dataset import scratch/collections-2d.ndjson --dataset production --replace
import "./lib/stub-vite-modules";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/collections-2d.ndjson");

function asset(image: { src: string }) {
  const path = image.src.startsWith("/") ? image.src : resolve(process.cwd(), image.src);
  readFileSync(path);
  return { _sanityAsset: `image@file://${path}` };
}

async function main() {
  const t = await import("../src/data/team.ts");
  const team = await t.getTeam();
  const profiles = await t.getTeamProfiles();

  // Assert the join BEFORE relying on it. A profile with no roster entry would
  // otherwise be dropped silently — a whole bio page vanishing from the site.
  for (const profile of profiles) {
    if (!team.some((m) => m._key === profile.slug)) {
      throw new Error(`Profile "${profile.slug}" has no roster entry — the join is not 1:1.`);
    }
  }

  // Order is per GROUP, and the groups render in this sequence on the team page.
  const KINDS = ["partner", "attorney", "staff", "dog"];
  const seen: Record<string, number> = {};

  const documents = team.map((member) => {
    const profile = profiles.find((p) => p.slug === member._key);
    const rank = (seen[member.kind] = (seen[member.kind] ?? 0) + 1);

    const doc: Record<string, unknown> = {
      _type: "teamMember",
      key: { _type: "slug", current: member._key },
      name: member.name,
      role: member.role,
      kind: member.kind,
      order: (KINDS.indexOf(member.kind) + 1) * 1000 + rank * 10,
      memorial: Boolean(member.memorial),
      hasProfile: Boolean(profile),
    };

    if (member.photo) doc.photo = asset(member.photo as unknown as { src: string });
    // `photoLarge` was seeded here too. The field was collapsed into `photo`
    // shortly after, by request — one portrait per person, cropped per surface
    // by the hotspot. See scripts/migrate-team-fields.ts, which did the move.
    // This script cannot run again anyway: team.ts reads from Sanity now.
    if (member.bio) doc.bio = member.bio;
    if (member.awards) {
      doc.awards = member.awards.map((a) => ({
        _key: a._key,
        image: asset(a.image as unknown as { src: string }),
        alt: a.alt,
      }));
    }

    if (profile) {
      if (profile.category) doc.category = profile.category;
      if (profile.lede) doc.lede = profile.lede;
      if (profile.email) doc.email = profile.email;
      if (profile.facts) doc.facts = profile.facts;
      doc.body = profile.body;
      if (profile.education) doc.education = profile.education;
      if (profile.links) {
        doc.links = profile.links.map((l) => ({
          _type: "navLink",
          _key: l._key,
          label: l.label,
          href: l.href,
        }));
      }
      if (profile.video) {
        doc.video = {
          ref: { _type: "videoRef", provider: profile.video.ref.provider, id: profile.video.ref.id },
          poster: asset(profile.video.poster as unknown as { src: string }),
          alt: profile.video.alt,
        };
      }
    }

    return doc;
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, documents.map((d) => JSON.stringify(d)).join("\n") + "\n");

  const images = documents.reduce(
    (n, d) =>
      n +
      (d.photo ? 1 : 0) +
      (d.photoLarge ? 1 : 0) +
      ((d.awards as unknown[])?.length ?? 0) +
      (d.video ? 1 : 0),
    0
  );
  console.log(`Wrote ${documents.length} team members to ${OUT}`);
  console.log(`  ${documents.filter((d) => d.hasProfile).length} with a bio page · ${images} images`);
}

await main();
