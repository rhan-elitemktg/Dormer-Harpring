// Lets a plain Node script import a module from `src/data/`.
//
// THE PROBLEM: those modules import images — `import teamPhoto from
// "../assets/team/attorneys-skyline.jpg"` — which Astro resolves into an
// `ImageMetadata` object at build time. Outside Astro that is
// `ERR_UNKNOWN_FILE_EXTENSION` and the whole module fails to load, so a seed or
// migration script cannot read a single string out of it.
//
// THE FIX: a module hook that answers any image import with a stub. Registered
// with `node:module`'s `registerHooks`, which runs in-thread and synchronously,
// so it takes effect for every import that happens after this module is
// evaluated — import this BEFORE the dynamic import of anything under
// `src/data/`, and use `await import()` rather than a static import, since
// static imports are all hoisted above it.
//
// The stub carries the fields `ImageMetadata` has, so a script that reaches one
// by accident gets an object with a readable `src` rather than `undefined` and
// a crash three frames later. Nothing that seeds Sanity should be reading one:
// large decorative images stay in the codebase and are not editor content, and
// card images are uploaded by their own migration, from the file on disk.
import { registerHooks } from "node:module";

const ASSET = /\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$/i;
const STUB = "?data-module-asset-stub";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!ASSET.test(specifier)) return nextResolve(specifier, context);
    const url = new URL(specifier, context.parentURL ?? import.meta.url).href;
    return { url: `${url}${STUB}`, shortCircuit: true, format: "module" };
  },

  load(url, context, nextLoad) {
    if (!url.endsWith(STUB)) return nextLoad(url, context);
    const file = url.slice(0, -STUB.length);
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
