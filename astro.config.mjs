// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import sanity from "@sanity/astro";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

/**
 * Read one required variable or fail with a message naming it.
 *
 * THIS IS THE HALF `sanity.config.ts` COULD NOT COVER. That file guards the two
 * entry points that read it directly — the browser Studio bundle and the Sanity
 * CLI — but the client the prerender uses is configured HERE, by the `sanity()`
 * integration below, and it gets there first. Without this, a missing .env fails
 * with `@sanity/client`'s "Configuration must contain `projectId`", which names
 * no variable, no file and no fix.
 *
 * The build already died without these; this only changes the message.
 *
 * @param {"PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET"} name
 * @returns {string}
 */
function required(name) {
  const value = env[name];
  if (!value) {
    throw new Error(
      `${name} is not set, so the Sanity client cannot be configured.\n` +
        `Add it to .env at the repository root — the same file serves the site, ` +
        `the embedded Studio and the Sanity CLI.\n` +
        `On a deploy, set it in the hosting provider's environment instead; ` +
        `.env is not committed.`
    );
  }
  return value;
}

const PUBLIC_SANITY_PROJECT_ID = required("PUBLIC_SANITY_PROJECT_ID");
const PUBLIC_SANITY_DATASET = required("PUBLIC_SANITY_DATASET");

// https://astro.build/config
export default defineConfig({
  /* THE SITE IS STILL STATIC. `output` is deliberately left at its default, so
     all 328 pages prerender exactly as before and the adapter only exists to
     host the ONE route that opts out: `src/pages/api/consult.ts`, which sets
     `export const prerender = false`.
     Verified rather than assumed — `scripts/compare-builds.py` reports every
     page byte-identical across adding this. If a future route needs a server,
     it opts out the same way; do NOT switch `output` to "server", which would
     turn all 328 back into runtime renders. */
  adapter: vercel(),

  // The canonical origin. Every canonical tag, og:url and sitemap entry is
  // built from this, so it must match the domain Vercel serves as primary.
  //
  // SETTLED: www, not the apex. This is the shape the legacy site serves and
  // therefore the shape Google already holds for ~300 indexed URLs, so keeping
  // it means the cutover changes no canonical that is already ranking. The apex
  // is the cleaner brand URL and was declined for exactly that reason: it would
  // have made every indexed URL a redirect on day one, on top of the 162
  // redirects the cutover already carries.
  //
  // Vercel must serve www as the PRIMARY domain, with the apex redirecting to
  // it. If that is ever reversed, this line has to move with it or every
  // canonical tag points at a redirect.
  site: "https://www.denvertrial.com",

  // ONE URL PER PAGE. Without this Astro builds `/about/index.html` and Vercel
  // happily serves it at BOTH `/about` and `/about/` with a 200 — the same page
  // at two URLs, with only a canonical tag hinting which one counts. "always"
  // makes the built links, the canonical tag and the server agree.
  //
  // The trailing slash rather than the bare path because every indexed legacy
  // URL carries one: WordPress 301s the bare form to it, so this is the shape
  // Google already has for ~300 pages. See ROUTES in lib/routePaths.ts.
  trailingSlash: "always",

  // Self-hosted Google Fonts via Astro's Fonts API — downloaded and served
  // from our own origin at build time, so there is no render-blocking request
  // to fonts.googleapis.com (which is what the comps do).
  //
  // The five families and their weights are the exact set in the comps' single
  // shared Google Fonts URL. Roles:
  //   Anton          every display heading (uppercase, 400 is its only weight)
  //   Hanken Grotesk body copy — the <body> default
  //   Geist          nav, phone number, eyebrows, stat numerals
  //   Newsreader     pull quotes
  //   Caveat         signatures
  // `cssVariable` is what src/styles/global.css builds --font-display etc. on.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Anton",
      cssVariable: "--font-anton",
      weights: [400],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken",
      weights: [400, 500, 600, 700, 800],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Geist",
      cssVariable: "--font-geist",
      weights: [400, 500, 600, 700, 800],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Newsreader",
      cssVariable: "--font-newsreader",
      weights: [400, 500, 600],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "Caveat",
      cssVariable: "--font-caveat",
      weights: [600, 700],
      styles: ["normal"],
    },
  ],

  integrations: [
    // THE ONE CLIENT. `IntegrationOptions` is `ClientConfig` plus the studio
    // keys, so everything the site's fetches need is configured here rather
    // than in a wrapper module — `import { sanityClient } from "sanity:client"`
    // gets exactly this, everywhere.
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      // Pinned, not floating. GROQ's behaviour is versioned by date, so an
      // unpinned client can change what a query returns on an unrelated day.
      apiVersion: "2026-08-01",
      // The build is static and runs once per publish, so there is no cache to
      // warm and a stale CDN read would ship stale content for a whole deploy.
      useCdn: false,
      // DRAFTS MUST NOT BUILD. Without this the client returns whatever the
      // editor last typed, so an unpublished draft would go live on the next
      // deploy — including one nobody meant to ship. `published` is what makes
      // the Studio's Publish button mean something.
      perspective: "published",
      studioBasePath: "/admin",
    }),
    react(),
  ],
});
