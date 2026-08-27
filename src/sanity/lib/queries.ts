// Every GROQ query the site runs.
//
// ONE MODULE, AND `getStaticPaths` IS THE REASON. Astro hoists that function
// into its own module context, so a module-level `const QUERY = defineQuery(…)`
// in a page's frontmatter is NOT in scope inside it — the page throws
// `ReferenceError: QUERY is not defined` at request time, with a green build.
// Queries defined here are imported, which is in scope, and both `[slug].astro`
// files need that.
//
// It is also what `overloadClientMethods` reads: typegen scans for
// `defineQuery` calls and types `sanityClient.fetch(THAT_QUERY)` from the
// query's own text, so a projection's return type is derived rather than
// annotated. Run `npm run typegen` after changing anything here or the types
// describe the previous version.
//
// THE PROJECTIONS DO THE COALESCING. That division of labour predates Sanity
// here: the content files keep the source's shape and the getter reshapes.
// A projection is what does that after the swap, which is why these return the
// interface's shape rather than the document's.
import { defineQuery } from "groq";

/**
 * Firm-wide facts.
 *
 * FILTERED ON BOTH `_type` AND `_id`, and both earn their place. `_id` is what
 * the desk pins the singleton to and it is the cheapest possible lookup. `_type`
 * is what TYPEGEN needs: an id on its own tells it nothing about shape, so the
 * generated result type comes back as a union across every document type in the
 * dataset — one all-null variant per type — and every field reads as possibly
 * null no matter how the schema is validated. With `_type` the projection types
 * itself.
 *
 * `geo` is flattened out of Sanity's `geopoint` — that type carries `_type` and
 * an optional `alt` the site has no use for, and `FirmAddress`'s neighbours are
 * all flat.
 *
 * There is no `phoneE164` / `smsE164` here because there are no such fields:
 * both are derived from the displayed number in `data/site.ts`. See
 * `sanity/lib/phone.ts`.
 */
export const FIRM_DETAILS_QUERY = defineQuery(`*[_type == "firmDetails" && _id == "firmDetails"][0]{
  name,
  legalName,
  phone,
  sms,
  email,
  address{ street, unit, city, region, postalCode, country },
  "geo": { "lat": geo.lat, "lng": geo.lng },
  mapUrl,
  mapPlaceCid,
  hours,
  hoursDisplay,
  socials[]{ name, href },
  "directoryProfiles": coalesce(directoryProfiles, [])
}`);

/**
 * The three dropdown menus and the footer's lists.
 *
 * The main nav's SIX TOP-LEVEL ITEMS ARE NOT IN HERE. They are code-owned in
 * `data/navigation.ts` so an editor cannot rename, reorder or delete one — see
 * the note there. This query returns only what hangs beneath them.
 */
export const NAVIGATION_QUERY = defineQuery(`*[_type == "navigation" && _id == "navigation"][0]{
  "aboutMenu": coalesce(aboutMenu[]{ label, href }, []),
  "practiceAreasMenu": coalesce(practiceAreasMenu[]{ label, href }, []),
  "locationsMenu": coalesce(locationsMenu[]{ label, href }, []),
  "footerPracticeAreas": coalesce(footerPracticeAreas[]{ label, href }, []),
  "footerNav": coalesce(footerNav[]{ label, href }, []),
  "serviceAreas": coalesce(serviceAreas, [])
}`);

/**
 * The consultation band and the contact card — copy only.
 *
 * No phone number, no address, no email: every VALUE on those cards is derived
 * from Firm Details at render time. See `data/contact.ts`.
 */
export const CONTACT_SETTINGS_QUERY = defineQuery(`*[_type == "contactSettings" && _id == "contactSettings"][0]{
  eyebrow,
  title,
  "reassurances": coalesce(reassurances, []),
  callPrompt,
  callBadge,
  form{ title, lede, submitLabel, disclaimer },
  photoAlt,
  callCard{ label, note },
  textCard{ label, note },
  emailCard{ label, note },
  officeCard{ label, note },
  hours{ label, note }
}`);

/** The dark "by the numbers" band. */
export const FIRM_STATS_QUERY = defineQuery(`*[_type == "firmStats" && _id == "firmStats"][0]{
  "stats": coalesce(stats[]{ _key, big, label }, [])
}`);

/**
 * Award badges for the trust bar, in the order they are drawn.
 *
 * `_key` IS PROJECTED FROM `key.current`, NOT FROM `_id`, and that difference
 * is load-bearing. The heavy Car Accidents page names six awards by key and
 * `[slug].astro` throws when one is missing — projecting the generated document
 * id broke that build on the first attempt. Ordered by an explicit `order`
 * field rather than by creation date: a collection of documents has no
 * inherent order, and this band's is the comps' own.
 *
 * `image` comes back whole — `{_type, asset:{_ref}}` — because that is what
 * `urlFor()` takes. Do not project into it.
 */
export const AWARDS_QUERY = defineQuery(`*[_type == "award"] | order(order asc){
  "_key": key.current,
  alt,
  image,
  height
}`);

/** The six core values, in the order the cards are drawn. */
export const CORE_VALUES_QUERY = defineQuery(`*[_type == "coreValue"] | order(order asc){
  "_key": _id,
  title,
  body,
  iconKey
}`);

/**
 * Headings for bands that appear on more than one page.
 *
 * Only two qualify — see the note on the schema type. A band whose heading
 * differs per page is that page's content, not this document's.
 */
export const SHARED_SECTIONS_QUERY = defineQuery(
  `*[_type == "sharedSections" && _id == "sharedSections"][0]{
  coreValues{ eyebrow, title },
  reviewSummary{ count, rating, source },
  attorneysBand{
    eyebrow,
    title,
    quote,
    ctaLabel,
    signature{ name, role, attorneyKey, portrait }
  }
}`
);

/**
 * FAQ accordions, one page's at a time.
 *
 * `shownOn` rather than a reference, for now: the homepage and the heavy Car
 * Accidents page are the only two hand-authored accordions, and the 28 imported
 * practice-area pages carry theirs inline on their own document. When those
 * move, an FAQ belongs to a practice area and this becomes a reference.
 *
 * The answer is a plain string, not Portable Text — it also feeds FAQPage
 * structured data, which takes a string.
 */
export const HOME_FAQS_QUERY = defineQuery(`*[_type == "faq" && shownOn == "home"]
  | order(order asc){
  "_key": _id,
  question,
  answer,
  videoLength,
  video{ provider, id }
}`);

/** The heavy Car Accidents page's twelve. Same shape, same components. */
export const CAR_ACCIDENT_FAQS_QUERY = defineQuery(
  `*[_type == "faq" && shownOn == "car-accidents"] | order(order asc){
  "_key": _id,
  question,
  answer,
  videoLength,
  video{ provider, id }
}`
);

/**
 * The three case-result lists.
 *
 * `wonInCourt` is coalesced because a Sanity boolean is optional at the type
 * level whatever its initialValue — and the projection is where that belongs,
 * rather than three `?? false`s at three call sites.
 *
 * THREE QUERIES, NOT ONE FILTERED THREE WAYS AT THE CALL SITE, because they are
 * three different lists that happen to share a shape — and two of them contain
 * records the archive also contains, six in the same words and three in
 * different ones. See the note on the `caseResult` schema type: they are
 * migrated faithfully rather than merged, because choosing which wording the
 * firm publishes about a real case is the firm's call.
 */
export const CASE_RESULTS_QUERY = defineQuery(
  `*[_type == "caseResult" && shownOn == "results"] | order(order asc){
  "_key": _id, tag, badge, "wonInCourt": coalesce(wonInCourt, false), offered, recovered, story
}`
);

/** The seven won alongside another firm. */
export const CO_COUNSEL_RESULTS_QUERY = defineQuery(
  `*[_type == "caseResult" && shownOn == "co-counsel"] | order(order asc){
  "_key": _id, tag, badge, "wonInCourt": coalesce(wonInCourt, false), offered, recovered, story
}`
);

/** The three the homepage leads with. */
export const HOME_RESULTS_QUERY = defineQuery(
  `*[_type == "caseResult" && shownOn == "home"] | order(order asc){
  "_key": _id, tag, badge, "wonInCourt": coalesce(wonInCourt, false), offered, recovered, story
}`
);

/**
 * The homepage rail — filmed and written interleaved, in the comps' own order.
 *
 * ONE COLLECTION, TWO PRESENTATIONS. These are the same records the
 * /testimonials page renders; the rail shows a filmed card's runtime and a
 * written card's TRIMMED quote, where the page shows the full one. The
 * projection is what reshapes them, which is why the two lists can share a
 * collection without either losing anything.
 *
 * `kind` is derived from `format` because the rail's discriminator is the
 * card's shape, not the review's medium — the components have always read
 * `kind`, and renaming a field an editor sees to match a component's prop is
 * the wrong way round.
 */
export const HOME_TESTIMONIALS_QUERY = defineQuery(
  `*[_type == "testimonial" && onHomeRail == true] | order(railOrder asc){
  "_key": key.current,
  "kind": select(format == "video" => "video", "quote"),
  name,
  video{ provider, id },
  poster,
  length,
  "headline": railHeadline,
  "body": railBody
}`
);

/** The /testimonials page's filmed reviews. */
export const VIDEO_REVIEWS_QUERY = defineQuery(
  `*[_type == "testimonial" && onReviewsPage == true && format == "video"]
  | order(reviewOrder asc){
  "_key": key.current,
  video{ provider, id },
  name,
  quote,
  poster
}`
);

/** The /testimonials page's written reviews. */
export const WRITTEN_REVIEWS_QUERY = defineQuery(
  `*[_type == "testimonial" && onReviewsPage == true && format == "written"]
  | order(reviewOrder asc){
  "_key": key.current,
  name,
  source,
  quote,
  body
}`
);

/**
 * The roster — everyone, in the order the team page renders them.
 *
 * `href` IS DERIVED IN THE GETTER, NOT HERE, because `attorneyPath()` in
 * `lib/routePaths.ts` is the only thing allowed to build an internal URL. A
 * projection that string-concatenated "/meet-our-attorneys/" would be a second
 * place the route shape lives, and there are already three layers agreeing on
 * the trailing slash.
 *
 * `awards[].image` and `photo` come back whole — `urlFor()` takes the object.
 *
 * GROUP FIRST, THEN RANK — and the group half is what stops the desk fighting
 * the page.
 *
 * The desk shows four filtered lists (Founding Partners, Attorneys, Staff,
 * Office Dogs) but `orderRank` is ONE global sequence, and this page renders
 * partners and then everyone else FLAT. So dragging a row inside Attorneys used
 * to move it against the whole roster: attorneys landed ahead of partners and
 * staff interleaved between attorneys. That looked like data corruption and was
 * mistaken for it once.
 *
 * Sorting by group first makes it impossible rather than merely fixed. A drag
 * inside a group can only reorder that group, whatever rank it writes.
 *
 * THE GROUP ORDER IS NOW WRITTEN DOWN IN THREE PLACES and they must agree: the
 * `kind` option list in the schema, the GROUPED map in sanity/structure, and
 * here. Adding a fifth kind means adding it to all three — this `select` sends
 * anything it does not recognise to the end rather than dropping it, so a
 * missed one appears after the dogs instead of vanishing.
 *
 * `orderRank` is the LexoRank string the drag plugin rewrites when a row moves;
 * it replaced a `position` number that had to be edited on four documents to
 * reorder four people. There is no `photoLarge`: one portrait now serves the
 * team page, the bio and the rail, with the hotspot deriving each crop.
 */
export const TEAM_QUERY = defineQuery(`*[_type == "teamMember"] | order(
  select(
    kind == "partner" => 1,
    kind == "attorney" => 2,
    kind == "staff" => 3,
    kind == "dog" => 4,
    5
  ) asc,
  orderRank asc
){
  "_key": key.current,
  name,
  role,
  kind,
  photo,
  bio,
  "memorial": coalesce(memorial, false),
  "hasProfile": coalesce(hasProfile, false),
  "awards": awards[]{ _key, image, alt }
}`);

/**
 * The bio pages — only the people who have one.
 *
 * One document per person carries both this and the roster card above; the two
 * projections are the two presentations. `slug` is the same key the roster
 * returns as `_key`, which is what joined them before the merge and what
 * `[slug].astro` still matches on.
 */
export const TEAM_PROFILES_QUERY = defineQuery(
  `*[_type == "teamMember" && hasProfile == true] | order(
  select(
    kind == "partner" => 1,
    kind == "attorney" => 2,
    kind == "staff" => 3,
    kind == "dog" => 4,
    5
  ) asc,
  orderRank asc
){
  "slug": key.current,
  category,
  lede,
  email,
  "facts": facts[]{ _key, value, label },
  body,
  education,
  "links": links[]{ _key, label, href },
  video{ ref{ provider, id }, poster, alt }
}`
);

/** The nine cities that have practice-area pages. */
export const CITIES_QUERY = defineQuery(`*[_type == "city"] | order(order asc){
  "_key": key.current, name
}`);

/** Press mentions — the firm in someone else's publication. */
export const NEWS_MENTIONS_QUERY = defineQuery(`*[_type == "newsMention"] | order(order asc){
  "_key": _id, outlet, logo, date, headline, href
}`);

/** Insight teaser cards. */
export const INSIGHTS_QUERY = defineQuery(`*[_type == "insight"] | order(order asc){
  "_key": _id, category, iconKey, readTime, title, href
}`);

/** The homepage's community mosaic. */
export const COMMUNITY_PHOTOS_QUERY = defineQuery(`*[_type == "communityPhoto"] | order(order asc){
  "_key": _id, image, org, caption, span
}`);

/** Charity logos in the homepage strip. */
export const NGO_PARTNERS_QUERY = defineQuery(`*[_type == "ngoPartner"] | order(order asc){
  "_key": _id, name, logo
}`);

/** The Community page's partner cards. */
export const COMMUNITY_PARTNERS_QUERY = defineQuery(
  `*[_type == "communityPartner"] | order(order asc){
  "_key": _id, org, logo, photo, body
}`
);

/** Teams, events and causes the firm sponsors. */
export const SPONSORSHIPS_QUERY = defineQuery(`*[_type == "sponsorship"] | order(order asc){
  "_key": _id, name, body
}`);

/**
 * The attorney rail — a third presentation of people who are already team
 * members, with a wider crop and a film on the portrait.
 *
 * ONE QUERY FOR BOTH RAILS. About shows all four and the homepage a subset, so
 * the getters filter on `onHomeRail` rather than running two near-identical
 * queries — and `once()` then makes it one request for both pages.
 *
 * `href` is built by `attorneyPath()` in the getter, not here: three layers
 * already agree on the trailing slash and a projection must not become a
 * fourth.
 *
 * THE PORTRAIT IS THE PERSON'S ONE PORTRAIT. There used to be a separate rail
 * crop — and for two of the four it was a different photograph entirely, which
 * is how Sean Dormer appeared on the site as two different people. One image,
 * hotspot-cropped per surface.
 *
 * Ordered by `railOrder`, NOT `orderRank`: the rail's sequence genuinely
 * differs from the team page's — it leads with the other partner.
 *
 * A MISSING `railOrder` SORTS LAST, NOT ARBITRARILY. Adding someone to the rail
 * is a checkbox, so an unpositioned card is the normal state right after one is
 * added; without the coalesce they land wherever null happens to sort and the
 * rail reshuffles. Ties fall back to the team page's own group-then-rank order,
 * so two unpositioned attorneys still come out in a sensible sequence rather
 * than at random.
 */
export const ATTORNEY_RAIL_QUERY = defineQuery(
  `*[_type == "teamMember" && onAttorneyRail == true] | order(
  coalesce(railOrder, 9999) asc,
  select(
    kind == "partner" => 1,
    kind == "attorney" => 2,
    kind == "staff" => 3,
    kind == "dog" => 4,
    5
  ) asc,
  orderRank asc
){
  "_key": key.current,
  name,
  role,
  location,
  "portrait": photo,
  "video": railVideo{ provider, id },
  "placement": coalesce(railPlacement, "both")
}`
);
