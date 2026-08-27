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
// `required(fetch(NGO_PARTNERS_QUERY), …)` could not throw however empty the
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
 * PRODUCTION ONLY, and that is the point of the branch. A build reads a dataset
 * that cannot change under it — one process, one `published` perspective — so
 * caching is free and correct. `astro dev` is the opposite case: an editor
 * saving in the Studio expects the next reload to show it, and a module-level
 * cache would hold the old value until the dev server restarted. Slower dev
 * requests are the right trade for that.
 */
const inFlight = new Map<string, Promise<unknown>>();

export function once<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Optional-chained because this module is also imported OUTSIDE Vite: the
  // seed scripts pull data modules into plain Node, where `import.meta.env` is
  // undefined and a bare `.PROD` throws a TypeError that masks the real error
  // underneath it.
  if (!import.meta.env?.PROD) return fetcher();

  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher();
  inFlight.set(key, promise);
  return promise;
}
