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
  reviewSummary{ count, rating, source }
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
