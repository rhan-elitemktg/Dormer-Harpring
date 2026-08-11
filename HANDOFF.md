# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-10._

## State

Build is green: **40 pages**, `npm run check` passing, all **five** comp-diff scripts exiting
0. **Every page template in the comps is now built.** Nothing is in flight; run `git status`
for where you are. This file deliberately does **not** name the working branch — that line
went stale three times in the session that wrote it.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

**Built:** `index`, `about`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `practice-areas`, `news` (the blog index),
`meet-our-attorneys/` + `meet-our-attorneys/[slug]`, `tokens.astro` (an internal design-token
reference, not public-facing), and the root `[slug]` — which now serves **two** collections.

`meet-our-attorneys/[slug]` serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

### The root `[slug].astro` now serves blog posts AND practice-area details

Both `blogPath()` and `practiceAreaPath()` are `/${slug}` — the legacy WordPress site is flat
and ~300 live URLs depend on it — and Astro allows exactly one `[slug].astro` per directory.
So `getStaticPaths` **unions the two collections** and every record carries a `kind` the
template branches on, the way `meet-our-attorneys/[slug].astro` branches on `member.kind`.
Each branch awaits only what its own shape renders.

A slug claimed by both collections would silently build one page and drop the other, so
`getStaticPaths` checks for it and **throws** instead. Any third collection at the root joins
the same union; it does not get its own file.

### What the Car Accidents work established

**One practice-area detail page is built** — `/denver-car-accident-lawyer`, the live URL.
`getPracticeAreaDetails()` returns an array of one and the other 45 areas are the CMS
phase's job; the shape is already right for them.

**IT WAS BUILT TWICE.** The first build followed a 31-section comp; the design folder was
then re-dropped with a 17-section replacement — half the page cut, two sections new, three
long explainers reduced to teasers pointing at articles. The four other comp-diff scripts
still passed against the new folder, so **Car Accidents was the only page that changed**.

The rebuild is the current one. What it left behind is worth knowing:

- **A comp's script block can outlive its markup.** `renderVals()` still defines **fifteen
  arrays no placeholder reads** — `keyPoints`, `crashSteps`, `leadAttorneys`,
  `otherAttorneys`, `processSteps`, `injuries`, `damageCols`, `faultBranches`,
  `denverData`, `corridors`, `courts`, `relatedAreas`, `relatedArticles`, `firmData`,
  `lawCtas`. Several are close enough to the new copy to look authoritative and are not:
  `denverData` lists four bare figures where the page draws three with a consequence
  attached, `corridors` carries a different sentence per road, and `firmData`'s third label
  disagrees with the markup's. **AGENTS.md says to read the script rather than the markup;
  on a revised comp you need both, and where they disagree the markup wins.**
  `diff-comp-car-accidents.py` asserts all fifteen are still unread, so a later revision
  that wires one back up fails there instead of shipping the older copy.
- **Check `sc-for` counts before budgeting.** 23 loops became 10, and 105 placeholders 75.
  Counting them took a minute and reshaped the whole estimate.
- **`lawQuestionsData` + `faqLens` IS the existing `Faq` type** with its two halves kept
  apart. The twelve rows live in `faqs.ts` as `getCarAccidentFaqs()` and `FaqBand` renders
  them unchanged, `faqSchema` included. Unchanged across both designs.
- **The section nav uses explicit ids, not a slugifier.** `CA_SECTION_IDS` is read by both
  the nav's hrefs and each section's `id`, so they cannot drift, and there is no second
  slugifier to disagree with `lib/headings.ts`. `#know` moved between designs — it was a
  long medical-bills section and is now the four-point summary — and only that object
  changed.
- **THE BAR'S ORDER IS THE PAGE'S ORDER, and the diff script asserts it structurally** by
  resolving each link to its target's position in the built page. The comp's own bar lists
  five links in an order unrelated to its page — "Colorado car accident laws" fourth of five
  with its section FIRST of the five in the document — which nothing caught until the scroll
  highlight, which walks the page in one direction, started marking the wrong link. A label
  comparison cannot see that; the positional check fails the moment the two disagree. If a
  section moves, that check fails until `nav.items` follows.
- **This page's accent is FOREST, not gold.** Eyebrow rules, badge captions, the FAQ sign,
  the testimonial quote mark, the results eyebrow and the recovered figures are all
  `--dh-forest-100` here. The other 16 comps still use gold and their diffs still pass, so
  it is **this page only** — Rhan's call, flagged below for the designer.

### One trap, and it is not blog-specific

**Two components cannot share a root class name unless BOTH style it.** `check:styles` maps
one class name to one component: it collects the cids any scoped rule demands for a class
and fails an element carrying that class with none of them. This caught four names across
the two builds — `.stats` (against `HeroStats`), `.results` (against `RecentResults`),
`.related` (against `RelatedPosts`) and `.why__*` (against `WhyUs`). **Grep for a root class
name before using it.** The detail components are prefixed off the collisions now:
`.stories`, `.whyfirm`, `.rellinks` were all renamed for this reason.

### Shared pieces to reach for

New pages should use these rather than re-solving them. All are in use on two or more pages
already, so a change to one is a change to all of them — check before editing.

- **`components/practice/detail/` is a kit, not one page.** `DetailHero`, `SectionNav`,
  `DetailVideo`, `SourceNote`, `Triage`, `Takeaways`, `Criteria`, `LawyerCards`,
  `Credentials`, `WhyFirm`, `ResultStories`, `CaseTimeline`, `TileGrid`, `DenverData`, the
  two teasers, `MoreOnClaims` and `ClosingCta` are what the next practice-area page is
  assembled from. `DetailPage.astro` is the composition; it owns no content. The first
  design's primitives (`DetailBlocks`, `InlineCta`, `PhoneAsk`, `BigAnswerCard`,
  `Disclosure`, `QaSection`, `BigAnswer`) were **deleted with the sections that used
  them** — `git show e42c323` has them if a later page wants that shape back.
- **Portable Text carries images.** `ptImage(src, alt)` in `data/portableText.ts` composes
  with `pt()` by spreading; `ProseImage.astro` renders it through `Picture`. Registered under
  `type` — **singular**, which is astro-portabletext's key. `@portabletext/react` calls the
  same map `types`, and the plural renders nothing at all without erroring.
- **`lib/headings.ts`** — `headingId()` and `extractHeadings()`. `ProseH2`/`ProseH3` emit an
  id from the first, any contents list reads the second, so an anchor and its target cannot
  drift. Prose headings only; section handles are the data's, per above.
- **`lib/readTime.ts`** — "7 min read", counted from a body rather than typed beside it.
- **`ContactForm`'s `variant` prop** — `panel` (default) is the white card; `sidebar` is the
  blog post's dark one. Same fields, endpoint, honeypot and phone mask either way.
- **`blogFilterUrl(slug)`** in `routePaths.ts` — `/news?category=<slug>`. `blogFeed.ts`
  presses the matching tab on load. Unknown slugs fall through to the whole feed.
- **`lib/dates.ts`'s `formatPostDate`** — ISO in, "June 23, 2026" out, pinned to UTC.
- **`ReviewRating.astro`** — the white "300+ Client Reviews · 5.0 on Google" card.
- **`AttorneyCard`'s `layout` prop** — `"rail"` fixes the card at 272px; `"grid"` lets the
  track set it.
- **`AwardsBar`'s `tone` prop** — `lifted` (default) is the comps' near-white; `sunk` is for
  pages where the band follows a plain cream section.
- **`.hero-cta` / `.hero-cta__note`** in `global.css` — the one-button-plus-gold-note row.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates.** Four documented exclusions,
  each commented where it lives: `.pa__tab`'s chevron marks selection, `.attys__cta`'s badge
  scales instead of sliding, the carousel prev/next are controls rather than CTAs, and a
  card with no page behind it keeps the comp's LABEL and drops the arrow — which is what
  the two unlinked crash types and the checklist teaser do.
- **`TestimonialRail` and `Takeaways` take an optional `id`**, so a page's section nav can
  anchor to them without either component knowing what a section nav is.
- **`MobileNav`'s `subItemsOf`** — a parent with children renders as a `<summary>`, which
  toggles rather than navigates. This adds a link to its own page when no child points there.

### Two traps from the Blog post review, both still live on any new card

- **A light card inside `.section--forest` must declare its own heading colour.** global.css
  paints every heading in such a section with `.section--forest :is(h1, h2, h3, h4) { color:
  var(--text-on-dark) }` — aimed at headings sitting ON the dark background. A heading on a
  light panel inside that band, with no colour of its own, renders at 1.08:1. It is not a
  specificity fight — `:is(h1, h2, h3, h4)` contributes only a type selector, so any scoped
  class rule outranks it. The rule just has to say something. The new result-story card and
  the process card both declare one.
- **`color: inherit` on a link re-interpolates on the ANCHOR's timing.** A card whose title
  is an `<h3>` with a stretched `<a>` inside it paints the text from the anchor, and the
  anchor picks up global.css's `a { transition: color var(--transition) }`. Every animated
  property on one hover should name the same duration, the anchor's included.

### The mobile heroes

`Hero.astro`, `PageHeader.astro`'s `tone="photo"` and now `DetailHero.astro` share one
construction below their breakpoints, and it is worth reading the comments before touching
any of them. The photograph is a **band across the top**, sized off the viewport WIDTH; the
copy sits beneath or over its lower half.

Three things that look arbitrary and are not:

- The band is sized off **width**, not content. `cover` on a full-height portrait box takes
  its whole crop out of the SIDES — measured at 42–49% of the frame across phone widths.
  Off width it is 6%.
- The proportions are of the band, because the band is itself a proportion of the viewport.
  What has to hold is the copy's relationship to the faces.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`**. A wash has to end
  in exactly the colour behind the band's foot, and the radial is a different green at every y.

`DetailHero` is the one hero whose narrow layout the comp actually specifies — its own
`@media (max-width:1180px)` block floats the panel out from over the photograph. Ours follows
it, and below 768px puts the phone number first and gives it the solid fill.

## Next

**No page template is left.** What remains is content and infrastructure, in this order:

1. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter
   body to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical.
   It owns three collections at once now: the **blog import** (167 posts and 23 categories
   out of the scrape, plus the four Portable Text object types the post template deferred —
   `callout`, `phoneBand`, `attorneyCard`, `pullQuote`, whose intended home is commented in
   `components/prose/components.ts`), the **practice-area details** (45 more of the shape
   `carAccidents.ts` establishes), and everything else.
2. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. **`BlogPosting` JSON-LD
   belongs to this phase**, not to the post template — `Layout.astro` has no extra-schema
   prop yet. The detail page already emits `FAQPage` through the shared `FaqBand`.
3. `/studio-polish ux` — desk grouping into Pages/Collections/Site Settings, unique icons,
   length caps, preview fixes. Audits the filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment; `/new-seo-setup` later expects a `legalPage` type for the former.

## Open

**Bugs**

- The attorney-bio awards carousel doesn't scroll on mobile. Its six badges lay out to
  ~1006px inside a 327px rail, but the rail reports no scrollable overflow. Pre-existing —
  replicating the pre-change CSS reproduces it exactly — and the identical carousel in
  `AwardsBar.astro` works. Only 2 of 6 badges have ever been reachable there. Its dots
  correctly stay hidden as a result; fixing the scroll makes them appear with no script
  change. Four causes already ruled out: `display: contents` on `.bio__main`, adding
  `display: flex` to the items, the `min-width` difference between the two rails, and making
  `.bio__awards` a centred flex column.

**Decide before launch**

- `/practice-areas`'s directory ships **86 links to legacy WordPress URLs that this build
  does not serve** — down one, because Car Accidents is now built. They resolve today
  because the WordPress site is still live at those paths, and they keep resolving after
  cutover only if the remaining detail pages are built or redirected first.
- **Four more of the same** on the Blog index: its other real posts, plus the two legacy
  articles the built post's body links out to. Same fix — the blog import, not more templates.
- Eight of the Blog index's twelve cards **have no post behind them at all** and render
  without a link. README.md's table has the full account.
- Three entries the Practice Areas comp lists have **no page anywhere** — Legal Malpractice,
  Life Insurance Bad Faith, Pet Insurance Bad Faith. They render as plain text via
  `href: null`. Marked `TODO(launch)`.
- **Two crash types on the detail page have no page either** — rear-end and head-on. Same
  treatment, same marker.
- **The detail page promises nine articles that do not exist** — the eight in "More on car
  accident claims" and the 8-step checklist the teaser names. The eight are the first
  design's cut sections turned into promised reading, and the comp points them at the blog
  index; the checklist has its own comp (`DH - Blog - What to do after a car accident.html`)
  that this build does not serve, so its teaser ships **unlinked** by Rhan's decision.

**Waiting on the firm** — these are content, not code. `README.md` has the full table; the
short version is that **30** `TODO(launch)` markers are open in `src/`, up from 18. The new
ones are Car Accidents': the three Denver crash figures (the comp dates them "[year]" and
sources them to "[CDOT / DRCOG / Denver Open Data]"), the three firm closed-case figures
(whose disclaimer names the period "[date range]"), the reviewed-by date and K.C.'s five
credential lines, the four statute citations whose links the comp points at an index page,
the two crash types with no page, and the nine promised articles. The rest are unchanged —
the seven attorney emails (six inferred from a pattern), the office address and hours, the
`$70M+ / 20 Years` stat claims, and **who is in the About page's founders photograph**.

**Waiting on the designer**

- **No comp specifies a mobile layout for anything** — every comp is a desktop frame, with
  one exception now: `DH - Car Accidents.html` carries a `@media (max-width:1180px)` block
  for its hero, which `DetailHero` follows. Everything else — the drawer, the other mobile
  heroes, the stacked CTA rows, the checklist's collapse from two columns to one — is ours.
  The most visible is still the homepage hero, signed off by Rhan and unseen by the designer.
- **The Blog index departs from its comp in three visible ways**, the **Blog post in
  eighteen** (all listed and asserted in `diff-comp-blog-post.py`), and the **Car Accidents
  page in eleven** (asserted in `diff-comp-car-accidents.py`). All at Rhan's request or
  forced by serving a real URL. Same standing: signed off by Rhan, not seen by the designer.
- **Two sections moved.** The testimonials rail sits directly after the results — they are
  one argument told two ways, the figures then the people behind them, and the comp puts
  three sections between them. And the case timeline moved below the crash types and the
  Denver data, so the reference pair runs together and "what the next few months look like"
  is the last substantive section before the reading tail. Between them these also cleared
  the comp's `cream → cream → cream` run; `CaseTimeline` took `--alt` in its new slot, and
  its spine-node halo moved with it, because that halo has to BE the section's background.
  Nothing else moved: the rest of the comp's order is sound.
- **The section nav is six links, not the comp's five**, rebuilt in document order with
  shortened labels ("Crash types", "Colorado law") and a new "Do I have a case?" entry
  whose section the comp never anchored. The phone number now drops out of the bar at
  1180px rather than 900px — six labels plus the number plus the CTA fill the row, and the
  number is repeated in the hero directly above and in the closing block.
- **The Car Accidents comp moves almost every accent from gold to forest** — eyebrow rules,
  badge captions, the FAQ +/− sign, the testimonial quote mark, the results eyebrow, and the
  recovered figures. The other 16 comps still use gold and their diffs still pass. Built as
  drawn, on this page only, at Rhan's direction. **If it is a site-wide direction rather
  than one page's, it touches `Eyebrow`'s tones, `FaqItem`, `TestimonialRail`, `AwardsBar`
  and the token layer** — worth settling before more pages are built on the gold assumption.
- **A second Car Accidents design replaced the first mid-build.** Worth confirming this one
  is final before the remaining 45 practice-area pages are modelled on it.
- **Two comps arrived with the redesign and are not built**: `DH - Attorney Bio v1.html`
  (which suggests `DH - Attorney Bio.html` was itself revised — the built bio has no diff
  script, so nothing checks it) and `DH - Blog - What to do after a car accident.html`.
  Neither has been diffed against what is built. **Check the attorney bio before launch.**
- The comp's blog-post sidebar lists **six categories** where the index's tab row lists five.
  One `getBlogCategories()` serves both, using the index's signed-off five.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size
  with different checksums. Nobody has said which is final.
- Whether the copy in the comps is final or placeholder.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately.
  `PracticeIcon` carries the `pa-icons-line` set so brain injury looks the same on every
  page. Confirm that's the intended drawing before launch; reverting is one file.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them. Add three groups, or leave
  them to the nav?
- That section's heading is "Every case we handle, by **location**", but the comp's last two
  groups — "Premises Liability" and "Other Legal Services" — are topical.
- The About comp and the homepage comp carry the **same six core values with two of them
  written differently**. One singleton serves both, keeping the homepage's wording. Same
  shape of thing in the reviews panel. Both asserted in `diff-comp-about.py`.

**Blockers for launch, not for building**

- `/api/consult` does not exist. **Three** forms post to it and 404 on submit — the contact
  band, the co-counsel referral, and the blog post's sidebar. The Car Accidents page closes
  on the shared contact block, so it is the fourth page pointing at the same endpoint.
- The production URL is not yet a Sanity CORS origin, so the deployed `/admin` loads but
  fails sign-in. `http://localhost:4321` is registered.
- `site:` in `astro.config.mjs` — www vs apex, unsettled.

## Studio

Elite brand theme applied (scaffold-time `/studio-polish brand`): light-locked palette,
ELITE emblem as the workspace `icon`, centred login card. That login-card layout uses a
scoped CSS hook into Sanity's internal DOM, attached to the icon component because
`studio.components.layout` doesn't wrap the unauthenticated login screen. Cosmetic only and
fails gracefully — worth a glance after major Sanity upgrades.

The desk is empty because there are no content types yet. Expected.
