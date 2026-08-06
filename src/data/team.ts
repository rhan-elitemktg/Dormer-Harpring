// The firm's people — attorneys, support staff and the office dogs.
//
// SANITY SWAP POINT — the future `teamMember` collection. ONE type with a
// `kind` discriminator rather than three arrays: the comp keeps `partners`,
// `attorneys` and `staffData` apart and then merges them back together for the
// grid, which means the merge order is code rather than content and a person
// cannot move between groups without an edit in two places.

import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import { attorneyPath, blogPath } from "../lib/routePaths";
import { videoWatchUrl, type VideoRef } from "../lib/video";
import seanVideoPoster from "../assets/team/sean-dormer-video.jpg";
import seanLg from "../assets/team/sean-dormer-lg.jpg";
import kcLg from "../assets/team/kc-harpring-lg.jpg";
import seanSm from "../assets/team/sean-dormer.jpg";
import kcSm from "../assets/team/kc-harpring.jpg";
import timgarvey from "../assets/team/tim-garvey.jpg";
import laurabrowne from "../assets/team/laura-browne.jpg";
import jessicamauser from "../assets/team/jessica-mauser.jpg";
import amyrogers from "../assets/team/amy-rogers.jpg";
import gregbentley from "../assets/team/greg-bentley.jpg";
import marcieemch from "../assets/team/marcie-emch.jpg";
import kassandraburival from "../assets/team/kassandra-burival.jpg";
import brittanyfreeman from "../assets/team/brittany-freeman.jpg";
import cindywaller from "../assets/team/cindy-waller.jpg";
import brittanylesmeister from "../assets/team/brittany-lesmeister.jpg";
import juliealtenhofen from "../assets/team/julie-altenhofen.jpg";
import ashleyreisman from "../assets/team/ashley-reisman.jpg";
import davidgarber from "../assets/team/david-garber.jpg";
import abbyhouk from "../assets/team/abby-houk.jpg";
import jessicaayala from "../assets/team/jessica-ayala.jpg";
import livilesch from "../assets/team/livi-lesch.jpg";
import leanakim from "../assets/team/leana-kim.jpg";
import maddyricciardi from "../assets/team/maddy-ricciardi.jpg";
import morganjewel from "../assets/team/morgan-jewel.jpg";
import rachelpavelko from "../assets/team/rachel-pavelko.jpg";
import ellanelson from "../assets/team/ella-nelson.jpg";
import michaelgreer from "../assets/team/michael-greer.jpg";
import marilynmorales from "../assets/team/marilyn-morales.jpg";
import randysawpring from "../assets/team/randy-sawpring.jpg";
import janegonzalesdormer from "../assets/team/jane-gonzales-dormer.jpg";
import bellasawpring from "../assets/team/bella-sawpring.jpg";
import awardTop20Verdicts from "../assets/awards/top-20-verdicts.webp";
import awardMultiMillion from "../assets/awards/multi-million.webp";
import awardAvvo10 from "../assets/awards/avvo-10.webp";
import awardBestLawyers from "../assets/awards/best-lawyers.webp";
import awardNationalTrial40 from "../assets/awards/national-trial-40.webp";
import awardOnesToWatch from "../assets/awards/ones-to-watch.webp";
import awardExpertisePi from "../assets/awards/expertise-pi.webp";
import awardExpertiseTruck from "../assets/awards/expertise-truck.webp";
import awardTop100 from "../assets/awards/top-100-litigators.webp";
import awardSuperLawyersKc from "../assets/awards/super-lawyers-kc.webp";

export type TeamKind = "partner" | "attorney" | "staff" | "dog";

export interface TeamMember {
  _key: string;
  name: string;
  role: string;
  kind: TeamKind;
  /**
   * Absent for the two people the firm has no photograph of. The card falls
   * back to their initials rather than leaving a hole.
   */
  photo?: ImageMetadata;
  /** The larger crop the founding-partner cards need. */
  photoLarge?: ImageMetadata;
  /**
   * Set by `getTeam` for anyone who has a profile below, and by nobody else —
   * see the note there. Absent for the two people with no live bio page.
   */
  href?: string;
  bio?: PortableTextBlock[];
  /** Personal accolades, shown on the founding-partner cards. */
  awards?: { _key: string; image: ImageMetadata; alt: string }[];
  /** Shows "In Loving Memory" above the role. */
  memorial?: boolean;
}

/** Initials for the fallback monogram: "Alexandra Petroff" -> "AP". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export async function getTeam(): Promise<TeamMember[]> {
  const roster: Omit<TeamMember, "href">[] = [
    {
      _key: "sean-dormer",
      name: "Sean Dormer",
      role: "Founding Partner",
      kind: "partner",
      photo: seanSm,
      photoLarge: seanLg,
      bio: pt(
        "Sean was shaped most by his tenure as a student attorney in CU Law School’s " +
        "Defense Clinic, representing clients with limited means for free. Twenty years " +
        "later he is still picking fights with bullies — taking clients other lawyers " +
        "rejected, bringing their cases to trial, and winning against long odds. In 2017 he " +
        "took a permanently injured single mother’s case against one of the country’s " +
        "largest grocery chains, which offered $250,000; the jury returned $1.77 million " +
        "and the case settled for $2.1 million. He speaks on trial technique for the " +
        "Colorado Trial Lawyers Association and has testified for fairer injury laws at the " +
        "state legislature. Born and raised in Colorado, he spends his time with his wife, " +
        "their dog and two cats, and anything the mountains allow."
      ),
      // Six, which is what the bio comp lays out and what the live site shows
      // for him. The one omission is his Super Lawyers "Rising Stars" badge —
      // see the README; it is an early-career award he has since aged out of,
      // and his press links now carry plain Super Lawyers instead.
      awards: [
        { _key: "top-20-verdicts", image: awardTop20Verdicts, alt: "TopVerdict Top 20 Jury Verdicts Colorado" },
        { _key: "multi-million", image: awardMultiMillion, alt: "Multi-Million Dollar Advocates Forum" },
        { _key: "avvo-10", image: awardAvvo10, alt: "Avvo Rating 10.0 Superb" },
        { _key: "top-100", image: awardTop100, alt: "America’s Top 100 High Stakes Litigators" },
        { _key: "expertise-pi", image: awardExpertisePi, alt: "Expertise Best Personal Injury Attorneys in Denver" },
        { _key: "best-lawyers", image: awardBestLawyers, alt: "Best Lawyers" },
      ],
    },
    {
      _key: "k-c-harpring",
      name: "K.C. Harpring",
      role: "Founding Partner",
      kind: "partner",
      photo: kcSm,
      photoLarge: kcLg,
      bio: pt(
        "K.C. has always wanted work that improves the day-to-day lives of real people " +
        "rather than the bottom line of a faceless company. He tried corporate law in " +
        "Chicago and Spain, then found his calling in DePaul’s Poverty Law clinic — where " +
        "he won back the home of a single mother wrongfully evicted over a clerical error. " +
        "That moment became the driving force behind his practice. After passing the " +
        "Colorado bar in 2014 he worked at a high-volume plaintiff’s firm and saw a model " +
        "that could not give clients the service they deserved, so he partnered with Sean " +
        "to build something different. Outside the office he is in the foothills with his " +
        "partner and their two dogs — hiking, skiing, and working through the Colorado " +
        "Mountain Club’s mountaineering courses."
      ),
      awards: [
        { _key: "national-trial-40", image: awardNationalTrial40, alt: "The National Trial Lawyers Top 40 Under 40" },
        { _key: "ones-to-watch", image: awardOnesToWatch, alt: "Best Lawyers: Ones to Watch" },
        { _key: "avvo-10", image: awardAvvo10, alt: "Avvo Rating 10.0 Superb" },
        { _key: "super-lawyers", image: awardSuperLawyersKc, alt: "Colorado Super Lawyers Rising Stars" },
        { _key: "expertise-truck", image: awardExpertiseTruck, alt: "Expertise Best Truck Accident Lawyers in Denver" },
        { _key: "best-lawyers", image: awardBestLawyers, alt: "Best Lawyers" },
      ],
    },
    {
      _key: "tim-garvey",
      name: "Tim Garvey",
      role: "Attorney",
      kind: "attorney",
      photo: timgarvey,
    },
    {
      _key: "laura-browne",
      name: "Laura Browne",
      role: "Attorney",
      kind: "attorney",
      photo: laurabrowne,
    },
    {
      _key: "jessica-mauser",
      name: "Jessica Mauser",
      role: "Attorney",
      kind: "attorney",
      photo: jessicamauser,
    },
    {
      _key: "amy-rogers",
      name: "Amy Rogers",
      role: "Attorney",
      kind: "attorney",
      photo: amyrogers,
    },
    {
      _key: "greg-bentley",
      name: "Greg Bentley",
      role: "Attorney",
      kind: "attorney",
      photo: gregbentley,
    },
    {
      _key: "marcie-emch",
      name: "Marcie Emch",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: marcieemch,
    },
    {
      _key: "kassandra-burival",
      name: "Kassandra Burival",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: kassandraburival,
    },
    {
      _key: "brittany-freeman",
      name: "Brittany Freeman",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: brittanyfreeman,
    },
    {
      _key: "cindy-waller",
      name: "Cindy Waller",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: cindywaller,
    },
    {
      _key: "brittany-lesmeister",
      name: "Brittany Lesmeister",
      role: "Litigation Paralegal",
      kind: "staff",
      photo: brittanylesmeister,
    },
    {
      _key: "julie-altenhofen",
      name: "Julie Altenhofen",
      role: "Paralegal",
      kind: "staff",
      photo: juliealtenhofen,
    },
    {
      _key: "ashley-reisman",
      name: "Ashley Reisman",
      role: "Paralegal",
      kind: "staff",
      photo: ashleyreisman,
    },
    {
      _key: "david-garber",
      name: "David Garber",
      role: "Paralegal",
      kind: "staff",
      photo: davidgarber,
    },
    {
      _key: "alexandra-petroff",
      name: "Alexandra Petroff",
      role: "Paralegal",
      kind: "staff",
    },
    {
      _key: "abby-houk",
      name: "Abby Houk",
      role: "Intake Specialist",
      kind: "staff",
      photo: abbyhouk,
    },
    {
      _key: "jessica-ayala",
      name: "Jessica Ayala",
      role: "Intake Specialist",
      kind: "staff",
      photo: jessicaayala,
    },
    {
      _key: "livi-lesch",
      name: "Livi Lesch",
      role: "Office Manager",
      kind: "staff",
      photo: livilesch,
    },
    {
      _key: "leana-kim",
      name: "Leana Kim",
      role: "Office Assistant",
      kind: "staff",
      photo: leanakim,
    },
    {
      _key: "maddy-ricciardi",
      name: "Maddy Ricciardi",
      role: "Controller",
      kind: "staff",
      photo: maddyricciardi,
    },
    {
      _key: "morgan-jewel",
      name: "Morgan Jewel",
      role: "Law Clerk",
      kind: "staff",
      photo: morganjewel,
    },
    {
      _key: "rachel-pavelko",
      name: "Rachel Pavelko",
      role: "Law Clerk",
      kind: "staff",
      photo: rachelpavelko,
    },
    {
      _key: "ella-nelson",
      name: "Ella Nelson",
      role: "Legal Assistant",
      kind: "staff",
      photo: ellanelson,
    },
    {
      _key: "dinorah-gutierrez",
      name: "Dinorah Gutierrez",
      role: "Legal Assistant",
      kind: "staff",
    },
    {
      _key: "michael-greer",
      // "Paralegal" on the live roster and on his own bio page; the comp still
      // has the "Legal Assistant" he was hired as. See the README.
      name: "Michael Greer",
      role: "Paralegal",
      kind: "staff",
      photo: michaelgreer,
    },
    {
      _key: "marilyn-morales",
      name: "Marilyn Morales",
      role: "Legal Assistant",
      kind: "staff",
      photo: marilynmorales,
    },
    {
      _key: "randy-ira-sawpring",
      name: "Randy Ira Sawpring",
      role: "Chief of Security",
      kind: "dog",
      photo: randysawpring,
    },
    {
      _key: "jane-gonzales-dormer",
      name: "Jane Gonzales-Dormer",
      role: "Greeter",
      kind: "dog",
      photo: janegonzalesdormer,
      memorial: true,
    },
    {
      _key: "bella-mae-sawpring",
      name: "Bella Mae Sawpring",
      role: "Hype Girl",
      kind: "dog",
      photo: bellasawpring,
    },
  ];

  // A card links to a bio when, and only when, that bio exists. Derived rather
  // than written out per person because a hand-written href outlives the page
  // it points at: the homepage rail linked Tim Garvey to a route
  // `getStaticPaths` had never built. In Sanity this is the same condition,
  // `defined(bio)`, evaluated in the projection.
  return roster.map((member) =>
    PROFILES.some((profile) => profile.slug === member._key)
      ? { ...member, href: attorneyPath(member._key) }
      : member
  );
}

// ---------------------------------------------------------------------------
// The long-form profiles behind /meet-our-attorneys/<slug>.
//
// A SECOND PROJECTION of the same `teamMember` documents, not a second type —
// the roster above needs a name, a role and a portrait, and this needs two
// thousand words. In Sanity that is two GROQ projections; here it is two
// functions, so the index page never ships a bio it does not render.
//
// The prose is the firm's own, lifted from the live site rather than the comp:
// the comp carries only Sean's, and paraphrasing a lawyer's biography is not
// something a rebuild should be doing. Three bios end on an appended sentence
// about the firm rather than the person ("Part of the Dormer Harpring team,
// dedicated to helping those injured in Colorado."); those are left out — see
// the README.
//
// Everyone on the live site has one of these. Alexandra Petroff and Dinorah
// Gutierrez do not, which is why they have no photograph either: they joined
// after the last update to it.

export interface AttorneyFact {
  _key: string;
  /** The figure — set in Geist, not the display face. */
  value: string;
  label: string;
}

export interface ProfileLink {
  _key: string;
  label: string;
  href: string;
}

export interface TeamProfile {
  slug: string;
  /**
   * The eyebrow above the name. Optional — it defaults to the member's role,
   * which is what it says for everyone except the two partners, whose cards
   * read "Founding Partner" but whose bios open "Attorney · Founding Partner".
   */
  category?: string;
  /**
   * The single sentence the live site pulls out beside the portrait. STAFF
   * ONLY — the attorney comp has no standfirst, and its opening sentence is
   * the first body paragraph, so the seven attorneys carry theirs in `body`.
   * Two of the staff bios have none and simply open on the body.
   */
  lede?: string;
  /** The three-up dark band under the name. Optional — only Sean has them. */
  facts?: AttorneyFact[];
  /** A `> ` paragraph becomes the pull quote. */
  body: PortableTextBlock[];
  /** Degrees, most recent first. */
  education?: string[];
  /**
   * Press mentions and directory profiles. Real destinations, read off the live
   * site — the comp points every one of Sean's at "#". Seven of them are the
   * firm's own posts, which arrive with Phase 3j and 404 until then.
   */
  links?: ProfileLink[];
  /** A profile film, where one exists. */
  video?: { ref: VideoRef; poster: ImageMetadata; alt: string };
}

const PROFILES: TeamProfile[] = [
  {
    slug: "sean-dormer",
    category: "Attorney · Founding Partner",
    facts: [
      { _key: "years", value: "20 Years", label: "Trying cases in Colorado" },
      { _key: "slip", value: "$2.1M", label: "Largest slip & fall recovery" },
      { _key: "ctla", value: "CTLA", label: "Trial technique speaker" },
    ],
    body: pt(
        "Sean was most shaped by his tenure as a student attorney in CU Law School’s " +
          "Defense Clinic. The Defense Clinic gave Sean the opportunity to represent " +
          "clients with limited financial means for free, including those facing " +
          "combinations of both criminal and immigration charges.",
        "If you ask Sean why he does personal injury work, this is the story he tells:",
        "> You know, I guess I’ve been picking fights with bullies since I was a kid. I was " +
        "riding the bus home one day in middle school, and I saw another boy picking on " +
        "someone about half his size. So, I stood up and told him what I thought of what he " +
        "was doing. When we got off at our stop, he made it clear to me that we were going to " +
        "have a fight about it. He was about a head taller than me. I don’t think I won, but " +
        "I did get him to go away and leave us alone. That was a scary moment for me. But " +
        "I’ve always been glad I spoke up.",
        "About 20 years later, Sean is picking fights to help people who’ve been hurt due to " +
        "the irresponsible acts of others. He’s accepted clients who were rejected by " +
        "multiple other lawyers, brought their cases to trial, and won against long odds. " +
        "He’s advised his clients to reject unjust settlement offers from some of the world’s " +
        "largest and most powerful companies and forced those companies to pay far more than " +
        "they said they would. In 2017, he helped a single mom who was permanently injured " +
        "get justice from one of the largest grocery store chains in the country. The company " +
        "offered only $250,000. Sean and his team obtained a jury verdict of $1.77 million. " +
        "The case settled for $2.1 million after Sean and his team asked the court to add " +
        "interest and costs and to increase the damages caps.",
        "Sean’s willingness to fight means his clients often don’t have to. Sean and his team " +
        "of Denver personal injury lawyers recently tried a case against a large insurance " +
        "company and secured a judgment for hundreds of thousands of dollars – almost triple " +
        "what the company offered to pay. That company now offers Sean’s other clients fairer " +
        "settlements.",
        "Sean and his team help people who have been injured in car, bike, vehicle vs. " +
        "pedestrian, motorcycle, and truck accidents; people injured because of negligent " +
        "property design, property cleaning, or property maintenance; people injured by " +
        "dangerous products of all different categories; and people with a multitude of other " +
        "types of personal injury claims.",
        "Sean has also dedicated himself to helping improve the chances of personal injury " +
        "victims throughout Colorado. He has accepted multiple invitations to speak about " +
        "trial techniques at statewide meetings of the Colorado Trial Lawyers’ Association " +
        "and other groups. He has testified in favor of fairer personal injury laws at the " +
        "Colorado State Legislature. He loves working with other personal injury lawyers to " +
        "help their clients achieve full justice, whether it’s talking through complex issues " +
        "over the phone, sharing data about defense “expert” witnesses, or joining trial " +
        "teams on tough cases as co-counsel.",
        "But our job isn’t just about the results – our clients have often lost so much more " +
        "than just the cost of their medical bills or the wages they couldn’t earn because " +
        "they were hurt. Everyone at Dormer Harpring strives to live a balanced, full life " +
        "because that’s what allows us to empathize with what our clients are going through. " +
        "For Sean, the most important things in life are family, the mountains, and music. " +
        "Sean was born and raised here in Colorado. He cherishes spending time with his wife " +
        "and their dog and two cats. He loves to do just about anything in the mountains, " +
        "from rock climbing, mountain biking, and skiing, to fly fishing, hiking, " +
        "backpacking, and camping. He enjoys riding and working on his motorcycle. He likes " +
        "to play his guitar and sing, but mostly just to himself."
    ),
    video: {
      ref: { provider: "youtube", id: "LT-oU3yqtmA" },
      poster: seanVideoPoster,
      alt: "Sean Dormer presenting with a model of the spine",
    },
    education: [
      "University of California, Berkeley — B.A.",
      "University of Colorado School of Law — J.D.",
    ],
    links: [
      {
        _key: "e-scooter",
        label: "E-Scooter Companies Hit with Lawsuit",
        href: blogPath(
          "e-scooter-companies-hit-with-lawsuit-alleging-dangerous-design-and-marketing-practices"
        ),
      },
      {
        _key: "saguache",
        label: "Lawsuit Alleges Unconstitutional Mismanagement of Saguache County Jail",
        href: blogPath(
          "lawsuit-alleges-unconstitutional-mismanagement-of-saguache-county-jail-resulted-in-crestone-mans-suicide"
        ),
      },
      {
        _key: "multi-car",
        label: "Multi-Car Crash $2.51 Million Verdict",
        href: "https://www.thectlc.com/episode/sean-dormer-and-tim-garvey-2-51-million-verdict-after-multi-car-crash-in-denver",
      },
      {
        _key: "top-20",
        label: "2023 Top 20 Colorado Verdicts",
        href: "https://topverdict.com/lists/2023/colorado/top-20-verdicts",
      },
      {
        _key: "pressure-cookers",
        label: "The Dangers of Pressure Cookers",
        href: blogPath("dangers-of-pressure-cookers"),
      },
      {
        _key: "helmets",
        label: "Lessons from Defective Helmet Lawsuits",
        href: blogPath("how-to-choose-a-safe-bike-helmet"),
      },
      {
        _key: "hearing-damage",
        label: "Product Liability Permanent Hearing Damage Lawsuit",
        href: blogPath("permanent-hearing-damage-from-rolland-boss-rc-3-loop-station"),
      },
      {
        _key: "forbes",
        label: "Forbes Best Personal Injury Attorneys",
        href: "https://www.forbes.com/advisor/legal/personal-injury/best-personal-injury-lawyers-denver-co/",
      },
      {
        _key: "high-stakes",
        label: "Top 100 High Stakes Litigators",
        href: "https://www.top100highstakeslitigators.com/listing/sean-m-dormer/",
      },
      {
        _key: "super-lawyers",
        label: "Super Lawyers",
        href: "https://profiles.superlawyers.com/colorado/denver/lawyer/sean-dormer/27d91d09-f419-4d2b-bcf9-50be7af0f0c9.html",
      },
      {
        _key: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/sean-dormer-3a849932/",
      },
      {
        // Built rather than written out: nothing outside video.ts may compose a
        // video URL, or the Wistia migration stops being a data change.
        _key: "about-film",
        label: "About Dormer Harpring",
        href: videoWatchUrl({ provider: "youtube", id: "OUGOMAWgrmc" }),
      },
    ],
  },
  {
    slug: "k-c-harpring",
    category: "Attorney · Founding Partner",
    body: pt(
        "K.C. has always had a desire to do meaningful work that improves the day-to-day " +
          "lives of real people, as opposed to aiding the bottom line of some large, " +
          "faceless company.",
        "K.C. went to law school in the aftermath of the 2008 financial crisis without being " +
        "completely sure where he would end up. K.C. first tried out the life of a corporate " +
        "lawyer. But after spending two years learning about antitrust, corporate mergers and " +
        "acquisitions, public-private partnerships, and general business law in Chicago and " +
        "Spain, K.C. was turned off. In his final year of law school, he signed up for " +
        "DePaul’s Poverty Law clinic, Trial Advocacy Course, and a Litigation Laboratory. " +
        "That year, he found his calling and learned the tools to pursue it.",
        "K.C.’s final “project” in the Poverty Law clinic allowed him to help a single mother " +
        "who had been wrongfully evicted from her home. During his review of the case, it " +
        "became obvious to K.C. that his client and her children had been rendered homeless " +
        "due to a simple clerical error by a busy bureaucrat. K.C. thought the case would be " +
        "as simple as that for the other side too. It was not. The bureaucrat responsible for " +
        "the error refused to change her stance, even when confronted with the evidence. The " +
        "judge agreed with K.C. and his client, and thankfully this single mom and her family " +
        "were able to regain the shelter they needed to survive. After the hearing, K.C.’s " +
        "client broke down crying and hugged K.C. The feeling K.C. got by helping that client " +
        "– of being a voice for an actual human being in need – became a driving force behind " +
        "K.C.’s work as a lawyer.",
        "From that moment on, K.C. vowed to work for individual people in their quests to be " +
        "heard by those that have wronged them. That decision led him to the field of " +
        "plaintiffs’ personal injury law. In personal injury work, K.C. gets to continue " +
        "fighting for real human beings against emotionless insurance companies, " +
        "corporations, and governments. He hasn’t looked back since.",
        "Long before becoming a Denver personal injury attorney, K.C. grew up in Southern " +
        "Indiana, near Louisville, Kentucky. He attended Purdue University, where he studied " +
        "History, with minors in Political Science, Peace Studies, and Global Studies of the " +
        "Middle East. He played club soccer at Purdue as a goalkeeper. He hasn’t lost any of " +
        "the creativity or tenacity with which he learned to play the game without being able " +
        "to rely on the typical goalie’s towering height. He also joined the Purdue " +
        "Organization for Labor Equality, where he worked in a campaign with students across " +
        "the nation to better the working conditions of the people creating the college " +
        "apparel that Purdue and other schools profited from. K.C. participated in direct " +
        "actions and civil disobedience and got a taste for how hard it can be to fight the " +
        "powerful.",
        "After college, K.C. moved to Denver because of his love for the outdoors and " +
        "memories of great family vacations in Colorado as a kid. He spent that year working " +
        "various blue-collar jobs and eventually decided that law school was a better choice " +
        "than trying to start a career on the tails of the 2008 financial crisis.",
        "So, after a year in Denver, K.C. moved to Chicago to study law at DePaul University " +
        "College of Law, with a plan to return to Colorado in the future. While there, he " +
        "participated in Moot Court and became a member of the National Lawyers’ Guild. He " +
        "completed a Masters of Law in International and European Business Law from " +
        "Universidad Pontificia Comillas in Madrid, Spain. He completed his J.D. in 2014, " +
        "graduating Cum Laude. Following graduation, he returned to Colorado as planned to " +
        "find work in the courtroom representing real people.",
        "After passing the Colorado Bar Exam in 2014, K.C. worked for a high-volume " +
        "plaintiff’s personal injury firm. While there, he further developed his passion for " +
        "his clients and their stories. However, K.C. never felt like the high-volume firm " +
        "model was capable of giving clients the level of service they deserved. After " +
        "leaving, he partnered up with Sean because they both shared a different vision for " +
        "how to achieve the best results for each client individually. Instead of trying to " +
        "fit every client into one method of practice, K.C. and Sean work hard to tailor " +
        "their work to each client’s specific needs.",
        "At Dormer Harpring, K.C. and Sean strive to maintain a healthy environment both " +
        "physically and mentally for their team, encouraging everyone to take personal days " +
        "and vacations frequently to maintain their fire to fight for our clients.",
        "Outside of personal injury, K.C. loves to get outside with his partner and their two " +
        "dogs. They spend most waking hours of their weekends hiking, camping, or skiing in " +
        "the mountains, and K.C. spends the early morning – and sometimes late evening – " +
        "hours trail running or hiking in the foothills west of Denver with his dogs. K.C. is " +
        "a member of the Colorado Mountain Club and is slowly working his way through the " +
        "mountaineering skills courses offered by the club. In 2021, K.C. hopes to complete a " +
        "ski descent of a 14,000-foot peak in Colorado. K.C. is also an avid reader, amateur " +
        "home-gardener, drummer, LP-collector, and home-brewer."
    ),
    education: [
      "Purdue University — B.A. in History",
      "DePaul University College of Law — J.D.",
      "Universidad Pontificia Comillas — LL.M in International & European Business Law",
    ],
  },
  {
    slug: "tim-garvey",
    body: pt(
        "When asked what he does for a living, Tim often explains: “I sue insurance " +
          "companies when they act like jerks. They keep me very busy.”",
        "Tim Garvey is an experienced Denver personal injury attorney dedicated to " +
        "helping regular people fight insurance company greed, and he specializes in " +
        "insurance bad faith, catastrophic personal injury, and wrongful death.",
        "Throughout his career, Tim has helped his clients recover millions of dollars in " +
        "wrongly withheld insurance benefits, and Tim credits his success to his unique " +
        "approach of treating clients like family to learn their human story. This " +
        "approach allows Tim to tell his client’s story—to insurance companies, to " +
        "mediators, or to juries—with empathy and compassion.",
        "He currently serves as a Board Member of the Colorado Trial Lawyers Association, " +
        "where he works with fellow attorneys to promote justice and protect the rights " +
        "of injured individuals throughout Colorado.",
        "Many organizations have recognized Tim’s dedication to his clients and the " +
        "results he gets for them over the past decade, including:",
        "- Best Lawyers 2026",
        "- The National Trial Lawyers: Top 100 Trial Lawyer (2021–now);",
        "- Colorado Super Lawyers: SuperLawyer (top 5% of all lawyers) (2021–now);",
        "- Colorado Super Lawyers: Rising Star (2016–2020);",
        "- 5280 Magazine: Top Lawyer: Plaintiffs’ Personal Injury (2023);",
        "- Martindale: Client Champion Gold (2023–now);",
        "- AVVO: Perfect 10.0 Rating;",
        "- Colorado Trial Lawyers Association: Outstanding Service Award (2021);",
        "- American Society of Legal Advocates: Top 40 under 40 (2015);",
        "- Colorado Bar Foundation: Fellow (2014);",
        "- Colorado Bar Association: Pro Bono Award (2014);",
        "- U.S. District Court for the District of Colorado: Pro Bono Award (2014);",
        "- Colorado Bar Association Leadership Training program (Graduate 2013).",
        "Since graduating law school in the top 25% of his class from the University of " +
        "Denver Sturm College of Law in 2010, Tim has trained with some of the country’s " +
        "best trial lawyers at renowned institutions like the Trial Lawyers College; the " +
        "Lanier Trial Academy; and the Ethos Institute, to name just a few.",
        "Tim is actively involved in both the legal community and the community at large. " +
        "Tim previously served as a Co-Chair for CTLA’s Amicus Committee from 2021 to " +
        "2023. He also served as a Co-Chair for CTLA’s New Lawyers Division and CTLA’s " +
        "Seminar Committee; as a Mentor for City Year Denver (2018–2020); as a board " +
        "member and Treasurer for Youth on Record (2012–2017); as President of the " +
        "Colorado Lawyer Chapter of the American Constitution Society (2013–15); and as a " +
        "Council Member of the Colorado Bar Association Young Lawyers Division (2012–14). " +
        "Tim has also been a member of the American, Colorado, Denver, and Arapahoe " +
        "County Bar Associations; the American Association for Justice; the Colorado " +
        "Trial Lawyers Association; the Faculty of Federal Advocates; and the Plaintiffs’ " +
        "Employment Lawyers Association.",
        "While attending law school, Tim worked as a research assistant for three " +
        "professors and completed multiple prestigious internships including one with the " +
        "Office of Legal Counsel of Governor Bill Ritter, Jr., and another with Judge Ed " +
        "Bronfin of the Denver District Court. Tim also won a scholarship during law " +
        "school to attend The Hague Academy of International Law and had his winning " +
        "paper published in the Denver Journal of International Law & Policy. Upon " +
        "graduation, Tim clerked for Judge A. Bruce Jones of the Denver District Court, " +
        "serving on both civil and domestic relations dockets.",
        "A native of New Jersey, but a proud Colorado resident since 1989, Tim enjoys all " +
        "that living in the Mile High City has to offer, including a thriving arts scene " +
        "and easy access to the Rocky Mountains. Tim also enjoys traveling to new " +
        "destinations and exploring new cultures. Prior to attending law school, Tim " +
        "spent nearly a decade managing one of the country’s best independent record " +
        "stores (Twist & Shout Records), while simultaneously running a small " +
        "Denver-based record label (Public Service Records), DJ’ing at several weekly " +
        "events, and owning a cheesesteak restaurant (Taste of Philly) with his twin " +
        "brother.",
        "Notable Cases:",
        "- Johnson v. KGPCo, 2024CV30665 (Denver Dist. Ct., July 29, 2025) ($8.26M jury " +
        "verdict for man who suffered a moderate brain injury in an e-scooter crash)",
        "- Lieberenz v. Board of County Commissioners, 1:21-CV-628-NYW-NRN (D. Colo., " +
        "Apr. 10, 2025) ($4M jury verdict for estate of man who died by suicide in a " +
        "county jail)",
        "- Tibbits v. Jasion, 2022CV31347 (Denver Dist. Ct., May 28, 2024) ($2.5M " +
        "post-trial settlement for client injured in a five-car pileup)",
        "- Covelli v. Toyota, 23CA1767 (Colo. Ct. App. 2024) (amicus counsel for " +
        "plaintiff in a roof collapse case where the jury awarded damages of over $40M)",
        "- Watson v. EMC Corp., 2024WL501610 (10th Cir. 2024) (ERISA life insurance claim " +
        "involving novel equitable remedy of surcharge)",
        "- Fear v. GEICO Cas. Co., 2023 COA 31 (amicus counsel for plaintiff in landmark " +
        "case involving the admissibility of insurer’s internal evaluation in insurance " +
        "bad faith claims)",
        "- Gebert v. Sears, Roebuck & Co., 2023 COA 107 (amicus counsel for plaintiff in " +
        "case affirming district court’s $1.1M judgment for injuries caused by a miswired " +
        "stove)",
        "- Confidential pre-trial seven-figure settlement for man injured by a runaway " +
        "tractor trailer (2023)",
        "- Confidential post-trial seven-figure settlement for woman injured in a crash " +
        "with a food delivery driver (2023)",
        "- Ford Motor Co. v. Forrest Walker, 2022 CO 32 (amicus counsel for plaintiff in " +
        "a car crash case involving proper calculation of interest for $2.9M judgment)",
        "- Brown v. Long Romero, 2021 CO 67 (amicus counsel for case where the Supreme " +
        "Court overturned the district court’s ruling that the parents of a child who " +
        "died in birth could not hold the birthing center accountable for negligent " +
        "hiring of nurse-midwife involved in the child’s wrongful death)",
        "- Ellis v. Liberty Life Assur. Co. of Boston, 958 F.3d 1271 (10th Cir. 2020) " +
        "(ERISA LTD claim)",
        "- Auwae v. Metro. Life Ins. Co., 441 F.Supp.3d 1188 (D. Colo. 2020) (defeating " +
        "insurer’s motion to dismiss life insurance claim involving suicide)",
        "- Amica Life Ins. Co. v. Wertz, 2020 CO 29 (amicus counsel for life insurance " +
        "claim involving a suicide exclusion)",
        "- Renfandt v. N.Y. Life Ins. Co., 2018 CO 49 (amicus counsel for plaintiff in " +
        "case where Colorado Supreme Court held that “under Colorado law, a life " +
        "insurance policy exclusion for ‘suicide, sane or insane’ excluded coverage only " +
        "if the insured, whether sane or insane at the time, committed an act of " +
        "self-destruction with the intent to kill himself.”)",
        "- DonMoyer v. Quanta Services, Inc., 2017WL5191803 (D. Colo. 2017) (defeated " +
        "employer’s motion for summary judgment regarding male client’s retaliation claim " +
        "for hiring and promoting women within the company)",
        "- Estate of Roemer v. Johnson, 764 Fed. Appx. 784 (10th Cir. 2019) (represented " +
        "the estate of a man murdered by his cellmate in the estate’s claims against the " +
        "government)",
        "- Spokas v. Am. Family Mut. Ins. Co., 2015WL3948098 (D. Colo. 2015) ($2.2M " +
        "judgment in insurance bad faith matter)",
        "- Am. Family Mut. Ins. Co. v. Green-Tillman, 2014CV30642 (Adams County Dist. " +
        "Ct., Apr. 21, 2015) ($215,000 judgment in insurance breach of contract case)",
        "- Casper v. Guarantee Trust Life Ins., 2014WL8726761 (Pueblo County Dist. Ct., " +
        "June 15, 2014) ($4.8M jury award for cancer patient with a $50,000 cancer " +
        "insurance policy) (affirmed on appeal to the Colorado Supreme Court Guarantee " +
        "Trust Life Ins. Co. v. Casper, 2018 CO 43)",
        "- Lacroix v. Beverage Distributors Co., 2014WL7184283 (Adams County Dist. Ct., " +
        "May 16, 2014) ($200,000 jury award for client served drain cleaner with his beer " +
        "at a restaurant, damaging his esophagus)",
    ),
    education: [
      "Metropolitan State University of Denver — B.A. in Sociology",
      "University of Denver Sturm College of Law — J.D.",
    ],
    links: [
      {
        _key: "trucking",
        label: "Trucking Settlement: $1,150,000",
        href: blogPath("trucking-settlement-1150000"),
      },
      {
        _key: "multi-car",
        label: "Multi-Car Crash $2.51 Million Verdict",
        href: "https://www.thectlc.com/episode/sean-dormer-and-tim-garvey-2-51-million-verdict-after-multi-car-crash-in-denver",
      },
      {
        _key: "wrongful-death",
        label: "Wrongful Death Case",
        href: blogPath(
          "national-hotel-brand-neglects-medical-emergency-of-guest-resulting-in-death"
        ),
      },
      {
        // The live site's own link carries a `refPageViewId` tracking parameter
        // from whatever session copied it; it is not part of the address.
        _key: "findlaw",
        label: "FindLaw",
        href: "https://lawyers.findlaw.com/profile/lawyer/timothy-m-garvey/co/denver/NDY3OTcyNV8x/PP",
      },
      {
        _key: "super-lawyers",
        label: "Super Lawyers",
        href: "https://profiles.superlawyers.com/colorado/denver/lawyer/timothy-garvey/bda7325e-435c-4602-9623-c9896967057c.html",
      },
    ],
  },
  {
    slug: "laura-browne",
    body: pt(
        "Laura is an experienced personal injury attorney who has successfully resolved " +
          "hundreds of cases where her clients were injured through the negligence of others.",
        "Laura Browne is originally from Cape Girardeau, Missouri. She attended the " +
        "University of Missouri (Mizzou) where she earned degrees in Political Science " +
        "and History before going on to complete her law degree. Laura is licensed to " +
        "practice law in Missouri and Colorado.",
        "While in law school, Laura worked in her school’s Family Violence Clinic which " +
        "allowed her to get into the courtroom early, and help victims of domestic " +
        "violence and custody disputes. She was also a Note and Comment Editor of the " +
        "Journal of Dispute Resolution, in which she was published in 2010.",
        "After graduating law school in 2012, Laura joined the Public Safety Division of " +
        "the Office of the Missouri Attorney General, focusing on habeas corpus and " +
        "special prosecutions. Feeling dissatisfied with that role, she moved to Denver " +
        "in 2013 in order to experience the beautiful outdoors and find a position that " +
        "suited her desire to help people. Laura started her legal career in Colorado at " +
        "one of the highest volume and most well-known personal injury firms in the " +
        "state. After spending several years gaining experience and knowledge through " +
        "that firm, Laura moved on to a mid-size personal injury firm and focused solely " +
        "on litigation. Laura’s time as a personal injury litigation attorney allowed her " +
        "access to the courtroom, and she participated in multiple jury trials in that " +
        "position. Laura has represented hundreds of injured people and secured tens of " +
        "millions of dollars in compensation for them.",
        "As a Denver personal injury attorney, Laura is passionate about standing up for " +
        "those who cannot stand up for themselves, and providing injured people power " +
        "against large insurance companies who seek to take advantage of them. She has " +
        "experienced both the large and small personal injury firm environments in her " +
        "practice and can attest that the large, high-volume firms often simply do not " +
        "have the ability to truly take the time needed to get the most value out of your " +
        "case.",
        "Laura is an active member of the Colorado Trial Lawyers Association and the " +
        "Women Trial Lawyers’ Network. When she’s not working, Laura enjoys spending time " +
        "with her two young daughters and two dogs, Mia and Molly.",
    ),
    education: [
      "University of Missouri — B.A. in Political Science and History",
      "University of Missouri School of Law",
    ],
  },
  {
    slug: "jessica-mauser",
    body: pt(
        "Jessica Mauser joined the Dormer Harpring team in early 2024. She is motivated by " +
          "representing clients who have suffered injuries due to the negligence of another.",
        "Jessica Mauser is a Colorado native whose childhood dream was to practice law. " +
        "She attended Cornell College where she earned a degree in Political Science " +
        "before going on to complete her law degree at the Appalachian School of Law in " +
        "Virginia.",
        "While in law school, Jessica was involved in various groups and organizations. " +
        "She was a staff member of the Appalachian Journal of Law. She was awarded her " +
        "Third Year Practice Certificate by the Commonwealth of Virginia where she " +
        "assisted local attorneys on legal matters both inside and outside of the " +
        "courtroom. Jessica was a member of the Dean’s List for multiple semesters and " +
        "was awarded the Willard Owens Award in 2014 for her 300+ hours of community " +
        "service to Buchanan County in Virginia. Jessica graduated in the top 10% of her " +
        "class in 2014.",
        "While chasing her dream to practice law led Jessica to different parts of the " +
        "country, she always knew that Colorado was home and where she wanted to practice " +
        "law. Jessica spent her law school summers in Colorado clerking for the Honorable " +
        "Magistrate Carolyn McLean in the 20th Judicial District and for the Honorable " +
        "Judge John E. Popovich in the 17th Judicial District where she soon learned that " +
        "practicing law was a work of art and not for the faint of heart. It has been " +
        "Jessica’s goal throughout her practice is to make sure that every voice is " +
        "heard. That no story is left untold. That no harm goes unnoticed.",
        "As a Denver personal injury attorney, Jessica’s passion is guided by her " +
        "strong-will to advocate for victims harmed by another’s wrongdoing. Her " +
        "dedication and ambition enable her to carry out her mission. Jessica’s clients " +
        "are real people who have suffered real injuries. While no amount of time or " +
        "money can compensate a person for harm to their health and well-being, Jessica’s " +
        "mission is to make sure each person’s voice is heard.",
        "She is admitted to practice law in the State of Colorado as well as the United " +
        "States District Court for the District of Colorado. Jessica is an active member " +
        "of Colorado Bar Association, Colorado Trial Lawyers Association, the Women’s " +
        "Trial Lawyer Network, and American Association for Justice. When she is not " +
        "working, Jessica enjoys spending time with her husband and children, golfing, " +
        "playing softball and cheering on the Denver Broncos.",
    ),
    education: [
      "Cornell College — Political Science",
      "Appalachian School of Law",
    ],
  },
  {
    slug: "amy-rogers",
    body: pt(
        "Amy Rogers combines her extensive legal expertise with a compassionate approach to " +
          "representing clients in complex personal injury cases across Denver and Colorado.",
        "Ms. Rogers earned her Juris Doctor with honors from West Virginia University " +
        "College of Law. During her time in law school, Ms. Rogers was actively involved " +
        "in the Immigration Law Clinic, where she represented clients seeking asylum in " +
        "the United States and successfully appealed a Board of Immigration Appeals " +
        "decision to the Seventh Federal Circuit Court of Appeals. While at WVU College " +
        "of Law, Ms. Rogers participated on the WVU Moot Court National Team, the WVU " +
        "Jessup International Law Trial Team, and in the Annual Lugar Trial Competition, " +
        "in which she won first place. Ms. Rogers’ educational background complements her " +
        "current trial practice, as she ensures that each client’s story is not only " +
        "heard, but told.",
        "In her practice, Ms. Rogers is known for her empathetic approach and resilience " +
        "in seeking justice for her clients, especially for those facing challenging " +
        "circumstances. Her personal experience with a family member’s traumatic injury " +
        "deeply informs her approach to legal representation, driving her to fight " +
        "vigorously for those affected by similar circumstances. Testimonials from " +
        "clients highlight her exceptional dedication and ability to secure favorable " +
        "outcomes, reflecting her strong work ethic and deeply rooted values.",
        "Professionally, Ms. Rogers is an active member of several legal associations, " +
        "such as the Colorado Bar Association, the Colorado Trial Lawyers Association, " +
        "and the Women Trial Lawyer Network. Her contributions to the local legal " +
        "community have been recognized through various honors, such as being named to " +
        "the Best Lawyers: Ones to Watch list. Most recently, Ms. Rogers was selected to " +
        "participate in and graduated from the Colorado Bar Association COBALT Leadership " +
        "Program. Ms. Rogers’ active role in her organizations, coupled with her " +
        "accolades, underscores her commitment to legal excellence and advocacy.",
        "Through her professional endeavors and community engagement, she exemplifies a " +
        "balanced approach to life and law, advocating tirelessly for her clients while " +
        "contributing positively to her community. In her free time, Amy helps to " +
        "organize Voter Registration Drives in Colorado for a non-partisan non-profit. " +
        "She also enjoys hiking, camping, and enjoying all that colorful Colorado has to " +
        "offer.",
    ),
    education: [
      "West Virginia University College of Law",
    ],
  },
  {
    slug: "greg-bentley",
    body: pt(
        "Greg Bentley is a skilled and dedicated trial lawyer with a proven track record of " +
          "advocating for his clients. As Dormer Harpring’s primary trucking attorney, he " +
          "represents clients in complex trucking and transportation cases, bringing deep " +
          "industry knowledge and strategic courtroom experience to every case.",
        "Greg Bentley is a civil trial lawyer with substantial experience in complex " +
        "civil and commercial litigation. He primarily focuses on helping clients who " +
        "have suffered catastrophic injuries and represents clients in state and federal " +
        "courts in Colorado and throughout the country. Greg has developed specific " +
        "expertise in cases involving commercial trucking crashes and in helping clients " +
        "who have suffered traumatic brain injuries.",
        "Each case is unique, and Greg enjoys mastering the specific facts and legal " +
        "issues of each case. His experience extends across a broad variety of cases, " +
        "including class actions, products liability, consumer protection, abuse in " +
        "sports, real estate litigation, and business disputes. He has helped clients " +
        "with issues across an array of industries, including transportation and " +
        "commercial trucking, pharmaceutical drugs and medical devices, nursing homes and " +
        "assisted living facilities, telecommunications and technology, sports and " +
        "entertainment, hemp and CBD, and financial services. He has worked closely with " +
        "key scientific and medical experts from fields such as neurology, orthopedics, " +
        "embryology, cardiology, urology, genetics, epidemiology, and statistics.",
        "Greg has assisted clients across the country in seeking justice for injuries " +
        "caused by defective medical products. He was an important member of the trial " +
        "teams for a number of bellwether trials in the birth defect and polypropylene " +
        "mesh mass tort litigations. He has represented families regarding birth defect " +
        "injuries caused by selective serotonin reuptake inhibitor antidepressants " +
        "(SSRIs) and anticonvulsant medications. He has represented women and men injured " +
        "by the implantation of polypropylene mesh, metal on metal hip implants, and " +
        "inferior vena cava filter implants (IVC).",
        "Representative cases include:",
        "- Obtained $8,260,000 jury verdict for client who suffered traumatic brain " +
        "injury and spinal injuries in an e-scooter crash on a public sidewalk involving " +
        "claims under the Colorado Premises Liability Act (PLA)",
        "- Obtained favorable settlement for client who suffered life-altering injuries " +
        "after crash with semi truck",
        "- Assisted in obtaining 8-figure global settlement for persons injured in " +
        "commercial truck crash involving catastrophic injuries and death",
        "- Obtained 7-figure settlement for client catastrophically injured in motorcycle " +
        "crash",
        "- Obtained 7-figure settlement for client who suffered traumatic brain injury in " +
        "scooter crash",
        "- Appointed class counsel and obtained 7-figure class-wide settlement for " +
        "thousands of patients who underwent surgery during years-long sterilization " +
        "breach at hospital",
        "- Obtained favorable jury verdict in construction dispute involving claims for " +
        "breach of contract, construction defect, violation of Colorado Consumer " +
        "Protection Act (CCPA), and veil piercing",
        "- Obtained favorable resolution of class action involving consumer protection " +
        "claims against national hardware retail",
        "- Obtained favorable resolution against hotel management company for injuries " +
        "caused by failure to safely maintain property, involving claims for violation of " +
        "Colorado Premises Liability Act, veil piercing, and evidence spoliation",
        "- Assisted clients in investigating and resolving claims regarding violations of " +
        "the Americans with Disability Act (ADA)",
        "- Assisted employees in obtaining unpaid commission and compensation under " +
        "Colorado Wage Claim Act (CWCA)",
        "Greg has been designated “Top Rated Class Action & Mass Torts Attorney” and " +
        "selected to Rising Stars (2018-2020) and Super Lawyers (2023-2025) by Colorado " +
        "Super Lawyers®.",
    ),
    education: [
      "St. Edward’s University — Finance",
      "University of Texas at El Paso — Masters of Business Administration",
      "University of Denver Sturm College of Law — J.D.",
    ],
    links: [
      {
        _key: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/gregorydbentley/",
      },
      {
        _key: "super-lawyers",
        label: "Super Lawyers",
        href: "https://profiles.superlawyers.com/colorado/denver/lawyer/greg-bentley/c41a557a-20c3-41cd-abd5-054db9225cf2.html",
      },
      {
        _key: "avvo",
        label: "Avvo Profile",
        href: "https://www.avvo.com/attorneys/80203-co-gregory-bentley-3413253.html",
      },
      {
        _key: "martindale",
        label: "Martindale",
        href: "https://www.martindale.com/attorney/gregory-bentley-169116456/",
      },
    ],
  },
  {
    slug: "marcie-emch",
    lede:
      "I enjoy being a paralegal and doing the work behind-the-scenes. The wins belong to " +
      "the clients and trial team, and I am genuinely happiest when the work I did is " +
      "invisible because it worked.",
    body: pt(
        "Marcie was born and raised in Metro Detroit and began her legal career in 2003. " +
        "Since joining Dormer Harpring in 2019, Marcie has been a dedicated litigation " +
        "paralegal who takes pride in supporting clients and the team through every stage " +
        "of a case. She is committed to being prepared, organized, and dependable so the " +
        "attorneys and clients she supports can focus on achieving the best possible " +
        "result.",
        "Outside of work, Marcie enjoys listening to music, attending concerts and " +
        "sporting events, visiting Colorado breweries, and reading in her free time. She " +
        "also loves spending time with her friends and her cat, Johan.",
    ),
  },
  {
    slug: "kassandra-burival",
    lede:
      "Her true passion lies in serving clients throughout the complex legal process. At " +
      "Dormer Harpring, Kassandra’s goal is simple: to fight hard for every client, " +
      "ensuring they receive the justice they deserve.",
    body: pt(
        "With several years of experience in the field, Kassandra came to Dormer Harpring " +
        "from a big, well-known Personal Injury firm with a large caseload and billboards " +
        "on every major road in the state. She knows that clients deserve more – which is " +
        "exactly what she provides. Working well under pressure is second nature to her, " +
        "thanks to her past experience.",
        "At Dormer Harpring, our clients come first, and Kassandra embodies that " +
        "philosophy. Her kind, compassionate approach makes our clients feel right at " +
        "home, while her dedication to fighting for their rights is unwavering. Kassandra " +
        "is a Denver native and proud dog mom to Pablo. When she’s not working hard in " +
        "the office, she enjoys traveling, trying new restaurants, enjoying margarita " +
        "flights, and cherishing time with loved ones.",
    ),
    education: [
      "Front Range Community College — Paralegal Studies Program",
    ],
  },
  {
    slug: "brittany-freeman",
    lede:
      "Brittany enjoys assisting clients and ensuring their comfort throughout their " +
      "personal injury cases.",
    body: pt(
        "Brittany was born in New Jersey and grew up in South Florida. She graduated from " +
        "Florida State University, where she earned a degree in Political Science and a " +
        "passion for civil and voting rights issues. After graduating, she began working " +
        "at a prominent Personal Injury firm in Fort Lauderdale, Florida, and quickly " +
        "became an integral part of their trial teams. In addition to her paralegal role, " +
        "Brittany gained experience facilitating in-house focus groups, mock trials, mock " +
        "voir dire trainings, and helped develop and implement new systems for jury " +
        "research.",
        "Since 2020, Brittany has been a member of a national plaintiff’s attorney and " +
        "paralegal organization that focuses on product liability, trucking, and other " +
        "complex cases. She has spoken at conferences across the country, and regularly " +
        "contributes to the paralegal section magazine, both as a writer and on the " +
        "editing subcommittee. In 2025 she was selected as a Board member for the " +
        "paralegal section, allowing her to be more closely involved in a community that " +
        "fosters collaboration between plaintiff’s firms in order to best represent their " +
        "clients.",
        "Outside of work Brittany enjoys practicing yoga, soaking up the sun at the " +
        "beach, and is on a journey to find the best tasting decaf coffee. Her sweet dog " +
        "Kylo is basically her shadow, she always has a book within reach, and as a " +
        "backpacker at heart, she is always planning new trips to take with her partner " +
        "and their dog.",
    ),
    education: [
      "Florida State University — Political Science",
    ],
  },
  {
    slug: "cindy-waller",
    lede:
      "Cindy is passionate in advocating for, guiding and empowering injured clients " +
      "through their healing and legal personal injury journey.",
    body: pt(
        "Cindy was born and raised in northern Minnesota and attended the College of " +
        "Saint Teresa in Winona, MN. After living on Maui for 7 years she moved to the " +
        "Denver Metro area. Cindy’s interest in law began in high school when she " +
        "interned at a local law firm. She narrowed her legal specialty to complex " +
        "personal injury law in 2002. Cindy looks forward to compassionately connecting " +
        "with clients and fiercely fighting for and on their behalf. Cindy is a member of " +
        "the Colorado Trial Lawyers Association Legal Staff Committee and Rocky Mountain " +
        "Paralegal Association.",
        "Outside of work, Cindy is a somatic movement instructor of a fitness fusion " +
        "class which combines martial arts, dance and the healing arts of Yoga, " +
        "Feldenkrais and Alexander Technique. A lover of big water, Cindy is most at home " +
        "on, in or near the ocean where she can dance on the beach, paddleboard, snorkel " +
        "and swim. She and her husband enjoy visiting their daughters in California, " +
        "traveling to Costa Rica and neighborhood hikes with their dog Mika.",
    ),
  },
  {
    slug: "brittany-lesmeister",
    body: pt(
        "Brittany was born and raised in Colorado and has built her career in the Denver " +
        "Metro area. She graduated from the University of Colorado Denver with a degree " +
        "in Political Science, where she developed a strong interest in the legal field. " +
        "Drawn to the opportunity to make a difference in people’s lives, she began her " +
        "career in personal injury law and has since focused on helping clients navigate " +
        "complex cases with dedication and compassion.",
        "She is committed to providing both attentive support and strong advocacy, " +
        "ensuring that clients feel understood and well represented throughout the legal " +
        "process.",
        "Outside of work, Brittany enjoys an active and adventurous lifestyle. She spends " +
        "her winters snowboarding in the Colorado mountains and looks forward to scuba " +
        "diving whenever she has the chance. Traveling is a favorite passion, with Costa " +
        "Rica and Cozumel among her most loved destinations. At home, Brittany enjoys " +
        "life with her husband, teenage son, and their three dogs, often spending time " +
        "outdoors on neighborhood walks and lake days together.",
    ),
    education: [
      "University of Colorado Denver — Political Science",
    ],
  },
  {
    slug: "julie-altenhofen",
    lede:
      "Julie cares about people and their experiences, works relentlessly for her " +
      "clients, and helps the team at Dormer Harpring to get the best results possible.",
    body: pt(
        "Julie was born and raised in Menasha, WI. She attended the University of " +
        "Wisconsin–Madison, graduating in 2016 with a bachelor’s degree in Legal Studies " +
        "and a minor in Criminal Justice. After spending a summer interning within the " +
        "Wisconsin prison system, she began her legal career that fall, working for three " +
        "years as a legal assistant at a large personal injury firm in Madison. It was " +
        "there that she discovered her passion for helping people whose lives had been " +
        "upended by unforeseen injury.",
        "In 2019, Julie and her then-fiancé (now husband) moved to Colorado, a place " +
        "they’d both fallen in love with after years of visiting. That’s when she joined " +
        "Dormer Harping as a personal injury paralegal. In fall 2020, Julie and her " +
        "husband relocated back to Wisconsin to be closer to family during the pandemic, " +
        "and she now continues her work with the firm fully remote.",
        "Outside the office, Julie enjoys hiking with her husband and dogs, Tenney and " +
        "Breezy. She’s an avid reader who also loves yoga, cooking, gardening, and " +
        "spending time with family.",
    ),
    education: [
      "University of Wisconsin Madison — B.S. in Legal Studies",
    ],
  },
  {
    slug: "ashley-reisman",
    lede:
      "Ashley is a motivated pre-litigation paralegal at Dormer Harpring who started in " +
      "July 2024. She brings a wealth of experience and a passion for investigation to " +
      "her role.",
    body: pt(
        "Ashley graduated from Colorado State University, where she received her " +
        "bachelor’s degree in health and exercise science, enabling her to understand her " +
        "clients dealing with significant injuries. After graduating, she first worked as " +
        "a private investigator and, in the process, fell in love with the legal field.",
        "She became a paralegal in 2015, assisting attorneys in case management. Ashley " +
        "is committed to providing in-depth support to clients and attorneys, ensuring " +
        "that each case receives the utmost attention and care it deserves. " +
        "Unsurprisingly, given her background, Ashley’s favorite part of the job is the " +
        "investigation aspect of digging in and uncovering crucial information to support " +
        "her clients’ cases.",
        "Ashley moved from Colorado to Tennessee in 2021. You can find her hiking, " +
        "exploring, and traveling in her free time with her dog Ivy in tow and camera in " +
        "hand. When she’s not capturing emotions and moments through a lens, she also " +
        "enjoys spending time on the lake with family and friends.",
    ),
    education: [
      "Colorado State University — Health and Exercise Science",
    ],
  },
  {
    slug: "david-garber",
    body: pt(
        "David is a devoted and adept paralegal who has been in the industry since 2020. " +
        "David graduated from the University of Central Florida with his BA in History " +
        "and Legal Studies. Following graduation, he worked as a paralegal and intake " +
        "specialist at a small personal injury law firm in Florida, where he developed " +
        "his legal knowledge and compassion for the injured. He spent two years working " +
        "as a paralegal in the mass tort fighting for victims of defective products and " +
        "toxic exposure.",
        "Wanting to be in a more hands on position, David made his transition back into " +
        "single event personal injury law where he could witness the positive change " +
        "firsthand. David is highly motivated and always strives for the absolute best " +
        "results in the cases he handles.",
        "In his spare time, David enjoys reading, creative writing, and spending time " +
        "with dogs.",
    ),
    education: [
      "University of Central Florida — BA in History and Legal Studies",
    ],
  },
  {
    slug: "abby-houk",
    lede:
      "As an Intake Specialist at Dormer Harpring, Abby brings a wealth of empathy and " +
      "problem-solving skills to every call she handles.",
    body: pt(
        "Abby was born and raised in Vero Beach, Florida, and recently moved to Colorado " +
        "with her partner, who is attending Law School at CU Boulder. She graduated from " +
        "the University of Central Florida in December of 2023 with a BA in Political " +
        "Science, a minor in Global Peace, and certificates in both Diplomacy and " +
        "Intelligence & National Security. In a few years, she is eager to attend law " +
        "school after gaining an understanding of the field and where she would like to " +
        "fit into it.",
        "Abby has always been driven to help people in any way she knows how, and learns " +
        "quickly when she does not. Her initial career interests were in healthcare, " +
        "having earned her Certified Nursing Assistant and Phlebotomy licenses as a " +
        "dual-enrollment student in high school in anticipation of being a nurse. While " +
        "working as a home health aide with the local hospice house, the world slipped " +
        "into a global pandemic. She quickly realized that her skills could be utilized " +
        "in a different profession, and switched her focus and degree path to law. While " +
        "obtaining her degree, she worked as a server and bartender in Orlando at " +
        "high-end restaurants, sharpening her hospitality skills and daily applying her " +
        "love for people.",
        "When she is not in the office, you can find her running around in the mountains " +
        "with her partner, doing yoga, or at her local climbing gym! Staying active and " +
        "moving her body is a large part of her free time. Music has always been an " +
        "integral part of her personality, and she is always seeking out new artists and " +
        "any chance to catch a live performance.",
    ),
  },
  {
    slug: "jessica-ayala",
    lede:
      "Jessica brings a diverse background and a compassionate approach to her role as an " +
      "Intake Specialist.",
    body: pt(
        "With a degree in Music and experience as a classical musician and English " +
        "teacher, she made a bold shift into the legal field driven by a desire to " +
        "explore new and challenging paths. Prior to joining Dormer Harpring, she worked " +
        "at one of Florida’s leading personal injury law firms, handling cases involving " +
        "medical and dental malpractice, criminal defense, funeral home neglect, and " +
        "motor vehicle accidents.",
        "Fluent in English and Spanish, and with a working knowledge of several other " +
        "languages, Jessica prioritizes clear, empathetic communication with every " +
        "client. Her ability to connect across cultures and her commitment to honesty and " +
        "loyalty guide her approach to intake. Outside of work, she enjoys reading, " +
        "writing and composing music, and continually seeking out new ways to grow both " +
        "personally and professionally.",
    ),
  },
  {
    slug: "livi-lesch",
    lede:
      "Livi helps bridge people, processes, and technology so our team can stay focused " +
      "on providing strong, compassionate representation to our clients.",
    body: pt(
        "After graduating from Elon University with degrees in Journalism and Statistics, " +
        "Livi joined Dormer Harpring as a Receptionist and quickly grew into her current " +
        "role as Office Manager. Her background in fact-checking, editorial work, data " +
        "analysis, and team leadership gives her a unique mix of communication, " +
        "organization, and problem-solving skills that she brings to the firm’s daily " +
        "operations.",
        "As Office Manager, Livi works behind the scenes to support the people, systems, " +
        "and processes that keep Dormer Harpring running smoothly. She helps coordinate " +
        "firmwide projects, improve internal workflows, strengthen reporting systems, and " +
        "support the team so they can stay focused on providing thoughtful, high-quality " +
        "representation to clients. She enjoys turning complex problems into clear " +
        "processes and is always looking for ways to make the firm more efficient, " +
        "organized, and collaborative.",
        "Outside of work, Livi loves to cook, craft, garden, spend time in nature, and " +
        "give her four cats the best life possible.",
    ),
    education: [
      "Elon University — Journalism and Statistics",
    ],
  },
  {
    slug: "leana-kim",
    lede:
      "As Dormer Harpring’s Office Assistant, Leana finds fulfillment in making our " +
      "clients feel at home when they visit the office.",
    body: pt(
        "Leana was born and raised on the island of Oʻahu, Hawaiʻi, and earned her " +
        "Bachelor’s degree in Finance from the University of Hawaiʻi at Mānoa.",
        "During her undergraduate studies, Leana participated in a study abroad program " +
        "in Prague, Czech Republic. This experience allowed her to connect with " +
        "individuals from diverse backgrounds and cultures, and to explore her interests " +
        "through several law-focused courses. It was during this time that she discovered " +
        "a passion for building meaningful relationships and making a positive impact in " +
        "the lives of others.",
        "Leana also gained valuable experience as a Development Operations Intern, where " +
        "she developed key skills that continue to support her in her professional " +
        "journey. She is committed to continuous improvement and is always seeking new " +
        "opportunities to grow both personally and professionally.",
        "In her free time, Leana enjoys reading, traveling, hiking, and embracing new " +
        "experiences. She is often found researching unique destinations and planning her " +
        "next global adventure.",
        "As part of the Dormer Harpring team, Leana Kim supports clients with dedication, " +
        "helping to provide compassionate assistance throughout their journey.",
    ),
    education: [
      "University of Hawai’i at Manoa — B.B.A in Finance",
    ],
  },
  {
    slug: "maddy-ricciardi",
    lede:
      "As our Controller, Maddy’s approach to finance is rooted in collaboration and " +
      "building strong internal structures so the team can focus on what matters most, " +
      "helping clients.",
    body: pt(
        "Originally from Milwaukee, Wisconsin, Maddy earned her degree in Criminology and " +
        "Law Studies from Marquette University, with minors in Psychology and Sociology. " +
        "Her early experiences as a Criminal Intelligence Analyst intern and later as a " +
        "Legal Assistant deepened her understanding of both the legal system and the " +
        "people it serves.",
        "After four years in legal support roles, Maddy transitioned into finance " +
        "management, combining her analytical mindset with her commitment to integrity " +
        "and collaboration. Before joining Dormer Harpring, she served as Finance Manager " +
        "at a Colorado law firm, where she honed her expertise in budgeting, forecasting, " +
        "and process improvement.",
        "Maddy brings a thoughtful and detail-oriented approach to her work, always " +
        "striving to create clarity and efficiency behind the scenes so the team can " +
        "better serve clients.",
        "Outside of the office, she enjoys skiing, yoga, hiking, and traveling to new " +
        "places around the world.",
    ),
    education: [
      "Marquette University — Criminology and Law Studies",
    ],
  },
  {
    slug: "morgan-jewel",
    lede:
      "As Dormer Harpring’s Law Clerk, Morgan combines her dedication to advocacy with " +
      "hands-on legal experience, helping support clients while pursuing her mission to " +
      "give voice to those who need it most.",
    body: pt(
        "Morgan, a native of Austin, Texas, is currently pursuing her Juris Doctor degree " +
        "as a candidate at the University of North Texas Dallas College of Law. Her " +
        "academic journey began at Texas A&M University, where she earned her " +
        "undergraduate degree in Sociology with a minor in Business.",
        "Driven by a lifelong aspiration to advocate for those unable to speak for " +
        "themselves, Morgan has actively sought opportunities to make a positive impact " +
        "in her community. During her time in law school, she has gained valuable " +
        "experience assisting foster care nonprofits. This commitment to helping others " +
        "stems from her early determination to become an attorney and make a difference " +
        "in people’s lives.",
        "Beyond her academic pursuits, Morgan is deeply committed to community service, " +
        "regularly volunteering for various legal clinics and nonprofits in her free " +
        "time. When not studying or volunteering, Morgan enjoys spending time with her " +
        "dog, Yogi Bear.",
    ),
  },
  {
    slug: "rachel-pavelko",
    lede:
      "As a Law Clerk, Rachel combines her extensive history in social services and " +
      "mental health with a passion for advocating through legal writing and providing " +
      "compassionate, trauma-informed support.",
    body: pt(
        "Rachel holds a Bachelor’s degree in Communication and a Master’s degree in " +
        "Education Policy from the University of Wisconsin-Milwaukee. After working for " +
        "over a decade in social services, education and mental health, she chose to " +
        "pursue law school, driven by a dedication to bringing a trauma-informed lens to " +
        "legal advocacy. Rachel is currently completing her J.D. at Mitchell Hamline " +
        "School of Law, where she thrives in its Blended program. By successfully " +
        "navigating this hybrid of remote and in-person learning, she has earned a spot " +
        "on the Law Review and a recurring place on the Dean’s List. Beyond her legal " +
        "studies and work, Rachel remains connected to her professional “roots” by " +
        "serving as a certified Mental Health First Aid Instructor. In this role, she " +
        "facilitates trainings that equip others to effectively support people navigating " +
        "mental health and substance use challenges throughout our community.",
        "Rachel was born and raised in Wisconsin and moved to Colorado in 2012. Like most " +
        "transplants, she enjoys hiking, being active outside and never taking a view of " +
        "the mountains or an alpine lake for granted. She also enjoys cooking, playing " +
        "bocce ball, traveling, spending time with her partner and friends, and keeping " +
        "up with her very needy dog, Layla.",
    ),
    education: [
      "University of Wisconsin-Milwaukee — Bachelor’s in Communication",
      "University of Wisconsin-Milwaukee — Master’s in Education Policy",
      "Mitchell Hamline School of Law — Juris Doctor (J.D.)",
    ],
  },
  {
    slug: "ella-nelson",
    lede:
      "Ella joined the Dormer Harpring team in September 2024, eager to assist clients " +
      "throughout their cases.",
    body: pt(
        "Ella holds a Bachelor’s degree in Interdisciplinary Studies, allowing her to " +
        "delve deeper into the complexities of human behavior and social dynamics.",
        "Ella’s journey took a pivotal turn when she worked as an intake specialist, " +
        "where she had the privilege of assisting clients in navigating their legal " +
        "challenges. This experience sparked her desire to expand her understanding of " +
        "the legal field and become more actively involved in client cases. She believes " +
        "that effective communication is the cornerstone of client satisfaction and " +
        "strives to ensure that every individual feels heard and supported throughout " +
        "their journey.",
        "Dedicated to making a positive impact on people’s lives, Ella approaches each " +
        "interaction with empathy and understanding. Her goal is to empower clients by " +
        "fostering open lines of communication, ensuring they feel informed and confident " +
        "as they navigate their unique situations together.",
    ),
    education: [
      "Central Washington University — Bachelor’s in Interdisciplinary Studies",
    ],
  },
  {
    slug: "michael-greer",
    lede:
      "Michael’s exceptional attention to detail and empathetic approach fuel their " +
      "passion for guiding new clients smoothly into the start of their personal injury " +
      "cases.",
    body: pt(
        "Michael graduated from the University of Minnesota with a degree in history. " +
        "Although they planned on becoming a high school teacher after graduation, they " +
        "quickly discovered that that career was not a good fit and instead ended up " +
        "working at the Volunteer Lawyers Network–a nonprofit that provides pro bono " +
        "legal assistance to impoverished Minnesotans. Working at VLN piqued their " +
        "interest in the law, and so when they moved to Denver they found a job at Dormer " +
        "Harpring.",
        "Outside of work, Michael enjoys reading history, birdwatching with their " +
        "partner, and playing word games.",
    ),
  },
  {
    slug: "marilyn-morales",
    lede:
      "As a Legal Assistant, Marilyn enjoys achieving goals and helping clients stay " +
      "informed and supported throughout every step of their case.",
    body: pt(
        "Marilyn was born and raised in Monterrey, Mexico, where she spent her entire " +
        "life. She earned her Bachelor’s degree in law at the Universidad Autónoma de " +
        "Nuevo León, where she had the opportunity to participate in the bilingual " +
        "program throughout her studies. Her fluency in both English and French has been " +
        "a key asset in her professional development.",
        "With a passion for exploring the many facets of law, Marilyn has continuously " +
        "sought to expand her practice beyond the Mexican legal system. Her professional " +
        "experience is primarily rooted in criminal law, having worked for a law firm " +
        "based in Florida, USA.",
        "Marilyn has a deep love for sports, particularly basketball and soccer, having " +
        "played basketball since junior high school. This passion for athletics has " +
        "inspired her to pursue a Master’s degree in Business Law with a specialization " +
        "in Sports Law. Her drive to combine her legal expertise with her love for sports " +
        "reflects her commitment to setting and achieving new professional goals.",
    ),
    education: [
      "Universidad Autónoma de Nuevo León — Bachelor’s in Law",
    ],
  },
];

/** Undefined for anyone without a profile — today, the two people the live site
 *  has no page for. `getStaticPaths` builds only the pages that exist. */
export async function getTeamProfile(
  slug: string
): Promise<TeamProfile | undefined> {
  return PROFILES.find((profile) => profile.slug === slug);
}

export async function getTeamProfiles(): Promise<TeamProfile[]> {
  return PROFILES;
}
