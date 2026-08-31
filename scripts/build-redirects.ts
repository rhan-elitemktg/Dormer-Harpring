/**
 * Writes `vercel.json` from `src/data/redirects.ts`. Runs before every build.
 *
 * WHY NOT ASTRO'S OWN `redirects:` OPTION. This project is a static build with
 * no adapter, and in that mode Astro emits an HTML page per redirect carrying a
 * meta refresh. Google treats those as soft redirects and passes signal more
 * slowly than a real 301 — and preserving the ~300 indexed legacy URLs is the
 * entire reason `blogPath()` is flat at the root. Vercel reads `vercel.json`
 * with or without an adapter, so the platform issues a true status code.
 *
 * GENERATED — DO NOT HAND-EDIT vercel.json. It is rewritten on every build, so
 * an edit there survives exactly until the next one. Edit the data module.
 *
 * `permanent: true` is a 308 on Vercel, not a 301: 308 preserves the request
 * method where 301 permits a browser to rewrite POST to GET. For a GET-only
 * marketing site the distinction is academic, and Google treats them alike.
 */
import { writeFile } from "node:fs/promises";
import { getRedirects } from "../src/data/redirects.ts";

const redirects = await getRedirects();

const config = {
  // A note for whoever opens this file first.
  $schema: "https://openapi.vercel.sh/vercel.json",

  /* ONE URL PER PAGE, ENFORCED BY THE SERVER. Without this Vercel serves the
     same page at `/about` and `/about/`, both 200, no redirect — two URLs for
     one page, with only a canonical tag hinting which counts. `true` makes the
     bare form 308 to the trailing-slash one, so only one ever answers.
     Must stay in step with `trailingSlash: "always"` in astro.config.mjs and
     with ROUTES in lib/routePaths.ts. */
  trailingSlash: true,

  /* THE SECOND TIER, AND IT IS OFF UNTIL THE PATH IS PROVEN ON A DEPLOY.
     Everything in `redirects` below is code-owned and comes from
     `src/data/redirects.ts`. `bulkRedirectsPath` is how a redirect added in the
     Studio reaches the edge without a developer — it points Vercel at a file
     the BUILD writes, which is the one mechanism that works given Vercel reads
     this very file before the build starts.

     IT IS COMMENTED OUT BECAUSE A WRONG PATH FAILS THE WHOLE DEPLOY, not the
     feature. The first attempt shipped `.vercel/output/static/bulk-redirects.json`
     — repo-root relative, which is what the reference project uses — and the
     build passed, then:

       Build Completed in /vercel/output [18s]
       Deploying outputs...
       No files found at path .vercel/output/static/bulk-redirects.json.

     The deploy step runs FROM `/vercel/output`, so a repo-root path resolves to
     `/vercel/output/.vercel/output/...` and misses. The file really sits at
     `/vercel/output/static/bulk-redirects.json`, so the next value to try is
     `"static/bulk-redirects.json"`, and `"bulk-redirects.json"` after that.

     Nothing else depends on this line: the `redirect` document type, its
     validators, `bulk-redirects.json.ts` and the live-page guard are all built
     and tested. Only DELIVERY is off, and there are zero redirect documents
     today, so nothing is currently un-delivered. Re-enable it on a PREVIEW
     deployment with one real redirect document to verify against — it cannot be
     tested locally, because redirects fire under neither `astro dev` nor
     `vercel dev`.

     bulkRedirectsPath: "static/bulk-redirects.json", */

  /* CACHE LIFETIMES, and only for the files that cannot say it themselves.
     Vercel's default for a static file is `public, max-age=0, must-revalidate`,
     so every navigation re-asks for it.

     `/_astro/*` is CONTENT-HASHED by the build — a changed byte is a changed
     filename — so it can be cached permanently and immutably. That is safe
     precisely because nothing at that path is ever edited in place.

     The three root icons are the opposite case and the reason this block
     exists: they are NOT hashed, they are requested on nearly every navigation,
     and they change roughly never. A day is the compromise — long enough to
     stop the revalidations, short enough that replacing the firm's mark does
     not need a cache-busting rename. Do NOT extend this pattern to the HTML:
     a page must revalidate, or a publish would not reach anyone.

     NOTE the leading slash and the `(.*)` form — Vercel matches `source`
     against the path, and a bare `_astro/(.*)` matches nothing. */
  headers: [
    {
      source: "/_astro/(.*)",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/(favicon.ico|icon-192.png|apple-touch-icon.png)",
      headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
    },
  ],

  /* BOTH SLASH FORMS FOR EVERY RULE. `trailingSlash: true` above already
     normalizes a bare request to the slashed shape, so `/category/x` would
     reach `/category/x/` and then match — but as TWO redirects, one to add the
     slash and one to reach the destination. These carry every indexed category
     URL on the legacy site, which is the traffic least worth spending an extra
     hop on, and the cost of avoiding it is a longer generated file nobody
     hand-edits. Listing the bare form FIRST so it matches before the
     normalizer gets to it. */
  redirects: redirects.flatMap((r) => {
    const bare = r.from.replace(/\/+$/, "");
    const entry = (source: string) => ({
      source,
      destination: r.to,
      permanent: r.permanent,
    });
    // `/` has no bare form, and emitting one would claim every path on the site.
    return bare ? [entry(bare), entry(r.from)] : [entry(r.from)];
  }),
};

await writeFile("vercel.json", JSON.stringify(config, null, 2) + "\n");
console.log(`vercel.json: ${redirects.length} redirects`);
