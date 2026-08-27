// Lets a plain Node script import a module from `src/data/`.
//
// THREE THINGS IN THOSE MODULES ONLY EXIST INSIDE AN ASTRO BUILD:
//
//   image imports    `import photo from "../assets/team/x.jpg"` — Astro turns
//                    this into an ImageMetadata object. Node says
//                    ERR_UNKNOWN_FILE_EXTENSION and the whole module fails to
//                    load, so a seed script cannot read one string out of it.
//   `sanity:client`  a VITE VIRTUAL module served by @sanity/astro. Node says
//                    ERR_UNSUPPORTED_ESM_URL_SCHEME, thrown from a SYNCHRONOUS
//                    load hook — outside the promise chain, where a try/catch
//                    around `await import()` cannot see it — after which tsx
//                    has been observed exiting 0. A seed that silently does
//                    nothing and leaves a stale payload on disk.
//   `astro:content`  the content-collection loader, virtual for the same
//                    reason. By default its `getCollection` THROWS rather than
//                    returning `[]` — a migration reads `src/content/**/*.json`
//                    off disk directly, so a script reaching for it has usually
//                    taken a wrong turn and an empty array would look like an
//                    empty archive. Pass `collections` to serve it instead: the
//                    loader is a glob over JSON, which plain Node can do, and
//                    3c needs it to re-derive a body THROUGH the getter and
//                    compare that against what it is about to write.
//
// All three are answered through `node:module`'s `registerHooks`, which runs
// in-thread and synchronously. Call `registerDataModuleHooks()` BEFORE the
// dynamic import of anything under `src/data/`, and use `await import()` —
// static imports are hoisted above the call.
//
// THE CLIENT HAS TWO MODES, AND PHASE 3 IS WHY THE SECOND ONE EXISTS.
//
//   "throw" (default)  Every fetch explains that this getter has already been
//                      swapped. Right while Sanity is EMPTY and the code is the
//                      source of truth: a seed that called an already-swapped
//                      getter would otherwise write a document full of nothing
//                      and import it perfectly happily.
//
//   "live"             A real client, configured exactly as `astro.config.mjs`
//                      configures the site's. Right once Sanity holds content a
//                      migration legitimately needs to READ — Phase 3b's two
//                      hand-authored posts resolve their reviewer off the team
//                      roster, the firm's phone off Firm Details and their
//                      category off the taxonomy, all three of which moved in
//                      earlier phases. Under "throw" that module simply cannot
//                      be loaded, which would have made the two literals
//                      unreachable to any script — a one-way door with nothing
//                      on the other side of it.
//
// The "already swapped" guard did not disappear with the second mode; it moved
// somewhere better. Each migration script asserts against the SOURCE IT READS
// (see `assertSourcesPresent` in the 3b script) rather than against the module
// it happens to load, which is the thing that actually matters and is the thing
// a per-module check got wrong as soon as one getter in a module moved.
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";

const ASSET = /\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$/i;
const STUB = "?data-module-asset-stub";
const CLIENT = "sanity:client";
/*
 * A `file:` URL, NOT a `\0`-prefixed virtual one, and the live client is why.
 * Node resolves a bare specifier relative to the importing module's URL, so the
 * moment this stub gained `import { createClient } from "@sanity/client"` a
 * synthetic URL failed with `ERR_INVALID_URL: input './package.json', base
 * '\0stub:sanity-client'` — the resolver could not walk up to node_modules from
 * something that is not a path. These two point at files that do not exist,
 * inside a directory that does; `load` short-circuits before anything reads
 * them, and bare imports resolve from here as they would from any script.
 */
const CLIENT_STUB = new URL("./sanity-client.virtual.mjs", import.meta.url).href;
const CONTENT = "astro:content";
const CONTENT_STUB = new URL("./astro-content.virtual.mjs", import.meta.url).href;

/**
 * `getCollection`, over whatever directories the caller declared.
 *
 * ONE THING IT CANNOT DO, and callers have to know: Astro's loader resolves
 * `image()` fields into `ImageMetadata`, and this returns the raw relative
 * string the JSON holds. Everything else — `id`, `data`, the file order — is
 * what Astro produces. A migration comparing bodies must therefore compare
 * shapes and ignore the image `src`, which is what 3c's `sameBody` does.
 *
 * A collection the caller did NOT declare still throws, with its name, rather
 * than returning `[]`. An empty array reads as an empty archive.
 */
function contentSource(collections: Record<string, string>): string {
  return `
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DIRS = ${JSON.stringify(collections)};

export function getCollection(name) {
  const dir = DIRS[name];
  if (!dir) {
    throw new Error(
      \`astro:content is not available outside an Astro build (getCollection("\${name}")).\n\` +
      "A migration script reads src/content/**/*.json off disk instead — plain JSON, no loader, " +
      "which is why Phase 3 needs no build at all. If this script genuinely needs the collection, " +
      "declare it: registerDataModuleHooks({ collections: { '" + name + "': 'src/content/…' } })."
    );
  }
  const base = resolve(process.cwd(), dir);
  return readdirSync(base)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      id: file.replace(/\\.json$/, ""),
      collection: name,
      data: JSON.parse(readFileSync(join(base, file), "utf8")),
    }));
}

export function getEntry(name, id) {
  return getCollection(name).find((entry) => entry.id === id);
}
`;
}

/** Read one variable from the environment or `.env`, or fail naming it. */
function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(readFileSync(".env", "utf8"));
  if (!match) throw new Error(`${name} is not set, and .env does not carry it.`);
  return match[1].trim();
}

/** `fetch` explains itself instead of returning `[]`. */
const THROWING_CLIENT = `
export const sanityClient = {
  fetch() {
    throw new Error(
      "This getter already reads from Sanity, so there is nothing left in the code to seed.\\n" +
      "Its content lives in the Studio now — seeding is one-way, and a getter is seeded " +
      "BEFORE it is swapped, not after.\\n" +
      "If you are seeding a DIFFERENT getter from the same module, stop calling this one, " +
      "or register these hooks with { sanityClient: \\"live\\" }."
    );
  },
};
`;

/**
 * The site's own client, rebuilt outside Vite.
 *
 * EVERY OPTION HERE MIRRORS `astro.config.mjs`, and each one changes what comes
 * back: an unpinned `apiVersion` can change a query's meaning on an unrelated
 * day, `useCdn: false` avoids reading a cache the build never reads, and
 * `perspective: "published"` is what stops a migration copying an editor's
 * unpublished draft into a document it then publishes. A migration that read a
 * different dataset view than the build would produce a byte-diff nobody could
 * explain.
 */
function liveClient(): string {
  return `
import { createClient } from "@sanity/client";
export const sanityClient = createClient({
  projectId: ${JSON.stringify(env("PUBLIC_SANITY_PROJECT_ID"))},
  dataset: ${JSON.stringify(env("PUBLIC_SANITY_DATASET"))},
  apiVersion: "2026-08-01",
  useCdn: false,
  perspective: "published",
});
`;
}

let registered = false;

export function registerDataModuleHooks(
  options: {
    sanityClient?: "throw" | "live";
    /** Collection name → the directory its JSON lives in, relative to the repo
     *  root. Anything not listed here still throws by name. */
    collections?: Record<string, string>;
  } = {}
): void {
  // `registerHooks` stacks rather than replaces, so a second call would leave
  // two resolvers racing for the same specifier. One per process.
  if (registered) throw new Error("registerDataModuleHooks() was already called.");
  registered = true;

  const clientSource = options.sanityClient === "live" ? liveClient() : THROWING_CLIENT;
  const contentStub = contentSource(options.collections ?? {});

  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === CLIENT) {
        return { url: CLIENT_STUB, shortCircuit: true, format: "module" };
      }
      if (specifier === CONTENT) {
        return { url: CONTENT_STUB, shortCircuit: true, format: "module" };
      }
      if (!ASSET.test(specifier)) return nextResolve(specifier, context);
      const url = new URL(specifier, context.parentURL ?? import.meta.url).href;
      return { url: `${url}${STUB}`, shortCircuit: true, format: "module" };
    },

    load(url, context, nextLoad) {
      if (url === CLIENT_STUB) {
        return { format: "module", shortCircuit: true, source: clientSource };
      }
      if (url === CONTENT_STUB) {
        return { format: "module", shortCircuit: true, source: contentStub };
      }
      if (!url.endsWith(STUB)) return nextLoad(url, context);
      const file = url.slice(0, -STUB.length);
      // The fields ImageMetadata has, so a script that reaches one by accident
      // gets a readable `src` rather than undefined and a crash three frames
      // on. A migration that needs to UPLOAD one of these reads the path off
      // `src` and hands the file to Sanity — see the 3b script's `assetRef`.
      const stub = {
        src: new URL(file).pathname,
        width: 0,
        height: 0,
        format: file.split(".").pop() ?? "jpg",
      };
      return {
        format: "module",
        shortCircuit: true,
        source: `export default ${JSON.stringify(stub)};`,
      };
    },
  });
}
