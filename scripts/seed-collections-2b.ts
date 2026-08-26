// Seed for Phase 2b — FAQs and case results. 109 documents, no images.
//
// THE THREE CASE-RESULT LISTS ARE SEEDED AS THREE LISTS. Six of the co-counsel
// seven duplicate the archive in the same words and three of the homepage's
// duplicate it in different ones. Merging them means choosing which wording the
// firm publishes about a real case, which is the firm's call — so the migration
// is faithful and the duplicates end up side by side in one Studio list, where
// they can be seen and decided on. See the note on the caseResult schema type.
//
// Seed FIRST, verify, then swap the getters. See scripts/seed-settings.ts.
//
//   npx tsx scripts/seed-collections-2b.ts
//   npx tsx scripts/sanity-purge.ts faq caseResult --yes
//   npx sanity dataset import scratch/collections-2b.ndjson --dataset production --replace
import "./lib/stub-vite-modules";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "scratch/collections-2b.ndjson");

// NO MODULE-LEVEL "already swapped" GUARD. There used to be one, and it became
// wrong the moment a module was swapped one getter at a time: `home.ts` has
// six and only `getRecentResults()` moved in Phase 2b, so refusing the whole
// module would block the other five from ever being seeded. The guard is
// per-GETTER now and lives in the stub — calling one that already reads from
// Sanity throws, naming the problem, instead of writing a document full of
// nothing. See scripts/lib/stub-vite-modules.ts.

async function main() {
  const faqsModule = await import("../src/data/faqs.ts");
  const resultsModule = await import("../src/data/caseResults.ts");
  const homeModule = await import("../src/data/home.ts");
  const coCounselModule = await import("../src/data/coCounsel.ts");

  const homeFaqs = await faqsModule.getHomeFaqs();
  const carFaqs = await faqsModule.getCarAccidentFaqs();
  const archive = await resultsModule.getCaseResults();
  const homeResults = await homeModule.getRecentResults();
  const coCounselResults = await coCounselModule.getCoCounselResults();

  type Faq = (typeof homeFaqs)[number];
  type Result = (typeof archive)[number];

  const faqDocs = (list: Faq[], shownOn: string) =>
    list.map((f, i) => ({
      _type: "faq",
      question: f.question,
      answer: f.answer,
      shownOn,
      video: { _type: "videoRef", provider: f.video.provider, id: f.video.id },
      videoLength: f.videoLength,
      order: (i + 1) * 10,
    }));

  const resultDocs = (list: Result[], shownOn: string) =>
    list.map((r, i) => ({
      _type: "caseResult",
      tag: r.tag,
      recovered: r.recovered,
      offered: r.offered,
      badge: r.badge,
      wonInCourt: r.wonInCourt,
      story: r.story,
      shownOn,
      order: (i + 1) * 10,
    }));

  const documents = [
    ...faqDocs(homeFaqs, "home"),
    ...faqDocs(carFaqs, "car-accidents"),
    ...resultDocs(archive, "results"),
    ...resultDocs(coCounselResults, "co-counsel"),
    ...resultDocs(homeResults, "home"),
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, documents.map((d) => JSON.stringify(d)).join("\n") + "\n");

  console.log(`Wrote ${documents.length} documents to ${OUT}`);
  console.log(
    `  faq: ${homeFaqs.length} home + ${carFaqs.length} car-accidents\n` +
      `  caseResult: ${archive.length} results + ${coCounselResults.length} co-counsel + ` +
      `${homeResults.length} home`
  );
}

await main();
