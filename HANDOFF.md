# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-21._

## State

Build is green: **205 pages** (206 with `/admin`), `npm run check` passing, all five comp-diff
scripts exiting 0. Run `git status` for where you are; this file deliberately does **not** name
the working branch, because that line went stale three times in the session that first wrote it.

**The legacy blog is imported.** 167 posts and 23 categories now live in an Astro content
collection, and the blog index serves the real archive rather than the comp's twelve placeholder
cards. That is the single biggest change since the last handoff and it settled several things
`README.md` had on the launch list.

Marker inventory: **41 `TODO(launch)`, 5 `TODO(video)`, 4 `TODO(sanity)`, 1 `TODO(content)`.**
Grep all four before launch, not just the first — the `TODO(content)` one hides eight dead links
on the homepage from the grep the README's table is built from.

## The blog import

**`src/content/` is an interim store, by request — not Sanity.** The import lands in a content
collection so the content can be reviewed, corrected and version-controlled before any of it is
pushed to a CMS. Sanity still holds nothing and `src/sanity/schemaTypes/index.ts` is still an
empty array. Nothing about the getters' contract changes when it moves.

- **`scripts/import-blog-posts.mjs`** is rerunnable: `--only <slug>` and `--dry` for inspection.
  Source is the live WordPress REST API, **not** the scrape — the scrape's post pages have no
  `<article>` wrapper, so pulling a body out means reading div soup to decide what is content.
  The scrape is still used for **images**, which is where it earns its keep.
- **Bodies are Portable Text JSON, not Markdown.** The site already renders Portable Text;
  Markdown would need a second renderer now *and* a re-conversion at the Sanity swap.
- **Fidelity, measured post by post against the source with chrome stripped: 167 of 167 at
  ≥99% similarity, 144 at exactly 100%.** 156,798 words in, 156,772 out — and every one of the
  26 missing words is whitespace the conversion *fixed*, not content it lost.
- **`scripts/import-blog-categories.mjs`** rebuilds the taxonomy from live. Editing a category
  file by hand is pointless; edit the rules in that script.

**The importer has an audit** that counts images in the source before the walk and compares
against what was emitted. It exists because two bugs of the same shape — content disappearing
with a green build and no warning — got through: a `<p>` holding both media and text, and
`querySelectorAll` reaching *through* a chrome wrapper. Keep it. It caught the second bug
immediately, including one in its own first draft.

Four warnings on a clean run, all four deliberate: the three Google My Maps dropped with their
`mid` recorded, and the one table converted to a list.

## Two bugs worth not re-deriving

**Every Portable Text link on the site was dead, and the cause was not the data.**
`ProseLink.astro` read `Astro.props.value` and fell back to `"#"` when undefined — and it was
*always* undefined. astro-portabletext gives a mark component `node.markDef`, not `value`; its
own `Mark.astro` reads `node.markDef.href`. `value` is `@portabletext/react`'s name for the same
thing, the identical singular/plural trap that `type` vs `types` sets in `prose/components.ts`.
The previous handoff recorded these as "a link with no href", which is why the fallback looked
defensible. **Dead links across the site went 28 → 9.**

**`hidden` does not hide an element that sets its own `display`.** `blogFeed.ts` hides cards by
writing the `hidden` attribute, but `.pcard` is `display: flex`, and `hidden` only carries
`display: none` from the UA stylesheet. The category filter and "Load more" did nothing at all,
with no error. Invisible while the feed was twelve cards; at 166 it was the whole page.
`.pcard[hidden]` fixes it — **any element `blogFeed.ts` hides needs the same if it sets a
display.**

## URLs now carry a trailing slash

`/about/`, not `/about`. Three layers have to agree and all three are set:

| Layer | Setting |
|---|---|
| `astro.config.mjs` | `trailingSlash: "always"` |
| `vercel.json` | `"trailingSlash": true` — the bare form 308s rather than answering |
| `lib/routePaths.ts` | `ROUTES` and every helper emit the slash |

The site used to serve `/about` and `/about/` as 200s with identical bytes and no redirect — one
page at two URLs, with only a canonical tag hinting which counted. The slash rather than the bare
path because every indexed legacy URL carries one: WordPress 301s the bare form to it, so this is
the shape Google already has for ~300 pages.

**`normalizePath` deliberately did NOT change.** It is the *comparison* form — slash-free, so two
paths compare equal however they are written. That is why flipping the convention touched no
comparison logic, except one that was not using it (`Header.astro`, whose `aria-current` would
have silently stopped matching on every nav item).

`vercel.json` is **generated** by `scripts/build-redirects.ts` on every build from
`src/data/redirects.ts` — a Sanity swap point, since these eventually live in the CMS. Don't
hand-edit it. 50 rules: all 23 category archives plus the two dropped slugs, each in both slash
forms so none takes two hops. `/category/accidents-in-the-news/` is deliberately **not** claimed —
it already 301s to `accidentnews.denvertrial.com`, a separate site the firm runs.

## How categories work

**No archive pages.** `/category/<slug>/` is redirect-only; it lands on `/news/?category=<slug>`
and `blogFeed.ts` presses the matching tab on load, then `arriveAt()` scrolls to the tab row.

- **A post belongs to exactly one category** — the first its source record lists — by request.
  The content files still keep every slug, because the getter is where a projection narrows.
- **The tab row scrolls horizontally through all of them.** `CategoryTabs.astro` was already
  built for this before the import; it needed no change. Ordered by post count descending, so
  the two categories covering two thirds of the archive are where the eye lands.
- **22 tabs, not 23.** A category no post *leads* with can never be reached, so it is dropped
  rather than shipped as an empty state. Today that is **Auto Insurance & Accident Claims** —
  13 posts carry it second and none carry it first. It is a count of zero, not a special case:
  give any one of those 13 that category first and the tab returns with nothing to edit.
- **`arriveAt()` scrolls to the tab row, not the grid** — the grid alone puts the tabs
  off-screen, leaving no way to see which category is active. It does nothing on a plain
  `/news/` visit, drops the animation (not the destination) under `prefers-reduced-motion`, and
  stays put if the browser already restored a scroll position.

## Card art

**Featured images are real now**, and the importer fetches them: `featured_media` is an
attachment ID, not a URL, so they have to be resolved through `/wp/v2/media`. 60 posts have one;
59 reach the grid and **all 59 are distinct**.

**The other 107 get `PostThumb.astro`** — dark green with the firm's mark centred, as markup
rather than a generated image file. It replaced a per-category fallback that gave every post in a
category the same photograph.

**That component cost three attempts, for one reason worth writing down.**
`.thumb-mark[data-astro-cid-…]` is specificity **(0,2,0)** — an attribute selector counts the same
as a class — which exactly *ties* `.pcard__thumb .pcard__img`. On a tie the later rule wins, and
PostCard's styles are emitted after PostThumb's, so every property PostCard also set was silently
taken. The fix is not to out-specify it: the placeholder's inner element is `position: absolute;
inset: 0`, which no caller styles and which fills its parent whatever the parent's display is.
**A scoped rule competing with a class you were handed is a tie, not a win.**

## The root `[slug].astro` serves blog posts AND practice-area details

Both `blogPath()` and `practiceAreaPath()` are `/${slug}/` — the legacy site is flat and ~300 live
URLs depend on it — and Astro allows one `[slug].astro` per directory. So `getStaticPaths` unions
the collections and every record carries a `kind` the template branches on. A slug claimed twice
**throws**; the message names both claimants, because it used to always say "a blog post and a
practice area" and sent the first post-vs-post collision looking in the wrong place.

**Hand-authored articles win over the import.** The trampoline post exists both ways, and the
hand-authored version is the legacy article *with* corrections — the truncated sentence completed,
the firm's phone number in place of the article's third one, both asserted in the diff script.
`getImportedPosts()` drops any slug a hand-authored article claims.

## Shared pieces to reach for

New work should use these rather than re-solving them. All are in use on two or more pages, so a
change to one is a change to all.

- **`components/practice/detail/` is a kit, not one page** — `DetailHero`, `SectionNav`,
  `DetailVideo`, `SourceNote`, `Triage`, `Takeaways`, `Criteria`, `LawyerCards`, `Credentials`,
  `WhyFirm`, `ResultStories`, `CaseTimeline`, `TileGrid`, `DenverData`, the two teasers,
  `MoreOnClaims` and `ClosingCta`, composed by `DetailPage.astro`, which owns no content.
- **`PostThumb.astro`** — every post card's art, both branches. Don't draw a `<Picture>` for a
  post directly; 107 of them have nothing to draw.
- **`media/PlayButton.astro`** owns the pulse. **Three components still hand-roll a play circle**
  and so do not pulse: `testimonials/VideoReviewCard`, `team/AttorneyBio`,
  `practice/detail/MoreOnClaims`.
- **`scripts/rail.ts`** — one module behind every rail, wired by name. **`TestimonialRail` and
  `home/AttorneysBand` still do not declare `data-rail-nav`**, so check them before assuming
  their arrows hide when the content fits.
- **`scripts/blogFeed.ts`** — the index's filter *and* its pager. One owner, deliberately: two
  scripts writing `hidden` on one element is a race with no winner.
- **`scripts/sectionNav.ts`**, **`Eyebrow.astro`**, **`lib/headings.ts`**, **`lib/readTime.ts`**,
  **`lib/dates.ts`'s `formatPostDate`**, **`ContactForm`'s `variant` prop**, **`ReviewRating`**,
  **`AttorneyCard`'s `layout` prop**, **`AwardsBar`'s `tone` prop**, **`StatsBand`**.
- **Portable Text carries images.** `ptImage(src, alt)` composes with `pt()` by spreading.
  Registered under `type` — **singular**, astro-portabletext's key.
- **The renderer now handles `h4`, numbered lists and `em`.** All three arrived with the import;
  `pt()` still emits none of them. `.prose__h4` had been styled from the start and was
  unreachable until a component existed for it.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates**, and `.arrow-link__label` on the
  label whenever that link is underlined.

## Traps worth knowing before touching a section

- **A text decoration on a flex container reaches the arrow inside it.** `.arrow-link` is
  `inline-flex`, and a decoration propagates into in-flow block-level descendants where the child
  cannot cancel it. The fix is `.arrow-link__label`. Swept site-wide once; no rule anywhere else
  combines `inline-flex` with `text-decoration: underline`.
- **A light card inside `.section--forest` must declare its own heading colour**, or it renders
  at 1.08:1.
- **Animate one hover on one clock.** `text-decoration` cannot be animated; declare the underline
  transparent up front and transition `text-decoration-color`.
- **Surfaces are positional, and nothing checks them.** After any reorder, list every section's
  surface in document order and confirm no two adjacent match.
- **A value painted to match a section's background has to move when that surface does.**
- **Token names can mislead.** `--dh-cream-50` reads like a hover state but is 1.009:1 against
  `--dh-cream-100`.
- **An animation's value outranks a normal declaration, even paused at frame zero.**
- **`overflow: hidden` clips the shadow of anything flush to the edge.** Widen the clip box with
  padding and pull it back with an equal negative margin.
- **`space-between` centres a middle item only when the outer two are equal width.**
- **Grep a root class name before using it.** Still shared: `.feat` (`blog/FeaturedPost` +
  `practice/FeaturedAreas`) and `.stats` (`StatsBand` + `home/hero/HeroStats`).
- **`unesc()` in the diff scripts strips tags**, so `built_text` cannot see attribute values.
  Assertions about `alt`, `href` or `target` must read `built`.

## The mobile heroes

`Hero.astro`, `PageHeader.astro`'s `tone="photo"` and `DetailHero.astro` share one construction
below their breakpoints: the photograph is a **band across the top**, sized off the viewport
WIDTH, with the copy beneath or over its lower half.

- Sized off **width**, not content — `cover` on a full-height portrait box takes its crop out of
  the SIDES, 42–49% of the frame. Off width it is 6%.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`** — a wash has to end in
  exactly the colour behind the band's foot.
- `DetailHero` uses a **container query** on the panel, not a media query, so its three proof
  labels hold one line.
- **Art direction is a hand-built `<picture>`, not `Picture.astro`** — two crops can only be
  chosen by `media`. `PageHeader`, `Hero` and `WhyFirm` each build their own.

## Next

1. **The 9 remaining dead links.** Eight are `data/news.ts` on the homepage, every `href` a
   literal `"#"`, marked `TODO(content)` rather than `TODO(launch)` — which is how they stayed off
   the launch list. The ninth is the Car Accidents checklist teaser, deliberate and marked in
   three places. `#` must not reach production.
2. **The remaining 45 practice-area detail pages.** This is now the biggest single dependency:
   **149 body links across 42 distinct paths point at pages this build does not serve**, and they
   are overwhelmingly practice areas — `/motorcycle-accident-lawyer-denver` ×18,
   `/denver-truck-accident-lawyer` ×15, `/denver-brain-injury-lawyer` ×12. They resolve today only
   because WordPress is still live.
3. **Move the collection into Sanity.** Write the schema types, then convert each getter body to
   a `sanityClient.fetch()`. The shapes are already right and the content is already clean, so
   this is mechanical — plus the four Portable Text object types the post template deferred
   (`callout`, `phoneBand`, `attorneyCard`, `pullQuote`), whose intended home is commented in
   `prose/components.ts`.
4. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton, JSON-LD, `sitemap.xml`,
   `robots.txt`, editor-managed redirects. **`BlogPosting` JSON-LD belongs to this phase.** Note
   that **every page already links `/sitemap.xml` in its head and no sitemap is built**, so that
   URL 404s today.
5. `/studio-polish ux` — audits the filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment.

## Open

**Decide**

- **Auto Insurance & Accident Claims has no tab** — see "How categories work" above. 13 posts.
- **`site:` in `astro.config.mjs`** — www vs apex, still unsettled. The server now enforces one
  URL *shape*; picking the origin is the other half of the same question.
- **Three Practice Areas entries have no page anywhere** — Legal Malpractice, Life Insurance Bad
  Faith, Pet Insurance Bad Faith. Plain text via `href: null`.
- **Two crash types on the detail page** — rear-end and head-on.
- **The detail page promises nine articles that do not exist**, and its checklist teaser ships
  linked to `#` at Rhan's direction.
- **The three Denver crash figures are unsourced**, and `[year]` renders live in all three stat
  labels. The `TODO(launch)` on `denver.stats` is the only record anywhere.
- **`src/content/blog` is 31M**, mostly images. Fine for git today; worth watching.

**Waiting on the firm** — content, not code. `README.md` has the full table. Unchanged: the seven
attorney emails, the office address and hours, the `$70M+ / 20 Years` stat claims — **that last
one now appears on all 167 posts**, since the fact-check band derives from one `reviewedBy()`
helper — and who is in the About page's founders photograph.

**Waiting on the designer**

- **Confirm the second Car Accidents design is final** before the remaining 45 pages are modelled
  on it.
- **Two comps arrived with that redesign and are not built**: `DH - Attorney Bio v1.html` — and
  **the built bio has no diff script, so nothing is checking it** — and `DH - Blog - What to do
  after a car accident.html`, the article the checklist teaser points `#` at.
- **The Car Accidents comp moves almost every accent from gold to forest.** Built as drawn, that
  page only. If it is site-wide it touches `Eyebrow`'s tones, `FaqItem`, `TestimonialRail`,
  `AwardsBar` and the token layer.
- **The built pages depart from their comps in 71 recorded ways**, every one asserted so it fails
  loudly if reverted. Re-run rather than trusting these:

  | Page | Departures |
  |---|---|
  | Blog post | 28 |
  | Blog index | 19 |
  | Car Accidents | 19 |
  | About | 5 |
  | Practice Areas | 0 |

  The blog numbers grew because the index and the post page now serve a real archive: the comp's
  twelve cards were placeholder copy, its related-articles band names posts that do not exist,
  and its sixth sidebar category (**Colorado Law**) exists nowhere on the live site.
- **No comp specifies a mobile layout for anything** except one Car Accidents hero block.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size with
  different checksums. Nobody has said which is final.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them.

**Blockers for launch, not for building**

- `/api/consult` does not exist. Two form components are rendered in **five** places and all of
  them 404 on submit. One endpoint, not two: a hidden `kind` field tells the payloads apart.
- The production URL is not yet a Sanity CORS origin, so the deployed `/admin` loads but fails
  sign-in. `http://localhost:4321` is registered — don't move dev off 4321.

## Studio

Elite brand theme applied at scaffold time: light-locked palette, ELITE emblem as the workspace
`icon`, centred login card. That login-card layout hooks into Sanity's internal DOM and is
attached to the icon component, because `studio.components.layout` doesn't wrap the
unauthenticated login screen. Cosmetic only and fails gracefully — worth a glance after major
Sanity upgrades.

The desk is empty because there are no content types yet. Expected — the blog lives in
`src/content/` for now, on purpose.
