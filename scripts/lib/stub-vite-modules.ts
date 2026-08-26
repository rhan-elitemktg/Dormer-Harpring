// Lets a plain Node script import a module from `src/data/`.
//
// TWO THINGS IN THOSE MODULES ONLY EXIST INSIDE AN ASTRO BUILD:
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
//
// Both are answered with stubs, registered through `node:module`'s
// `registerHooks`, which runs in-thread and synchronously. Import this BEFORE
// the dynamic import of anything under `src/data/`, and use `await import()` —
// static imports are hoisted above it.
//
// WHY THE CLIENT STUB MATTERS MORE THAN IT LOOKS. A module is swapped one
// getter at a time: `home.ts` has six, and only `getRecentResults()` moved in
// Phase 2b. Without this, the first swap would make the whole module
// unimportable and the other five getters could never be seeded — a one-way
// door across a module boundary that has nothing to do with the content.
//
// The client's `fetch` THROWS rather than returning empty. A seed that called
// an already-swapped getter would otherwise write a document full of nothing
// and import it perfectly happily; this names the problem at the call site.
import { registerHooks } from "node:module";

const ASSET = /\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$/i;
const STUB = "?data-module-asset-stub";
const CLIENT = "sanity:client";
const CLIENT_STUB = "\0stub:sanity-client";

/** The stub module's source. `fetch` explains itself instead of returning []. */
const CLIENT_SOURCE = `
export const sanityClient = {
  fetch() {
    throw new Error(
      "This getter already reads from Sanity, so there is nothing left in the code to seed.\\n" +
      "Its content lives in the Studio now — seeding is one-way, and a getter is seeded " +
      "BEFORE it is swapped, not after.\\n" +
      "If you are seeding a DIFFERENT getter from the same module, stop calling this one."
    );
  },
};
`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === CLIENT) {
      return { url: CLIENT_STUB, shortCircuit: true, format: "module" };
    }
    if (!ASSET.test(specifier)) return nextResolve(specifier, context);
    const url = new URL(specifier, context.parentURL ?? import.meta.url).href;
    return { url: `${url}${STUB}`, shortCircuit: true, format: "module" };
  },

  load(url, context, nextLoad) {
    if (url === CLIENT_STUB) {
      return { format: "module", shortCircuit: true, source: CLIENT_SOURCE };
    }
    if (!url.endsWith(STUB)) return nextLoad(url, context);
    const file = url.slice(0, -STUB.length);
    // The fields ImageMetadata has, so a script that reaches one by accident
    // gets a readable `src` rather than undefined and a crash three frames on.
    // Nothing seeding Sanity should be reading one: decorative images stay in
    // the codebase, and card images are uploaded from the file on disk.
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
