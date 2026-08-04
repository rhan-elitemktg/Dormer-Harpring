import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
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

const projectId =
  viteEnv?.PUBLIC_SANITY_PROJECT_ID ?? nodeEnv?.PUBLIC_SANITY_PROJECT_ID;
const dataset = viteEnv?.PUBLIC_SANITY_DATASET ?? nodeEnv?.PUBLIC_SANITY_DATASET;

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
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
