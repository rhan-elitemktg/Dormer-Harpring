// Verdicts and settlements.
//
// SANITY SWAP POINT — the future `caseResult` collection, and the largest
// content set on the site: 89 records lifted verbatim from the comp.
//
// TODO(sanity): three of these also appear on the homepage in DIFFERENT words.
// The King Soopers slip-and-fall is "Slip and Fall on Melted Snow / Denied /
// $2.1M" here and "Slip & Fall / $250K offered / $2.1M" there. They are the
// same cases and belong in one document each; which wording is right is the
// firm's call, so nothing is reconciled yet.
import { pt, type PortableTextBlock } from "./portableText";

export interface CaseResult {
  _key: string;
  /** The kind of case, e.g. "Rear-End Car Accident". */
  tag: string;
  /**
   * The pill's text. Six values are in use — Trial Win, Settlement, Judgment,
   * Trial Counsel, Co-Counsel, Local Counsel — so this is a string rather than
   * the homepage comp's lone boolean, which could only ever say one of two
   * things.
   */
  badge: string;
  /**
   * Filled pill rather than outlined: won in a courtroom rather than
   * negotiated. Separate from `badge` because the two do not track — a
   * "Trial Counsel" result may be either.
   */
  wonInCourt: boolean;
  /** The insurer's offer before the firm took over. "Denied" and "—" both occur. */
  offered: string;
  /** A figure, or the literal "Confidential". */
  recovered: string;
  story: string;
}

/** Ordered by recovery, largest first. */
export async function getCaseResults(): Promise<CaseResult[]> {
  return [
    {
      _key: "car-crash",
      tag: "Car Crash",
      badge: "Judgment",
      wonInCourt: true,
      offered: "—",
      recovered: "$10M",
      story:
        "Judgment: After taking over the case from another law firm in Denver, we litigated " +
        "and then obtained a judgment for our client who suffered a brain injury in the " +
        "crash.",
    },
    {
      _key: "premises-liability",
      tag: "Premises Liability",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "Denied",
      recovered: "$8.26M",
      story:
        "Our client suffered a moderate traumatic brain injury and serious physical injuries " +
        "after a mangled sidewalk caused him to crash his e-scooter.",
    },
    {
      _key: "car-crash-2",
      tag: "Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$6.5M",
      story:
        "Settlement: A drunk driver crossed into oncoming traffic and struck our client " +
        "head-on, resulting in hip replacements and other less severe injuries. We were asked " +
        "to help by another local personal injury firm. Although the driver was on his way " +
        "home, we successfully argued that he was still in the course of his work. The drunk " +
        "driver’s employer paid for the settlement.",
    },
    {
      _key: "assault",
      tag: "Assault",
      badge: "Judgment",
      wonInCourt: true,
      offered: "—",
      recovered: "$4.6M",
      story:
        "Judgment: After a damages hearing, we were able to obtain a judgment for our client " +
        "who was shot twice at a night club and lives with a bullet still lodged in his " +
        "pelvis.",
    },
    {
      _key: "civil-rights",
      tag: "Civil Rights",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "Denied",
      recovered: "$4M",
      story:
        "Our client’s son was held in a cell after missing a court date on a traffic issue, " +
        "where he tragically passed away. A federal jury determined that the jail and its " +
        "Captain violated our client’s constitutional rights by choosing to be deliberately " +
        "indifferent to his serious medical needs.",
    },
    {
      _key: "rear-end-car-accident",
      tag: "Rear-End Car Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$425K",
      recovered: "Confidential",
      story:
        "Settlement: Confidential settlement following the successful exclusion of Defense " +
        "experts. Hired by a local personal injury firm to act as trial counsel.",
    },
    {
      _key: "side-impact-car-accident",
      tag: "Side-Impact Car Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "Confidential",
      story:
        "Settlement following mistrial: Insurer paid policy limits to our client after a " +
        "demand by our trial team in the days following the mistrial, which was caused by " +
        "Defendant and successfully argued by our team.",
    },
    {
      _key: "car-crash-3",
      tag: "Car Crash",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$50K",
      recovered: "$2.5M",
      story: "Our client suffered injuries in a five-car pileup on the highway.",
    },
    {
      _key: "breach-of-insurance-contract",
      tag: "Breach of Insurance Contract",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$0",
      recovered: "$2.4M",
      story:
        "Hartkopp v. State Farm Insurance. A jury found State Farm owed our client $2,400,000 " +
        "for his injuries in a head-on collision with an uninsured driver in Denver. They " +
        "told the jury he was only owed $60,000.",
    },
    {
      _key: "product-liability",
      tag: "Product Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "Confidential",
      story:
        "Settlement: A bike helmet’s defective retention system failed, leaving our client " +
        "unprotected in a bike accident. The client suffered a head injury. Litigated against " +
        "a well-known, national bike and helmet manufacturer. Defendant agreed to settle on " +
        "the eve of trial.",
    },
    {
      _key: "oil-and-gas-rig-injuries",
      tag: "Oil and Gas Rig Injuries",
      badge: "Co-Counsel",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$2.3M",
      story:
        "Settlement: Our clients were injured by an explosion caused by improper snubbing on " +
        "a drilling rig. Hired by a Texas firm as co-counsel in Colorado.",
    },
    {
      _key: "slip-and-fall-on-melted-snow",
      tag: "Slip and Fall on Melted Snow",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "Denied",
      recovered: "$2.1M",
      story:
        "Slip and fall on melted snow at a national grocery store chain resulting in " +
        "permanent neck and back pain.",
    },
    {
      _key: "boating-injury",
      tag: "Boating Injury",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$25K",
      recovered: "$1.8M",
      story:
        "Settlement: Settlement following successful litigation in Chicago, Illinois with " +
        "local counsel.",
    },
    {
      _key: "car-crash-4",
      tag: "Car Crash",
      badge: "Trial Counsel",
      wonInCourt: true,
      offered: "$150K",
      recovered: "$1.3M",
      story:
        "Settlement: Our client was hit in a head-on collision and suffered a leg injury. " +
        "Hired by a local personal injury firm as trial counsel.",
    },
    {
      _key: "negligence",
      tag: "Negligence",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$1.255M",
      story:
        "Settlement: An employee of a company failed to secure a box of equipment to his " +
        "flatbed truck, and when he turned onto a road, it flew off into the road. Our client " +
        "collided with that box sometime later in the dark, jolting his vehicle upward, " +
        "causing permanent injuries to his back.",
    },
    {
      _key: "landlord-tenant",
      tag: "Landlord Tenant",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$0",
      recovered: "Confidential",
      story:
        "Settlement: Our client was living in an independent apartment at a senior community. " +
        "After our client moved out, the facility refused to refund her deposit of more than " +
        "a half million dollars. Just days before the case was set for trial, the senior " +
        "living community agreed to a confidential settlement to favorably resolve all of our " +
        "client’s claims.",
    },
    {
      _key: "trucking-crash",
      tag: "Trucking Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$200K",
      recovered: "$1.15M",
      story:
        "Settlement: Our client, a former marine with pre-existing injuries, was hit and " +
        "injured by a semi-truck because of the truck’s poorly maintained brakes and " +
        "inability to stop near Colorado Springs.",
    },
    {
      _key: "motor-vehicle-collision",
      tag: "Motor Vehicle Collision",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$1.14M",
      story:
        "Settlement: Our clients were involved in a motor vehicle collision and suffered " +
        "significant injuries. Through dedicated advocacy, we secured a $1,140,000 settlement " +
        "to help them recover and move forward.",
    },
    {
      _key: "premises-liability-dangerous-door",
      tag: "Premises Liability — Dangerous Door",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "$100K",
      recovered: "$1.025M",
      story:
        "Settlement: After a door to a business blew open in a wind storm, striking our " +
        "client in the face and causing her head injuries. Hired by a local personal injury " +
        "firm to act as trial counsel.",
    },
    {
      _key: "rear-end-car-accident-2",
      tag: "Rear-End Car Accident",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$65K",
      recovered: "$844K",
      story:
        "Musician rear-ended in a collision suffered a concussion and permanent lower back " +
        "and neck pain.",
    },
    {
      _key: "slip-and-fall",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$750K",
      story:
        "Settlement: Our client broke his ankle after slipping and falling at a poorly " +
        "maintained entrance way to a building while he was delivering materials for work. He " +
        "was dropped by a local personal injury firm that was too afraid to pursue the case " +
        "further.",
    },
    {
      _key: "low-speed-rear-end-crash",
      tag: "Low Speed Rear-End Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$2,543.62",
      recovered: "$750K",
      story:
        "Settlement: Our clients injured their neck and back after another vehicle struck " +
        "their trailer hitch, causing no visible property damage to their vehicle. They hired " +
        "us after being fired by a large regional TV advertising firm for lack of visible " +
        "property damage.",
    },
    {
      _key: "slip-and-fall-2",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$663K",
      story:
        "Settlement: Our client injured her back after slipping and falling on ice in the " +
        "covered entryway of a national luxury hotel chain in the Cherry Creek neighborhood " +
        "of Denver.",
    },
    {
      _key: "car-accident",
      tag: "Car Accident",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "$17K",
      recovered: "$621K",
      story: "Brush-by collision leading to permanent neck pain to our client.",
    },
    {
      _key: "prisoner-overdose-death",
      tag: "Prisoner Overdose Death",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$550K",
      story:
        "Settlement: Our client’s husband was sentenced to community corrections, where he " +
        "tragically passed away from an accidental drug overdose. We fought for " +
        "accountability and secured a $550,000 settlement to help provide justice and support " +
        "for his family.",
    },
    {
      _key: "car-accident-2",
      tag: "Car Accident",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$550K",
      story:
        "Settlement: Our client’s vehicle collided with another vehicle that was backing up " +
        "into the roadway, suffering injuries to her neck. Hired by a local personal injury " +
        "firm as trial counsel.",
    },
    {
      _key: "negligent-interference-with-medical-care",
      tag: "Negligent Interference with Medical Care",
      badge: "Trial Win",
      wonInCourt: true,
      offered: "—",
      recovered: "$527K",
      story:
        "We secured a $527,000 judgment for our client after a week-and-a-half trial. Despite " +
        "being misled by a doctor, our client overcame significant medical setbacks and is " +
        "now in good health. With additional costs and sanctions pending, this case " +
        "underscores the importance of defending good medical care against harmful " +
        "interference.",
    },
    {
      _key: "pedestrian-struck-by-vehicle",
      tag: "Pedestrian Struck By Vehicle",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$500K",
      story:
        "Settlement: Our client’s brother was hit by an SUV while crossing a pedestrian " +
        "crosswalk, resulting in him sustaining multiple injuries. He was hospitalized for 10 " +
        "days before he tragically passed away.",
    },
    {
      _key: "trucking-wrongful-death",
      tag: "Trucking Wrongful Death",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$25K",
      recovered: "$500K",
      story:
        "Settlement: Our client was killed in a three-car collision while headed out of " +
        "state. We were hired after the initial insurance paid out $25,000.",
    },
    {
      _key: "slip-fall",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$500K",
      story:
        "Settlement: Our client was helping out-of-town neighbors by dog-sitting when she " +
        "slipped and fell on their driveway, suffering a fractured shoulder. We fought to " +
        "ensure she received full compensation, securing a $500,000 policy limits settlement " +
        "for her injuries.",
    },
    {
      _key: "pedestrian-wrongful-death",
      tag: "Pedestrian Wrongful Death",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$500K",
      story:
        "Settlement: Our client was tragically killed in a motor vehicle collision while " +
        "crossing in a crosswalk. We fought for justice on behalf of his family and secured a " +
        "$500,000 settlement to help provide support during this difficult time.",
    },
    {
      _key: "wrongful-death",
      tag: "Wrongful Death",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$500K",
      story:
        "Settlement: Our client passed away after having a medical emergency in his hotel " +
        "room that left him unconscious but alive. When he didn’t check out of his hotel room " +
        "on time, the hotel staff just knocked on his door but failed to take any further " +
        "action for over 24 hours. Unfortunately our client passed away due to the hotel’s " +
        "apathy.",
    },
    {
      _key: "rear-end-car-crash",
      tag: "Rear-End Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$500K",
      story:
        "Settlement: We obtained the maximum available policy limits for our clients, a " +
        "family of four, after they were rear-ended at a stoplight and pushed into oncoming " +
        "traffic, suffering injuries including neck pain, concussion, and driving anxiety.",
    },
    {
      _key: "t-bone-car-crash",
      tag: "T-Bone Car Crash",
      badge: "Co-Counsel",
      wonInCourt: false,
      offered: "$180K",
      recovered: "$465K",
      story:
        "Settlement: Warehouse manager t-boned by a delivery truck driver that disputed " +
        "liability. Co-counseled with a local firm.",
    },
    {
      _key: "rear-end-car-accident-3",
      tag: "Rear-End Car Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$25K",
      recovered: "$450K",
      story: "Settlement: School janitor rear-ended and suffered permanent neck pain.",
    },
    {
      _key: "insurance-bad-faith",
      tag: "Insurance Bad Faith",
      badge: "Judgment",
      wonInCourt: true,
      offered: "$100K",
      recovered: "$430K",
      story:
        "Judgment: Executed against a State Farm Insurance bank account for unreasonably " +
        "delaying payment to our client of a previously-agreed $100,000 settlement.",
    },
    {
      _key: "slip-fall-2",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$410K",
      story:
        "Settlement: Our client was picking up their mail when they slipped on snow and ice " +
        "that covered the front of the mailboxes. This resulted in multiple fractures in " +
        "their ankle. Working alongside co-counsel, we secured a $410,000 settlement to aid " +
        "in their recovery.",
    },
    {
      _key: "slip-fall-3",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$400K",
      story:
        "Settlement: Our client was attending a baseball game when he tripped on bags of ice. " +
        "This resulted in multiple injuries which led him to be a surgical candidate. Working " +
        "alongside co-counsel, we were able to settle for $400,000 to aid in his recovery.",
    },
    {
      _key: "slip-fall-4",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$55K",
      recovered: "$400K",
      story:
        "Settlement: Our client slipped on ice while exiting a shuttle bus at the Denver " +
        "airport.",
    },
    {
      _key: "slip-and-fall-3",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$400K",
      story:
        "Settlement: Our client, while visiting his partner’s family home, slipped and fell " +
        "on an icy stairway. He suffered soft tissue injuries.",
    },
    {
      _key: "product-liability-2",
      tag: "Product Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$400K",
      story:
        "Settlement: Our client injured his finger and suffered emotional distress after " +
        "cutting his hand on an after-market car part while unboxing it.",
    },
    {
      _key: "premises-liability-2",
      tag: "Premises Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$400K",
      story:
        "Settlement: Our client broke her arm when she tripped on a crack in a tile walkway " +
        "at a swimming pool in an apartment complex.",
    },
    {
      _key: "rear-end-accident",
      tag: "Rear-End Accident",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$400K",
      story:
        "Settlement: Our client injured her back in a low-speed rear-end collision. Hired by " +
        "a local personal injury firm to act as trial counsel.",
    },
    {
      _key: "insurance-bad-faith-2",
      tag: "Insurance Bad Faith",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$375K",
      story:
        "Settlement: An insurance company failed to pay our client proper compensation after " +
        "a motor vehicle accident. Two weeks before trial was set to begin, we were able to " +
        "secure a settlement of $375,000 for our client.",
    },
    {
      _key: "motor-vehicle-collision-2",
      tag: "Motor Vehicle Collision",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$375K",
      story:
        "Settlement: Our client was driving southbound when another driver going northbound " +
        "turned unsafely. She was hit in the front passenger side, colliding with another " +
        "vehicle and then a stoplight post head on. We secured a $375,000 settlement to aid " +
        "in her recovery.",
    },
    {
      _key: "rear-end-accident-2",
      tag: "Rear-End Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$75K",
      recovered: "$375K",
      story:
        "Settlement: Massage therapist rear-ended on Vail Pass in a snow storm where " +
        "Defendant disputed liability.",
    },
    {
      _key: "slip-and-fall-4",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$27K",
      recovered: "$350K",
      story:
        "Settlement: Our client slipped and fell on a snow-packed walkway while picking up " +
        "food for her family at a Boston Market in Aurora, Colorado, injuring her knee and " +
        "hip.",
    },
    {
      _key: "slip-and-fall-5",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$350K",
      story:
        "Settlement: Our client slipped on water and injured her leg while eating at a " +
        "sandwich store.",
    },
    {
      _key: "rear-end-car-crash-2",
      tag: "Rear-End Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$205K",
      recovered: "$315K",
      story:
        "Settlement: Our client was involved in a 4-vehicle accident on the highway. She was " +
        "rear-ended by a driver, which caused her to hit the vehicle in front of her, and led " +
        "to that vehicle hitting the car in front of them. She suffered whiplash injuries, a " +
        "concussion, and nerve pain.",
    },
    {
      _key: "premises-liability-3",
      tag: "Premises Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "Confidential",
      story:
        "Settlement: Our client was sitting outside a coffee shop when a gust of wind sent an " +
        "umbrella into the air, causing injuries to our client. We ultimately secured a " +
        "settlement prior to taking this to trial.",
    },
    {
      _key: "assault-2",
      tag: "Assault",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$0",
      recovered: "$310K",
      story:
        "Settlement: Obtained above the maximum policy limits for our clients after they were " +
        "injured by a man who stabbed them during a mental health episode.",
    },
    {
      _key: "slip-fall-5",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$300K",
      story:
        "Settlement: Our client was walking out of a store towards her car when her foot hit " +
        "a snow covered curb. She slipped and fell, sustaining injuries to her hip and ankle, " +
        "and needed surgery to repair her ankle.",
    },
    {
      _key: "slip-fall-6",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$300K",
      story:
        "Settlement: Our client was walking to her car after leaving a retail shop when she " +
        "slipped on icy ground near the passenger side. She suffered multiple fractures in " +
        "her leg and foot. We secured a $300,000 settlement to help her recover.",
    },
    {
      _key: "slip-fall-7",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$300K",
      story:
        "Settlement: Our client slipped on ice in a grocery store parking lot, suffering " +
        "serious injuries. Working alongside co-counsel, we secured a $300,000 settlement to " +
        "aid in their recovery.",
    },
    {
      _key: "wrongful-death-2",
      tag: "Wrongful Death",
      badge: "Co-Counsel",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$300K",
      story:
        "Settlement: Clients’ father passed away from complications following a slip and fall " +
        "due to an unsafe, slippery bathtub surface in a prominent Denver hotel. A Texas " +
        "personal injury firm hired us as co-counsel to help litigate the case in Colorado.",
    },
    {
      _key: "dog-bite",
      tag: "Dog Bite",
      badge: "Settlement",
      wonInCourt: false,
      offered: "No offer",
      recovered: "$300K",
      story:
        "Settlement: Our client was attending a birthday party when he was bitten by the " +
        "host’s dog, causing the need for over a dozen stitches and leaving him scarred " +
        "physically and mentally.",
    },
    {
      _key: "rear-end-car-crash-3",
      tag: "Rear-End Car Crash",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "$60K",
      recovered: "$300K",
      story:
        "Settlement: Defendant was hauling a heavy trailer and driving too fast on I-25 north " +
        "of Denver. As traffic slowed ahead, he lost control, entered the median, and " +
        "rear-ended our client, causing a lower back injury. Hired by a local personal injury " +
        "firm to act as trial counsel.",
    },
    {
      _key: "slip-and-fall-6",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$297.5K",
      story:
        "Settlement: Our client was walking and took a left when her left foot slid out from " +
        "under her due to residual snow melt and ice. This led to a fracture in her femur and " +
        "other injuries.",
    },
    {
      _key: "rear-end-car-crash-4",
      tag: "Rear-End Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$281K",
      story:
        "Settlement: Our client was stopped at a light waiting to take a left turn when a " +
        "speeding car collided with her vehicle. The accident led to muscle spasms and severe " +
        "strain to her neck and back. We achieved a settlement of $281,157.45 to aid in her " +
        "recovery.",
    },
    {
      _key: "dog-bite-2",
      tag: "Dog Bite",
      badge: "Settlement",
      wonInCourt: false,
      offered: "Denied",
      recovered: "$280K",
      story:
        "Settlement: We obtained above the maximum policy limits after our client was bitten " +
        "by a dog inside her home.",
    },
    {
      _key: "product-liability-3",
      tag: "Product Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$275K",
      story:
        "Settlement: Our client was traveling on a scooter when it suddenly stopped moving " +
        "and threw her forward. She flew off the scooter, causing a severe knee injury.",
    },
    {
      _key: "ada-premises-liability",
      tag: "ADA & Premises Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$275K",
      story:
        "Settlement: A local hotel negligently installed a grab bar inside a bathroom stall, " +
        "and when our handicapped client attempted to use it to lower himself from his chair, " +
        "it ripped from the wall, causing him to suffer injuries.",
    },
    {
      _key: "slip-fall-8",
      tag: "Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was getting out of her car when she slid and fell due to snow " +
        "and ice on the ground, sustaining fractures to her shoulder. Before our scheduled " +
        "trial date, we achieved a settlement of $250,000.",
    },
    {
      _key: "premises-liability-slip-fall",
      tag: "Premises Liability — Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was walking towards the sidewalk of her apartment complex " +
        "when her foot slipped on ice that had accumulated from previous snowfalls. She fell " +
        "backwards, landing flat on her back with her head and neck hitting the ground.",
    },
    {
      _key: "trucking-accident",
      tag: "Trucking Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$9K",
      recovered: "$250K",
      story:
        "Settlement: Our client was driving onto a highway, approaching a yield sign, when a " +
        "semi-truck turned into his lane and hit his car from behind. We were able to settle " +
        "right before this case was set for trial.",
    },
    {
      _key: "pedestrian-struck-by-vehicle-2",
      tag: "Pedestrian Struck By Vehicle",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was jogging across an intersection when a driver suddenly " +
        "took a right-hand turn and struck her. This resulted in multiple fractures and " +
        "broken bones.",
    },
    {
      _key: "car-crash-5",
      tag: "Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was driving when someone in a stolen vehicle hit her car and " +
        "dragged it a couple of miles. When she got out, the other driver continued driving " +
        "towards her. She fell back into the vehicle, leading to multiple injuries.",
    },
    {
      _key: "premises-liability-slip-fall-2",
      tag: "Premises Liability — Slip & Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was staying at a vacation rental when he stepped into the " +
        "shower and his feet flew out from under him. A repair to a leak had left a " +
        "lubricated shower floor. He fell backward and hit his head, causing a closed head " +
        "injury.",
    },
    {
      _key: "trucking-accident-2",
      tag: "Trucking Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$80K",
      recovered: "$250K",
      story:
        "Settlement: Our client was driving a large semi truck when it started sliding into " +
        "the median of the highway. As a result, he suffered lasting high back pain.",
    },
    {
      _key: "premises-liability-defective-door",
      tag: "Premises Liability — Defective Door",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was injured during a trip to Keystone resort with the " +
        "National Brotherhood of Skiers. While staying at a condo managed by Vail Resorts, " +
        "the closet door of her unit fell and pinched a nerve in her hand.",
    },
    {
      _key: "insurance-bad-faith-3",
      tag: "Insurance Bad Faith",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was t-boned by an uninsured driver and suffered neck pain and " +
        "migraines.",
    },
    {
      _key: "single-car-crash",
      tag: "Single Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story:
        "Settlement: Our client was injured when her son-in-law fell asleep at the wheel and " +
        "crashed the car she was a passenger in.",
    },
    {
      _key: "slip-and-fall-7",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$250K",
      story: "Settlement: Our client was injured after slipping and falling on a wet surface.",
    },
    {
      _key: "premises-liability-injury",
      tag: "Premises Liability Injury",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$230K",
      story:
        "Settlement: Our client slipped on ice the morning after a snow storm. Although he " +
        "didn’t fall, he twisted his knee, aggravating a significant and longstanding " +
        "pre-existing condition.",
    },
    {
      _key: "bicycle-crash",
      tag: "Bicycle Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$210K",
      story:
        "Settlement: Our client was injured when he was t-boned by a car in an intersection " +
        "while riding his bike. Despite many of his injuries being aggravations of old " +
        "injuries, we obtained a much larger settlement than he expected.",
    },
    {
      _key: "product-liability-4",
      tag: "Product Liability",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$200K",
      story:
        "Settlement: Client injured by a stationary spin bike after the seat collapsed during " +
        "first use after assembly.",
    },
    {
      _key: "premises-liability-4",
      tag: "Premises Liability",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$200K",
      story:
        "Settlement: Client injured by an automated shopping cart pusher in the parking lot " +
        "of a grocery store. Hired by a local personal injury firm to act as trial counsel.",
    },
    {
      _key: "t-bone-car-crash-2",
      tag: "T-Bone Car Crash",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$175K",
      story:
        "Settlement: Our client suffered a hip injury when he was t-boned by a woman " +
        "attempting to merge. Hired by a local personal injury firm as trial counsel.",
    },
    {
      _key: "car-crash-6",
      tag: "Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$150K",
      story:
        "Settlement: We obtained the maximum available insurance limits for our client " +
        "despite them obtaining no treatment prior to hiring us, four months after the crash.",
    },
    {
      _key: "rear-end-accident-3",
      tag: "Rear-End Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$150K",
      story:
        "Settlement: Our client was injured in a low-speed 3-car accident, suffering low back " +
        "pain. After denying liability and making an offer of less than our client’s medical " +
        "bills, Allstate paid the policy limits following successful litigation.",
    },
    {
      _key: "head-on-collision",
      tag: "Head-On Collision",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$125K",
      story:
        "Settlement: Our client sustained injuries after being hit head-on by a driver who " +
        "went straight in a left-turn only lane. We obtained the maximum possible insurance " +
        "policy limits.",
    },
    {
      _key: "pedestrian-injury",
      tag: "Pedestrian Injury",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$125K",
      story:
        "Settlement: Our client suffered a concussion and abrasions when he was struck in the " +
        "crosswalk by a turning vehicle. We were hired as trial counsel by a Denver personal " +
        "injury firm.",
    },
    {
      _key: "single-car-crash-2",
      tag: "Single Car Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$125K",
      story:
        "Settlement: We obtained all available policy limits for our client. While driving " +
        "our client’s car, her daughter lost control on a gravel road, causing her mom " +
        "serious injuries.",
    },
    {
      _key: "insurance-bad-faith-4",
      tag: "Insurance Bad Faith",
      badge: "Trial Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$100K",
      story:
        "Settlement: Our client’s claim for benefits was refused because of a data entry " +
        "error. State Farm paid the policy limits shortly after Dormer Harpring entered an " +
        "appearance. A local personal injury firm hired us as trial counsel.",
    },
    {
      _key: "trip-and-fall",
      tag: "Trip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "$0",
      recovered: "$100K",
      story:
        "Settlement: Our client suffered a knee injury after tripping on a blind step in the " +
        "parking garage of his apartment complex. He was dropped by a well-known local firm " +
        "with heavy TV advertising after receiving a $0 offer. We took the case, filed suit, " +
        "and exceeded his expectations.",
    },
    {
      _key: "trucking-crash-2",
      tag: "Trucking Crash",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$100K",
      story:
        "Settlement: Our client was side-swiped by a semi-truck while merging onto the " +
        "highway, suffering an aggravation of an old shoulder injury.",
    },
    {
      _key: "motor-vehicle-accident",
      tag: "Motor Vehicle Accident",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$100K",
      story:
        "Settlement: We obtained the maximum available insurance policy limits for our client " +
        "after she was rear-ended at a stoplight and suffered emotional trauma.",
    },
    {
      _key: "slip-and-fall-8",
      tag: "Slip and Fall",
      badge: "Settlement",
      wonInCourt: false,
      offered: "—",
      recovered: "$100K",
      story:
        "Settlement: Our client was injured at a prominent Colorado hot spring operator when " +
        "he slipped and fell on a pathway on their property.",
    },
    {
      _key: "pedestrian-struck-by-vehicle-3",
      tag: "Pedestrian Struck by Vehicle",
      badge: "Local Counsel",
      wonInCourt: false,
      offered: "—",
      recovered: "$100K",
      story:
        "Settlement: Soft-tissue knee injuries resulting from a minor auto-pedestrian " +
        "collision. The insurer refused to settle until we filed suit, then paid policy " +
        "limits. A California business lawyer hired us as local counsel.",
    },
  ];
}

// ---------------------------------------------------------------------------
// The /results page's own copy.

export interface CaseResultsPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  moreLabel: string;
}

export async function getCaseResultsPage(): Promise<CaseResultsPage> {
  return {
    eyebrow: "Case results",
    title: "Outstanding results.",
    lede: pt(
      "Verdicts and settlements our team has obtained for injured Coloradans — " +
        "including cases other firms turned down or dropped. Prior results do not " +
        "guarantee a similar outcome."
    ),
    moreLabel: "Load more results",
  };
}
