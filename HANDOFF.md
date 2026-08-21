# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-21._

## State

Build is green: **40 pages**, `npm run check` passing, all **five** comp-diff scripts exiting
0. Every page template in the comps is built. Nothing is in flight; run `git status` for where
you are. This file deliberately does **not** name the working branch — that line went stale
three times in the session that first wrote it.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

**The Car Accidents detail page has had a full section-by-section review — 18 of 18 sections,
against the comp and against Rhan's own notes.** That work is merged. What follows is what it
established; the page itself is done.

### The root `[slug].astro` serves blog posts AND practice-area details

Both `blogPath()` and `practiceAreaPath()` are `/${slug}` — the legacy WordPress site is flat
and ~300 live URLs depend on it — and Astro allows exactly one `[slug].astro` per directory.
So `getStaticPaths` **unions the two collections** and every record carries a `kind` the
template branches on, the way `meet-our-attorneys/[slug].astro` branches on `member.kind`.
A slug claimed by both would silently build one page and drop the other, so `getStaticPaths`
checks and **throws** instead. Any third collection at the root joins the same union.

## THE THING TO FIX FIRST: 18 dead links ship today

`href="#"` renders **18 times across four pages**, and only one of them is marked
`TODO(launch)`. Two of them are the firm's phone number rendered as a link that does not dial,
which is the worst version of this on a personal-injury site.

| Where | Count | Source |
|---|---|---|
| Homepage, News & Insights band | 8 | `data/news.ts` — every `href` is `"#"` |
| Blog post (trampoline waiver) | 8 | `prose/ProseLink.astro`'s `value?.href ?? "#"` fallback |
| `/thank-you` | 1 | a phone number in Portable Text, same fallback |
| Car Accidents checklist teaser | 1 | deliberate placeholder, marked in three places |

**The homepage eight are marked `TODO(content)`, not `TODO(launch)`** — so they are invisible
to the grep the README's launch table is built from. That is how eight dead links on the
busiest page stayed off the list. Marker inventory: **35 `TODO(launch)`, 5 `TODO(video)`,
3 `TODO(sanity)`, 1 `TODO(content)`.** Grep all four before launch, not just the first.

`ProseLink`'s fallback is the more interesting one: it silently turns a Portable Text link with
no href into a link to nowhere. `TeamCard.astro` already documents the opposite choice — render
plain text rather than an `<a href="#">` — and that is the convention this should follow.

## What the Car Accidents review established

Patterns worth not re-deriving. All five comp-diff scripts still pass, so anything here that
departs from a comp is recorded in `diff-comp-car-accidents.py`'s DELIBERATE DIFFERENCES list (19 entries).

- **A text decoration on a flex container reaches the arrow inside it.** `.arrow-link` is
  `inline-flex`, which blockifies its children, and a decoration propagates into in-flow
  block-level descendants where the child cannot cancel it. So `text-decoration: underline` on
  the anchor strikes the glyph too. **Five instances** on that one page, found one section at a
  time. The fix is `.arrow-link__label` in `global.css` — the label carries the underline, the
  anchor says `text-decoration: none`. **Two of the five already had a rule trying to fix it**
  (`.tile__link .arrow { text-decoration: none }` and the same in `MoreOnClaims`), one with a
  comment asserting it worked. A descendant cannot turn it off; those rules never did anything.
  Swept the whole site afterwards: **no rule anywhere else combines `inline-flex` with
  `text-decoration: underline`**, so this is closed, not lurking.
- **A rail whose content fits leaves its arrows permanently disabled.** `scripts/rail.ts` gained
  an opt-in `data-rail-nav="<name>"` wrapper that it hides outright when `scrollWidth` fits
  `clientWidth`, extending to arrows the rule the dots already had. **Two card rails still do
  not declare it** — `TestimonialRail` and `home/AttorneysBand` — so check them before assuming
  their arrows work at every width. `ResultStories` was disabled at *every* desktop width for
  months before this was noticed.
- **A rounded percentage basis will not sit flush with the controls under it.** Card rails size
  off `calc((100% - N * var(--gap)) / N)` now, not the comps' `31.4%`/`48%`, which left the last
  visible card ~24px short of the container edge the arrows sit on.
- **Grep a root class name before using it.** Still shared: `.feat`
  (`blog/FeaturedPost` + `practice/FeaturedAreas`) and `.stats` (`StatsBand` +
  `home/hero/HeroStats`). Harmless today — Astro scoping keeps them apart and they never share
  a page — but `check:styles` cannot see it, and it is one `:global()` away from real.
  `MoreOnClaims` was renamed off `.feat` to `.morefeat` for exactly this reason.
- **`space-between` centres a middle item only when the outer two are equal width.** Its centre
  resolves to `a + gap + b/2`, which equals `W/2` only when `a == c`. The fault teaser's
  threshold label sat ~25px off the mark it annotated. Three equal grid tracks instead.
- **`overflow: hidden` clips the shadow of anything flush to the edge.** Widen the clip box with
  padding and pull it back with an equal negative margin; keep the bleed `<= --container-pad` so
  it stays inside the gutter. Watch absolutely positioned children — they resolve against the
  **padding** box, so `left: 0` lands in the new bleed.
- **`unesc()` in the diff scripts strips tags**, so `built_text` cannot see attribute values.
  Assertions about `alt`, `href` or `target` must read `built`, not `built_text`.
- **Assert on class *presence*, not on an exact class-attribute prefix.** Two departures were
  matching `'class="tile tile--link'`; adding a second class to the list would have made them
  silently false rather than failing.

## Shared pieces to reach for

New pages should use these rather than re-solving them. All are in use on two or more pages, so
a change to one is a change to all — check before editing.

- **`components/practice/detail/` is a kit, not one page.** `DetailHero`, `SectionNav`,
  `DetailVideo`, `SourceNote`, `Triage`, `Takeaways`, `Criteria`, `LawyerCards`, `Credentials`,
  `WhyFirm`, `ResultStories`, `CaseTimeline`, `TileGrid`, `DenverData`, the two teasers,
  `MoreOnClaims` and `ClosingCta`, composed by `DetailPage.astro`, which owns no content.
  The first design's primitives were deleted with the sections that used them; `git show
  e42c323` has them if a later practice area wants that shape back.
- **`media/PlayButton.astro`** owns the pulse. Whether it runs is decided in `global.css` by
  `:is(a, button):hover .play` and `[data-video]:hover .play`, so a card that is an `<a>` gets
  the pulse for free. **Three components still hand-roll a play circle** and so do not pulse:
  `testimonials/VideoReviewCard`, `team/AttorneyBio`, and `practice/detail/MoreOnClaims`.
- **`scripts/rail.ts`** — one self-executing module behind every rail, wired by name through
  `data-rail` / `data-rail-prev` / `data-rail-next` / `data-rail-dots` / `data-rail-nav`.
  Card rails use arrows; awards carousels use dots below 760px. Nothing renders both.
- **`scripts/sectionNav.ts`** — the scroll highlight. It sorts targets into document order
  itself; keep that even though the bar now matches, because it is what stops the next
  reshuffle re-introducing the bug it was written for.
- **`Eyebrow.astro`** — the rule is part of the mark; never render the label without it. Its
  `on-dark` tone is gold, so a forest-accented page overrides the colour locally.
- **Portable Text carries images.** `ptImage(src, alt)` in `data/portableText.ts` composes with
  `pt()` by spreading. Registered under `type` — **singular**, astro-portabletext's key.
  `@portabletext/react` calls the same map `types`, and the plural renders nothing at all
  without erroring.
- **`lib/headings.ts`**, **`lib/readTime.ts`**, **`lib/dates.ts`'s `formatPostDate`**,
  **`ContactForm`'s `variant` prop**, **`blogFilterUrl(slug)`**, **`ReviewRating.astro`**,
  **`AttorneyCard`'s `layout` prop**, **`AwardsBar`'s `tone` prop**, **`StatsBand`**.
  `TestimonialRail` and `Takeaways` both take an optional `id`, so a page's section nav can
  anchor them without either knowing what a section nav is.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates**, and `.arrow-link__label` on the
  label whenever that link is underlined. Four documented exclusions, each commented where it
  lives.
- **`MobileNav`'s `subItemsOf`** — a parent with children renders as a `<summary>`, which
  toggles rather than navigates. This adds a link to its own page when no child points there.

## Traps worth knowing before touching a section

- **A light card inside `.section--forest` must declare its own heading colour.** global.css
  paints every heading in such a section with `.section--forest :is(h1,h2,h3,h4)`. A heading on
  a light panel inside that band renders at 1.08:1. Not a specificity fight; the rule just has
  to say something.
- **Animate one hover on one clock.** `text-decoration` cannot be animated, so declaring it on
  `:hover` snaps it on while colour eases. Declare the underline transparent up front and
  transition `text-decoration-color`. Likewise `color: inherit` on a link re-interpolates on
  the ANCHOR's timing, not its own.
- **Surfaces are positional, not per-component, and nothing checks them.** Neither linter can
  see two adjacent sections sharing a background; the comps hardcode a hex per section and never
  compare two. **After any reorder, list every section's surface in document order and confirm
  no two adjacent match.**
- **A value painted to match a section's background has to move when that surface does.**
  `CaseTimeline`'s spine-node halo is a `box-shadow` that punches the spine out from behind each
  node; left at `--surface-page` on an `--alt` band it draws a cream ring.
- **Token names can mislead.** `--dh-cream-50` is commented "lifted cards on cream" and reads
  like a hover state, but it is 1.009:1 against `--dh-cream-100`, which is what most cream
  sections actually use. A card hovering to it dissolves into the band.
- **An animation's value outranks a normal declaration, even paused at frame zero.** A
  `box-shadow` on `.play` cannot be overridden from a parent while `playPulseLight` is applied.

## The mobile heroes

`Hero.astro`, `PageHeader.astro`'s `tone="photo"` and `DetailHero.astro` share one construction
below their breakpoints. The photograph is a **band across the top**, sized off the viewport
WIDTH; the copy sits beneath or over its lower half. Three things that look arbitrary and are not:

- The band is sized off **width**, not content. `cover` on a full-height portrait box takes its
  crop out of the SIDES — 42–49% of the frame across phone widths. Off width it is 6%.
- The proportions are of the band, because the band is a proportion of the viewport. What has to
  hold is the copy's relationship to the faces.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`**. A wash has to end in
  exactly the colour behind the band's foot, and the radial is a different green at every y.

`DetailHero` is the one hero whose narrow layout a comp specifies. It uses a **container query**
on the panel, not a media query, so its three proof labels can hold one line: their fit is
decided by the panel, which is 40% of the viewport above 1180px and full width below it, so in
viewport terms the fit/no-fit bands are disjoint.

**Art direction is a hand-built `<picture>`, not `Picture.astro`.** `PageHeader`, `Hero` and now
`WhyFirm` each build their own, because two different crops can only be chosen by `media` and
`Picture` takes one `src` by design. Switch the crop on the same breakpoint the layout restacks
on, and give each `<source>` its own `widths` — the two boxes are rarely the same size.

## Next

**No page template is left.** What remains is content and infrastructure, in this order:

1. **The 18 dead links above.** Cheapest real risk on the board, and two of them are the phone
   number.
2. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter body
   to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical. It owns
   three collections: the **blog import** (167 posts and 23 categories out of the scrape, plus
   the four Portable Text object types the post template deferred — `callout`, `phoneBand`,
   `attorneyCard`, `pullQuote`, whose intended home is commented in
   `components/prose/components.ts`), the **practice-area details** (45 more of the shape
   `carAccidents.ts` establishes), and everything else.
3. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. **`BlogPosting` JSON-LD
   belongs to this phase**, not to the post template — `Layout.astro` has no extra-schema prop
   yet. The detail page already emits `FAQPage` and `Attorney` locally.
4. `/studio-polish ux` — desk grouping, unique icons, length caps, preview fixes. Audits the
   filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment; `/new-seo-setup` later expects a `legalPage` type for the former.

## Open

**Bugs**

- The attorney-bio awards carousel doesn't scroll on mobile. Its six badges lay out to ~1006px
  inside a 327px rail, but the rail reports no scrollable overflow. Pre-existing, and the
  identical carousel in `AwardsBar.astro` works. Only 2 of 6 badges have ever been reachable.
  Its dots correctly stay hidden as a result; fixing the scroll makes them appear with no script
  change. Four causes ruled out: `display: contents` on `.bio__main`, adding `display: flex` to
  the items, the `min-width` difference between the two rails, and making `.bio__awards` a
  centred flex column. **`Credentials.astro` is the same construction and works** — it was built
  from `AwardsBar` deliberately for that reason, so diffing the two is the next thing to try.

**Decide before launch**

- `/practice-areas`'s directory ships **86 links to legacy WordPress URLs this build does not
  serve**. They resolve today because the WordPress site is still live at those paths, and keep
  resolving after cutover only if the remaining detail pages are built or redirected first.
- **Four more of the same** on the Blog index, plus the two legacy articles the built post links
  out to. Same fix — the blog import, not more templates.
- Eight of the Blog index's twelve cards **have no post behind them at all**.
- Three Practice Areas entries have **no page anywhere** — Legal Malpractice, Life Insurance Bad
  Faith, Pet Insurance Bad Faith. Plain text via `href: null`.
- **Two crash types on the detail page** — rear-end and head-on. Same treatment.
- **The detail page promises nine articles that do not exist**: the eight in "More on car
  accident claims" (all pointed at `/news`, as the comp has them) and the 8-step checklist. The
  checklist teaser now ships **linked to `#`** at Rhan's direction — the affordance is drawn and
  the destination is a placeholder. `#` must not reach production.
- **The three Denver crash figures are unsourced**, and `[year]` renders live in all three stat
  labels. The comp's source line that admitted this was removed at Rhan's request, so the
  `TODO(launch)` on `denver.stats` is now the only record anywhere. Verify against a published
  table or drop the band.

**Waiting on the firm** — content, not code. `README.md` has the full table. Unchanged: the
seven attorney emails (six inferred from a pattern), the office address and hours, the
`$70M+ / 20 Years` stat claims, and **who is in the About page's founders photograph**.

**Waiting on the designer**

- **A second Car Accidents design replaced the first mid-build.** Confirm this one is final
  before the remaining 45 practice-area pages are modelled on it.
- **Two comps arrived with that redesign and are not built**: `DH - Attorney Bio v1.html` —
  which implies `DH - Attorney Bio.html` was itself revised, and **the built bio has no diff
  script, so nothing is checking it** — and `DH - Blog - What to do after a car accident.html`,
  which is the article the checklist teaser now points `#` at. **Check the attorney bio before
  launch.**
- **The Car Accidents comp moves almost every accent from gold to forest.** Built as drawn, this
  page only. **If it is a site-wide direction rather than one page's, it touches `Eyebrow`'s
  tones, `FaqItem`, `TestimonialRail`, `AwardsBar` and the token layer.**
- **The built pages depart from their comps in 53 recorded ways**, every one asserted in a
  diff script so it fails loudly if reverted. Counts, straight from the scripts — the old
  numbers in this file had gone stale, so re-run rather than trusting these:

  | Page | Departures |
  |---|---|
  | Blog post | 20 |
  | Car Accidents | 19 |
  | Blog index | 9 |
  | About | 5 |
  | Practice Areas | 0 |

  Car Accidents' structural ones: two sections moved, the section nav rebuilt in document order,
  the lawyers band is a rail of five rather than a grid of four, the results rail carries a
  fourth card and one card design rather than two, the credentials badges are neither linked nor
  captioned, and the Denver band drops its source line and map caption. All at Rhan's request or
  forced by serving a real URL: signed off by Rhan, **not seen by the designer**.
- **The WhyFirm photographs are under-resolution.** Two art-directed crops were supplied at
  893×893 (desktop) and 1218×686 (mobile); the boxes want 1126px and ~2032px at 2×. Astro caps
  generated variants at the source, so desktop is soft on any Retina display. The width lists
  already request 1200 and 2100 — larger re-exports at the same two paths need **no code
  change**.
- **No comp specifies a mobile layout for anything** except one Car Accidents hero block. The
  drawer, the other mobile heroes, the stacked CTA rows and every collapse are ours.
- The comp's blog-post sidebar lists **six categories** where the index's tab row lists five.
  One `getBlogCategories()` serves both, using the index's signed-off five.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size with
  different checksums. Nobody has said which is final.
- Whether the copy in the comps is final or placeholder.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately —
  `PracticeIcon` carries one set so brain injury looks the same on every page.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them. That section's heading is
  "Every case we handle, by **location**", but its last two groups are topical.
- The About and homepage comps carry the **same six core values with two written differently**.
  One singleton serves both, keeping the homepage's wording. Both asserted in `diff-comp-about.py`.

**Blockers for launch, not for building**

- `/api/consult` does not exist. Two form components — `ContactForm` and `CoCounselForm` — are
  rendered in **five** places and all of them 404 on submit. One endpoint, not two: a hidden
  `kind` field tells the payloads apart.
- The production URL is not yet a Sanity CORS origin, so the deployed `/admin` loads but fails
  sign-in. `http://localhost:4321` is registered.
- `site:` in `astro.config.mjs` — www vs apex, unsettled.

## Studio

Elite brand theme applied (scaffold-time `/studio-polish brand`): light-locked palette, ELITE
emblem as the workspace `icon`, centred login card. That login-card layout uses a scoped CSS
hook into Sanity's internal DOM, attached to the icon component because
`studio.components.layout` doesn't wrap the unauthenticated login screen. Cosmetic only and
fails gracefully — worth a glance after major Sanity upgrades.

The desk is empty because there are no content types yet. Expected.
