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
import { ROUTES, locationPath, practiceAreaPath } from "../lib/routePaths";
import carAccident from "../assets/home/practice-car-accident.jpg";
import truck from "../assets/home/practice-truck.jpg";
import motorcycle from "../assets/home/practice-motorcycle.jpg";
import bicycle from "../assets/home/practice-bicycle.jpg";
import slipAndFall from "../assets/home/practice-slip-and-fall.jpg";
import pedestrian from "../assets/home/practice-pedestrian.jpg";
// Same source frame as `slipAndFall` — the package ships one premises-liability
// photograph, which the homepage labels Slip & Fall and this page labels
// Premises Liability. Imported under both names so each page's list reads as
// its own comp does.
import premisesLiability from "../assets/home/practice-slip-and-fall.jpg";
import dogBite from "../assets/home/practice-dog-bite.jpg";
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

export async function getHomePracticeAreas(): Promise<PracticeAreaSummary[]> {
  return [
    {
      _key: "car",
      name: "Car Accidents",
      iconKey: "car-accident",
      blurb:
        "How we handle car accident cases in Denver — the common issues, who is " +
        "liable, and how we build the claim.",
      href: practiceAreaPath("denver-car-accident-lawyer"),
      image: carAccident,
    },
    {
      _key: "truck",
      name: "Truck Accidents",
      iconKey: "truck-accident",
      blurb:
        "Commercial truck cases — federal regulations, multiple defendants, and the " +
        "evidence that decides the outcome.",
      href: practiceAreaPath("denver-truck-accident-lawyer"),
      image: truck,
    },
    {
      _key: "motorcycle",
      name: "Motorcycle Accidents",
      iconKey: "motorcycle-accident",
      blurb:
        "Motorcycle cases — the bias riders face on the road, and how we counter it " +
        "with facts.",
      href: practiceAreaPath("motorcycle-accident-lawyer-denver"),
      image: motorcycle,
    },
    {
      _key: "bicycle",
      name: "Bicycle Accidents",
      iconKey: "bicycle-accident",
      blurb:
        "Bicycle crash cases — driver liability, right-of-way, and the severe " +
        "injuries cyclists suffer in Denver traffic.",
      href: practiceAreaPath("denver-bicycle-accident-lawyer"),
      image: bicycle,
    },
    {
      _key: "slip",
      name: "Slip & Fall",
      iconKey: "slip-and-fall",
      blurb:
        "Premises liability — proving negligence and unsafe conditions on someone " +
        "else's property.",
      href: practiceAreaPath("denver-slip-and-fall-lawyer"),
      image: slipAndFall,
    },
    {
      _key: "pedestrian",
      name: "Pedestrian Accidents",
      iconKey: "pedestrian-accident",
      blurb:
        "Pedestrian cases — crosswalk and right-of-way law, and the serious injuries " +
        "these crashes cause.",
      href: practiceAreaPath("denver-pedestrian-accident-lawyer"),
      image: pedestrian,
    },
  ];
}

/**
 * The Practice Areas page's featured grid — the comp's own `featured` array,
 * in its order, with its copy and its photography.
 *
 * NOT a projection of the homepage's six, though six names overlap. The two
 * comps ship DIFFERENT COPY for the same area: the homepage's Car Accidents
 * reads "How we handle car accident cases in Denver…", this one "Denver
 * crashes are rarely as simple as the insurer claims…". The homepage blurb is
 * a one-line label, this one is a two-sentence pitch. In the CMS these are two
 * fields on one `practiceArea` document, not one field read twice — so they
 * are two lists here, not one list sliced twice.
 *
 * The sets differ too: this page carries Premises Liability and Dog Bites
 * where the homepage carries Slip & Fall and Pedestrian Accidents.
 */
export async function getFeaturedPracticeAreas(): Promise<PracticeAreaSummary[]> {
  return [
    {
      _key: "car",
      name: "Car Accidents",
      iconKey: "car-accident",
      blurb:
        "Denver crashes are rarely as simple as the insurer claims. We build " +
        "liability from the scene up and value the injury for the whole future, " +
        "not just the ER bill.",
      href: practiceAreaPath("denver-car-accident-lawyer"),
      image: carAccident,
    },
    {
      _key: "truck",
      name: "Truck Accidents",
      iconKey: "truck-accident",
      blurb:
        "Commercial cases turn on federal regulations, logs, and multiple " +
        "defendants. We move fast to preserve the evidence carriers are allowed " +
        "to destroy.",
      href: practiceAreaPath("denver-truck-accident-lawyer"),
      image: truck,
    },
    {
      _key: "motorcycle",
      name: "Motorcycle Accidents",
      iconKey: "motorcycle-accident",
      blurb:
        "Riders face bias before the first question is asked. We counter it with " +
        "reconstruction, physical evidence, and testimony that puts fault where " +
        "it belongs.",
      href: practiceAreaPath("motorcycle-accident-lawyer-denver"),
      image: motorcycle,
    },
    {
      _key: "bicycle",
      name: "Bicycle Accidents",
      iconKey: "bicycle-accident",
      blurb:
        "Right-of-way law protects cyclists, but drivers and their insurers argue " +
        "otherwise. We prove what happened and what the injuries will really cost.",
      href: practiceAreaPath("denver-bicycle-accident-lawyer"),
      image: bicycle,
    },
    {
      // The comp names this panel Premises Liability but gives it the
      // slip-and-fall icon — the broader area, its most common case type.
      _key: "premises",
      name: "Premises Liability",
      iconKey: "slip-and-fall",
      blurb:
        "Slip and fall, negligent security, unsafe maintenance. Colorado premises " +
        "law is technical — and we have taken these cases to verdict against " +
        "national chains.",
      href: practiceAreaPath("denver-premises-liability-lawyer"),
      image: premisesLiability,
    },
    {
      _key: "brain",
      name: "Brain Injuries",
      iconKey: "brain-injury",
      blurb:
        "Concussions and TBI rarely show on a scan, which is exactly what insurers " +
        "exploit. We document the long-term cost with the medicine and the people " +
        "who know you.",
      href: practiceAreaPath("denver-brain-injury-lawyer"),
      image: brainInjury,
    },
    {
      _key: "wrongful-death",
      name: "Wrongful Death",
      iconKey: "wrongful-death",
      blurb:
        "When a family loses someone to negligence, accountability matters as much " +
        "as compensation. We handle these cases with the care they demand.",
      href: practiceAreaPath("denver-wrongful-death-lawyer"),
      image: wrongfulDeath,
    },
    {
      _key: "dog-bite",
      name: "Dog Bites",
      iconKey: "dog-bite",
      blurb:
        "Colorado has a strict liability statute for serious dog bite injuries. We " +
        "handle the claim — usually against a homeowner policy — so you can heal.",
      href: practiceAreaPath("denver-dog-bite-lawyer"),
      image: dogBite,
    },
    {
      _key: "burns",
      name: "Burn Injuries",
      iconKey: "burns",
      blurb:
        "Burns mean surgeries, scarring, and a permanently altered life. These " +
        "claims are valued for the whole future, and we build them that way from " +
        "day one.",
      href: practiceAreaPath("denver-burn-injury-attorney"),
      image: burns,
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
      href: practiceAreaPath("denver-brain-injury-lawyer"),
    },
    {
      _key: "spinal",
      name: "Spinal Cord Injury",
      iconKey: "spinal-cord",
      insight:
        "Paralysis and permanent mobility loss demand lifetime-care planning. We build " +
        "the full-value claim.",
      href: practiceAreaPath("denver-spinal-cord-injury-lawyer"),
    },
    {
      _key: "burns",
      name: "Severe Burns",
      iconKey: "burns",
      insight:
        "Disfigurement and multiple surgeries — valued for the whole future, not just " +
        "the ER bill.",
      href: practiceAreaPath("denver-burn-injury-attorney"),
    },
    {
      _key: "wrongful-death",
      name: "Wrongful Death",
      iconKey: "wrongful-death",
      insight: "Holding the responsible party accountable when a family loses someone.",
      href: practiceAreaPath("denver-wrongful-death-lawyer"),
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
  /**
   * `null` where the firm advertises the area but no page exists to send anyone
   * to — same convention as `NavItem.href` in `navigation.ts`. The entry still
   * renders, as plain text rather than a dead link.
   */
  href: string | null;
}

export interface AreaGroup {
  _key: string;
  title: string;
  items: AreaLink[];
}

/**
 * The full directory. Its skeleton is the comp's own `groupsData`, in its
 * order, with its group titles and its item order — read out of the
 * `data-dc-script` block at the foot of `DH - Practice Areas.html`, which is
 * where the comps keep the content behind their `sc-for` placeholders.
 *
 * The comp's links are all `href="#"`, so the URLs are the one thing it does
 * NOT specify. Those come from the live `denvertrial.com/practice-areas` hub,
 * matched to each label — which is also what makes them resolve after cutover
 * (see `routePaths.ts` on preserving the flat shape).
 *
 * THE COMP IS NOT AN INVENTORY, and this list is now synced to that live hub
 * rather than to the comp: the hub carries 110 entries in 11 groups, the comp
 * 90 in 8. Every entry the hub has and the comp lacks is one the firm links
 * today and would have lost at cutover. The gap was three whole city groups
 * and six Denver pages; all nineteen destinations were already built and
 * served, just unlinked from here. `scripts/diff-comp-practice-areas.py`
 * declares each addition, so the diff against the comp stays strict.
 *
 * Every entry now resolves. Legal Malpractice, Life Insurance Bad Faith and
 * Pet Insurance Bad Faith used to carry `href: null` and render as plain text,
 * on the belief that no page existed — the legacy hub links them relative
 * without a `../`, so they 404 under /practice-areas/ and looked absent. All
 * three are in fact live, and the practice-area import now serves them.
 * `assertDirectoryJoin()` fails the build if any entry here loses its page
 * again, so this list cannot silently rot back.
 *
 * Departures from the comp, all about scope or consistency, none presentation:
 *  - ITS LAST TWO GROUPS ARE GONE. "Premises Liability" and "Other Legal
 *    Services" are topical rather than geographic, which the section heading
 *    ("by location") does not describe — a mismatch this comment flagged and
 *    tolerated for a long time. Folded into the Denver column by request, which
 *    is where every one of their entries pointed anyway: all eight are Denver
 *    pages. The heading is now true of the whole section.
 *
 *    THE FOLD DROPPED TWO ENTRIES AS DUPLICATES of Denver's own —
 *    `denver-premises-liability-lawyer` and
 *    `denver-negligent-ice-snow-removal-attorneys` were listed twice on the
 *    page, once per group. Dropping the first is also the requested relabel:
 *    the surviving entry is Denver's plain "Premises Liability", not the
 *    topical group's "Premises Liability Overview".
 *    `diff-comp-practice-areas.py` now fails on ANY duplicate within a group,
 *    because folding is how one gets introduced and reading is not how one gets
 *    found.
 *  - Greeley, Fort Collins and Grand Junction are added from the live hub. See
 *    the comment on the Greeley group.
 *  - Six Denver entries are added from the live hub — five branded-truck pages
 *    and Daycare Injury.
 *  - FIVE ARE REMOVED from the Premises Liability group, which the hub and the
 *    comp both carry: "Premises Liability Factors", "Slip and Fall Accident
 *    Laws in Colorado", "Slip and Fall Case Types", "Slip and Fall Injury Cases
 *    – Hiring a Lawyer" and "10 Things To Do After a Slip and Fall Accident".
 *    They are articles and moved to the blog by request. Their slugs are
 *    unchanged, so the URLs still resolve — the blog template serves them now,
 *    and `/news` lists them. The group is four entries.
 *    NOTE this is the ONLY place the directory drops something the hub links.
 *    Removing an entry here does not remove the page; check the collection
 *    before assuming a slug is gone.
 *  - Grand Junction reads car → truck → motorcycle. The hub has that one group
 *    the other way round and its two siblings this way; normalised, by request.
 *
 * EVERY LABEL IS THE LIVE HUB'S, with one exception. The comp shortens twelve
 * of them — "E-Scooter Accidents" for "Dockless Bike / E-Scooter Accidents",
 * "10 Things to Do After a Fall" for "10 Things To Do After a Slip and Fall
 * Accident" — and the hub's longer wording is the firm's own, so it wins. The
 * exception is the personal-injury row, which reads "Personal Injury" in every
 * group: the hub says "Personal Injury Overview" in four of them, "Personal
 * Injuries" in Denver and "Personal Injury" in the rest, and the column read as
 * a mistake. By request.
 *
 * A LABEL LIVES IN THREE PLACES and they must not drift: here, the manifest in
 * `scripts/practice-area-pages.mjs`, and the page's own content JSON, which the
 * importer writes from the manifest. Change all three or re-run the import.
 * One slug breaks the one-to-one: `denver-premises-liability-lawyer` is
 * "Premises Liability" in the Denver column and "Premises Liability Overview"
 * in the topical group — both the hub's. The manifest holds the topical form,
 * which is the one the city bands want.
 *
 * NOT synced from the hub: its "Privacy Policy/Disclaimer" entry. No privacy
 * page exists in this build (`ROUTES.privacy` is reserved, not built), and an
 * href to a page that does not exist is the one thing this codebase will not
 * ship. Add the entry when the page lands.
 */
export async function getPracticeAreaGroups(): Promise<AreaGroup[]> {
  return [
    {
      _key: "denver",
      title: "Denver Personal Injury",
      items: [
        // The legacy hub points this one at the homepage, which doubles as its
        // Denver PI overview page. `navigation.ts` drops the equivalent nav
        // item for that reason; here the comp shows it, so it stays.
        { _key: "pi", label: "Personal Injury", href: ROUTES.home },
        { _key: "amazon-truck", label: "Amazon Truck Accident", href: practiceAreaPath("denver-amazon-truck-accident-lawyer") },
        { _key: "amputation", label: "Amputation Injuries", href: practiceAreaPath("denver-amputation-injury-lawyer") },
        { _key: "bike", label: "Bike Accidents", href: practiceAreaPath("denver-bicycle-accident-lawyer") },
        { _key: "birth", label: "Birth Injuries", href: practiceAreaPath("denver-birth-injury-lawyer") },
        { _key: "brain", label: "Brain Injuries", href: practiceAreaPath("denver-brain-injury-lawyer") },
        { _key: "burn", label: "Burn Injuries", href: practiceAreaPath("denver-burn-injury-attorney") },
        { _key: "bus", label: "Bus Accidents", href: practiceAreaPath("denver-bus-accident-lawyer") },
        { _key: "car", label: "Car Accidents", href: practiceAreaPath("denver-car-accident-lawyer") },
        { _key: "child", label: "Child Injuries", href: practiceAreaPath("denver-child-injury-lawyer") },
        { _key: "construction", label: "Construction Accidents", href: practiceAreaPath("denver-construction-accident-attorney") },
        { _key: "daycare", label: "Daycare Injury", href: practiceAreaPath("denver-daycare-injury-lawyers") },
        { _key: "distracted", label: "Distracted Driver Accidents", href: practiceAreaPath("denver-distracted-driver-accident-lawyer") },
        { _key: "scooter", label: "Dockless Bike / E-Scooter Accidents", href: practiceAreaPath("denver-scooter-accident-lawyer") },
        { _key: "dog", label: "Dog Bites", href: practiceAreaPath("denver-dog-bite-lawyer") },
        { _key: "dram-shop", label: "Dram Shop Liability", href: practiceAreaPath("denver-dram-shop-lawyer") },
        { _key: "drowsy", label: "Drowsy Driving Accident", href: practiceAreaPath("denver-drowsy-driving-accident-lawyer") },
        { _key: "fedex-truck", label: "FedEx Truck Accident", href: practiceAreaPath("denver-fedex-truck-accident-lawyer") },
        { _key: "funeral", label: "Funeral Home Negligence", href: practiceAreaPath("colorado-funeral-home-negligence-lawyer") },
        { _key: "garbage-truck", label: "Garbage Truck Accident", href: practiceAreaPath("denver-garbage-truck-accident-lawyer") },
        { _key: "bad-faith", label: "Insurance Bad Faith", href: practiceAreaPath("denver-insurance-bad-faith-lawyer") },
        { _key: "legal-malpractice", label: "Legal Malpractice", href: practiceAreaPath("legal-malpractice-attorney") },
        { _key: "life-bad-faith", label: "Life Insurance Bad Faith", href: practiceAreaPath("denver-life-insurance-bad-faith-lawyer") },
        { _key: "motorcycle", label: "Motorcycle Accidents", href: practiceAreaPath("motorcycle-accident-lawyer-denver") },
        { _key: "malpractice", label: "Medical Malpractice", href: practiceAreaPath("denver-medical-malpractice-lawyer") },
        { _key: "building", label: "Negligent Building Maintenance", href: practiceAreaPath("denver-negligent-building-maintenance-attorneys") },
        { _key: "ice-snow", label: "Negligent Ice/Snow Removal", href: practiceAreaPath("denver-negligent-ice-snow-removal-attorneys") },
        { _key: "security", label: "Negligent Security", href: practiceAreaPath("denver-negligent-security-lawyers") },
        { _key: "nursing-home", label: "Nursing Home Abuse", href: practiceAreaPath("nursing-home-abuse-lawyer") },
        { _key: "pedestrian", label: "Pedestrian Accidents", href: practiceAreaPath("denver-pedestrian-accident-lawyer") },
        { _key: "pet-bad-faith", label: "Pet Insurance Bad Faith", href: practiceAreaPath("denver-pet-insurance-bad-faith-lawyer") },
        { _key: "premises", label: "Premises Liability", href: practiceAreaPath("denver-premises-liability-lawyer") },
        { _key: "product", label: "Product Liability", href: practiceAreaPath("denver-product-liability-lawyer") },
        { _key: "rideshare", label: "Rideshare Accidents", href: practiceAreaPath("denver-uber-accident-lawyer") },
        { _key: "rtd", label: "RTD Denver Accidents", href: practiceAreaPath("rtd-denver-accidents") },
        { _key: "sexual-assault", label: "Sexual Assault", href: practiceAreaPath("denver-sexual-assault-lawyer") },
        { _key: "side-impact", label: "Side-Impact Accident", href: practiceAreaPath("denver-side-impact-accident-lawyer") },
        { _key: "ski", label: "Ski Accidents", href: practiceAreaPath("denver-ski-accident-lawyer") },
        { _key: "slip", label: "Slip and Fall Accidents", href: practiceAreaPath("denver-slip-and-fall-lawyer") },
        { _key: "spinal", label: "Spinal Cord Injury", href: practiceAreaPath("denver-spinal-cord-injury-lawyer") },
        { _key: "tow-truck", label: "Tow Truck Accident", href: practiceAreaPath("denver-tow-truck-accident-lawyer") },
        { _key: "trampoline", label: "Trampoline Park Injuries", href: practiceAreaPath("denver-trampoline-park-injury-lawyer") },
        { _key: "truck", label: "Truck Accidents", href: practiceAreaPath("denver-truck-accident-lawyer") },
        { _key: "uninsured", label: "Uninsured and Underinsured Motorcyclist Accidents", href: practiceAreaPath("denver-uninsured-and-underinsured-motorcyclist-accident-lawyer") },
        { _key: "ups-truck", label: "UPS Truck Accident", href: practiceAreaPath("denver-ups-truck-accident-lawyer") },
        { _key: "whiplash", label: "Whiplash Injuries", href: practiceAreaPath("denver-whiplash-injury-attorney") },
        { _key: "wrongful-death", label: "Wrongful Death", href: practiceAreaPath("denver-wrongful-death-lawyer") },
        { _key: "wildfire", label: "Wildfire Litigation", href: practiceAreaPath("colorado-wildfire-attorney") },
      ],
    },
    {
      _key: "aurora",
      title: "Aurora Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("aurora-personal-injury-attorney") },
        { _key: "brain", label: "Brain Injuries", href: locationPath("aurora-brain-injury-lawyer") },
        { _key: "car", label: "Car Accidents", href: locationPath("aurora-car-accident-lawyer") },
        { _key: "premises", label: "Premises Liability", href: locationPath("aurora-premises-liability-attorney") },
        { _key: "product", label: "Product Liability", href: locationPath("aurora-product-liability-attorney") },
        { _key: "truck", label: "Truck Accidents", href: locationPath("aurora-truck-accident-attorney") },
      ],
    },
    {
      _key: "boulder",
      title: "Boulder Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("boulder-personal-injury-attorney") },
        { _key: "brain", label: "Brain Injuries", href: locationPath("boulder-brain-injury-lawyer") },
        { _key: "car", label: "Car Accidents", href: locationPath("boulder-car-accident-lawyer") },
        { _key: "hit-and-run", label: "Hit and Run Accidents", href: locationPath("boulder-hit-and-run-accident-attorney") },
        { _key: "off-road", label: "Off-Road Recreational Vehicle Accidents", href: locationPath("boulder-off-road-recreational-vehicle-accident-attorney") },
        { _key: "premises", label: "Premises Liability", href: locationPath("boulder-premises-liability-attorney") },
        { _key: "product", label: "Product Liability", href: locationPath("boulder-product-liability-attorney") },
        { _key: "truck", label: "Truck Accidents", href: locationPath("boulder-truck-accident-attorney") },
      ],
    },
    {
      _key: "highlands-ranch",
      title: "Highlands Ranch Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("highlands-ranch-personal-injury-attorney") },
        { _key: "brain", label: "Brain Injuries", href: locationPath("highlands-ranch-brain-injury-lawyer") },
        { _key: "car", label: "Car Accidents", href: locationPath("highlands-ranch-car-accident-lawyer") },
        { _key: "elder-abuse", label: "Financial Elder Abuse", href: locationPath("highlands-ranch-financial-elder-abuse-lawyer") },
        { _key: "premises", label: "Premises Liability", href: locationPath("highlands-ranch-premises-liability-attorney") },
        { _key: "product", label: "Product Liability", href: locationPath("highlands-ranch-product-liability-attorney") },
        { _key: "truck", label: "Truck Accidents", href: locationPath("highlands-ranch-truck-accident-attorney") },
      ],
    },
    {
      _key: "lakewood",
      title: "Lakewood Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("lakewood-personal-injury-attorney") },
        { _key: "brain", label: "Brain Injuries", href: locationPath("lakewood-brain-injury-lawyer") },
        { _key: "car", label: "Car Accidents", href: locationPath("lakewood-car-accident-lawyer") },
        { _key: "premises", label: "Premises Liability", href: locationPath("lakewood-premises-liability-attorney") },
        { _key: "product", label: "Product Liability", href: locationPath("lakewood-product-liability-attorney") },
        { _key: "truck", label: "Truck Accidents", href: locationPath("lakewood-truck-accident-attorney") },
      ],
    },
    {
      _key: "thornton",
      title: "Thornton Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("thornton-personal-injury-attorney") },
        { _key: "brain", label: "Brain Injury", href: locationPath("thornton-brain-injury-lawyer") },
        { _key: "bicycle", label: "Bicycle Accidents", href: locationPath("thornton-bicycle-accident-lawyer") },
        { _key: "car", label: "Car Accidents", href: locationPath("thornton-car-accident-attorney") },
        { _key: "dog", label: "Dog Bite", href: locationPath("thornton-dog-bite-attorney") },
        { _key: "motorcycle", label: "Motorcycle Accidents", href: locationPath("thornton-motorcycle-accident-lawyer") },
        { _key: "pedestrian", label: "Pedestrian Accidents", href: locationPath("thornton-pedestrian-accident-attorney") },
        { _key: "premises", label: "Premises Liability", href: locationPath("thornton-premises-liability-lawyer") },
        { _key: "product", label: "Product Liability", href: locationPath("thornton-product-liability-attorney") },
        { _key: "slip", label: "Slip and Fall Accidents", href: locationPath("thornton-slip-and-fall-accident-lawyer") },
        { _key: "spinal", label: "Spinal Cord Injury", href: locationPath("thornton-spinal-cord-injury-lawyer") },
        { _key: "truck", label: "Truck Accidents", href: locationPath("thornton-truck-accident-attorney") },
        { _key: "workplace", label: "Workplace Injuries", href: locationPath("thornton-workplace-injury-attorney") },
        { _key: "wrongful-death", label: "Wrongful Death", href: locationPath("thornton-wrongful-death-lawyer") },
      ],
    },
    /* Greeley, Fort Collins and Grand Junction are NOT in the comp. They are in
       the live hub, with thirteen live pages between them, and until now this
       build served all thirteen while linking none of them from the directory —
       reachable only from each other's city bands. Added from the live list;
       the comp is not an inventory. Their live group titles are the bare city
       name, unlike every other group's "<City> Personal Injury"; the suffix is
       ours, for consistency down the column. */
    {
      _key: "greeley",
      title: "Greeley Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("greeley-personal-injury-lawyer") },
        { _key: "car", label: "Car Accident", href: locationPath("greeley-car-accident-lawyer") },
        { _key: "truck", label: "Truck Accident", href: locationPath("greeley-truck-accident-lawyer") },
        { _key: "motorcycle", label: "Motorcycle Accident", href: locationPath("greeley-motorcycle-accident-lawyer") },
        { _key: "wrongful-death", label: "Wrongful Death", href: locationPath("greeley-wrongful-death-lawyer") },
      ],
    },
    {
      _key: "fort-collins",
      title: "Fort Collins Personal Injury",
      items: [
        { _key: "pi", label: "Personal Injury", href: locationPath("fort-collins-personal-injury-lawyer") },
        { _key: "car", label: "Car Accident", href: locationPath("fort-collins-car-accident-lawyer") },
        { _key: "truck", label: "Truck Accident", href: locationPath("fort-collins-truck-accident-lawyer") },
        { _key: "motorcycle", label: "Motorcycle Accident", href: locationPath("fort-collins-motorcycle-accident-lawyer") },
      ],
    },
    {
      _key: "grand-junction",
      title: "Grand Junction Personal Injury",
      items: [
        // Truck before motorcycle. The live hub puts them the other way round
        // here and only here — its two sibling groups both read car → truck →
        // motorcycle — so this one is normalised rather than followed.
        { _key: "pi", label: "Personal Injury", href: locationPath("grand-junction-personal-injury-lawyer") },
        { _key: "car", label: "Car Accident", href: locationPath("grand-junction-car-accident-lawyer") },
        { _key: "truck", label: "Truck Accident", href: locationPath("grand-junction-truck-accident-lawyer") },
        { _key: "motorcycle", label: "Motorcycle Accident", href: locationPath("grand-junction-motorcycle-accident-lawyer") },
      ],
    },
  ];
}
