// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import sanity from "@sanity/astro";
import react from "@astrojs/react";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  ""
);

// https://astro.build/config
export default defineConfig({
  // The canonical origin. Every canonical tag, og:url and sitemap entry is
  // built from this, so it must match the domain Vercel serves as primary.
  // TODO(launch): confirm www vs apex before the first production deploy.
  site: "https://www.denvertrial.com",

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
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: "/admin",
    }),
    react(),
  ],
});
