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
//   npx tsx scripts/seed-settings.ts
//   npx sanity dataset import <the file it names> production --replace
import "./lib/stub-assets";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/settings.ndjson");

/** A stable `_key` from a human string. Sanity needs one per array item. */
const keyOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";

async function main() {
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
      phone: firm.phone,
      phoneE164: firm.phoneE164,
      sms: firm.sms,
      smsE164: firm.smsE164,
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
