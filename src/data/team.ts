// The firm's people — attorneys, support staff and the office dogs.
//
// SANITY SWAP POINT — the future `teamMember` collection. ONE type with a
// `kind` discriminator rather than three arrays: the comp keeps `partners`,
// `attorneys` and `staffData` apart and then merges them back together for the
// grid, which means the merge order is code rather than content and a person
// cannot move between groups without an edit in two places.

import type { ImageMetadata } from "astro";
import { pt, type PortableTextBlock } from "./portableText";
import { attorneyPath } from "../lib/routePaths";
import type { VideoRef } from "../lib/video";
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
  /** Only attorneys have a bio page today; everyone else renders as a card. */
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
  return [
    {
      _key: "sean-dormer",
      name: "Sean Dormer",
      role: "Founding Partner",
      kind: "partner",
      photo: seanSm,
      photoLarge: seanLg,
      href: attorneyPath("sean-dormer"),
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
      awards: [
        { _key: "top-20-verdicts", image: awardTop20Verdicts, alt: "TopVerdict Top 20 Jury Verdicts Colorado" },
        { _key: "multi-million", image: awardMultiMillion, alt: "Multi-Million Dollar Advocates Forum" },
        { _key: "avvo-10", image: awardAvvo10, alt: "Avvo Rating 10.0 Superb" },
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
      href: attorneyPath("k-c-harpring"),
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
      name: "Michael Greer",
      role: "Legal Assistant",
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
// something a rebuild should be doing.

export interface AttorneyFact {
  _key: string;
  /** The figure — set in Geist, not the display face. */
  value: string;
  label: string;
}

export interface AttorneyProfile {
  slug: string;
  /** Above the name, e.g. "Attorney · Founding Partner". */
  category: string;
  /** The three-up dark band under the name. Optional — only Sean has them. */
  facts?: AttorneyFact[];
  /** A `> ` paragraph becomes the pull quote. */
  body: PortableTextBlock[];
  /** Degrees, most recent first. Optional: the live site lists none for K.C. */
  education?: string[];
  /** Press and profile links. TODO(launch): these need real destinations. */
  links?: string[];
  /** A profile film, where one exists. */
  video?: { ref: VideoRef; poster: ImageMetadata; alt: string };
}

const PROFILES: AttorneyProfile[] = [
  {
    slug: "sean-dormer",
    category: "Attorney · Founding Partner",
    facts: [
      { _key: "years", value: "20 Years", label: "Trying cases in Colorado" },
      { _key: "slip", value: "$2.1M", label: "Largest slip & fall recovery" },
      { _key: "ctla", value: "CTLA", label: "Trial technique speaker" },
    ],
    body: pt(
        "Sean was most shaped by his tenure as a student attorney in CU Law School’s Defense " +
        "Clinic. The Defense Clinic gave Sean the opportunity to represent clients with " +
        "limited financial means for free, including those facing combinations of both " +
        "criminal and immigration charges.",
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
      "E-Scooter Companies Hit with Lawsuit",
      "Lawsuit Alleges Unconstitutional Mismanagement of Saguache County Jail",
      "Multi-Car Crash $2.51 Million Verdict",
      "2023 Top 20 Colorado Verdicts",
      "The Dangers of Pressure Cookers",
      "Lessons from Defective Helmet Lawsuits",
      "Product Liability Permanent Hearing Damage Lawsuit",
      "Forbes Best Personal Injury Attorneys",
      "Top 100 High Stakes Litigators",
      "Super Lawyers",
    ],
  },
  {
    slug: "k-c-harpring",
    category: "Attorney · Founding Partner",
    body: pt(
        "K.C. has always had a desire to do meaningful work that improves the day-to-day " +
        "lives of real people, as opposed to aiding the bottom line of some large, faceless " +
        "company.",
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
  },
];

/** Undefined for anyone without a profile — which today is everyone but the two
 *  founding partners. `getStaticPaths` builds only the pages that exist. */
export async function getAttorneyProfile(
  slug: string
): Promise<AttorneyProfile | undefined> {
  return PROFILES.find((profile) => profile.slug === slug);
}

export async function getAttorneyProfiles(): Promise<AttorneyProfile[]> {
  return PROFILES;
}
