// Phase 4b — the eight route singletons, out of six data modules.
//
//   npx tsx scripts/migrate-pages-4b.ts
//   npx sanity dataset import scratch/pages-4b.ndjson --dataset production --replace
//   npx tsx scripts/migrate-pages-4b.ts --verify      # BEFORE swapping the getters
//   …then swap, build, and byte-diff.
//
//   data/aboutPage.ts      getAboutPage         → aboutPage
//   data/teamPage.ts       getTeamPage          → teamPage
//   data/contactPage.ts    getContactPage       → contactPage
//   data/thankYou.ts       getThankYouPage      → thankYouPage
//   data/testimonials.ts   getTestimonialsPage  → testimonialsPage
//   data/caseResults.ts    getCaseResultsPage   → resultsPage
//   data/coCounsel.ts      getCoCounselPage     → coCounselPage
//   data/blog.ts           getBlogPage          → blogIndexPage
//
// ALL EIGHT ARE NEW DOCUMENTS, so there is nothing to read back and merge —
// which is the one way this slice is simpler than 4a and 3d. `--replace` is
// still correct: singletons sit at fixed ids, so it replaces the right document
// on a re-run rather than adding a second one.
//
// THREE THINGS ARE LEFT IN CODE ON PURPOSE, and each is left as a UNIT with the
// thing it describes:
//
//   the page-header photographs   `photo` / `photoMobile` / `photoAlt`.
//                                 `PageHeader` art-directs through a hand-built
//                                 <picture>, so this is a component change, not
//                                 a data change. The alt stays with the
//                                 photograph: an alt describing a picture the
//                                 editor cannot see or change is a field that
//                                 drifts with nothing checking it — and About's
//                                 carries a live TODO(launch) that would not
//                                 survive the move.
//   two band photographs          Co-Counsel's partnership duo and Thank You's
//                                 skyline panel. Same call.
//   every derived VALUE           the office address inside Contact's "Find us"
//                                 lede, and the phone number inside Thank You's.
//                                 Copy moves; values stay derived.
//
// SO CONTACT AND THANK YOU STORE LESS THAN THEY RENDER. `contactPage.find.lede`
// is the part AFTER the address, and the getter prepends it. `thankYouPage.lede`
// is Portable Text carrying a real `tel:` link, seeded from the same
// `firmDetails` the site reads — so it is the one field here whose stored value
// contains a derived one, and the verify below checks it still matches.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/pages-4b.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

/**
 * REFUSE TO RUN ONCE THE SOURCE HAS MOVED, asserted per GETTER against a string
 * that exists only inside the literal it migrates — a module-shaped check stopped
 * meaning anything once one getter in a module could move without the others.
 */
const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["aboutPage.ts", "getAboutPage", "Quality over quantity."],
  ["teamPage.ts", "getTeamPage", "The people in your corner."],
  ["contactPage.ts", "getContactPage", "Let's talk."],
  ["thankYou.ts", "getThankYouPage", "Message received"],
  ["testimonials.ts", "getTestimonialsPage", "In our clients' own words."],
  ["caseResults.ts", "getCaseResultsPage", "Outstanding results."],
  ["coCounsel.ts", "getCoCounselPage", "Co-counsel opportunities."],
  ["blog.ts", "getBlogPage", "Load more posts"],
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

/** Keys sorted at every depth — see the note in `migrate-practice-cards-3d.ts`. */
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

/**
 * The file with its comments removed.
 *
 * A SENTINEL THAT ALSO APPEARS IN A COMMENT IS A GUARD THAT CANNOT FIRE — 4a
 * caught one in the act, where a module header quoted its own heading verbatim.
 */
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

/** Sanity requires `_key` uniqueness WITHIN an array; a collision is a silently
 *  dropped member, not an error. Two of these documents carry `pt()` bodies. */
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

/** Drop the array member's `_key` and keep the rest, in the given order. */
const keyed = <T extends { _key: string }>(rows: T[], pick: (row: T) => Json): Json[] =>
  rows.map((row) => ({ _key: row._key, ...pick(row) }));

async function load() {
  registerDataModuleHooks({ sanityClient: "live" });
  const about = await import("../src/data/aboutPage.ts");
  const team = await import("../src/data/teamPage.ts");
  const contact = await import("../src/data/contactPage.ts");
  const thanks = await import("../src/data/thankYou.ts");
  const testimonials = await import("../src/data/testimonials.ts");
  const results = await import("../src/data/caseResults.ts");
  const coCounsel = await import("../src/data/coCounsel.ts");
  const blog = await import("../src/data/blog.ts");
  const site = await import("../src/data/site.ts");

  const [aboutPage, teamPage, contactPage, thankYouPage, testimonialsPage, resultsPage, coCounselPage, blogPage, firm] =
    await Promise.all([
      about.getAboutPage(),
      team.getTeamPage(),
      contact.getContactPage(),
      thanks.getThankYouPage(),
      testimonials.getTestimonialsPage(),
      results.getCaseResultsPage(),
      coCounsel.getCoCounselPage(),
      blog.getBlogPage(),
      site.getFirmDetails(),
    ]);

  return {
    aboutPage,
    teamPage,
    contactPage,
    thankYouPage,
    testimonialsPage,
    resultsPage,
    coCounselPage,
    blogPage,
    // The rendered address, built by the site's OWN formatter rather than
    // re-assembled here — the two would drift the first time a unit number or a
    // comma moved.
    address: site.formatAddress(firm.address),
  };
}

/**
 * THE ADDRESS COMES OFF THE FRONT OF CONTACT'S "FIND US" LEDE.
 *
 * The getter builds `"<address> — <note>"`, and only the note is content. This
 * asserts the prefix is really there rather than slicing blind: if the getter
 * ever stops prepending, this throws instead of storing the whole sentence and
 * publishing the address from two documents.
 */
function noteAfterAddress(lede: string, address: string): string {
  const prefix = `${address} — `;
  assert(
    lede.startsWith(prefix),
    `Contact's "Find us" lede no longer opens on the firm's address (${address}), so the ` +
      `address cannot be split back out of it:\n  ${lede}`
  );
  return lede.slice(prefix.length);
}

function documents(loaded: Awaited<ReturnType<typeof load>>): Json[] {
  const {
    aboutPage,
    teamPage,
    contactPage,
    thankYouPage,
    testimonialsPage,
    resultsPage,
    coCounselPage,
    blogPage,
    address,
  } = loaded;

  return [
    {
      _id: "aboutPage",
      _type: "aboutPage",
      eyebrow: aboutPage.eyebrow,
      title: aboutPage.title,
      lede: aboutPage.lede,
      ctaLabel: aboutPage.ctaLabel,
      ctaNote: aboutPage.ctaNote,
      whoWeAre: {
        eyebrow: aboutPage.whoWeAre.eyebrow,
        title: aboutPage.whoWeAre.title,
        body: aboutPage.whoWeAre.body,
        ctaLabel: aboutPage.whoWeAre.ctaLabel,
        ctaHref: aboutPage.whoWeAre.ctaHref,
      },
      quote: { text: aboutPage.quote.text, attribution: aboutPage.quote.attribution },
      team: { ...aboutPage.team },
      reviews: { ...aboutPage.reviews },
      oneShot: {
        eyebrow: aboutPage.oneShot.eyebrow,
        title: aboutPage.oneShot.title,
        body: aboutPage.oneShot.body,
      },
      expect: {
        title: aboutPage.expect.title,
        promises: keyed(aboutPage.expect.promises, (p) => ({
          title: p.title,
          body: p.body,
          iconKey: p.iconKey,
        })),
        milestones: keyed(aboutPage.expect.milestones, (m) => ({
          tag: m.tag,
          title: m.title,
          body: m.body,
        })),
      },
    },
    {
      _id: "teamPage",
      _type: "teamPage",
      eyebrow: teamPage.eyebrow,
      title: teamPage.title,
      lede: teamPage.lede,
      partners: { ...teamPage.partners },
      team: { ...teamPage.team },
    },
    {
      _id: "contactPage",
      _type: "contactPage",
      eyebrow: contactPage.eyebrow,
      title: contactPage.title,
      lede: contactPage.lede,
      find: {
        eyebrow: contactPage.find.eyebrow,
        title: contactPage.find.title,
        lede: noteAfterAddress(contactPage.find.lede, address),
      },
    },
    {
      _id: "thankYouPage",
      _type: "thankYouPage",
      eyebrow: thankYouPage.eyebrow,
      title: thankYouPage.title,
      lede: thankYouPage.lede,
      panel: {
        eyebrow: thankYouPage.panel.eyebrow,
        title: thankYouPage.panel.title,
        lede: thankYouPage.panel.lede,
        reassurances: thankYouPage.panel.reassurances,
        ctas: keyed(thankYouPage.panel.ctas, (cta) => ({ label: cta.label, href: cta.href })),
      },
    },
    {
      _id: "testimonialsPage",
      _type: "testimonialsPage",
      eyebrow: testimonialsPage.eyebrow,
      title: testimonialsPage.title,
      lede: testimonialsPage.lede,
      ctaLabel: testimonialsPage.ctaLabel,
      ctaNote: testimonialsPage.ctaNote,
      videos: { ...testimonialsPage.videos },
      written: { ...testimonialsPage.written },
    },
    {
      _id: "resultsPage",
      _type: "resultsPage",
      eyebrow: resultsPage.eyebrow,
      title: resultsPage.title,
      lede: resultsPage.lede,
      moreLabel: resultsPage.moreLabel,
    },
    {
      _id: "coCounselPage",
      _type: "coCounselPage",
      eyebrow: coCounselPage.eyebrow,
      title: coCounselPage.title,
      lede: coCounselPage.lede,
      ctaLabel: coCounselPage.ctaLabel,
      ctaNote: coCounselPage.ctaNote,
      partnership: {
        eyebrow: coCounselPage.partnership.eyebrow,
        title: coCounselPage.partnership.title,
        intro: coCounselPage.partnership.intro,
        callout: coCounselPage.partnership.callout,
        terms: coCounselPage.partnership.terms,
      },
      results: { ...coCounselPage.results },
      areas: {
        eyebrow: coCounselPage.areas.eyebrow,
        title: coCounselPage.areas.title,
        ctaLabel: coCounselPage.areas.ctaLabel,
        items: keyed(coCounselPage.areas.items, (item) => ({ label: item.label, href: item.href })),
      },
      form: { ...coCounselPage.form },
    },
    {
      _id: "blogIndexPage",
      _type: "blogIndexPage",
      eyebrow: blogPage.eyebrow,
      title: blogPage.title,
      lede: blogPage.lede,
      categoryLabel: blogPage.categoryLabel,
      allLabel: blogPage.allLabel,
      featuredBadge: blogPage.featuredBadge,
      readMoreLabel: blogPage.readMoreLabel,
      loadMoreLabel: blogPage.loadMoreLabel,
      emptyLabel: blogPage.emptyLabel,
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
      docs.map((doc) => `  ${doc._id}: ${Object.keys(doc).length - 2} fields`).join("\n") +
      `\n\nnpx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();
  const expected = new Map(documents(await load()).map((doc) => [String(doc._id), doc]));
  const ids = [...expected.keys()];

  const live = await query<Json[]>(
    `*[_id in ${JSON.stringify(ids)}]{ ..., "_id": _id }`
  );

  const problems: string[] = [];
  for (const id of ids) {
    const stored = live.find((doc) => doc._id === id);
    if (!stored) {
      problems.push(`${id}: not in the dataset.`);
      continue;
    }
    const { _rev, _createdAt, _updatedAt, ...rest } = stored;
    const want = expected.get(id)!;
    if (canon(rest) !== canon(want)) {
      // Name the fields that differ rather than printing two whole documents.
      const fields = new Set([...Object.keys(rest), ...Object.keys(want)]);
      const differing = [...fields].filter(
        (field) => canon((rest as Json)[field]) !== canon((want as Json)[field])
      );
      problems.push(`${id}: ${differing.join(", ")}`);
    }
  }

  assert(problems.length === 0, `${problems.length} document(s) differ:\n  ${problems.join("\n  ")}`);
  console.log(`✓ all ${ids.length} page documents match the code exactly.`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) return verify();
  await build();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
