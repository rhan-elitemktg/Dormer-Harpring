// One-time seed for the four Site Settings singletons.
//
// Reads the values out of `src/data/{site,navigation,contact,stats}.ts` as they
// stand today and writes them as NDJSON for `sanity dataset import`. Run it
// BEFORE swapping those getters over to GROQ — after the swap the literals are
// gone and there is nothing left to read.
//
// NDJSON + `dataset import` rather than a script full of `client.create()`
// calls, for three reasons: it uses the CLI's own credentials so no write token
// has to be minted or stored, `--replace` makes a re-run idempotent, and it is
// the same path the 313 imported documents take in Phase 3 — including their
// images, which `_sanityAsset` can only carry through this route. Proving it on
// four documents is cheaper than proving it on 313.
//
// FIXED `_id`s, and only because these are singletons. Ordinary content
// documents let Sanity generate theirs; a fixed id here is what
// `S.document().documentId(...)` in the desk pins to, and it is what makes
// `*[_id == "firmDetails"][0]` the cheapest possible fetch.
//
// SEED BEFORE YOU SWAP — THIS IS A ONE-WAY DOOR. Once a module's getter reads
// `sanity:client`, plain Node cannot import that module at all: `sanity:client`
// is a VITE VIRTUAL module that only exists inside an Astro build, so the
// import fails with ERR_UNSUPPORTED_ESM_URL_SCHEME. The script that reads a
// module's literals stops working the moment those literals are gone, which is
// the correct shape but takes people by surprise. `main()` catches it and says
// so, because tsx has been seen exiting 0 on the raw failure — a seed that
// silently does nothing, leaving a stale payload that then imports cleanly.
//
//   npx tsx scripts/seed-settings.ts
//   npx sanity dataset import <the file it names> --dataset production --replace
//
// `--replace` is a TRUE replace, not a merge: a field dropped from the payload
// is dropped from the document. Verified, after an earlier reading of the
// opposite turned out to be a stale query against a seed that had not re-run.
import "./lib/stub-assets";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/settings.ndjson");

/** A stable `_key` from a human string. Sanity needs one per array item. */
const keyOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";

/**
 * Refuse to run against a module that has already been swapped to Sanity.
 *
 * CHECKED BY READING THE SOURCE, NOT BY CATCHING THE IMPORT. `sanity:client` is
 * a Vite virtual module, so plain Node fails on it with
 * ERR_UNSUPPORTED_ESM_URL_SCHEME — thrown from a SYNCHRONOUS load hook, outside
 * the promise chain, where a try/catch around `await import()` cannot see it.
 * tsx then exits 0, so the seed appears to succeed while writing nothing and
 * leaving whatever payload was on disk from last time. That stale payload
 * imports perfectly happily, which is how a removed field came back.
 *
 * Kept SEPARATE from the imports below rather than wrapping them, because a
 * templated `import(\`../src/data/${name}.ts\`)` is untyped — every callback
 * downstream then infers `any` and `check:types` goes red. The literal imports
 * in `main()` keep their types; this just runs first.
 */
function assertNotSwapped(...names: string[]) {
  for (const name of names) {
    const file = resolve(process.cwd(), `src/data/${name}.ts`);
    if (!/from ["']sanity:client["']/.test(readFileSync(file, "utf8"))) continue;
    console.error(
      `\nsrc/data/${name}.ts already reads from Sanity, so it holds no literals to seed.\n\n` +
        `That module has been swapped and Sanity is its source of truth now — this script's\n` +
        `job there is done. To change its content, edit it in the Studio at /admin.\n\n` +
        `Seeding is one-way: seed FIRST, verify, then swap the getter.\n`
    );
    process.exit(1);
  }
}

async function main() {
  assertNotSwapped("site", "navigation", "contact", "stats");

  const site = await import("../src/data/site.ts");
  const nav = await import("../src/data/navigation.ts");
  const contact = await import("../src/data/contact.ts");
  const stats = await import("../src/data/stats.ts");

  const firm = await site.getFirmDetails();
  const navItems = await nav.getNavItems();
  const footerNav = await nav.getFooterNav();
  const footerAreas = await nav.getFooterPracticeAreas();
  const serviceAreas = await nav.getServiceAreas();
  const band = await contact.getContactBand();
  const details = await contact.getContactDetails();
  const figures = await stats.getFirmStats();

  /**
   * The children of one top-level item.
   *
   * Keyed on the LABEL, which is fine here and nowhere else: this reads the
   * tree once, today, while both the labels and this script are in front of
   * you. The running site does not do this — `getNavItems()` composes from a
   * code-owned spine that names each menu's field directly.
   */
  const childrenOf = (label: string) => {
    const parent = navItems.find((i) => i.label === label);
    if (!parent) throw new Error(`No top-level nav item called "${label}" — the spine moved.`);
    if (!parent.children) throw new Error(`"${label}" has no children to seed.`);
    return parent.children.map((c) => ({
      _type: "navLink",
      _key: keyOf(c.label),
      label: c.label,
      href: c.href,
    }));
  };

  const asLinks = (items: { label: string; href: string | null }[]) =>
    items.map((i) => ({
      _type: "navLink",
      _key: keyOf(i.label),
      label: i.label,
      href: i.href,
    }));

  const cardCopy = (key: string) => {
    const card = details.cards.find((c) => c._key === key);
    if (!card) throw new Error(`No contact card called "${key}".`);
    return { label: card.label, note: card.note };
  };

  const documents = [
    {
      _id: "firmDetails",
      _type: "firmDetails",
      name: firm.name,
      legalName: firm.legalName,
      // No phoneE164 / smsE164: both are derived from the displayed number.
      phone: firm.phone,
      sms: firm.sms,
      ...(firm.email ? { email: firm.email } : {}),
      address: { ...firm.address },
      geo: { _type: "geopoint", lat: firm.geo.lat, lng: firm.geo.lng },
      mapUrl: firm.mapUrl,
      mapPlaceCid: firm.mapPlaceCid,
      hours: firm.hours,
      hoursDisplay: firm.hoursDisplay,
      socials: firm.socials.map((s) => ({ _key: s.name, name: s.name, href: s.href })),
      directoryProfiles: firm.directoryProfiles,
    },

    {
      _id: "navigation",
      _type: "navigation",
      aboutMenu: childrenOf("About"),
      practiceAreasMenu: childrenOf("Practice Areas"),
      locationsMenu: childrenOf("Locations"),
      footerPracticeAreas: asLinks(footerAreas),
      footerNav: asLinks(footerNav),
      serviceAreas,
    },

    {
      _id: "contactSettings",
      _type: "contactSettings",
      eyebrow: band.eyebrow,
      title: band.title,
      reassurances: band.reassurances,
      callPrompt: band.callPrompt,
      callBadge: band.callBadge,
      form: band.form,
      photoAlt: details.photoAlt,
      callCard: cardCopy("call"),
      textCard: cardCopy("text"),
      emailCard: cardCopy("email"),
      officeCard: cardCopy("office"),
      hours: { label: details.hours.label, note: details.hours.note },
    },

    {
      _id: "firmStats",
      _type: "firmStats",
      stats: figures.map((f) => ({ _key: f._key, big: f.big, label: f.label })),
    },
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, documents.map((d) => JSON.stringify(d)).join("\n") + "\n");

  console.log(`Wrote ${documents.length} documents to ${OUT}`);
  for (const d of documents) console.log(`  ${d._id}`);
  console.log(`\nImport with:\n  npx sanity dataset import ${OUT} ${process.env.PUBLIC_SANITY_DATASET ?? "production"} --replace`);
}

await main();
