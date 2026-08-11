# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-11._

## State

Build is green: **40 pages**, `npm run check` passing, all **five** comp-diff scripts exiting
0. **Every page template in the comps is now built.** Nothing is in flight; run `git status`
for where you are. This file deliberately does **not** name the working branch — that line
went stale three times in the session that wrote it.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

**Built:** `index`, `about`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `practice-areas`, `news` (the blog index),
`meet-our-attorneys/` + `meet-our-attorneys/[slug]`, `tokens.astro` (an internal design-token
reference, not public-facing), and the root `[slug]` — which serves **two** collections.

`meet-our-attorneys/[slug]` serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

### The root `[slug].astro` serves blog posts AND practice-area details

Both `blogPath()` and `practiceAreaPath()` are `/${slug}` — the legacy WordPress site is flat
and ~300 live URLs depend on it — and Astro allows exactly one `[slug].astro` per directory.
So `getStaticPaths` **unions the two collections** and every record carries a `kind` the
template branches on, the way `meet-our-attorneys/[slug].astro` branches on `member.kind`.
Each branch awaits only what its own shape renders.

A slug claimed by both would silently build one page and drop the other, so `getStaticPaths`
checks and **throws** instead. Any third collection at the root joins the same union.

## What the Car Accidents work established

**One practice-area detail page is built** — `/denver-car-accident-lawyer`, the live URL.
`getPracticeAreaDetails()` returns an array of one; the other 45 areas are the CMS phase's
job and the shape is already right for them. The kit is 19 components under
`src/components/practice/detail/`, composed by `DetailPage.astro`, which owns no content.

**IT WAS BUILT TWICE.** The first build followed a 31-section comp; the design folder was
then re-dropped with a 17-section replacement — half the page cut, two sections new, three
long explainers reduced to teasers. The other four comp diffs still passed against the new
folder, so **Car Accidents was the only page that changed**.

Five things that cost time and would cost it again:

- **A comp's script block can outlive its markup.** `renderVals()` still defines **fifteen
  arrays no placeholder reads** — `keyPoints`, `crashSteps`, `leadAttorneys`,
  `otherAttorneys`, `processSteps`, `injuries`, `damageCols`, `faultBranches`, `denverData`,
  `corridors`, `courts`, `relatedAreas`, `relatedArticles`, `firmData`, `lawCtas`. Several
  are close enough to the live copy to look authoritative and are not: `denverData` lists
  four bare figures where the page draws three with a consequence attached, `corridors`
  carries a different sentence per road, and `firmData`'s third label disagrees with the
  markup's. **AGENTS.md says to read the script rather than the markup; on a REVISED comp
  you need both, and where they disagree the markup wins.** `diff-comp-car-accidents.py`
  asserts all fifteen stay unread, so a later revision that wires one back up fails there
  instead of shipping the older copy.
- **Count the `sc-for` loops before budgeting.** 23 became 10 and 105 placeholders became
  75. A minute's counting reshaped the whole estimate.
- **The nav's order must be the page's order, and it is asserted structurally.**
  `diff-comp-car-accidents.py` resolves every `data-section-link` to its target's position
  in the built page and requires those positions to ascend. The comp's own bar disagreed
  with the comp's own page — "Colorado car accident laws" fourth of five with its section
  FIRST of the five — and nothing caught it until the scroll highlight, which walks the page
  in one direction, started marking the wrong link. A label comparison cannot see that.
  **Move a section and that check fails until `nav.items` follows.**
- **Two components cannot share a root class name unless BOTH style it.** `check:styles`
  maps one class to one component: it collects the cids any scoped rule demands for a class
  and fails an element carrying that class with none of them. Four names were caught this
  way — `.stats` (vs `HeroStats`), `.results` (vs `RecentResults`), `.related` (vs
  `RelatedPosts`), `.why__*` (vs `WhyUs`). **Grep a root class name before using it.** The
  detail kit is prefixed off all four: `.stories`, `.whyfirm`, `.rellinks`.
- **This page's accent is FOREST, not gold**, throughout — eyebrow rules, badge captions,
  the FAQ sign, the testimonial quote mark, the results eyebrow, the recovered figures. The
  other 16 comps still use gold. This page only, at Rhan's direction; see Open below.

## Shared pieces to reach for

New pages should use these rather than re-solving them. All are in use on two or more pages,
so a change to one is a change to all — check before editing.

- **`components/practice/detail/` is a kit, not one page.** `DetailHero`, `SectionNav`,
  `DetailVideo`, `SourceNote`, `Triage`, `Takeaways`, `Criteria`, `LawyerCards`,
  `Credentials`, `WhyFirm`, `ResultStories`, `CaseTimeline`, `TileGrid`, `DenverData`, the
  two teasers, `MoreOnClaims` and `ClosingCta`. The first design's primitives
  (`DetailBlocks`, `InlineCta`, `PhoneAsk`, `BigAnswerCard`, `Disclosure`, `QaSection`,
  `BigAnswer`) were **deleted with the sections that used them** — `git show e42c323` has
  them if a later practice area wants that shape back.
- **`scripts/sectionNav.ts`** — the scroll highlight, wired by `data-section-nav` on the bar
  and `data-section-link` on each participating link. Participation is opt-in because the
  bar also carries a CTA pointing at `#contact`. It sorts targets into document order
  itself; keep that even though the bar now matches, because it is what stops the next
  reshuffle re-introducing the bug.
- **Portable Text carries images.** `ptImage(src, alt)` in `data/portableText.ts` composes
  with `pt()` by spreading; `ProseImage.astro` renders it through `Picture`. Registered
  under `type` — **singular**, astro-portabletext's key. `@portabletext/react` calls the
  same map `types`, and the plural renders nothing at all without erroring.
- **`lib/headings.ts`** — `headingId()` and `extractHeadings()`, for PROSE headings. Section
  handles are explicit ids in `CA_SECTION_IDS`, read by both the nav and the sections, so
  there is no second slugifier to disagree with this one.
- **`lib/readTime.ts`** — "7 min read", counted from a body rather than typed beside it.
- **`ContactForm`'s `variant` prop** — `panel` (default) is the white card; `sidebar` is the
  blog post's dark one. Same fields, endpoint, honeypot and phone mask either way.
- **`blogFilterUrl(slug)`** in `routePaths.ts` — `/news?category=<slug>`. `blogFeed.ts`
  presses the matching tab on load. Unknown slugs fall through to the whole feed.
- **`lib/dates.ts`'s `formatPostDate`** — ISO in, "June 23, 2026" out, pinned to UTC.
- **`ReviewRating.astro`** — the white "300+ Client Reviews · 5.0 on Google" card.
- **`AttorneyCard`'s `layout` prop**; **`AwardsBar`'s `tone` prop**; **`StatsBand`**;
  **`TestimonialRail`** and **`Takeaways`** both take an optional `id`, so a page's section
  nav can anchor them without either knowing what a section nav is.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates.** Four documented exclusions,
  each commented where it lives: `.pa__tab`'s chevron marks selection, `.attys__cta`'s badge
  scales instead of sliding, the carousel prev/next are controls rather than CTAs, and a
  card with no page behind it keeps its LABEL and drops the arrow — which is what the two
  unlinked crash types and the checklist teaser do.
- **`MobileNav`'s `subItemsOf`** — a parent with children renders as a `<summary>`, which
  toggles rather than navigates. This adds a link to its own page when no child points there.

## Traps worth knowing before touching a section

- **A light card inside `.section--forest` must declare its own heading colour.** global.css
  paints every heading in such a section with `.section--forest :is(h1,h2,h3,h4)` — aimed at
  headings ON the dark background. A heading on a light panel inside that band renders at
  1.08:1. Not a specificity fight; the rule just has to say something.
- **Animate one hover on one clock.** `text-decoration` cannot be animated, so declaring it
  on `:hover` snaps it on while colour eases. Declare the underline transparent up front and
  transition `text-decoration-color` — `DetailHero`'s reviewer line and `SectionNav`'s
  current link both do. Likewise `color: inherit` on a link re-interpolates on the ANCHOR's
  timing, not its own.
- **Surfaces are positional, not per-component, and nothing checks them.** Neither linter
  can see two adjacent sections sharing a background; the comps hardcode a hex per section
  and never compare two. Reordering the detail page produced a `cream → cream → cream` run
  that had to be fixed by hand. **After any reorder, list every section's surface in
  document order and confirm no two adjacent match.**
- **A value painted to match a section's background has to move when that surface does.**
  `CaseTimeline`'s spine-node halo is a `box-shadow` that punches the spine out from behind
  each node; left at `--surface-page` on an `--alt` band it draws a cream ring.

## The mobile heroes

`Hero.astro`, `PageHeader.astro`'s `tone="photo"` and `DetailHero.astro` share one
construction below their breakpoints. The photograph is a **band across the top**, sized off
the viewport WIDTH; the copy sits beneath or over its lower half. Three things that look
arbitrary and are not:

- The band is sized off **width**, not content. `cover` on a full-height portrait box takes
  its crop out of the SIDES — 42–49% of the frame across phone widths. Off width it is 6%.
- The proportions are of the band, because the band is a proportion of the viewport. What
  has to hold is the copy's relationship to the faces.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`**. A wash has to end
  in exactly the colour behind the band's foot, and the radial is a different green at every y.

`DetailHero` is the one hero whose narrow layout a comp actually specifies — its own
`@media (max-width:1180px)` block floats the panel out from over the photograph. It also
uses a **container query** on the panel, not a media query, so the hero's three proof labels
can hold one line: their fit is decided by the panel, which is 40% of the viewport above
1180px and full width below it, so in viewport terms the fit/no-fit bands are disjoint.

## Next

**No page template is left.** What remains is content and infrastructure, in this order:

1. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter
   body to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical.
   It owns three collections: the **blog import** (167 posts and 23 categories out of the
   scrape, plus the four Portable Text object types the post template deferred — `callout`,
   `phoneBand`, `attorneyCard`, `pullQuote`, whose intended home is commented in
   `components/prose/components.ts`), the **practice-area details** (45 more of the shape
   `carAccidents.ts` establishes), and everything else.
2. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. **`BlogPosting` JSON-LD
   belongs to this phase**, not to the post template — `Layout.astro` has no extra-schema
   prop yet. The detail page already emits `FAQPage` and `Attorney` locally.
3. `/studio-polish ux` — desk grouping, unique icons, length caps, preview fixes. Audits the
   filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment; `/new-seo-setup` later expects a `legalPage` type for the former.

## Open

**Bugs**

- The attorney-bio awards carousel doesn't scroll on mobile. Its six badges lay out to
  ~1006px inside a 327px rail, but the rail reports no scrollable overflow. Pre-existing —
  replicating the pre-change CSS reproduces it exactly — and the identical carousel in
  `AwardsBar.astro` works. Only 2 of 6 badges have ever been reachable. Its dots correctly
  stay hidden as a result; fixing the scroll makes them appear with no script change. Four
  causes ruled out: `display: contents` on `.bio__main`, adding `display: flex` to the
  items, the `min-width` difference between the two rails, and making `.bio__awards` a
  centred flex column.

**Decide before launch**

- `/practice-areas`'s directory ships **86 links to legacy WordPress URLs this build does
  not serve**. They resolve today because the WordPress site is still live at those paths,
  and keep resolving after cutover only if the remaining detail pages are built or
  redirected first.
- **Four more of the same** on the Blog index, plus the two legacy articles the built post
  links out to. Same fix — the blog import, not more templates.
- Eight of the Blog index's twelve cards **have no post behind them at all**.
- Three Practice Areas entries have **no page anywhere** — Legal Malpractice, Life Insurance
  Bad Faith, Pet Insurance Bad Faith. Plain text via `href: null`.
- **Two crash types on the detail page** — rear-end and head-on. Same treatment.
- **The detail page promises nine articles that do not exist**: the eight in "More on car
  accident claims" (the first design's cut sections turned into promised reading, all
  pointed at `/news` as the comp has them) and the 8-step checklist, whose own comp
  (`DH - Blog - What to do after a car accident.html`) this build does not serve — so that
  teaser ships **unlinked**, by Rhan's decision.

**Waiting on the firm** — content, not code. `README.md` has the full table. **30**
`TODO(launch)` markers are open in `src/`, up from 18 before this page. The new ones are all
Car Accidents': the three Denver crash figures (dated "[year]", sourced to "[CDOT / DRCOG /
Denver Open Data]"), the three firm closed-case figures (period given as "[date range]"),
the reviewed-by date, the four statute citations whose links the comp points at an index
page, the two crash types with no page, and the nine promised articles. Unchanged: the seven
attorney emails (six inferred from a pattern), the office address and hours, the `$70M+ /
20 Years` stat claims, and **who is in the About page's founders photograph**.

**Waiting on the designer**

- **A second Car Accidents design replaced the first mid-build.** Confirm this one is final
  before the remaining 45 practice-area pages are modelled on it.
- **Two comps arrived with that redesign and are not built**: `DH - Attorney Bio v1.html` —
  which implies `DH - Attorney Bio.html` was itself revised, and **the built bio has no diff
  script, so nothing is checking it** — and `DH - Blog - What to do after a car accident.html`.
  Neither has been compared against what ships. **Check the attorney bio before launch.**
- **The Car Accidents comp moves almost every accent from gold to forest.** Built as drawn,
  this page only. **If it is a site-wide direction rather than one page's, it touches
  `Eyebrow`'s tones, `FaqItem`, `TestimonialRail`, `AwardsBar` and the token layer** — worth
  settling before more pages are built on the gold assumption.
- **The Car Accidents page departs from its comp in fourteen ways**, all listed and asserted
  in `diff-comp-car-accidents.py`. Three are structural and worth naming: two sections moved
  (the testimonials rail up to join the results, the case timeline down below the reference
  pair), the section nav is six links rebuilt in document order rather than the comp's five
  in its own, and the reviewed-by disclosure is a link to the reviewer's bio. The Blog index
  departs in three ways and the Blog post in eighteen. All at Rhan's request or forced by
  serving a real URL: signed off by Rhan, **not seen by the designer**.
- **No comp specifies a mobile layout for anything** except that one Car Accidents hero
  block. The drawer, the other mobile heroes, the stacked CTA rows and every collapse are
  ours. The most visible is still the homepage hero, signed off by Rhan and unseen.
- The comp's blog-post sidebar lists **six categories** where the index's tab row lists five.
  One `getBlogCategories()` serves both, using the index's signed-off five.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size
  with different checksums. Nobody has said which is final.
- Whether the copy in the comps is final or placeholder.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately —
  `PracticeIcon` carries one set so brain injury looks the same on every page. Reverting is
  one file.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them.
- That section's heading is "Every case we handle, by **location**", but its last two groups
  — "Premises Liability" and "Other Legal Services" — are topical.
- The About and homepage comps carry the **same six core values with two written
  differently**. One singleton serves both, keeping the homepage's wording. Same shape of
  thing in the reviews panel. Both asserted in `diff-comp-about.py`.

**Blockers for launch, not for building**

- `/api/consult` does not exist. Two form components — `ContactForm` and `CoCounselForm` —
  are rendered in **five** places (`ContactBand`, `ContactDetails`, the blog post's
  `PostSidebar`, the detail page's `ClosingCta`, and `/co-counsel`) and all of them 404 on
  submit. One endpoint, not two: a hidden `kind` field tells the payloads apart.
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
