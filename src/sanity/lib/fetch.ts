// The one place a missing document becomes a loud failure.
//
// HARD CUTOVER, NOT A FALLBACK. A getter that quietly falls back to a literal
// when Sanity returns nothing is a second copy of the content that can ship by
// accident — the exact failure this site already had with a phone number, where
// the data layer held two and the wrong one was recorded as the firm's choice.
//
// So a singleton that is not there throws at BUILD time, naming the document
// and where to create it. The alternative is a build that succeeds with an
// empty header, an empty footer and no phone number anywhere, which is a
// silent failure of exactly the shape the four `check:` linters exist to catch
// — and none of them would catch this one, because the markup would be valid.
//
// IT ONLY STARTED DOING ANYTHING FOR THE EIGHT PAGE LISTS IN PHASE 2f. A GROQ
// collection query returns `[]` when a type has no documents, never null, so
// `required(fetch(CHARITY_PARTNERS_QUERY), …)` could not throw however empty the
// dataset got — the homepage would simply have rendered a strip with no logos.
// Reading an array off a page document returns null when the document or the
// field is absent, so the guard is real now. What keeps that failure in the
// Studio rather than in a deploy is `required().min(1)` on each of those arrays.
//
// Kept as a plain assertion rather than a generic fetch wrapper on purpose:
// `overloadClientMethods` types `sanityClient.fetch(QUERY)` from the query's
// own text, and wrapping the call in a generic throws that away.

/**
 * @param value  what the fetch returned
 * @param what   the document, named as an editor would see it in the Studio
 * @param where  the desk group it lives under — the message tells them where to go
 */
export function required<T>(
  value: T | null | undefined,
  what: string,
  where = "Site Settings"
): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(
      `Sanity has no "${what}" document, so the site cannot be built.\n` +
        `Create it in the Studio at /admin under ${where}, fill it in, and PUBLISH it — ` +
        `the build reads the published version only, so a draft is invisible to it.`
    );
  }
  return value as NonNullable<T>;
}

/**
 * Fetch a thing once per build, however many pages ask for it.
 *
 * WHY THIS EXISTS, MEASURED RATHER THAN ASSUMED. Without it the first
 * Sanity-backed build took 3m35s against the static build's 44s. Every one of
 * the 332 pages renders the header, the footer and usually the contact band, so
 * four singletons became roughly two thousand HTTP round trips — and that is
 * with only FOUR documents moved. The same arithmetic against the blog and the
 * practice areas is a build nobody waits for.
 *
 * Caching the PROMISE rather than the value is what makes concurrent callers
 * share one request: `Promise.all([getFirmDetails(), settings()])` on the same
 * tick would otherwise start two.
 *
 * FOREVER IN A BUILD, FOR A FEW SECONDS IN DEV — and the dev half is not a
 * refinement, it is what makes `astro dev` usable at all.
 *
 * This used to be production-only, on the reasoning that a build reads a dataset
 * that cannot change under it while an editor saving in the Studio expects the
 * next reload to show it. The trade was named as "slower dev requests". After
 * Phase 3 that stopped being true in kind: 290 of the 330 pages route through
 * one `[slug].astro`, whose `getStaticPaths` calls `getRelatedPosts()` 372
 * times, and each of those re-derives the whole feed. Measured with no cache,
 * ONE dev request needed **nine minutes** of network for the blog branch alone.
 * That is not slow, it is hung — the page never loads and nothing says why.
 *
 * A SHORT TTL KEEPS BOTH PROPERTIES. Everything inside a single
 * `getStaticPaths` run shares one fetch, because that run takes well under a
 * second once it is not re-fetching; and a reload a few seconds later reads the
 * dataset again, so an editor's save still shows up on the next reload the way
 * it always did. The window is deliberately shorter than the time it takes a
 * person to alt-tab, save, and come back.
 *
 * The build is unaffected: `PROD` skips the expiry entirely, so a build still
 * makes exactly one request per key however long it runs.
 */
const DEV_TTL_MS = 5_000;

const inFlight = new Map<string, { at: number; promise: Promise<unknown> }>();

export function once<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Optional-chained because this module is also imported OUTSIDE Vite: the
  // seed scripts pull data modules into plain Node, where `import.meta.env` is
  // undefined and a bare `.PROD` throws a TypeError that masks the real error
  // underneath it. Those scripts get the dev behaviour, which is what they want
  // — a migration that runs for a minute should not pin a stale read.
  const forever = import.meta.env?.PROD === true;

  const existing = inFlight.get(key);
  if (existing && (forever || Date.now() - existing.at < DEV_TTL_MS)) {
    return existing.promise as Promise<T>;
  }

  const promise = fetcher();
  inFlight.set(key, { at: Date.now(), promise });
  return promise;
}
