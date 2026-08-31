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

  /* THE SECOND TIER. Everything in `redirects` below is code-owned and comes
     from `src/data/redirects.ts` — the cutover table, fixed at migration. This
     line points Vercel at a file the BUILD writes, which is how a redirect
     added in the Studio reaches the edge without a developer.

     It has to be a separate mechanism because Vercel reads this very file
     before the build starts, so nothing generated during a build can land in
     it. Bulk redirects are the documented exception.

     THE PATH IS THE ONE ASSUMPTION THAT CANNOT BE TESTED LOCALLY. Vercel's
     reference confirms the file may be build-generated but not what the path
     resolves against, and redirects do not fire under `astro dev` or
     `vercel dev` at all — only on a deployed URL. This points at the actual
     deploy artifact: `@astrojs/vercel` copies static output to
     `.vercel/output/static/`. If the file is served but the redirects do not
     fire, try `"bulk-redirects.json"` (output-directory relative) and then
     `"dist/client/bulk-redirects.json"` BEFORE changing anything else — the
     generator, the schema and the guard are all independent of this string. */
  bulkRedirectsPath: ".vercel/output/static/bulk-redirects.json",

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
