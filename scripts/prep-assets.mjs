// One-off: pull the images the comps actually reference out of the 777 MB
// design folder, downsample them, and drop them into src/assets/ under
// meaningful names.
//
// Why not just copy: the source photos are up to 5.9 MB apiece (they came out
// of an image generator at full resolution). Dropping those into src/assets/
// makes every `astro build` Sharp-decode a 6000px image, and the repo carries
// the weight forever. Nothing on the site displays wider than ~1340px, so 2400
// on the long edge is already 2x for a full-bleed hero.
//
// Alpha decides the output format: logos and badges keep transparency as WebP,
// photographs become JPEG.
//
// Run: node scripts/prep-assets.mjs

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files";
const OUT = path.resolve(import.meta.dirname, "../src/assets");
const MAX_EDGE = 2400;

/** source path (relative to SRC) → destination path (relative to OUT). */
const MAP = {
  // Brand. Extensionless on purpose: the wordmark is a white glyph on
  // transparency, so it MUST keep its alpha channel. Naming a `.png`
  // destination here would send it down the JPEG branch and flatten it onto
  // white — a white logo on a white background, i.e. invisible.
  "wireframes/assets/logo-white.png": "logo-white",

  // Hero + home imagery
  "wireframes/assets/hero-client-5.jpg": "home/hero.jpg",
  "wireframes/assets/why-walk.png": "home/promise-walk.jpg",
  "wireframes/assets/pa-car-accident.png": "home/practice-car-accident.jpg",
  // The rest of the practice-area photography. It comes from `assets/`, which
  // belongs to the abandoned design generation — but that rule is about token
  // VALUES, not about photographs, and these are the only clean, text-free
  // shots available. The live site's equivalents are 800×400 CTA banners with
  // headlines baked into the pixels ("A Denver Truck Accident Attorney is Here
  // For You"), which would put competing copy inside the panel.
  "assets/practice-areas/truck-accident.jpg": "home/practice-truck.jpg",
  "assets/practice-areas/motorcycle-accident.jpg": "home/practice-motorcycle.jpg",
  "assets/practice-areas/bicycle-accident.jpg": "home/practice-bicycle.jpg",
  "assets/practice-areas/premises-liability.jpg": "home/practice-slip-and-fall.jpg",
  "wireframes/assets/watch-firm-video.png": "home/firm-video-cover.jpg",
  "wireframes/assets/faq-video-cover.png": "home/faq-video-cover.jpg",
  "wireframes/assets/contact-attorneys.png": "home/contact-attorneys.jpg",
  // Opaque source name; this is the Why-us team photograph.
  "uploads/pasted-1785214904589-0.png": "home/why-team.jpg",

  // Attorneys
  "wireframes/assets/attorney-1.png": "attorneys/attorney-1.jpg",
  "wireframes/assets/attorney-2.png": "attorneys/attorney-2.jpg",
  "wireframes/assets/attorney-3.avif": "attorneys/attorney-3.jpg",
  "wireframes/assets/kc-harpring.jpg": "attorneys/kc-harpring.jpg",

  // Testimonials (video posters + quote portraits)
  "wireframes/assets/testimonial-ben.png": "testimonials/ben.jpg",
  "wireframes/assets/testimonial-elijah.png": "testimonials/elijah.jpg",
  "wireframes/assets/testimonial-evelyn.png": "testimonials/evelyn.jpg",
  "wireframes/assets/testimonial-joel.png": "testimonials/joel.jpg",
  "wireframes/assets/testimonial-kelly.png": "testimonials/kelly.jpg",
  "wireframes/assets/vid-cover-1.png": "testimonials/video-cover-1.jpg",
  "wireframes/assets/vid-cover-3.png": "testimonials/video-cover-3.jpg",

  // Award badges
  "wireframes/assets/badge-1.png": "badges/badge-1",
  "wireframes/assets/badge-2.png": "badges/badge-2",
  "wireframes/assets/badge-3.avif": "badges/badge-3",
  "wireframes/assets/badge-4.png": "badges/badge-4",
  "wireframes/assets/badge-5.avif": "badges/badge-5",
  "wireframes/assets/badge-8.png": "badges/badge-8",

  // Press logos
  "wireframes/assets/news-denver7.png": "news/denver7",
  "wireframes/assets/news-fox31-cw2.png": "news/fox31-cw2",
  "wireframes/assets/news-mountainmail.png": "news/mountain-mail",
  "wireframes/assets/news-outthere.png": "news/outthere",

  // NGO partner logos
  "wireframes/assets/ngo-clothes-to-kids.png": "ngos/clothes-to-kids",
  "wireframes/assets/ngo-humane-colorado.png": "ngos/humane-colorado",
  "wireframes/assets/ngo-metro-caring.webp": "ngos/metro-caring",
  "wireframes/assets/ngo-project-angel-heart.png": "ngos/project-angel-heart",
  "wireframes/assets/ngo-rmhc.png": "ngos/rmhc",
  "wireframes/assets/ngo-true-companions.png": "ngos/true-companions",
  "wireframes/assets/ngo-we-dont-waste.png": "ngos/we-dont-waste",

  // Community mosaic
  "wireframes/assets/community-angel-heart.png": "community/angel-heart.jpg",
  "wireframes/assets/community-clothes-to-kids.png": "community/clothes-to-kids.jpg",
  "wireframes/assets/community-fridge.png": "community/fridge.jpg",
  "wireframes/assets/community-pikes-peak.png": "community/pikes-peak.jpg",
  "wireframes/assets/community-project-cure.png": "community/project-cure.jpg",
  "wireframes/assets/community-rmhc.png": "community/rmhc.jpg",
  "wireframes/assets/community-shelter.png": "community/shelter.jpg",
};

/**
 * Sources that don't live in the design package — client-supplied artwork.
 * Keyed by absolute path, since SRC doesn't reach them.
 *
 * These are the fragile entries: if the file moves, re-running this script
 * fails for that one image. That's tolerable because this is a one-off
 * regeneration tool rather than a build step — the processed result under
 * src/assets/ is committed and is what the site actually builds from.
 */
const EXTERNAL = {
  "/Users/rhanpemberton/Downloads/pedestrian-accident.webp": "home/practice-pedestrian.jpg",
};

const mb = (n) => (n / 1048576).toFixed(2);
let inTotal = 0;
let outTotal = 0;
const rows = [];

const entries = [
  ...Object.entries(MAP).map(([from, to]) => [path.join(SRC, from), to]),
  ...Object.entries(EXTERNAL),
];

for (const [src, to] of entries) {
  const from = src.startsWith(SRC) ? path.relative(SRC, src) : src;
  if (!existsSync(src)) {
    console.error(`MISSING  ${from}`);
    continue;
  }

  const image = sharp(src);
  const meta = await image.metadata();
  const hasAlpha = Boolean(meta.hasAlpha);

  // Destinations without an extension are logos: keep alpha, pick the format
  // from what the source actually has.
  const ext = path.extname(to);
  const dest = ext ? to : `${to}.${hasAlpha ? "webp" : "jpg"}`;
  const outPath = path.join(OUT, dest);
  await mkdir(path.dirname(outPath), { recursive: true });

  const pipeline = image.resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (path.extname(dest) === ".webp") {
    await pipeline.webp({ quality: 90 }).toFile(outPath);
  } else {
    // `flatten` matters: several sources are PNGs with an alpha channel that is
    // fully opaque. Without it Sharp refuses to write JPEG.
    await pipeline
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);
  }

  const before = (await stat(src)).size;
  const after = (await stat(outPath)).size;
  inTotal += before;
  outTotal += after;
  rows.push(
    `${mb(before).padStart(7)} → ${mb(after).padStart(7)} MB  ${dest}  (${meta.width}×${meta.height})`
  );
}

// ---------------------------------------------------------------------------
// Art-directed hero crop.
//
// The hero photograph is a 2.247:1 panorama with the four attorneys in its
// right third. Below 980px the layout drops it into a fixed band at the foot of
// the hero (see Hero.astro), so what's needed there is simply the team, framed
// tight, at roughly square.
const HERO_SRC = path.join(SRC, "wireframes/assets/hero-client-5.jpg");
const TEAM_CROP = { left: 1769, top: 0, width: 1580, height: 1536 };

{
  const outPath = path.join(OUT, "home/hero-team.jpg");
  await sharp(HERO_SRC)
    .extract(TEAM_CROP)
    .resize({ width: 1400 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const size = (await stat(outPath)).size;
  outTotal += size;
  rows.push(
    `        ${mb(size).padStart(7)} MB  home/hero-team.jpg  (${meta.width}×${meta.height}, aspect ${(meta.width / meta.height).toFixed(2)})`
  );
}

console.log(rows.sort().join("\n"));
console.log(
  `\n${rows.length} files:  ${mb(inTotal)} MB → ${mb(outTotal)} MB  ` +
    `(${(100 - (outTotal / inTotal) * 100).toFixed(1)}% smaller)`
);

async function tree(dir, prefix = "") {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(`${prefix}${entry.name}/`);
      await tree(full, `${prefix}  `);
    } else {
      console.log(`${prefix}${entry.name}  ${mb((await stat(full)).size)} MB`);
    }
  }
}
console.log("\nsrc/assets:");
await tree(OUT, "  ");
