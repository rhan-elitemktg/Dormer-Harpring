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

  // The firm's primary team photograph — four attorneys against the Denver
  // skyline. Under team/ rather than home/ because five pages now use it: the
  // homepage hero, Thank You, Testimonials, About and Practice Areas. The
  // comps hand three slightly different crops of the same frame
  // (hero-client-5, 111-192c78aa, pasted-1785212816747); at the sizes any of
  // them render, they are the same picture, so one asset serves all of it.
  "wireframes/assets/hero-client-5.jpg": "team/skyline.jpg",
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
  // The three the Practice Areas page adds on top of the homepage's six. Its
  // featured grid is nine panels, and these are the only other areas the
  // package has BOTH a photograph and an icon for — `spinal-cord` has an icon
  // but no photograph, and `dog-bite`/`personal-injury` the reverse.
  "assets/practice-areas/brain-injury.jpg": "home/practice-brain-injury.jpg",
  "assets/practice-areas/wrongful-death.jpg": "home/practice-wrongful-death.jpg",
  "assets/practice-areas/burn-injury.jpg": "home/practice-burns.jpg",
  "wireframes/assets/watch-firm-video.png": "home/firm-video-cover.jpg",
  "wireframes/assets/faq-video-cover.png": "home/faq-video-cover.jpg",
  "wireframes/assets/contact-attorneys.png": "home/contact-attorneys.jpg",
  // Opaque source name; this is the Why-us team photograph.
  "uploads/pasted-1785214904589-0.png": "home/why-team.jpg",

  // The four attorneys against the Denver skyline — a tighter crop of the same
  // frame as the hero. Ten of the fourteen comps use it, so it lives outside
  // home/ rather than being owned by whichever page happened to need it first.
  "uploads/pasted-1785212437457-0.png": "team/attorneys-skyline.jpg",

  // The two founding partners at 600x800 — the same shot as their headshot,
  // at the resolution the partner cards need for a square crop.
  "assets/team/dormer-photo.jpg": "team/sean-dormer-lg.jpg",
  "assets/team/harpring-photo.jpg": "team/kc-harpring-lg.jpg",

  // The badges shown on a partner's card. A different set from the firm-wide
  // trust bar in badges/ — these are personal accolades.
  "assets/awards/top-20-verdicts.png": "awards/top-20-verdicts",
  "assets/awards/multi-million.png": "awards/multi-million",
  "assets/awards/avvo-10.png": "awards/avvo-10",
  "assets/awards/best-lawyers.png": "awards/best-lawyers",
  "assets/awards/national-trial-40.png": "awards/national-trial-40",
  "assets/awards/ones-to-watch.png": "awards/ones-to-watch",
  // The Expertise.com pair. In the package all along but never pulled, which
  // left both partners a badge short of the six the bio comp lays out — the
  // personal-injury one is Sean's, the truck one is K.C.'s.
  "assets/awards/expertise-pi.png": "awards/expertise-pi",
  "assets/awards/expertise-truck.png": "awards/expertise-truck",

  // Co-counsel. From `assets/`, which belongs to the abandoned design
  // generation — the same carve-out as the practice-area photography above:
  // that rule is about token VALUES, not about pictures, and nothing else in
  // the package shows the two partners together.
  "assets/photos/cocounsel-hero.png": "cocounsel/hero.jpg",
  "assets/photos/cocounsel-duo.png": "cocounsel/duo.jpg",

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

  // Community partner logos. A SECOND set of the same brands the homepage's
  // NGO row uses — six overlap, and only Metro Caring is byte-identical; the
  // rest are different crops. Kept apart rather than merged, because picking
  // one crop over the other would silently restyle an approved homepage.
  // TODO(sanity): one asset per organisation once an editor owns them.
  "assets/partners/clothes-to-kids.png": "partners/clothes-to-kids",
  "assets/partners/craig-hospital.jpg": "partners/craig-hospital",
  "assets/partners/humane-colorado.png": "partners/humane-colorado",
  "assets/partners/metro-caring.webp": "partners/metro-caring",
  "assets/partners/pikes-peak-challenge.jpg": "partners/pikes-peak-challenge",
  "assets/partners/project-angel-heart.png": "partners/project-angel-heart",
  "assets/partners/project-cure.jpg": "partners/project-cure",
  "assets/partners/rmhc-denver.png": "partners/rmhc-denver",
  "assets/partners/the-park-people.png": "partners/the-park-people",
  "assets/partners/true-companions.png": "partners/true-companions",
  "assets/partners/we-dont-waste.png": "partners/we-dont-waste",

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
const SCRAPE =
  "/Users/rhanpemberton/Downloads/Dormer Harpring/sitesucker/www.denvertrial.com/wp-content/uploads";

/**
 * Team headshots, lifted from the LIVE SITE rather than the design package.
 * The comps ship generic stand-ins for three attorneys and nothing for the
 * rest; denvertrial.com/meet-our-attorneys carries a real, consistent set —
 * one backdrop, one lighting setup, 460x580 apiece — for 25 of the 27 people
 * the comp lists.
 *
 * TODO(launch): Alexandra Petroff and Dinorah Gutierrez appear in the comp but
 * nowhere in the scrape, so they have no photograph. The card falls back to a
 * monogram until the firm supplies one.
 */
const TEAM = {
  // The office dogs. On the live site's team page with the rest, and Jane is
  // marked "In Loving Memory" there.
  "2022/11/IMG_7462-scaled-e1759265649797.jpeg": "team/randy-sawpring.jpg",
  "2022/12/jane-thedog-e1759266062602.jpg": "team/jane-gonzales-dormer.jpg",
  "2022/11/IMG_0585-e1759266158161.jpeg": "team/bella-sawpring.jpg",

  "2020/12/att-bio-06.jpg": "team/sean-dormer.jpg",
  "2022/12/att-kc-harping.jpg": "team/kc-harpring.jpg",
  "2022/12/att-tim-garvey.jpg": "team/tim-garvey.jpg",
  "2026/05/LMB-1.png": "team/laura-browne.jpg",
  "2024/05/Untitled-design-1.png": "team/jessica-mauser.jpg",
  "2024/07/ANR-1.png": "team/amy-rogers.jpg",
  "2024/10/13.png": "team/greg-bentley.jpg",
  "2022/12/att-marcie-emch.jpg": "team/marcie-emch.jpg",
  "2023/07/att-bio-kmb.jpg": "team/kassandra-burival.jpg",
  "2024/05/BEF-1.png": "team/brittany-freeman.jpg",
  "2024/12/Cindy2-woodbkgd.jpg": "team/cindy-waller.jpg",
  "2025/09/BLL.png": "team/brittany-lesmeister.jpg",
  "2022/12/att-julie-althehofen.jpg": "team/julie-altenhofen.jpg",
  "2024/07/AAR.png": "team/ashley-reisman.jpg",
  "2024/10/Website-Headshots.png": "team/david-garber.jpg",
  "2024/10/14.png": "team/abby-houk.jpg",
  "2025/08/JAA.png": "team/jessica-ayala.jpg",
  "2024/11/Untitled-design-1.png": "team/livi-lesch.jpg",
  "2025/01/Untitled-design-2.png": "team/leana-kim.jpg",
  "2025/11/MMR-1.png": "team/maddy-ricciardi.jpg",
  "2024/09/MPJ.png": "team/morgan-jewel.jpg",
  "2026/05/RAP-3.png": "team/rachel-pavelko.jpg",
  "2024/09/EKN.png": "team/ella-nelson.jpg",
  "2024/10/15.png": "team/michael-greer.jpg",
  "2026/03/MPM-2.png": "team/marilyn-morales.jpg",
};

/**
 * Two accolades the design package has no artwork for. Both are on the
 * partners' live bio pages and both are personal rather than firm-wide, so
 * they cannot be substituted from the package's set.
 */
const BADGES = {
  "2020/10/award-15.png": "awards/top-100-litigators",
  "2020/10/award-12.png": "awards/super-lawyers-kc",
};
const EXTERNAL = {
  "/Users/rhanpemberton/Downloads/pedestrian-accident.webp": "home/practice-pedestrian.jpg",
};

const mb = (n) => (n / 1048576).toFixed(2);
let inTotal = 0;
let outTotal = 0;
const rows = [];

const entries = [
  ...Object.entries(MAP).map(([from, to]) => [path.join(SRC, from), to]),
  ...Object.entries(TEAM).map(([from, to]) => [path.join(SCRAPE, from), to]),
  ...Object.entries(BADGES).map(([from, to]) => [path.join(SCRAPE, from), to]),
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
// Art-directed crops.
//
// These are the NARROW-VIEWPORT sources: a wide landscape photograph with its
// subject off to one side loses that subject entirely in a portrait viewport,
// and no `object-position` recovers it. Each entry re-cuts the same frame
// around the people, at roughly square.
const CROPS = [
  {
    // The four attorneys sit in the right third of a 2.25:1 panorama.
    from: "wireframes/assets/hero-client-5.jpg",
    to: "team/skyline-crop.jpg",
    extract: { left: 1769, top: 0, width: 1580, height: 1536 },
  },
  {
    // The two partners stand centre-right, from about 51% to 89% across.
    from: "assets/photos/cocounsel-hero.png",
    to: "cocounsel/hero-crop.jpg",
    extract: { left: 1700, top: 0, width: 1500, height: 1536 },
  },
];

for (const { from, to, extract } of CROPS) {
  const src = path.join(SRC, from);
  if (!existsSync(src)) {
    console.error(`MISSING  ${from}`);
    continue;
  }

  const outPath = path.join(OUT, to);
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp(src)
    .extract(extract)
    .resize({ width: 1400 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const size = (await stat(outPath)).size;
  outTotal += size;
  rows.push(
    `        ${mb(size).padStart(7)} MB  ${to}  (${meta.width}\u00d7${meta.height}, aspect ${(meta.width / meta.height).toFixed(2)})`
  );
}

// ---------------------------------------------------------------------------
// Sean's profile-video poster, pulled from YouTube once and committed.
//
// Unlike the client testimonials — vertical, so every thumbnail YouTube serves
// is a letterboxed title card — this one is a true 16:9 frame of him
// presenting, which is a better poster than any headshot would be.
{
  const url = "https://img.youtube.com/vi/LT-oU3yqtmA/maxresdefault.jpg";
  const response = await fetch(url);
  if (response.ok) {
    const outPath = path.join(OUT, "team/sean-dormer-video.jpg");
    await mkdir(path.dirname(outPath), { recursive: true });
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer)
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);
    const after = (await stat(outPath)).size;
    outTotal += after;
    rows.push(`        ${mb(after).padStart(7)} MB  team/sean-dormer-video.jpg`);
  } else {
    console.error(`MISSING  ${url} (${response.status})`);
  }
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
