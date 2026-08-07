// The /about page's own copy.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/aboutPage.ts` and an
// `aboutPage` singleton.
//
// Six of the comp's eleven sections are NOT here, because they are singletons
// this site already serves from elsewhere and the About comp repeats them word
// for word: the stats band (`getFirmStats`), the awards bar (`getAwards`), the
// core values (`getCoreValues`), the contact block and its office-hours band
// (`getContactDetails`), the attorney cards (`getAboutAttorneys`) and the review
// records (`getHomeTestimonials`). What is left is what only this page says.
import { pt, type PortableTextBlock } from "./portableText";
import type { ImageMetadata } from "astro";
import { ROUTES } from "../lib/routePaths";
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
  return {
    eyebrow: "About Dormer Harpring",
    title: "Quality over quantity.",
    lede: pt(
      "We have gotten our best results for clients other firms turned down. " +
        "Every plaintiff in our cases is an underdog — and a small caseload is " +
        "what lets us shorten those odds."
    ),
    // The comp's own hero file (`uploads/111-192c78aa.jpg`) is the skyline frame
    // already extracted for the homepage and four other pages — the same
    // picture at the size it renders. See scripts/prep-assets.mjs.
    photo: skyline,
    photoMobile: skylineCrop,
    photoAlt: "The Dormer Harpring team above the Denver skyline",
    ctaLabel: "Request free consultation",
    ctaNote: "No win, no fee",

    whoWeAre: {
      eyebrow: "Who we are",
      title: "We take the cases other firms turn down.",
      body: pt(
        "The team at Dormer Harpring has obtained its best results for clients " +
          "who were turned down by countless other law firms. All of the " +
          "plaintiffs in our cases are underdogs, and we find joy in helping the " +
          "people who need it most.",
        "That is why we keep working the difficult cases with the longest odds. " +
          "A small caseload lets us attack those problems with creativity and " +
          "unpredictability — and by doing that, we shorten the odds for our " +
          "clients."
      ),
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
      ctaLabel: "Our practice areas",
      ctaHref: ROUTES.practiceAreas,
    },

    quote: {
      text: pt(
        "You will have your lawyer's cell phone number. That is not a slogan — " +
          "it is **what personal service actually means**."
      ),
      attribution: "Dormer Harpring · Denver, Colorado",
      photo: quoteBg,
    },

    team: {
      eyebrow: "Meet the team",
      title: "The lawyers on your case.",
      ctaLabel: "Meet all the team",
      ctaHref: ROUTES.attorneys,
    },

    reviews: {
      eyebrow: "Client reviews",
      title: "In their words.",
    },

    oneShot: {
      eyebrow: "Quality over quantity",
      title: "You only get one shot at this.",
      body: pt(
        "The number one reason to hire us is our ability to tailor the " +
          "representation to each client. You want a lawyer you can trust through " +
          "the whole process — not just to maximize the value of your case, but " +
          "to minimize what it costs you and your family in stress.",
        "When it is time to seek justice after an accident, you likely only have " +
          "one shot. The right answer for you is not the same as the right answer " +
          "for a limitless number of “files” — which is what high-volume shops " +
          "call their clients.",
        "The attorney you choose makes a real difference in the strength of your " +
          "case, but only if that attorney is willing to sit down with you and " +
          "work out the solution that fits your situation."
      ),
      photo: boardroom,
      photoAlt: "Dormer Harpring attorneys preparing a case",
    },

    expect: {
      title: "What you can expect when you hire us.",
      promises: [
        {
          _key: "support",
          title: "Compassionate, caring support",
          body:
            "We care about your whole recovery, not just the verdict. We help you " +
            "get access to medical care while we handle the complicated work of " +
            "moving the case forward.",
          iconKey: "compassion",
        },
        {
          _key: "service",
          title: "Personalized, responsive service",
          body:
            "We spend hours with our clients and their families, and we visit at " +
            "home when that is more comfortable. We answer calls, emails, and " +
            "texts — and you will have your lawyer's cell number.",
          iconKey: "phone",
        },
        {
          _key: "fees",
          title: "Contingency fees, costs advanced",
          body:
            "We never charge for a consultation, and our fee is based only on " +
            "what we recover. If your case needs expensive experts, we advance " +
            "those costs and charge no interest.",
          iconKey: "fee",
        },
      ],
      milestones: [
        {
          _key: "then",
          tag: "Then",
          title: "Built for trial",
          body: "Two trial lawyers who left volume practice to take the cases that deserve a jury.",
        },
        {
          _key: "now",
          tag: "Now",
          title: "Rooted in RiNo",
          body: "Serving injured Coloradans across the Front Range from our Denver office.",
        },
        {
          _key: "always",
          tag: "Always",
          title: "Underdogs first",
          body: "We find joy in helping the clients other firms would not take on.",
        },
        {
          _key: "with-you",
          tag: "With you",
          title: "To resolution",
          body: "Standing beside you from the first call through the final check.",
        },
      ],
    },
  };
}
