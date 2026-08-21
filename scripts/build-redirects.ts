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
