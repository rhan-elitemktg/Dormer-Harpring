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
import { pt, type PortableTextBlock } from "./portableText";
import carAccident from "../assets/home/practice-car-accident.jpg";
import truck from "../assets/home/practice-truck.jpg";
import motorcycle from "../assets/home/practice-motorcycle.jpg";
import bicycle from "../assets/home/practice-bicycle.jpg";
import slipAndFall from "../assets/home/practice-slip-and-fall.jpg";
import pedestrian from "../assets/home/practice-pedestrian.jpg";
import brainInjury from "../assets/home/practice-brain-injury.jpg";
import wrongfulDeath from "../assets/home/practice-wrongful-death.jpg";
import burns from "../assets/home/practice-burns.jpg";
import heroPhoto from "../assets/team/skyline.jpg";
import heroCrop from "../assets/team/skyline-crop.jpg";

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

/**
 * Every area that gets a photographed panel, keyed the way a `practiceArea`
 * document will be. The homepage projects six of these and the Practice Areas
 * page nine — two projections of one set, which is exactly what the two GROQ
 * queries will be. Written once here for the same reason: a second copy of
 * "Car Accidents" drifts from the first, and nobody finds out until migration.
 */
const AREA_LIBRARY = {
  car: {
    _key: "car",
    name: "Car Accidents",
    iconKey: "car-accident",
    blurb:
      "How we handle car accident cases in Denver — the common issues, who is " +
      "liable, and how we build the claim.",
    href: "/denver-car-accident-lawyer",
    image: carAccident,
  },
  truck: {
    _key: "truck",
    name: "Truck Accidents",
    iconKey: "truck-accident",
    blurb:
      "Commercial truck cases — federal regulations, multiple defendants, and the " +
      "evidence that decides the outcome.",
    href: "/denver-truck-accident-lawyer",
    image: truck,
  },
  motorcycle: {
    _key: "motorcycle",
    name: "Motorcycle Accidents",
    iconKey: "motorcycle-accident",
    blurb:
      "Motorcycle cases — the bias riders face on the road, and how we counter it " +
      "with facts.",
    href: "/motorcycle-accident-lawyer-denver",
    image: motorcycle,
  },
  bicycle: {
    _key: "bicycle",
    name: "Bicycle Accidents",
    iconKey: "bicycle-accident",
    blurb:
      "Bicycle crash cases — driver liability, right-of-way, and the severe " +
      "injuries cyclists suffer in Denver traffic.",
    href: "/denver-bicycle-accident-lawyer",
    image: bicycle,
  },
  slip: {
    _key: "slip",
    name: "Slip & Fall",
    iconKey: "slip-and-fall",
    blurb:
      "Premises liability — proving negligence and unsafe conditions on someone " +
      "else's property.",
    href: "/denver-slip-and-fall-lawyer",
    image: slipAndFall,
  },
  pedestrian: {
    _key: "pedestrian",
    name: "Pedestrian Accidents",
    iconKey: "pedestrian-accident",
    blurb:
      "Pedestrian cases — crosswalk and right-of-way law, and the serious injuries " +
      "these crashes cause.",
    href: "/denver-pedestrian-accident-lawyer",
    image: pedestrian,
  },
  brain: {
    _key: "brain",
    name: "Brain Injuries",
    iconKey: "brain-injury",
    blurb:
      "Concussion through life-altering TBI — proving the long-term cost of an " +
      "injury that does not show on an X-ray.",
    href: "/denver-brain-injury-lawyer",
    image: brainInjury,
  },
  "wrongful-death": {
    _key: "wrongful-death",
    name: "Wrongful Death",
    iconKey: "wrongful-death",
    blurb:
      "Holding the responsible party accountable when a family loses someone, and " +
      "carrying the claim so they do not have to.",
    href: "/denver-wrongful-death-lawyer",
    image: wrongfulDeath,
  },
  burns: {
    _key: "burns",
    name: "Burn Injuries",
    iconKey: "burns",
    blurb:
      "Disfigurement, skin grafts and repeat surgeries — valued for the whole " +
      "future, not just the emergency-room bill.",
    href: "/denver-burn-injury-attorney",
    image: burns,
  },
} as const satisfies Record<string, PracticeAreaSummary>;

const pickAreas = (keys: readonly (keyof typeof AREA_LIBRARY)[]): PracticeAreaSummary[] =>
  keys.map((key) => AREA_LIBRARY[key]);

export async function getHomePracticeAreas(): Promise<PracticeAreaSummary[]> {
  return pickAreas(["car", "truck", "motorcycle", "bicycle", "slip", "pedestrian"]);
}

/**
 * The Practice Areas page's featured grid — the homepage six plus the three
 * catastrophic areas the design package has photography for. Nine, which is the
 * comp's count and fills its three-column grid exactly.
 */
export async function getFeaturedPracticeAreas(): Promise<PracticeAreaSummary[]> {
  return pickAreas([
    "car",
    "truck",
    "motorcycle",
    "bicycle",
    "slip",
    "pedestrian",
    "brain",
    "wrongful-death",
    "burns",
  ]);
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

/* ------------------------------------------------------------------
   The /practice-areas page itself.
   ------------------------------------------------------------------ */

export interface PracticeAreasPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  photo: ImageMetadata;
  photoMobile: ImageMetadata;
  photoAlt: string;
  ctaLabel: string;
  ctaNote: string;
  /** The featured-panel grid's opener. */
  featured: { eyebrow: string; title: string; lede: string };
  /** The by-location directory's opener. */
  directory: { eyebrow: string; title: string };
}

export async function getPracticeAreasPage(): Promise<PracticeAreasPage> {
  return {
    eyebrow: "Practice areas",
    title: "How we help injured Coloradans.",
    lede: pt(
      "Car and truck crashes, premises liability, catastrophic injury, wrongful " +
        "death — we take on the cases other firms turn down, and we prepare every " +
        "one of them for a jury."
    ),
    photo: heroPhoto,
    photoMobile: heroCrop,
    photoAlt: "The Dormer Harpring attorneys above the Denver skyline",
    ctaLabel: "Request free consultation",
    ctaNote: "No win, no fee",
    featured: {
      eyebrow: "What we do",
      title: "Our core practice areas.",
      lede: "The cases we try most often — and the ones insurers most often undervalue.",
    },
    directory: {
      eyebrow: "Browse all",
      title: "Every case we handle, by location.",
    },
  };
}

export interface AreaLink {
  _key: string;
  label: string;
  href: string;
}

export interface AreaGroup {
  _key: string;
  title: string;
  items: AreaLink[];
}

/**
 * The full directory — 95 links across the nine cities that have landing pages.
 *
 * SOURCED FROM THE LIVE SITE, not the comp: the comp is a template whose
 * `groups` placeholder carries only a count (8 groups of 12). The real
 * inventory is the legacy `denvertrial.com/practice-areas` hub, read out of the
 * site scrape, which is also what makes every href below resolve after cutover
 * — these are the existing URLs, kept verbatim (see `routePaths.ts` on why the
 * flat shape is preserved).
 *
 * Five deliberate departures from that hub, all of them repairs:
 *
 *  1. Its first Denver link is "Personal Injuries → /", because there the
 *     homepage doubles as the PI overview page. Dropped, for the same reason
 *     `navigation.ts` drops it from the nav: here the homepage is the homepage.
 *  2. Its two trailing groups — "Premises Liability" and "Other Legal Services"
 *     — are topical, not locations, and this section's own heading promises
 *     locations. The four genuine service pages in them (negligent building
 *     maintenance, negligent security, negligent ice/snow removal, insurance
 *     bad faith) are all Denver pages and are filed under Denver. The other
 *     five entries are explainer articles, not practice areas, and belong to
 *     the blog rather than here.
 *  3. Three "Other Legal Services" links — legal malpractice, life insurance
 *     bad faith, pet insurance bad faith — are DEAD on the live site. They are
 *     written relative without a `../`, so they resolve under /practice-areas/,
 *     and no such pages exist anywhere in the scrape. Omitted rather than
 *     ported as 404s.
 *     TODO(launch): if the firm still offers these three, they need pages.
 *  4. Two real, published service pages the hub simply never links — Denver
 *     drunk driving and Denver taxi accidents — are included. The heading says
 *     every case we handle, and both pages exist.
 *  5. Labels normalised: singular case types made plural ("Amazon Truck
 *     Accident" → "Accidents"), the live "Overview" suffixes dropped, and
 *     "Bike Accidents" aligned to "Bicycle Accidents" as the rest of the site
 *     names it. Ordering is alphabetical within each group; the hub's own order
 *     is alphabetical apart from one slip (Motorcycle filed before Medical).
 */
export async function getPracticeAreaGroups(): Promise<AreaGroup[]> {
  return [
    {
      _key: "denver",
      title: "Denver",
      items: [
        { _key: "amazon", label: "Amazon Truck Accidents", href: "/denver-amazon-truck-accident-lawyer" },
        { _key: "amputation", label: "Amputation Injuries", href: "/denver-amputation-injury-lawyer" },
        { _key: "bicycle", label: "Bicycle Accidents", href: "/denver-bicycle-accident-lawyer" },
        { _key: "birth", label: "Birth Injuries", href: "/denver-birth-injury-lawyer" },
        { _key: "brain", label: "Brain Injuries", href: "/denver-brain-injury-lawyer" },
        { _key: "burn", label: "Burn Injuries", href: "/denver-burn-injury-attorney" },
        { _key: "bus", label: "Bus Accidents", href: "/denver-bus-accident-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/denver-car-accident-lawyer" },
        { _key: "child", label: "Child Injuries", href: "/denver-child-injury-lawyer" },
        { _key: "construction", label: "Construction Accidents", href: "/denver-construction-accident-attorney" },
        { _key: "daycare", label: "Daycare Injuries", href: "/denver-daycare-injury-lawyers" },
        { _key: "distracted", label: "Distracted Driving Accidents", href: "/denver-distracted-driver-accident-lawyer" },
        { _key: "scooter", label: "Dockless Bike & E-Scooter Accidents", href: "/denver-scooter-accident-lawyer" },
        { _key: "dog", label: "Dog Bites", href: "/denver-dog-bite-lawyer" },
        { _key: "dram-shop", label: "Dram Shop Liability", href: "/denver-dram-shop-lawyer" },
        { _key: "drowsy", label: "Drowsy Driving Accidents", href: "/denver-drowsy-driving-accident-lawyer" },
        { _key: "drunk", label: "Drunk Driving Accidents", href: "/denver-drunk-driving-accident-lawyer" },
        { _key: "fedex", label: "FedEx Truck Accidents", href: "/denver-fedex-truck-accident-lawyer" },
        { _key: "funeral", label: "Funeral Home Negligence", href: "/colorado-funeral-home-negligence-lawyer" },
        { _key: "garbage", label: "Garbage Truck Accidents", href: "/denver-garbage-truck-accident-lawyer" },
        { _key: "bad-faith", label: "Insurance Bad Faith", href: "/denver-insurance-bad-faith-lawyer" },
        { _key: "malpractice", label: "Medical Malpractice", href: "/denver-medical-malpractice-lawyer" },
        { _key: "motorcycle", label: "Motorcycle Accidents", href: "/motorcycle-accident-lawyer-denver" },
        { _key: "building", label: "Negligent Building Maintenance", href: "/denver-negligent-building-maintenance-attorneys" },
        { _key: "ice-snow", label: "Negligent Ice & Snow Removal", href: "/denver-negligent-ice-snow-removal-attorneys" },
        { _key: "security", label: "Negligent Security", href: "/denver-negligent-security-lawyers" },
        { _key: "nursing-home", label: "Nursing Home Abuse", href: "/nursing-home-abuse-lawyer" },
        { _key: "pedestrian", label: "Pedestrian Accidents", href: "/denver-pedestrian-accident-lawyer" },
        { _key: "premises", label: "Premises Liability", href: "/denver-premises-liability-lawyer" },
        { _key: "product", label: "Product Liability", href: "/denver-product-liability-lawyer" },
        { _key: "rideshare", label: "Rideshare Accidents", href: "/denver-uber-accident-lawyer" },
        { _key: "rtd", label: "RTD Accidents", href: "/rtd-denver-accidents" },
        { _key: "sexual-assault", label: "Sexual Assault", href: "/denver-sexual-assault-lawyer" },
        { _key: "side-impact", label: "Side-Impact Accidents", href: "/denver-side-impact-accident-lawyer" },
        { _key: "ski", label: "Ski Accidents", href: "/denver-ski-accident-lawyer" },
        { _key: "slip", label: "Slip & Fall Accidents", href: "/denver-slip-and-fall-lawyer" },
        { _key: "spinal", label: "Spinal Cord Injuries", href: "/denver-spinal-cord-injury-lawyer" },
        { _key: "taxi", label: "Taxi Accidents", href: "/denver-taxi-accident-lawyer" },
        { _key: "tow-truck", label: "Tow Truck Accidents", href: "/denver-tow-truck-accident-lawyer" },
        { _key: "trampoline", label: "Trampoline Park Injuries", href: "/denver-trampoline-park-injury-lawyer" },
        { _key: "truck", label: "Truck Accidents", href: "/denver-truck-accident-lawyer" },
        { _key: "uninsured", label: "Uninsured & Underinsured Motorists", href: "/denver-uninsured-and-underinsured-motorcyclist-accident-lawyer" },
        { _key: "ups", label: "UPS Truck Accidents", href: "/denver-ups-truck-accident-lawyer" },
        { _key: "whiplash", label: "Whiplash Injuries", href: "/denver-whiplash-injury-attorney" },
        { _key: "wildfire", label: "Wildfire Litigation", href: "/colorado-wildfire-attorney" },
        { _key: "wrongful-death", label: "Wrongful Death", href: "/denver-wrongful-death-lawyer" },
      ],
    },
    {
      _key: "aurora",
      title: "Aurora",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/aurora-personal-injury-attorney" },
        { _key: "brain", label: "Brain Injuries", href: "/aurora-brain-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/aurora-car-accident-lawyer" },
        { _key: "premises", label: "Premises Liability", href: "/aurora-premises-liability-attorney" },
        { _key: "product", label: "Product Liability", href: "/aurora-product-liability-attorney" },
        { _key: "truck", label: "Truck Accidents", href: "/aurora-truck-accident-attorney" },
      ],
    },
    {
      _key: "boulder",
      title: "Boulder",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/boulder-personal-injury-attorney" },
        { _key: "brain", label: "Brain Injuries", href: "/boulder-brain-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/boulder-car-accident-lawyer" },
        { _key: "hit-and-run", label: "Hit & Run Accidents", href: "/boulder-hit-and-run-accident-attorney" },
        { _key: "off-road", label: "Off-Road Vehicle Accidents", href: "/boulder-off-road-recreational-vehicle-accident-attorney" },
        { _key: "premises", label: "Premises Liability", href: "/boulder-premises-liability-attorney" },
        { _key: "product", label: "Product Liability", href: "/boulder-product-liability-attorney" },
        { _key: "truck", label: "Truck Accidents", href: "/boulder-truck-accident-attorney" },
      ],
    },
    {
      _key: "highlands-ranch",
      title: "Highlands Ranch",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/highlands-ranch-personal-injury-attorney" },
        { _key: "brain", label: "Brain Injuries", href: "/highlands-ranch-brain-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/highlands-ranch-car-accident-lawyer" },
        { _key: "elder-abuse", label: "Financial Elder Abuse", href: "/highlands-ranch-financial-elder-abuse-lawyer" },
        { _key: "premises", label: "Premises Liability", href: "/highlands-ranch-premises-liability-attorney" },
        { _key: "product", label: "Product Liability", href: "/highlands-ranch-product-liability-attorney" },
        { _key: "truck", label: "Truck Accidents", href: "/highlands-ranch-truck-accident-attorney" },
      ],
    },
    {
      _key: "lakewood",
      title: "Lakewood",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/lakewood-personal-injury-attorney" },
        { _key: "brain", label: "Brain Injuries", href: "/lakewood-brain-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/lakewood-car-accident-lawyer" },
        { _key: "premises", label: "Premises Liability", href: "/lakewood-premises-liability-attorney" },
        { _key: "product", label: "Product Liability", href: "/lakewood-product-liability-attorney" },
        { _key: "truck", label: "Truck Accidents", href: "/lakewood-truck-accident-attorney" },
      ],
    },
    {
      _key: "thornton",
      title: "Thornton",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/thornton-personal-injury-attorney" },
        { _key: "bicycle", label: "Bicycle Accidents", href: "/thornton-bicycle-accident-lawyer" },
        { _key: "brain", label: "Brain Injuries", href: "/thornton-brain-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/thornton-car-accident-attorney" },
        { _key: "dog", label: "Dog Bites", href: "/thornton-dog-bite-attorney" },
        { _key: "motorcycle", label: "Motorcycle Accidents", href: "/thornton-motorcycle-accident-lawyer" },
        { _key: "pedestrian", label: "Pedestrian Accidents", href: "/thornton-pedestrian-accident-attorney" },
        { _key: "premises", label: "Premises Liability", href: "/thornton-premises-liability-lawyer" },
        { _key: "product", label: "Product Liability", href: "/thornton-product-liability-attorney" },
        { _key: "slip", label: "Slip & Fall Accidents", href: "/thornton-slip-and-fall-accident-lawyer" },
        { _key: "spinal", label: "Spinal Cord Injuries", href: "/thornton-spinal-cord-injury-lawyer" },
        { _key: "truck", label: "Truck Accidents", href: "/thornton-truck-accident-attorney" },
        { _key: "workplace", label: "Workplace Injuries", href: "/thornton-workplace-injury-attorney" },
        { _key: "wrongful-death", label: "Wrongful Death", href: "/thornton-wrongful-death-lawyer" },
      ],
    },
    {
      _key: "greeley",
      title: "Greeley",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/greeley-personal-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/greeley-car-accident-lawyer" },
        { _key: "truck", label: "Truck Accidents", href: "/greeley-truck-accident-lawyer" },
      ],
    },
    {
      _key: "fort-collins",
      title: "Fort Collins",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/fort-collins-personal-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/fort-collins-car-accident-lawyer" },
        { _key: "truck", label: "Truck Accidents", href: "/fort-collins-truck-accident-lawyer" },
      ],
    },
    {
      _key: "grand-junction",
      title: "Grand Junction",
      items: [
        { _key: "pi", label: "Personal Injury", href: "/grand-junction-personal-injury-lawyer" },
        { _key: "car", label: "Car Accidents", href: "/grand-junction-car-accident-lawyer" },
      ],
    },
  ];
}
