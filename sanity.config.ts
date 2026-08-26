import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { structure } from "./src/sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes/index";
import { eliteTheme } from "./src/sanity/theme";
import { EliteMark } from "./src/sanity/components/EliteMark";

// This file is loaded from two very different places:
//   - the browser Studio, bundled by Astro/Vite → import.meta.env.PUBLIC_* exists
//   - the Sanity CLI (schema extract / typegen), plain Node → import.meta.env is
//     absent or empty, but the CLI loads .env into process.env
// Take the first source that actually carries the value, so one .env stays the
// single source of truth for both.
const viteEnv: Record<string, string | undefined> | undefined = import.meta.env;
const nodeEnv: Record<string, string | undefined> | undefined =
  typeof process !== "undefined" ? process.env : undefined;

/**
 * Read one required variable from whichever source carries it, or fail loudly.
 *
 * WHY: both values were typed `string | undefined` and handed straight to
 * `defineConfig`, which asks for `string`. That was the typechecker's only
 * complaint about this file. Throwing narrows them, and gives the two entry
 * points that read THIS file — the browser Studio bundle and the Sanity CLI —
 * a message naming the variable and where to put it.
 *
 * IT DOES NOT IMPROVE `npm run build`, AND THAT WAS CHECKED RATHER THAN
 * ASSUMED. Building with `.env` moved aside still fails with
 * "Configuration must contain `projectId`" from `@sanity/client`'s `initConfig`,
 * because the client the prerender constructs is configured by the `sanity()`
 * integration in `astro.config.mjs`, which reads the same variables through
 * Vite's `loadEnv` and gets there first. That path still reports a library
 * error naming no variable, no file and no fix. Fixing it means guarding
 * `astro.config.mjs` too — not done here.
 */
function required(name: "PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET"): string {
  const value = viteEnv?.[name] ?? nodeEnv?.[name];
  if (!value) {
    throw new Error(
      `${name} is not set, so the Sanity Studio cannot be configured.\n` +
        `Add it to .env at the repository root — the same file serves the browser ` +
        `Studio and the Sanity CLI, per the note above.\n` +
        `On a deploy, set it in the hosting provider's environment instead; ` +
        `.env is not committed.`
    );
  }
  return value;
}

const projectId = required("PUBLIC_SANITY_PROJECT_ID");
// Required rather than left to Sanity's default. A Studio silently pointed at
// the wrong dataset is worse than one that refuses to start, and `.env` and
// `astro.config.mjs` both already treat this as a value the project supplies.
const dataset = required("PUBLIC_SANITY_DATASET");

export default defineConfig({
  // Studio title — the name beside the emblem, in the browser tab, and in the
  // workspace menu.
  title: "Elite Legal Marketing",
  // The ELITE emblem in the navbar chip. This is the SUPPORTED way to brand the
  // nav — `studio.components.logo` is deprecated and a no-op in Studio 6.4.
  icon: EliteMark,
  // Elite brand palette (light scheme, teal accent, gold highlights).
  theme: eliteTheme,
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
  },
});
