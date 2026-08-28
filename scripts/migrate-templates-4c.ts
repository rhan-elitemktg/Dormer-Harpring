// Phase 4c — the two article templates, and the sidebar form they share.
//
//   npx tsx scripts/migrate-templates-4c.ts
//   npx sanity dataset import scratch/templates-4c.ndjson --dataset production --replace
//   npx tsx scripts/migrate-templates-4c.ts --verify   # BEFORE swapping the getters
//
//   data/blog.ts                getBlogPostPage         → blogPostTemplate
//   data/practiceAreaPages.ts   getPracticeAreaPageCopy → practiceAreaTemplate
//   both of the above, `form`   → sharedSections.sidebarForm
//
// THE SIDEBAR FORM IS SEEDED ONCE AND ASSERTED EQUAL IN BOTH SOURCES. The two
// getters carry byte-identical copy for it today, which is exactly why it
// becomes one field: two copies are two places to update and one to forget.
// If they ever disagree, this refuses to write rather than silently picking one.
//
// `sharedSections` MUST BE READ BACK AND MERGED — it carries four objects from
// Phase 1 and 4a, and `--replace` replaces a document whole. The two templates
// are new documents, so they are written fresh.
//
// WHAT DOES NOT MOVE, and it is one string: the fact-check SENTENCE. It names
// the reviewing attorney and links to their bio, both read from the roster —
// storing it would freeze a name the comp spells "KC Harpring" and the live
// site "KC Harping". `factCheckLabel`, the tag above it, does move. See the
// note on the `blogPostTemplate` schema type for what making the sentence
// editable would need.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { registerDataModuleHooks } from "./lib/stub-vite-modules";

const OUT = resolve(process.cwd(), "scratch/templates-4c.ndjson");
const API_VERSION = "2026-08-01";

type Json = Record<string, unknown>;

const SOURCES: [file: string, getter: string, sentinel: string][] = [
  ["blog.ts", "getBlogPostPage", "In this article"],
  ["practiceAreaPages.ts", "getPracticeAreaPageCopy", "Tough lawyers for tough cases"],
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

/** Comments stripped — a sentinel that survives in one is a guard that cannot fire. */
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
  const blog = await import("../src/data/blog.ts");
  const areas = await import("../src/data/practiceAreaPages.ts");
  const [post, area] = await Promise.all([blog.getBlogPostPage(), areas.getPracticeAreaPageCopy()]);
  return { post, area };
}

function documents({ post, area }: Awaited<ReturnType<typeof load>>): Json[] {
  /* THE TWO FORMS MUST AGREE, because they become one field. Byte-identical
     today; if that stops being true this is the wrong modelling and the script
     says so rather than picking a winner. */
  assert(
    canon(post.form) === canon(area.form),
    `The blog post sidebar's form copy and the practice-area sidebar's have diverged, so they ` +
      `cannot become one shared field:\n  post: ${canon(post.form)}\n  area: ${canon(area.form)}\n` +
      `Either reconcile them, or give each template its own \`form\` field.`
  );

  return [
    {
      _id: "blogPostTemplate",
      _type: "blogPostTemplate",
      contentsLabel: post.contentsLabel,
      categoriesLabel: post.categoriesLabel,
      relatedSidebarLabel: post.relatedSidebarLabel,
      relatedTitle: post.relatedTitle,
      factCheckLabel: post.factCheckLabel,
      readMoreLabel: post.readMoreLabel,
    },
    {
      _id: "practiceAreaTemplate",
      _type: "practiceAreaTemplate",
      eyebrow: area.eyebrow,
      meta: {
        writtenByLabel: area.meta.writtenByLabel,
        updatedLabel: area.meta.updatedLabel,
        postedLabel: area.meta.postedLabel,
      },
      contentsLabel: area.contentsLabel,
      relatedSidebarLabel: area.relatedSidebarLabel,
      faqsTitle: area.faqsTitle,
      factCheckLabel: area.factCheckLabel,
    },
  ];
}

const sidebarForm = ({ post }: Awaited<ReturnType<typeof load>>): Json => ({
  title: post.form.title,
  lede: post.form.lede,
  submitLabel: post.form.submitLabel,
  disclaimer: post.form.disclaimer,
});

async function build(): Promise<void> {
  assertSourcePresent();
  const loaded = await load();
  const docs = documents(loaded);

  /* READ BACK AND MERGE — sharedSections carries four objects already. */
  const shared = writable(
    await query<Json | null>(`*[_type == "sharedSections" && _id == "sharedSections"][0]`)
  );
  assert(
    typeof shared.attorneysBand === "object" && shared.attorneysBand !== null,
    `The live sharedSections document has no attorneysBand. Refusing to write: this payload ` +
      `REPLACES the document, and merging onto an empty read would delete Phases 1 and 4a.`
  );

  const all = [
    ...docs,
    { ...shared, _id: "sharedSections", _type: "sharedSections", sidebarForm: sidebarForm(loaded) },
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, all.map((doc) => JSON.stringify(doc)).join("\n") + "\n");

  console.log(
    `${all.length} documents → ${OUT}\n` +
      `  blogPostTemplate:     6 labels\n` +
      `  practiceAreaTemplate: 6 labels\n` +
      `  sharedSections:       sidebarForm MERGED onto ${Object.keys(shared).length} existing ` +
      `fields (both templates' copy for it is identical, asserted)\n\n` +
      `npx sanity dataset import ${OUT.replace(process.cwd() + "/", "")} ` +
      `--dataset ${env("PUBLIC_SANITY_DATASET")} --replace`
  );
}

async function verify(): Promise<void> {
  assertSourcePresent();
  const loaded = await load();
  const expected = new Map(documents(loaded).map((doc) => [String(doc._id), doc]));

  const live = await query<{
    docs: Json[];
    sidebarForm: Json | null;
    hasAttorneysBand: boolean;
    hasWhyUs: boolean;
  }>(`{
    "docs": *[_id in ["blogPostTemplate", "practiceAreaTemplate"]],
    "sidebarForm": *[_type == "sharedSections"][0].sidebarForm{ title, lede, submitLabel, disclaimer },
    "hasAttorneysBand": defined(*[_type == "sharedSections"][0].attorneysBand),
    "hasWhyUs": defined(*[_type == "sharedSections"][0].whyUs)
  }`);

  const problems: string[] = [];
  for (const [id, want] of expected) {
    const stored = live.docs.find((doc) => doc._id === id);
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

  if (canon(live.sidebarForm) !== canon(sidebarForm(loaded))) {
    problems.push(
      `sharedSections.sidebarForm:\n    live     ${canon(live.sidebarForm)}\n` +
        `    expected ${canon(sidebarForm(loaded))}`
    );
  }
  if (!live.hasAttorneysBand) problems.push("sharedSections.attorneysBand is gone — the merge replaced Phase 1.");
  if (!live.hasWhyUs) problems.push("sharedSections.whyUs is gone — the merge replaced Phase 4a.");

  assert(problems.length === 0, `${problems.length} mismatch(es):\n  ${problems.join("\n  ")}`);
  console.log(
    `✓ both templates and the shared sidebar form match the code exactly.\n` +
      `  sharedSections still holds its Phase 1 and 4a objects, so the merge did not replace them.`
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
