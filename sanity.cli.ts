// Sanity CLI configuration — the entry point for `sanity schema extract`,
// `sanity typegen generate`, `sanity dataset import` and friends.
//
// This file is read by the CLI running in plain Node, NOT by the browser
// Studio bundle. `sanity.config.ts` is the one that serves both; see the note
// at the top of it. The CLI loads `.env` into `process.env` itself, so the same
// two variables configure both entry points.
import { defineCliConfig } from "sanity/cli";

/**
 * Read one required variable or fail with a message naming it.
 *
 * Same contract as `required()` in `sanity.config.ts`, deliberately duplicated
 * rather than shared: importing across these two files would pull the Studio's
 * config (and therefore `sanity/structure`, the theme and React) into every CLI
 * invocation, including `sanity dataset import`. Six lines is the cheaper half
 * of that trade.
 */
function required(name: "PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set, so the Sanity CLI cannot tell which project to talk to.\n` +
        `Add it to .env at the repository root — the same file serves the browser ` +
        `Studio and this CLI.`
    );
  }
  return value;
}

export default defineCliConfig({
  api: {
    projectId: required("PUBLIC_SANITY_PROJECT_ID"),
    dataset: required("PUBLIC_SANITY_DATASET"),
  },

  /**
   * TYPEGEN IS MANUAL HERE, AND `enabled` IS OMITTED ON PURPOSE.
   *
   * `typegen.enabled` regenerates types during `sanity dev` and `sanity build`.
   * This Studio is EMBEDDED in Astro — it is served by `astro dev` at /admin via
   * `studioBasePath` in astro.config.mjs — so neither of those commands is ever
   * run on this project and the hook would never fire. Setting it true would be
   * a claim that does not hold.
   *
   * `npm run typegen` is the real path: extract the schema, then generate types
   * from it and from every `defineQuery` in the tree. Run it after any schema or
   * query change; `check:types` is the gate that catches you if you forget.
   *
   * `sanity-typegen.json` is deprecated — configuration belongs here.
   */
  typegen: {
    // `.astro` matters: queries live in page frontmatter as well as in
    // src/sanity/lib/queries.ts, and the default glob does not include them.
    //
    // THE THREE EXCLUSIONS ARE NOT TIDINESS. Typegen parses every matched file
    // as ordinary TypeScript looking for `defineQuery`, and:
    //   *.d.ts        a declaration has no initializer, so `export const theme:
    //                 StudioTheme & {…};` is a parse error. eliteTheme.d.ts hit
    //                 this on the first run.
    //   eliteTheme.js a vendored minified file whose single 56KB line is one
    //                 line. Nothing to find; the same file already forces
    //                 `check:types` down to --minimumSeverity error.
    //   sanity.types.ts  typegen's own output. Parsing what it just wrote.
    path: [
      "./src/**/*.{ts,tsx,js,jsx,astro}",
      "!./src/**/*.d.ts",
      "!./src/sanity/eliteTheme.js",
      "!./src/sanity/sanity.types.ts",
    ],
    schema: "./src/sanity/schema.json",
    generates: "./src/sanity/sanity.types.ts",
    // Types `sanityClient.fetch(QUERY)` from the query's own text, so a call
    // site gets the projection's type without a manual annotation.
    overloadClientMethods: true,
  },
});
