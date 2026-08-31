import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { withModifiedStamp } from "./src/sanity/actions/stampModified";
import { SINGLETON_TYPES, structure } from "./src/sanity/structure";
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

    /*
     * ONE PARAMETERISED TEMPLATE, so "＋" inside a city's list makes a page IN
     * that city.
     *
     * Team needs no equivalent: `orderableDocumentListDeskItem` sets its group's
     * field on anything created inside it, which is half of why that plugin is
     * worth its pin. The practice areas use a plain filtered list — nothing
     * reads a drag order for them — so the template is what closes the same
     * hole. Without it a page created inside Denver would have no `city`, match
     * none of the nine filters, and be invisible in the desk: content that
     * exists and cannot be reached.
     */
    templates: (prev) => [
      ...prev,
      {
        id: "practiceArea-by-city",
        title: "Practice Area (in this city)",
        schemaType: "practiceArea",
        parameters: [{ name: "value", type: "string" }],
        value: ({ value }: { value: string }) => ({ city: value }),
      },
      /*
       * THE SAME FOR FEATURED PAGES, and it is not optional: each city opens
       * into TWO filtered lists now, so the hole this closes exists twice per
       * city rather than once.
       *
       * A MISSING TEMPLATE IS NOT A MISSING FEATURE, IT IS A BROKEN DESK. The
       * structure names a template per list; naming one that was never
       * registered makes the whole Practice Areas pane fail to read with
       * "template id (`templateId`) is required for initial value template item
       * nodes" — not the list quietly lacking a create button.
       */
      {
        id: "featuredPracticeArea-by-city",
        title: "Featured practice area (in this city)",
        schemaType: "featuredPracticeArea",
        parameters: [{ name: "value", type: "string" }],
        value: ({ value }: { value: string }) => ({ city: value }),
      },
    ],
  },

  document: {
    /*
     * "LAST UPDATED" STAMPS ITSELF ON PUBLISH — see the note in
     * `src/sanity/actions/stampModified.ts` for why this is a Studio action and
     * not `_updatedAt`, and why it only fires when the article's own fields
     * changed rather than on every publish.
     *
     * Wrapped, not replaced: every disabled state and the keyboard shortcut
     * still come from Sanity's own publish action. Types with no `modifiedAt`
     * are unaffected — the wrapper checks the type and does nothing for them.
     */
    actions: (prev) =>
      prev.map((action) => (action.action === "publish" ? withModifiedStamp(action) : action)),

    /*
     * WHAT THE GLOBAL "CREATE NEW" MENU MUST NOT OFFER.
     *
     * `teamMember`, `practiceArea` and `featuredPracticeArea`, because all three
     * open into sub-lists filtered on a field the global button does not set —
     * `kind` for the first, `city` for the other two. Same failure either way: a
     * document matching none of its groups is invisible in the desk.
     *
     * `featuredPracticeArea` also cannot be created usefully by an editor at
     * all: its URL is declared in `FEATURED` in data/carAccidents.ts, so a page
     * nobody has routed fails the build by name. Keeping it out of this menu
     * means the only way to make one is inside a city, which is also the only
     * place the reminder to route it belongs.
     *
     * On `teamMember` specifically: `kind` is hidden in the form by request,
     * so the ONLY thing that sets it is creating a person inside one of those
     * lists. Removing the type from this menu leaves exactly one creation path,
     * and it is the one that sets the field.
     *
     * EVERY SINGLETON, because a singleton is a singleton only by convention
     * here — `documentId()` in the desk pins one to a fixed id, and nothing
     * stopped the ＋ menu making a SECOND one at a generated id. That second
     * copy opens, saves and publishes; the site never reads it, because every
     * query filters on the fixed `_id`. Editing content that silently goes
     * nowhere is worse than not finding the field.
     *
     * `SINGLETON_TYPES` is the desk's own list — Pages plus Site Settings — so
     * a singleton added there is covered here without a second edit. It was
     * exported and imported by nothing until Phase 2f added three page
     * documents and made the hole three wider.
     */
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) =>
          item.templateId !== "teamMember" &&
          item.templateId !== "practiceArea" &&
          item.templateId !== "featuredPracticeArea" &&
          !SINGLETON_TYPES.includes(item.templateId)
      ),
  },
});
