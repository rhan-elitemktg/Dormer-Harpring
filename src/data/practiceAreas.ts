// Practice areas surfaced on the homepage.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/practiceAreas.ts`.
// These become `practiceArea` documents (46 of them, per the legacy site); the
// homepage selector projects the six the firm leads with.
//
// Three fields in the comp's `primaryAreasData` are NOT ported, because no
// markup on the page consumes them: `stat`, `statContext`, and a `bullets`
// array whose three entries are all the literal string "Placeholder detail
// point about this practice area." Same story as the promise accordion — data
// built for a layout that was cut. `caseTypes` and `relatedInjuries` are dead
// for the same reason.
import type { ImageMetadata } from "astro";
import carAccident from "../assets/home/practice-car-accident.jpg";
import truck from "../assets/home/practice-truck.jpg";
import motorcycle from "../assets/home/practice-motorcycle.jpg";
import bicycle from "../assets/home/practice-bicycle.jpg";
import slipAndFall from "../assets/home/practice-slip-and-fall.jpg";
import pedestrian from "../assets/home/practice-pedestrian.jpg";

export interface PracticeSection {
  eyebrow: string;
  /** One entry per rendered line, as with the hero headline. */
  title: string[];
  lede: string;
  /** Label above the tab list. */
  tabsLabel: string;
  catastrophicTitle: string;
  ask: { text: string; cta: string };
}

export async function getPracticeSection(): Promise<PracticeSection> {
  return {
    eyebrow: "When the stakes are highest",
    title: ["Built for the cases that", "change a life."],
    lede:
      "Some injuries don't just heal and move on. For the most serious, complex " +
      "cases, you need a firm that tries them — not one that settles cheap. This " +
      "is where we go deepest.",
    tabsLabel: "Common case types",
    catastrophicTitle: "High-stakes cases we're built to take to verdict",
    ask: {
      text: "Not sure if your injury qualifies?",
      cta: "We review every case for free",
    },
  };
}

export interface PracticeAreaSummary {
  _key: string;
  name: string;
  /** Must match an entry in components/icons/PracticeIcon.astro. */
  iconKey: string;
  blurb: string;
  href: string;
  /** Panels without one fall back to an icon plate. */
  image?: ImageMetadata;
}

export async function getHomePracticeAreas(): Promise<PracticeAreaSummary[]> {
  return [
    {
      _key: "car",
      name: "Car Accidents",
      iconKey: "car-accident",
      blurb:
        "How we handle car accident cases in Denver — the common issues, who is " +
        "liable, and how we build the claim.",
      href: "/denver-car-accident-lawyer",
      image: carAccident,
    },
    {
      _key: "truck",
      name: "Truck Accidents",
      iconKey: "truck-accident",
      blurb:
        "Commercial truck cases — federal regulations, multiple defendants, and the " +
        "evidence that decides the outcome.",
      href: "/denver-truck-accident-lawyer",
      image: truck,
    },
    {
      _key: "motorcycle",
      name: "Motorcycle Accidents",
      iconKey: "motorcycle-accident",
      blurb:
        "Motorcycle cases — the bias riders face on the road, and how we counter it " +
        "with facts.",
      href: "/motorcycle-accident-lawyer-denver",
      image: motorcycle,
    },
    {
      _key: "bicycle",
      name: "Bicycle Accidents",
      iconKey: "bicycle-accident",
      blurb:
        "Bicycle crash cases — driver liability, right-of-way, and the severe " +
        "injuries cyclists suffer in Denver traffic.",
      href: "/denver-bicycle-accident-lawyer",
      image: bicycle,
    },
    {
      _key: "slip",
      name: "Slip & Fall",
      iconKey: "slip-and-fall",
      blurb:
        "Premises liability — proving negligence and unsafe conditions on someone " +
        "else's property.",
      href: "/denver-slip-and-fall-lawyer",
      image: slipAndFall,
    },
    {
      _key: "pedestrian",
      name: "Pedestrian Accidents",
      iconKey: "pedestrian-accident",
      blurb:
        "Pedestrian cases — crosswalk and right-of-way law, and the serious injuries " +
        "these crashes cause.",
      href: "/denver-pedestrian-accident-lawyer",
      image: pedestrian,
    },
  ];
}

/**
 * The line that closes every panel. It reads as per-area copy in the comp but is
 * the same string for all six, so it is one field on the section rather than
 * six copies an editor could let drift apart.
 */
export async function getPracticePromise(): Promise<string> {
  return (
    "You'll work with an experienced trial lawyer, not just a settlement lawyer. " +
    "We front the costs, handle every call and lien, and you owe nothing unless we win."
  );
}

export interface CatastrophicArea {
  _key: string;
  name: string;
  iconKey: string;
  insight: string;
  href: string;
}

export async function getCatastrophicAreas(): Promise<CatastrophicArea[]> {
  return [
    {
      _key: "tbi",
      name: "Traumatic Brain Injury",
      iconKey: "brain-injury",
      insight:
        "Mild concussions to life-altering TBI — we prove the long-term cost insurers " +
        "try to minimize.",
      href: "/denver-brain-injury-lawyer",
    },
    {
      _key: "spinal",
      name: "Spinal Cord Injury",
      iconKey: "spinal-cord",
      insight:
        "Paralysis and permanent mobility loss demand lifetime-care planning. We build " +
        "the full-value claim.",
      href: "/denver-spinal-cord-injury-lawyer",
    },
    {
      _key: "burns",
      name: "Severe Burns",
      iconKey: "burns",
      insight:
        "Disfigurement and multiple surgeries — valued for the whole future, not just " +
        "the ER bill.",
      href: "/denver-burn-injury-attorney",
    },
    {
      _key: "wrongful-death",
      name: "Wrongful Death",
      iconKey: "wrongful-death",
      insight: "Holding the responsible party accountable when a family loses someone.",
      href: "/denver-wrongful-death-lawyer",
    },
  ];
}
