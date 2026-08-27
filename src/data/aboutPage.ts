// The /about page's own copy.
//
// SANITY: reads the `aboutPage` singleton.
//
// Six of the comp's eleven sections are NOT here, because they are singletons
// this site already serves from elsewhere and the About comp repeats them word
// for word: the stats band (`getFirmStats`), the awards bar (`getAwards`), the
// core values (`getCoreValues`), the contact block and its office-hours band
// (`getContactDetails`), the attorney cards (`getAboutAttorneys`) and the review
// records (`getHomeTestimonials`). What is left is what only this page says.
//
// THE PHOTOGRAPHS ARE STILL LOCAL IMPORTS, AND SO IS EVERY `photoAlt`, and both
// halves of that are deliberate. `PageHeader` art-directs — a panorama above
// 760px and a portrait crop below — through a hand-built `<picture>` running
// `getImage()` over both sources, so making the art editable is a rewrite of
// that component rather than a data change. And an alt that describes a
// photograph the editor cannot see or change is a field that drifts with
// nothing checking it: the `whoWeAre` alt below carries a live `TODO(launch)`
// that would not have survived the move, which is a failure this project has
// already been through twice.
//
// If the client wants the page art editable, that is a real request and the
// answer is to move `PageHeader` and all eight page headers at once.
import { sanityClient } from "sanity:client";
import { ABOUT_PAGE_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";
import type { ImageMetadata } from "astro";
import skyline from "../assets/team/skyline.jpg";
import skylineCrop from "../assets/team/skyline-crop.jpg";
import foundersDuo from "../assets/about/founders-duo.jpg";
import quoteBg from "../assets/about/quote-bg.jpg";
import boardroom from "../assets/about/boardroom.jpg";

/** A two-column band: photograph on one side, eyebrow + heading + copy on the other. */
export interface AboutStory {
  eyebrow: string;
  title: string;
  /** One block per paragraph. */
  body: PortableTextBlock[];
  photo: ImageMetadata;
  photoAlt: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/** One of the three "what you can expect" cards. */
export interface AboutPromise {
  _key: string;
  title: string;
  body: string;
  /** Must match an entry in components/icons/ExpectIcon.astro. */
  iconKey: string;
}

/** One cell of the four-up band beneath them. */
export interface AboutMilestone {
  _key: string;
  /** "Then", "Now", "Always" — the small gold tag above the title. */
  tag: string;
  title: string;
  body: string;
}

export interface AboutPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  /** The narrow-viewport crop — see `PageHeader`'s `photoMobile`. */
  photoMobile: ImageMetadata;
  photoAlt: string;
  ctaLabel: string;
  ctaNote: string;

  whoWeAre: AboutStory;
  oneShot: AboutStory;

  quote: {
    /**
     * Portable Text, not a string, because the comp emphasises a run mid-
     * sentence — "it is *what personal service actually means*". The emphasis
     * is content (this clause matters); the gold it renders in is not.
     */
    text: PortableTextBlock[];
    attribution: string;
    photo: ImageMetadata;
  };

  team: { eyebrow: string; title: string; ctaLabel: string; ctaHref: string };
  reviews: { eyebrow: string; title: string };

  expect: {
    title: string;
    promises: AboutPromise[];
    milestones: AboutMilestone[];
  };
}

export async function getAboutPage(): Promise<AboutPage> {
  const copy = await once("aboutPage", async () =>
    required(await sanityClient.fetch(ABOUT_PAGE_QUERY), "About", "Pages")
  );

  return {
    ...copy,
    lede: copy.lede as PortableTextBlock[],
    // The comp's own hero file (`uploads/111-192c78aa.jpg`) is the skyline frame
    // already extracted for the homepage and four other pages — the same
    // picture at the size it renders. See scripts/prep-assets.mjs.
    photo: skyline,
    photoMobile: skylineCrop,
    photoAlt: "The Dormer Harpring team above the Denver skyline",

    whoWeAre: {
      ...copy.whoWeAre,
      body: copy.whoWeAre.body as PortableTextBlock[],
      photo: foundersDuo,
      // NOT the comp's alt text, which reads "Attorneys Michael Dormer and
      // Zachary Harpring". Neither person exists: the founders are Sean Dormer
      // and K.C. Harpring, and the same comp file names them correctly twelve
      // lines further down in its own `team` array. Invented names in an alt
      // attribute are what a screen reader actually says out loud.
      //
      // TODO(launch): confirm the two people in this frame. The man on the left
      // is unmistakably K.C. — same face as his headshot. The man on the right
      // wears glasses and is clean-shaven, where Sean's headshot has neither, so
      // he is identified here by inference (the firm has exactly two founding
      // partners and this is the package's "founders" photograph) rather than by
      // a match. Named left to right, which is the order the alt is read in.
      photoAlt: "Founding partners K.C. Harpring and Sean Dormer",
    },

    quote: {
      ...copy.quote,
      text: copy.quote.text as PortableTextBlock[],
      photo: quoteBg,
    },

    oneShot: {
      ...copy.oneShot,
      body: copy.oneShot.body as PortableTextBlock[],
      photo: boardroom,
      photoAlt: "Dormer Harpring attorneys preparing a case",
    },
  };
}
