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
 * Only THREE qualify — see the note on the schema type, and note the sweep that
 * found the third, which a naming-convention grep had been missing. A band whose
 * heading differs per page is that page's content, not this document's.
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
  },
  whyUs{
    eyebrow,
    title{ lead, accent },
    lede,
    "points": coalesce(points[]{ _key, title, body }, []),
    ctaLabel
  }
}`
);

/**
 * FAQ accordions — one array on the page that shows it.
 *
 * THEY WERE ONE COLLECTION SPLIT BY A `shownOn` RADIO, and the radio was the
 * tell: its only job was to undo the sharing. Eight questions belong to the
 * homepage and twelve to Car Accidents, and the third caller the collection's
 * header cited — the 28 imported practice-area accordions — is not in Sanity at
 * all; those arrive with the body copy in `src/content/practice-areas/`.
 *
 * `order` went with it. Array position is the order now.
 *
 * The answer is a plain string, not Portable Text — it also feeds FAQPage
 * structured data, which takes a string.
 */
export const HOME_FAQS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].faqs[]{
  _key,
  question,
  answer,
  videoLength,
  video{ provider, id }
}`
);

/** The heavy Car Accidents page's twelve. Same shape, same components. */
export const CAR_ACCIDENT_FAQS_QUERY = defineQuery(
  `*[_type == "carAccidentsPage" && _id == "carAccidentsPage"][0].faqs[]{
  _key,
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
  videoId
}`
);

/** The nine cities that have practice-area pages. */
export const CITIES_QUERY = defineQuery(`*[_type == "city"] | order(order asc){
  "_key": key.current, name
}`);

/**
 * The blog taxonomy — all 23, unfiltered and unordered by anything meaningful.
 *
 * NEITHER THE FILTER NOR THE ORDER IS IN HERE, and both could have been. The row
 * is ordered by how many posts LEAD with each category and drops any that no
 * post leads with, which GROQ can express — but both are decisions with reasons
 * written beside them in `getBlogCategories()` ("a tab that finds nothing is
 * worse than no tab"), and a projection is the wrong place for a decision whose
 * explanation lives somewhere else. The sort by slug is only so the result is
 * stable between builds.
 *
 * `_key` IS THE SLUG, not the projected `_id`. The card's `data-category`
 * attribute and 24 legacy `/category/<slug>/` redirects are keyed on it, so it
 * is content — see the field's own description in the schema.
 */
export const BLOG_CATEGORIES_QUERY = defineQuery(
  `*[_type == "blogCategory"] | order(slug.current asc){
    "_key": slug.current, title, "slug": slug.current,
    "posts": count(*[_type == "blogPost" && categories[0]._ref == ^._id])
  }`
);

/*
 * THE BLOG — three projections over one document type.
 *
 * The split is `getBlogPosts()` vs `getBlogPostArticles()`, which predates
 * Sanity and is why it survives it: the feed is 185 card records and the bodies
 * are 1,800 words each, so a card grid should not be pulling a whole archive of
 * prose into memory to print a title.
 *
 * `href` IS NOT PROJECTED, on any of them. `blogPath(slug)` builds it, and three
 * layers already agree on the trailing slash — a projection must not become a
 * fourth. Same reason `TEAM_QUERY` returns no href.
 *
 * `reviewerKey` RATHER THAN A RESOLVED BYLINE, for the same reason: a byline is
 * `{ name, href }`, and the href is `attorneyPath()`'s to build. `byline()` in
 * `data/blog.ts` is the one place a team member becomes a credit, and it reads
 * the roster that is already memoised for the header.
 */

/** One post as a card. Spread into the three below so they cannot drift. */
const POST_CARD = `
  "_key": slug.current,
  "slug": slug.current,
  title,
  excerpt,
  publishedAt,
  "category": categories[0]->{ "_key": slug.current, title, "slug": slug.current },
  image,
  "reviewerKey": reviewer->key.current
`;

/**
 * The feed, newest first — everything EXCEPT the featured post.
 *
 * `featured != true` rather than `!featured`: the field is absent on a document
 * created before it existed, and GROQ's `!` on a null is null, not true, so the
 * negation would drop every post that has never been near the toggle.
 */
export const BLOG_POSTS_QUERY = defineQuery(
  `*[_type == "blogPost" && featured != true] | order(publishedAt desc){${POST_CARD}}`
);

/**
 * The featured post — ALL of them, not `[0]`.
 *
 * Nothing in the schema can enforce "exactly one boolean among 186 documents",
 * so the getter counts and throws. `[0]` here would silently pick one of two and
 * quietly drop a post out of the feed as well, since the feed excludes them all.
 */
export const FEATURED_POST_QUERY = defineQuery(
  `*[_type == "blogPost" && featured == true]{${POST_CARD}, "imageAlt": image.alt}`
);

/**
 * The bodies, for `getStaticPaths`. Every post, featured included — it has a
 * page like any other.
 *
 * `factCheck` is an editor's OVERRIDE and empty on all 186; the getter derives
 * the standard band from the reviewer when it is absent. `readTime` is derived
 * from the body after this, never stored.
 */
/*
 * THE PRACTICE-AREA CARD RAILS AND THE DIRECTORY — Phase 3d.
 *
 * Three lists of cards and one directory, on the two page documents that render
 * them. None of it is a collection: each list appears on exactly one page, which
 * is the rule the Collections group is built on.
 *
 * A CARD STORES ITS OWN NAME; A DIRECTORY ROW BORROWS THE PAGE'S. That split is
 * the data's, not a preference — 99 of the directory's 100 page rows print the
 * referenced page's short name, where the rails rename almost every card
 * ("Bicycle Accidents" for a page filed as "Bike Accidents", "Traumatic Brain
 * Injury" for "Brain Injuries"). So the directory coalesces onto the reference
 * and the rails do not have one.
 */

/** The homepage's six-card rail. */
export const HOME_PRACTICE_AREAS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].practiceAreaCards[]{
    _key, name, iconKey, blurb, href, image
  }`
);

/** The homepage's four catastrophic-injury panels. No photographs — an icon. */
export const HOME_CATASTROPHIC_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].catastrophicAreas[]{
    _key, name, iconKey, insight, href
  }`
);

/**
 * `/practice-areas` — the featured grid and the full directory.
 *
 * `href` IS NOT BUILT HERE. A row either carries its own (the two that are not
 * practice-area pages) or names one, and the getter turns a slug into a path
 * with `practiceAreaPath()`. Three layers already agree on the trailing slash
 * and a projection must not become a fourth — the same reason `TEAM_QUERY`
 * returns no href.
 *
 * `label` coalesces onto the referenced page's short name, so 99 of the 100
 * rows have nothing stored and cannot drift from the page they point at.
 */
export const PRACTICE_AREAS_PAGE_QUERY = defineQuery(
  `*[_type == "practiceAreasPage" && _id == "practiceAreasPage"][0]{
    "featuredAreas": coalesce(featuredAreas[]{ _key, name, iconKey, blurb, href, image }, []),
    "directory": coalesce(directory[]{
      _key,
      title,
      "items": coalesce(items[]{
        _key,
        "label": coalesce(label, page->label),
        "slug": page->slug.current,
        href
      }, [])
    }, [])
  }`
);

/*
 * THE 104 IMPORTED PRACTICE-AREA PAGES — the light template's content.
 *
 * Same split as the blog's, for the same reason: the sidebar card lists a
 * city's siblings on every one of these pages, and printing 50 labels should
 * not pull 50 bodies of 1,500–3,000 words into memory.
 *
 * THE STORED BODY IS ALREADY TRIMMED. Three chrome sections were dropped at
 * migration rather than at render, because dropping one means walking from an
 * h2 to the next h2 and GROQ cannot express that. So there is no coalescing to
 * do here — which is the point: the projection returns what the page shows.
 * `scripts/migrate-practice-areas-3c.ts` carries the manifest and the reasoning.
 *
 * `href` is not projected. `practiceAreaPath(slug)` builds it, as everywhere.
 */

/**
 * Every page as a link. UNORDERED, deliberately — the getter sorts.
 *
 * `| order(label asc)` was the obvious thing and it is WRONG for a list a human
 * reads. GROQ orders by codepoint, so every capital sorts before every
 * lowercase letter: "RTD Denver Accidents" lands before "Rideshare Accidents"
 * and "UPS Truck Accident" before "Uninsured and Underinsured Motorcyclist
 * Accidents". `localeCompare` — what this list has always used — compares
 * letters first and case last, which is the order a reader scanning an
 * alphabetical column expects. It moved two pairs across 22 of the 104 sidebar
 * cards before the byte-diff caught it.
 *
 * So the sort stays in `getPracticeAreaPages()`, where the reason for it can be
 * written down next to it.
 */
export const PRACTICE_AREA_PAGES_QUERY = defineQuery(
  `*[_type == "practiceArea"]{
    "_key": slug.current,
    "slug": slug.current,
    title,
    label,
    city,
    topic,
    "resource": coalesce(resource, false)
  }`
);

/**
 * The bodies, for `getStaticPaths`.
 *
 * `updatedAt` is `modifiedAt` renamed for the interface, which is what the meta
 * line prints as "Updated" — all 104 have one, and `publishedAt` is the labelled
 * "Posted" fallback for a page that does not.
 *
 * `readTime` and `factCheck` are both DERIVED in the getter — the first from
 * this body's word count, the second from the fact-check sentence the blog and
 * these pages share. Neither is stored on 104 documents.
 */
export const PRACTICE_AREA_ARTICLES_QUERY = defineQuery(
  `*[_type == "practiceArea"]{
    "_key": slug.current,
    "slug": slug.current,
    title,
    city,
    body,
    "faqs": coalesce(faqs[]{ _key, question, answer }, []),
    publishedAt,
    "updatedAt": modifiedAt,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription
  }`
);

export const BLOG_ARTICLES_QUERY = defineQuery(
  `*[_type == "blogPost"]{
    "_key": slug.current,
    "slug": slug.current,
    body,
    "factCheck": coalesce(factCheck, []),
    "reviewerKey": reviewer->key.current
  }`
);

/*
 * THE SIX BELOW READ ARRAYS ON A PAGE DOCUMENT, NOT COLLECTIONS.
 *
 * Each was its own collection until Phase 2f and each renders on exactly one
 * page — a Collection is for content reused in more than one place, and none of
 * these ever was. `_key` is the array member's own now rather than a projected
 * `_id`, and `| order(order asc)` is gone with the field it sorted on.
 *
 * Both `_type` and `_id` are filtered, as everywhere else here: an `_id` alone
 * tells typegen nothing about shape and the result comes back as a union across
 * every document type.
 */

/** Press mentions — the firm in someone else's publication. */
export const PRESS_MENTIONS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].pressMentions[]{
  _key, outlet, logo, date, headline, href
}`
);

/** Insight teaser cards. */
export const INSIGHT_TEASERS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].insightTeasers[]{
  _key, category, iconKey, readTime, title, href
}`
);

/** The homepage's community mosaic. */
export const COMMUNITY_PHOTOS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].communityPhotos[]{
  _key, image, org, caption, span
}`
);

/** Charity logos in the homepage strip. */
export const CHARITY_PARTNERS_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].charityPartners[]{
  _key, name, logo
}`
);

/** The Community Involvement page's partner cards. */
export const COMMUNITY_PARTNERS_QUERY = defineQuery(
  `*[_type == "communityPage" && _id == "communityPage"][0].partners[]{
  _key, org, logo, photo, body
}`
);

/** Teams, events and causes the firm sponsors. */
export const SPONSORSHIPS_QUERY = defineQuery(
  `*[_type == "communityPage" && _id == "communityPage"][0].sponsorships[]{
  _key, name, body
}`
);

/**
 * The attorney rail — partners and attorneys with a card on the homepage and
 * About.
 *
 * ORDERED THE SAME WAY THE TEAM PAGE IS, and that is the simplification. There
 * was a separate `railOrder` number because the two sequences differed in the
 * comps; keeping both meant two orders that silently disagree and a field to
 * type into when the desk already has drag-and-drop. One order, dragged in one
 * place.
 *
 * `href` is built by `attorneyPath()` in the getter, not here: three layers
 * already agree on the trailing slash and a projection must not become a
 * fourth.
 *
 * The card's portrait IS the person's portrait — there is no separate rail
 * crop, and for two of the four there used to be a different photograph
 * entirely. The film is the profile film; there is no second id.
 */
export const ATTORNEY_RAIL_QUERY = defineQuery(
  `*[_type == "teamMember" && onAttorneyRail == true] | order(
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
  "portrait": photo,
  videoId
}`
);

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * PAGE COPY — Phase 4.
 *
 * The lists above moved in Phase 2f and 3d; these are the STRINGS around them.
 * Every projection here returns exactly the shape its interface already had,
 * because that is what makes the phase output-neutral: a field that is a
 * `string` in the data layer stays a `string` here, and only the fields already
 * typed as Portable Text are Portable Text. Widening one of those to rich text
 * would add a wrapper element to the markup and cost the byte-diff its meaning.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The homepage's own copy — the four sections `data/home.ts` owns.
 *
 * ONE QUERY FOR FOUR GETTERS, the way `practiceAreasDocument()` already serves
 * two. `once()` makes it one round trip per build either way; what this buys is
 * one projection to keep in step with four interfaces instead of four.
 *
 * The homepage's OTHER copy is not in here, and deliberately so: the practice
 * band belongs to `data/practiceAreas.ts`, the FAQ band to `data/faqs.ts`, the
 * feed to `data/news.ts` and the mosaic heading to `data/community.ts`, because
 * each of those modules already owns the list underneath its heading. A query
 * that spanned all of them would have no owning module — which is the same
 * reason Phase 2f kept one query per array.
 */
export const HOME_COPY_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0]{
  hero{
    eyebrow,
    headline,
    lede,
    primaryCta{ label, href },
    videoCta{ label, video{ provider, id } }
  },
  "heroStats": coalesce(heroStats[]{ _key, big, label }, []),
  firmIntro{
    title,
    tagline,
    body,
    helpTitle,
    "helpPoints": coalesce(helpPoints[]{ _key, lead, text }, []),
    videoLabel,
    video{ provider, id },
    quote{ text, name, role },
    aside{ title, text, ctaLabel }
  },
  promise{
    eyebrow,
    title,
    "slides": coalesce(slides[]{ _key, label, body }, []),
    ctaLabel
  }
}`
);

/**
 * The practice band's heading, and the reassurance under its cards.
 *
 * Two getters, one projection, one round trip — `getPracticeSection()` and
 * `getPracticePromise()` are read side by side on the one page that renders
 * them.
 */
export const HOME_PRACTICE_SECTION_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0]{
  practiceSection{
    eyebrow,
    title,
    lede,
    tabsLabel,
    catastrophicTitle,
    ask{ text, cta }
  },
  practicePromise
}`
);

/**
 * The FAQ band's copy.
 *
 * `ask.portrait` is an ASSET now rather than a local import — a portrait inside
 * a card, which is the editor-content side of the line this project drew in
 * Phase 2. Page-header photographs and band backgrounds stay local imports.
 *
 * The Car Accidents page renders this same band under its own heading and with
 * its own anchor; `getCarAccidentFaqSection()` overrides three fields on top of
 * this one rather than storing a second copy of the parts that do not change.
 */
export const HOME_FAQ_SECTION_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].faqSection{
  eyebrow,
  title,
  lede,
  answerCtaLabel,
  ask{ title, body, ctaLabel, ctaHref, portrait, portraitAlt }
}`
);

/** The two-tab feed's headings — one per tab, matching the two lists below. */
export const HOME_FEED_SECTION_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].feedSection{
  tabs{ news, insights },
  news{ eyebrow, title, lede, ctaLabel },
  insights{ eyebrow, title, lede, ctaLabel }
}`
);

/** The heading above the community mosaic. */
export const HOME_COMMUNITY_SECTION_QUERY = defineQuery(
  `*[_type == "homePage" && _id == "homePage"][0].communitySection{
  eyebrow, title, lede, ctaLabel
}`
);

/*
 * THE EIGHT ROUTE SINGLETONS — Phase 4b.
 *
 * One query per page, and each returns its interface's shape exactly. Three
 * things are DELIBERATELY ABSENT from every one of them, and all three are the
 * same call made three times:
 *
 *   the page-header photograph and its alt   still a local import — `PageHeader`
 *                                            art-directs through a hand-built
 *                                            <picture>, so making it editable is
 *                                            a component change
 *   the office address, phone, map           read from `firmDetails` at render
 *                                            time; copy moves, values stay derived
 *   the consultation form's copy             `contactSettings`, on twelve of the
 *                                            fourteen comps
 */

/** /about — nine bands' worth of copy, minus the six it borrows from elsewhere. */
export const ABOUT_PAGE_QUERY = defineQuery(
  `*[_type == "aboutPage" && _id == "aboutPage"][0]{
  eyebrow,
  title,
  lede,
  ctaLabel,
  ctaNote,
  whoWeAre{ eyebrow, title, body, ctaLabel, ctaHref },
  quote{ text, attribution },
  team{ eyebrow, title, ctaLabel, ctaHref },
  reviews{ eyebrow, title },
  oneShot{ eyebrow, title, body },
  expect{
    title,
    "promises": coalesce(promises[]{ _key, title, body, iconKey }, []),
    "milestones": coalesce(milestones[]{ _key, tag, title, body }, [])
  }
}`
);

/** /meet-our-attorneys — the page's copy. The roster is `TEAM_QUERY`. */
export const TEAM_PAGE_QUERY = defineQuery(
  `*[_type == "teamPage" && _id == "teamPage"][0]{
  eyebrow,
  title,
  lede,
  partners{ eyebrow, title },
  team{ eyebrow, title }
}`
);

/**
 * /contact.
 *
 * `find.lede` is the part AFTER the address, not the whole line — the address
 * is prepended in the getter, from `firmDetails`. Storing the rendered sentence
 * would publish the address twice from two documents.
 */
export const CONTACT_PAGE_QUERY = defineQuery(
  `*[_type == "contactPage" && _id == "contactPage"][0]{
  eyebrow,
  title,
  lede,
  find{ eyebrow, title, lede }
}`
);

/** /thank-you. `noIndex`, and reachable only by submitting the form. */
export const THANK_YOU_PAGE_QUERY = defineQuery(
  `*[_type == "thankYouPage" && _id == "thankYouPage"][0]{
  eyebrow,
  title,
  lede,
  panel{
    eyebrow,
    title,
    lede,
    "reassurances": coalesce(reassurances, []),
    "ctas": coalesce(ctas[]{ _key, label, href }, [])
  }
}`
);

/** /testimonials — two band headings over records the homepage also renders. */
export const TESTIMONIALS_PAGE_QUERY = defineQuery(
  `*[_type == "testimonialsPage" && _id == "testimonialsPage"][0]{
  eyebrow,
  title,
  lede,
  ctaLabel,
  ctaNote,
  videos{ eyebrow, title, lede },
  written{ eyebrow, title, lede, moreLabel }
}`
);

/** /results — the copy around the case-result grid. */
export const RESULTS_PAGE_QUERY = defineQuery(
  `*[_type == "resultsPage" && _id == "resultsPage"][0]{
  eyebrow, title, lede, moreLabel
}`
);

/** /co-counsel — the pitch to other lawyers, and its own referral form's copy. */
export const CO_COUNSEL_PAGE_QUERY = defineQuery(
  `*[_type == "coCounselPage" && _id == "coCounselPage"][0]{
  eyebrow,
  title,
  lede,
  ctaLabel,
  ctaNote,
  partnership{ eyebrow, title, intro, callout, terms },
  results{ eyebrow, title, lede },
  areas{
    eyebrow,
    title,
    ctaLabel,
    "items": coalesce(items[]{ _key, label, href }, [])
  },
  form{ title, lede, requiredNote, submitLabel, disclaimer }
}`
);

/** /news — the blog index's copy. Six of the eight fields are button labels. */
export const BLOG_INDEX_PAGE_QUERY = defineQuery(
  `*[_type == "blogIndexPage" && _id == "blogIndexPage"][0]{
  eyebrow,
  title,
  lede,
  categoryLabel,
  allLabel,
  featuredBadge,
  readMoreLabel,
  loadMoreLabel,
  emptyLabel
}`
);
