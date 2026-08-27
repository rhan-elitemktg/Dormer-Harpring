// Seed for Phase 2e — the last hand-authored collections.
//
// Cities, press mentions, insight teasers, community photos, charity partners,
// community partners and sponsorships. Plus two MERGES into documents that
// already exist:
//
//   the four attorney-rail cards are existing team members with a third
//     presentation — a wider marketing crop, a city, and a film on the portrait
//   the attorneys band's heading joins sharedSections, which already holds the
//     core-values heading and the review rating
//
//   npx tsx scripts/seed-collections-2e.ts
//   npx tsx scripts/sanity-purge.ts city newsMention insight communityPhoto ngoPartner communityPartner sponsorship --yes
//   npx sanity dataset import scratch/collections-2e.ndjson --dataset production --replace
import "./lib/stub-vite-modules";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/collections-2e.ndjson");

function asset(image: { src: string }) {
  const path = image.src.startsWith("/") ? image.src : resolve(process.cwd(), image.src);
  readFileSync(path);
  return { _sanityAsset: `image@file://${path}` };
}

/**
 * Run a GROQ query against the live dataset.
 *
 * Needed because two things in this slice ADD fields to documents that already
 * exist, and `dataset import --replace` replaces a document WHOLE — emitting
 * only the new fields would delete everything else on it. Reading the document
 * back and writing the merged result is what makes the import safe.
 *
 * Public-read, so no credentials.
 */
async function query<T>(groq: string): Promise<T> {
  const read = (name: string) => {
    const m = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
    if (!m) throw new Error(`${name} is not set in .env`);
    return m[1].trim();
  };
  const url =
    `https://${read("PUBLIC_SANITY_PROJECT_ID")}.api.sanity.io/v2026-08-01/data/query/` +
    `${read("PUBLIC_SANITY_DATASET")}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity returned ${res.status} for: ${groq}`);
  return (await res.json()).result as T;
}

/** System fields must not be written back — `_rev` would pin the import to a
 *  revision that is no longer current. */
function writable(doc: Record<string, unknown>): Record<string, unknown> {
  const { _rev, _createdAt, _updatedAt, ...rest } = doc;
  return rest;
}

const rank = (i: number) => (i + 1) * 10;

async function main() {
  const cities = await (await import("../src/data/cities.ts")).getCities();
  const news = await import("../src/data/news.ts");
  const community = await import("../src/data/community.ts");
  const communityPage = await import("../src/data/communityPage.ts");
  const attorneys = await import("../src/data/attorneys.ts");

  const mentions = await news.getNewsMentions();
  const insights = await news.getInsightPosts();
  const photos = await community.getCommunityPhotos();
  const ngos = await community.getNgoPartners();
  const partners = await communityPage.getCommunityPartners();
  const sponsorships = await communityPage.getSponsorships();
  const band = await attorneys.getAttorneysSection();
  const railHome = await attorneys.getHomeAttorneys();
  const railAbout = await attorneys.getAboutAttorneys();

  const documents: Record<string, unknown>[] = [
    ...cities.map((c, i) => ({
      _type: "city",
      key: { _type: "slug", current: c._key },
      name: c.name,
      order: rank(i),
    })),
    ...mentions.map((m, i) => ({
      _type: "newsMention",
      outlet: m.outlet,
      logo: asset(m.logo as unknown as { src: string }),
      date: m.date,
      headline: m.headline,
      href: m.href,
      order: rank(i),
    })),
    ...insights.map((p, i) => ({
      _type: "insight",
      title: p.title,
      category: p.category,
      iconKey: p.iconKey,
      readTime: p.readTime,
      href: p.href,
      order: rank(i),
    })),
    ...photos.map((p, i) => ({
      _type: "communityPhoto",
      image: asset(p.image as unknown as { src: string }),
      org: p.org,
      caption: p.caption,
      span: p.span,
      order: rank(i),
    })),
    ...ngos.map((n, i) => ({
      _type: "ngoPartner",
      name: n.name,
      logo: asset(n.logo as unknown as { src: string }),
      order: rank(i),
    })),
    ...partners.map((p, i) => ({
      _type: "communityPartner",
      org: p.org,
      logo: asset(p.logo as unknown as { src: string }),
      ...(p.photo ? { photo: asset(p.photo as unknown as { src: string }) } : {}),
      body: p.body,
      order: rank(i),
    })),
    ...sponsorships.map((s, i) => ({
      _type: "sponsorship",
      name: s.name,
      body: s.body,
      order: rank(i),
    })),
  ];

  /*
   * THE ATTORNEY RAIL IS A PATCH ONTO EXISTING PEOPLE, not new documents.
   * Emitting `_type: "teamMember"` with only these fields would REPLACE the
   * whole person and delete their bio. So each is written as the full existing
   * document plus the rail fields — read back from Sanity, the same way the
   * singleton is.
   *
   * About shows four and the homepage three; the homepage's set is a subset,
   * asserted rather than assumed.
   */
  for (const card of railHome) {
    if (!railAbout.some((a) => a.href === card.href)) {
      throw new Error(`Rail card "${card._key}" is on the homepage but not About — not a subset.`);
    }
  }

  /*
   * JOINED ON `href`, NOT ON `_key`, AND THE ASSERTION IS WHY THIS IS RIGHT.
   * The card keys and the team keys do not match: the homepage card is
   * `kc-harpring` where the team member is `k-c-harpring`. Matching on `_key`
   * found three of four and the throw below caught it — matching on `_key`
   * WITHOUT the assertion would have silently dropped KC Harpring off both
   * rails. The href is the authoritative link and already carries the team key.
   */
  const teamKeyOf = (href: string) => href.replace(/^\/meet-our-attorneys\/|\/$/g, "");
  const railKeys = railAbout.map((c) => teamKeyOf(c.href));
  const existing = await query<Record<string, unknown>[]>(
    `*[_type == "teamMember" && key.current in [${railKeys.map((k) => JSON.stringify(k)).join(",")}]]`
  );
  if (existing.length !== railKeys.length) {
    throw new Error(
      `Expected ${railKeys.length} team members for the rail, found ${existing.length}. ` +
        `Seed the team (2d) before this.`
    );
  }

  const railDocs = railAbout.map((card, i) => {
    const key = teamKeyOf(card.href);
    const person = existing.find((d) => (d.key as { current?: string })?.current === key);
    if (!person) throw new Error(`No team member with key "${key}" (card "${card._key}").`);
    return {
      ...writable(person),
      onAttorneyRail: true,
      railOrder: rank(i),
      onHomeRail: railHome.some((h) => h.href === card.href),
      railPortrait: asset(card.portrait as unknown as { src: string }),
      // `location` and `railOrder` were seeded here. Both were later dropped by
      // request — the city left the card, and the rail follows the team page's
      // drag order rather than a second sequence. See scripts/simplify-rail.ts.
      // Optional since the card gained a no-film branch. Every one of the four
      // this seed ran against had a stand-in id, so this never fired — it is
      // here because the TYPE is now honest about it.
      ...(card.video
        ? { railVideo: { _type: "videoRef", provider: card.video.provider, id: card.video.id } }
        : {}),
    };
  });

  const shared = {
    ...writable(await query<Record<string, unknown>>('*[_id == "sharedSections"][0]')),
    _id: "sharedSections",
    _type: "sharedSections",
    attorneysBand: {
      eyebrow: band.eyebrow,
      title: band.title,
      quote: band.quote,
      signature: {
        name: band.signature.name,
        role: band.signature.role,
        // The href is `attorneyPath(key)`; store the KEY, not the path — the
        // route helper stays the only thing that builds a URL.
        attorneyKey: band.signature.href.replace(/^\/meet-our-attorneys\/|\/$/g, ""),
        portrait: asset(band.signature.portrait as unknown as { src: string }),
      },
      ctaLabel: band.ctaLabel,
    },
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    [...documents, ...railDocs, shared].map((d) => JSON.stringify(d)).join("\n") + "\n"
  );

  const counts: Record<string, number> = {};
  for (const d of documents) counts[d._type as string] = (counts[d._type as string] ?? 0) + 1;
  console.log(`Wrote ${documents.length} documents to ${OUT}`);
  for (const [type, n] of Object.entries(counts)) console.log(`  ${type}: ${n}`);
  console.log(`  sharedSections carries: ${Object.keys(shared).filter((k) => !k.startsWith("_")).join(", ")}`);
  console.log(`  ${railDocs.length} team members re-emitted WHOLE with their rail fields added`);
}

await main();
