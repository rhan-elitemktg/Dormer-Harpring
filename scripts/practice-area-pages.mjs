// Which live WordPress pages are practice areas, what city each belongs to, and
// what to call it. Read by `import-practice-areas.mjs`.
//
// THERE IS NO PROGRAMMATIC DISCRIMINATOR, and looking for one is the trap. The
// obvious candidates all fail:
//
//   `parent`                162 of 195 pages sit at the root
//   `template-landing.php`  covers 70 of ~109; the rest are on the default
//                           template, alongside the resource articles and the
//                           community write-ups
//   body class              same problem — every one of them is `page page-id-*`
//   the slug                `motorcycle-accident-lawyer-denver` puts the city
//                           last; `nursing-home-abuse-lawyer` and
//                           `rtd-denver-accidents` carry no city at all
//
// The boundary was not even clean. Five pages that read as articles
// (`types-of-slip-and-fall-accidents` and friends) are LINKED FROM THE LEGACY
// DIRECTORY as practice areas, so they were imported as practice areas and
// marked `resource: true` rather than excluded by shape — which would have
// shipped five 404s at cutover.
//
// THAT IS NO LONGER TRUE. All five moved to the BLOG by request: 539–748 words,
// no FAQ, article titles, and one of them sat in the "Practice areas" sidebar
// card on 54 Denver pages reading exactly like the blog post it is. They are in
// EXCLUDED_SLUGS below and in PAGE_ARTICLES in `blog-category-overrides.mjs`,
// and the hub no longer links them — so nothing 404s: their slugs are still
// their live URLs, served by the blog template instead.
//
// `resource` is therefore a field no page sets. It stays on the schema and in
// the sidebar filter because the SHAPE recurs — the firm files articles under
// practice areas — and the next import may well bring another.
//
// So the classification is written down instead of inferred, the same way
// `blog-category-overrides.mjs` writes down the eleven the API cannot answer.
// EVERY live page must appear in one of the two maps below — the importer
// throws otherwise, which is what stops a page added in WordPress next month
// from being silently skipped.
//
// TOPIC IS INVENTED HERE. Nothing upstream carries one; the live site's own
// sidebar bands are hand-maintained and disagree with each other. It exists so
// the city band could group Denver's entries instead of listing them flat. That
// band has since been removed; nothing renders `topic` today.

/** Display order. `denver` first because it is two-thirds of the pages. */
export const CITIES = [
  { key: "denver", name: "Denver" },
  { key: "aurora", name: "Aurora" },
  { key: "boulder", name: "Boulder" },
  { key: "highlands-ranch", name: "Highlands Ranch" },
  { key: "lakewood", name: "Lakewood" },
  { key: "thornton", name: "Thornton" },
  { key: "greeley", name: "Greeley" },
  { key: "fort-collins", name: "Fort Collins" },
  { key: "grand-junction", name: "Grand Junction" },
];

/** Group order within a city. Titles are the band's `h3`s. */
export const TOPICS = [
  { key: "motor-vehicle", title: "Motor Vehicle Accidents" },
  { key: "premises", title: "Premises & Property" },
  { key: "catastrophic", title: "Catastrophic Injury" },
  { key: "professional", title: "Professional & Insurance Claims" },
  { key: "other", title: "Other Claims" },
];

/**
 * slug -> { city, topic, label, statewide?, resource? }
 *
 * `label` is the SHORT form for the directory and the city band, not the page's
 * own title — "Brain Injuries", not "Denver Brain Injury Lawyer". Where the
 * page is already in `getPracticeAreaGroups()`, the label is that one verbatim,
 * so the two lists cannot drift.
 *
 * `statewide: true` marks a page whose subject is Colorado-wide but which the
 * firm files under Denver (the two `colorado-*` pages are already in the
 * directory's Denver group). Assigned explicitly, never inferred from the slug.
 */
export const PRACTICE_AREA_PAGES = {
  "aurora-brain-injury-lawyer": { city: "aurora", topic: "catastrophic", label: "Brain Injuries" },
  "aurora-car-accident-lawyer": { city: "aurora", topic: "motor-vehicle", label: "Car Accidents" },
  "aurora-truck-accident-attorney": { city: "aurora", topic: "motor-vehicle", label: "Truck Accidents" },
  "aurora-personal-injury-attorney": { city: "aurora", topic: "other", label: "Personal Injury" },
  "aurora-product-liability-attorney": { city: "aurora", topic: "other", label: "Product Liability" },
  "aurora-premises-liability-attorney": { city: "aurora", topic: "premises", label: "Premises Liability" },
  "boulder-brain-injury-lawyer": { city: "boulder", topic: "catastrophic", label: "Brain Injuries" },
  "boulder-car-accident-lawyer": { city: "boulder", topic: "motor-vehicle", label: "Car Accidents" },
  "boulder-hit-and-run-accident-attorney": { city: "boulder", topic: "motor-vehicle", label: "Hit and Run Accidents" },
  "boulder-off-road-recreational-vehicle-accident-attorney": { city: "boulder", topic: "motor-vehicle", label: "Off-Road Recreational Vehicle Accidents" },
  "boulder-truck-accident-attorney": { city: "boulder", topic: "motor-vehicle", label: "Truck Accidents" },
  "boulder-personal-injury-attorney": { city: "boulder", topic: "other", label: "Personal Injury" },
  "boulder-product-liability-attorney": { city: "boulder", topic: "other", label: "Product Liability" },
  "boulder-premises-liability-attorney": { city: "boulder", topic: "premises", label: "Premises Liability" },
  "denver-amputation-injury-lawyer": { city: "denver", topic: "catastrophic", label: "Amputation Injuries" },
  "denver-birth-injury-lawyer": { city: "denver", topic: "catastrophic", label: "Birth Injuries" },
  "denver-brain-injury-lawyer": { city: "denver", topic: "catastrophic", label: "Brain Injuries" },
  "denver-burn-injury-attorney": { city: "denver", topic: "catastrophic", label: "Burn Injuries" },
  "denver-child-injury-lawyer": { city: "denver", topic: "catastrophic", label: "Child Injuries" },
  "denver-spinal-cord-injury-lawyer": { city: "denver", topic: "catastrophic", label: "Spinal Cord Injury" },
  "denver-wrongful-death-lawyer": { city: "denver", topic: "catastrophic", label: "Wrongful Death" },
  "denver-amazon-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Amazon Truck Accident" },
  "denver-autonomous-vehicle-injury-lawyer": { city: "denver", topic: "motor-vehicle", label: "Autonomous Vehicle Accidents" },
  "denver-bicycle-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Bike Accidents" },
  "denver-bus-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Bus Accidents" },
  "denver-distracted-driver-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Distracted Driver Accidents" },
  "denver-drowsy-driving-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Drowsy Driving Accident" },
  "denver-drunk-driving-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Drunk Driving Accidents" },
  "denver-scooter-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Dockless Bike / E-Scooter Accidents" },
  "denver-fedex-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "FedEx Truck Accident" },
  "denver-garbage-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Garbage Truck Accident" },
  "motorcycle-accident-lawyer-denver": { city: "denver", topic: "motor-vehicle", label: "Motorcycle Accidents" },
  "denver-pedestrian-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Pedestrian Accidents" },
  "rtd-denver-accidents": { city: "denver", topic: "motor-vehicle", label: "RTD Denver Accidents" },
  "denver-uber-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Rideshare Accidents" },
  "denver-side-impact-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Side-Impact Accident" },
  "denver-taxi-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Taxi Accidents" },
  "denver-tow-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Tow Truck Accident" },
  "denver-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Truck Accidents" },
  "denver-ups-truck-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "UPS Truck Accident" },
  "denver-uninsured-and-underinsured-motorcyclist-accident-lawyer": { city: "denver", topic: "motor-vehicle", label: "Uninsured and Underinsured Motorcyclist Accidents" },
  "denver-whiplash-injury-attorney": { city: "denver", topic: "motor-vehicle", label: "Whiplash Injuries" },
  "colorado-defective-helmet": { city: "denver", topic: "other", label: "Defective Helmets", statewide: true },
  "denver-product-liability-lawyer": { city: "denver", topic: "other", label: "Product Liability" },
  "denver-sexual-assault-lawyer": { city: "denver", topic: "other", label: "Sexual Assault" },
  "colorado-wildfire-attorney": { city: "denver", topic: "other", label: "Wildfire Litigation", statewide: true },
  "denver-construction-accident-attorney": { city: "denver", topic: "premises", label: "Construction Accidents" },
  "denver-daycare-injury-lawyers": { city: "denver", topic: "premises", label: "Daycare Injury" },
  "denver-dog-bite-lawyer": { city: "denver", topic: "premises", label: "Dog Bites" },
  "denver-dram-shop-lawyer": { city: "denver", topic: "premises", label: "Dram Shop Liability" },
  "denver-negligent-building-maintenance-attorneys": { city: "denver", topic: "premises", label: "Negligent Building Maintenance" },
  "denver-negligent-ice-snow-removal-attorneys": { city: "denver", topic: "premises", label: "Negligent Ice/Snow Removal" },
  "denver-negligent-security-lawyers": { city: "denver", topic: "premises", label: "Negligent Security" },
  "denver-premises-liability-lawyer": { city: "denver", topic: "premises", label: "Premises Liability Overview" },
  "denver-ski-accident-lawyer": { city: "denver", topic: "premises", label: "Ski Accidents" },
  "denver-slip-and-fall-lawyer": { city: "denver", topic: "premises", label: "Slip and Fall Accidents" },
  "denver-trampoline-park-injury-lawyer": { city: "denver", topic: "premises", label: "Trampoline Park Injuries" },
  "colorado-funeral-home-negligence-lawyer": { city: "denver", topic: "professional", label: "Funeral Home Negligence", statewide: true },
  "denver-insurance-bad-faith-lawyer": { city: "denver", topic: "professional", label: "Insurance Bad Faith" },
  "legal-malpractice-attorney": { city: "denver", topic: "professional", label: "Legal Malpractice" },
  "denver-life-insurance-bad-faith-lawyer": { city: "denver", topic: "professional", label: "Life Insurance Bad Faith" },
  "denver-medical-malpractice-lawyer": { city: "denver", topic: "professional", label: "Medical Malpractice" },
  "nursing-home-abuse-lawyer": { city: "denver", topic: "professional", label: "Nursing Home Abuse" },
  "denver-pet-insurance-bad-faith-lawyer": { city: "denver", topic: "professional", label: "Pet Insurance Bad Faith" },
  "fort-collins-car-accident-lawyer": { city: "fort-collins", topic: "motor-vehicle", label: "Car Accident" },
  "fort-collins-motorcycle-accident-lawyer": { city: "fort-collins", topic: "motor-vehicle", label: "Motorcycle Accident" },
  "fort-collins-truck-accident-lawyer": { city: "fort-collins", topic: "motor-vehicle", label: "Truck Accident" },
  "fort-collins-personal-injury-lawyer": { city: "fort-collins", topic: "other", label: "Personal Injury" },
  "grand-junction-car-accident-lawyer": { city: "grand-junction", topic: "motor-vehicle", label: "Car Accident" },
  "grand-junction-motorcycle-accident-lawyer": { city: "grand-junction", topic: "motor-vehicle", label: "Motorcycle Accident" },
  "grand-junction-truck-accident-lawyer": { city: "grand-junction", topic: "motor-vehicle", label: "Truck Accident" },
  "grand-junction-personal-injury-lawyer": { city: "grand-junction", topic: "other", label: "Personal Injury" },
  "greeley-wrongful-death-lawyer": { city: "greeley", topic: "catastrophic", label: "Wrongful Death" },
  "greeley-car-accident-lawyer": { city: "greeley", topic: "motor-vehicle", label: "Car Accident" },
  "greeley-motorcycle-accident-lawyer": { city: "greeley", topic: "motor-vehicle", label: "Motorcycle Accident" },
  "greeley-truck-accident-lawyer": { city: "greeley", topic: "motor-vehicle", label: "Truck Accident" },
  "greeley-personal-injury-lawyer": { city: "greeley", topic: "other", label: "Personal Injury" },
  "highlands-ranch-brain-injury-lawyer": { city: "highlands-ranch", topic: "catastrophic", label: "Brain Injuries" },
  "highlands-ranch-car-accident-lawyer": { city: "highlands-ranch", topic: "motor-vehicle", label: "Car Accidents" },
  "highlands-ranch-truck-accident-attorney": { city: "highlands-ranch", topic: "motor-vehicle", label: "Truck Accidents" },
  "highlands-ranch-personal-injury-attorney": { city: "highlands-ranch", topic: "other", label: "Personal Injury" },
  "highlands-ranch-product-liability-attorney": { city: "highlands-ranch", topic: "other", label: "Product Liability" },
  "highlands-ranch-premises-liability-attorney": { city: "highlands-ranch", topic: "premises", label: "Premises Liability" },
  "highlands-ranch-financial-elder-abuse-lawyer": { city: "highlands-ranch", topic: "professional", label: "Financial Elder Abuse" },
  "lakewood-brain-injury-lawyer": { city: "lakewood", topic: "catastrophic", label: "Brain Injuries" },
  "lakewood-car-accident-lawyer": { city: "lakewood", topic: "motor-vehicle", label: "Car Accidents" },
  "lakewood-truck-accident-attorney": { city: "lakewood", topic: "motor-vehicle", label: "Truck Accidents" },
  "lakewood-personal-injury-attorney": { city: "lakewood", topic: "other", label: "Personal Injury" },
  "lakewood-product-liability-attorney": { city: "lakewood", topic: "other", label: "Product Liability" },
  "lakewood-premises-liability-attorney": { city: "lakewood", topic: "premises", label: "Premises Liability" },
  "thornton-brain-injury-lawyer": { city: "thornton", topic: "catastrophic", label: "Brain Injury" },
  "thornton-spinal-cord-injury-lawyer": { city: "thornton", topic: "catastrophic", label: "Spinal Cord Injury" },
  "thornton-wrongful-death-lawyer": { city: "thornton", topic: "catastrophic", label: "Wrongful Death" },
  "thornton-bicycle-accident-lawyer": { city: "thornton", topic: "motor-vehicle", label: "Bicycle Accidents" },
  "thornton-car-accident-attorney": { city: "thornton", topic: "motor-vehicle", label: "Car Accidents" },
  "thornton-motorcycle-accident-lawyer": { city: "thornton", topic: "motor-vehicle", label: "Motorcycle Accidents" },
  "thornton-pedestrian-accident-attorney": { city: "thornton", topic: "motor-vehicle", label: "Pedestrian Accidents" },
  "thornton-truck-accident-attorney": { city: "thornton", topic: "motor-vehicle", label: "Truck Accidents" },
  "thornton-personal-injury-attorney": { city: "thornton", topic: "other", label: "Personal Injury" },
  "thornton-product-liability-attorney": { city: "thornton", topic: "other", label: "Product Liability" },
  "thornton-workplace-injury-attorney": { city: "thornton", topic: "other", label: "Workplace Injuries" },
  "thornton-dog-bite-attorney": { city: "thornton", topic: "premises", label: "Dog Bite" },
  "thornton-premises-liability-lawyer": { city: "thornton", topic: "premises", label: "Premises Liability" },
  "thornton-slip-and-fall-accident-lawyer": { city: "thornton", topic: "premises", label: "Slip and Fall Accidents" },
};

/**
 * Live pages that are deliberately NOT practice areas, each with the reason.
 *
 * This map is the other half of the guarantee: a page in neither map fails the
 * import. Deleting a line here does not skip a page, it breaks the build — which
 * is the intended asymmetry.
 *
 * FOURTEEN OF THESE ARE ARTICLES AND ARE IMPORTED — into the blog, by the other
 * importer, because that is what they are. They are excluded HERE, not dropped;
 * `PAGE_ARTICLES` in blog-category-overrides.mjs is where they land and why.
 * The distinction is the firm's own: its directory lists five near-identical
 * slip-and-fall pages as practice areas (kept here, marked `resource`) and
 * lists none of these fourteen.
 */
export const EXCLUDED_SLUGS = {
  "10-things-to-do-after-a-slip-and-fall-accident": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "2023-big-little-gala-hosted-by-big-brothers-big-sisters-of-colorado": "community involvement write-up",
  "a-great-success-at-the-2025-cca-convention": "community involvement write-up",
  "a-week-of-cinema-at-the-denver-film-festival-48": "community involvement write-up",
  "abby-houk": "community involvement write-up",
  "about": "site page",
  "alexandra-petroff": "community involvement write-up",
  "amy-rogers": "community involvement write-up",
  "announcements": "site page",
  "ashley-reisman": "community involvement write-up",
  "back-to-clothes-to-kids-denver": "community involvement write-up",
  "big-brothers-big-sisters-annual-big-little-gala": "community involvement write-up",
  "big-brothers-big-sisters-annual-big-little-gala-2025": "community involvement write-up",
  "brittany-freeman": "community involvement write-up",
  "brittany-lesmeister": "community involvement write-up",
  "car-accident": "duplicates denver-car-accident-lawyer",
  "car-seat-safety": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "cba-well-being-symposium-spring-summit": "community involvement write-up",
  "cindy-waller": "community involvement write-up",
  "client-review-testimonial": "the legacy Client Testimonials page — /testimonials/ replaces it; redirected",
  "clothes-to-kids-denver": "community involvement write-up",
  "co-counsel": "site page",
  "colorado-motorcycle-laws-important-information-for-riders": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "colorado-premises-liability-law": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "common-causes-of-car-accidents-in-colorado": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "common-causes-of-truck-accidents-in-colorado": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "common-types-of-car-accidents": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "common-types-of-motorcycle-accident-injuries": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "common-types-of-truck-accidents": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "community-involvement": "site page",
  "contact": "site page",
  "craig-hospital": "community involvement",
  "david-garber": "community involvement write-up",
  "demo": "WordPress scratch page",
  "denver-car-accident-lawyer": "served by the heavy detail template — see carAccidents.ts",
  "dinner-at-the-ronald-mcdonald-house": "community involvement write-up",
  "dinner-at-the-ronald-mcdonald-house-2": "community involvement write-up",
  "dinorah-gutierrez": "community involvement write-up",
  "dressed-for-success-dormer-harpring-volunteers-at-clothes-to-kids-denver": "community involvement write-up",
  "dumb-friends-league": "community involvement write-up",
  "editorial-guidelines": "site page",
  "ella-nelson": "community involvement write-up",
  "fmcsa-trucking-rules-regulations": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "giving-back-at-craig-hospital": "community involvement write-up",
  "giving-back-with-the-park-people": "community involvement write-up",
  "greg-bentley": "community involvement write-up",
  "highlights-from-the-2025-dmar-inaugural": "community involvement write-up",
  "how-a-colorado-car-accident-lawyer-can-help": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "how-can-a-truck-accident-lawyer-help-me": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "jassy-rendezvous-fundraising-gala": "community involvement write-up",
  "jessica-ayala": "community involvement write-up",
  "jessica-mauser": "community involvement write-up",
  "julie-altenhofen": "community involvement write-up",
  "k-c-harpring": "community involvement write-up",
  "kassandra-burival": "community involvement write-up",
  "landing-page": "WordPress scratch page",
  "laura-browne": "community involvement write-up",
  "leana-kim": "community involvement write-up",
  "livi-lesch": "community involvement write-up",
  "maddy-ricciardi": "community involvement write-up",
  "marcie-emch": "community involvement write-up",
  "marilyn-morales": "community involvement write-up",
  "meet-our-attorneys": "site page",
  "michael-greer": "community involvement write-up",
  "most-common-injuries-caused-by-car-accidents": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "new-homepage": "community involvement write-up",
  "new-homepage-v2": "community involvement write-up",
  "news": "site page — the blog index",
  "personal-injury-attorney": "duplicates the homepage, which is the Denver PI overview",
  "practice-areas": "site page — the directory hub",
  "privacy-policy": "site page",
  "project-angel-heart": "community involvement write-up",
  "rachel-pavelko": "community involvement write-up",
  "results": "site page",
  "reviews": "site page",
  "sean-dormer": "community involvement write-up",
  "should-you-hire-a-lawyer-for-a-slip-and-fall-injury-case": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "standing-together-for-access-and-expression-with-the-cwba": "community involvement write-up",
  "stepping-up-for-a-cause-our-2025-pikes-peak-challenge-experience": "community involvement write-up",
  "thank-you": "site page",
  "tim-garvey": "community involvement write-up",
  "traffic-collision-lawyer": "overlaps denver-car-accident-lawyer; scope unresolved",
  "true-companions-animal-shelter-clinic": "community involvement write-up",
  "types-of-slip-and-fall-accidents": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "volunteer-day-project-cure": "community involvement write-up",
  "volunteering-at-metro-carings-fresh-foods-market": "community involvement write-up",
  "we-dont-waste": "community involvement write-up",
  "what-are-colorados-slip-and-fall-laws": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "what-to-do-after-a-car-accident-in-colorado": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "what-to-do-after-a-motorcycle-accident": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
  "what-to-do-after-a-truck-accident-in-colorado": "article, not a practice area — imported into the BLOG, see PAGE_ARTICLES",
};

export const CITY_KEYS = new Set(CITIES.map((c) => c.key));
export const TOPIC_KEYS = new Set(TOPICS.map((t) => t.key));
