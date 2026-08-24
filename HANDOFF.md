# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-24._

## State

Build is green: **329 pages** (330 with `/admin`), `npm run check` passing, all five comp-diff
scripts exiting 0, and the new fidelity audit reporting 109 of 109 pages at ≥99% against the live
source. **Every internal body link resolves** — 2,013 of them across 236 paths, none
unserved. Run `git status` for where you are; this file deliberately does **not** name the working
branch, because that line went stale three times in the session that first wrote it.

**The practice-area pages are imported and there is a template for them.** 109 pages across nine
cities, on a light template built like the blog post. That is the single biggest change since the
last handoff and it moves the project's biggest dependency off the critical path.

**The blog archive is 181 posts, not 167.** WordPress has two post types and the article-shaped
content is spread across both — see below.

Marker inventory: **57 `TODO(launch)`, 5 `TODO(video)`, 4 `TODO(sanity)`, 1 `TODO(content)`.**
Grep all four before launch, not just the first.

## The scope was twice what this file said

The last version of this file named "the remaining 45 practice-area detail pages" across four
cities. Querying the live WordPress REST API directly:

| | This file assumed | Actually live |
|---|---|---|
| Pages | 45 | **109** imported (of 195 live WP pages) |
| Cities | 4 | **9** |

Denver 55, Thornton 14, Boulder 8, Highlands Ranch 7, Aurora 6, Lakewood 6, Greeley 5,
Fort Collins 4, Grand Junction 4. **Thornton, Lakewood, Aurora, Boulder and Highlands Ranch
appeared nowhere in this project** — not in `practiceAreas.ts`, not in `navigation.ts`, not in any
comp — despite 41 live pages between them. Four of them did have directory groups; Lakewood and
Thornton's pages were simply unaccounted for.

The four-city figure came from the comp. The comp is not an inventory.

## The blog was complete; WordPress's filing was not

The blog import took all **167 of 167** `/wp/v2/posts` records, and that was right. But fourteen
more articles live under `/wp/v2/pages` with the practice areas — "What to Do After a Car Accident
in Colorado", "Most Common Injuries Caused by Car Accidents", "Car Seat Safety", the FMCSA
trucking rules, and ten more. **No query for "the blog" would ever have found them**, because
WordPress does not think they are blog posts. 12,719 words, 18 in-body links pointing at them.

They are now imported into the blog collection, where they belong, and the archive is 181.

The line between these and the practice-area import is the FIRM'S OWN, not a guess. Its directory
lists five near-identical slip-and-fall pages **as practice areas** — those are imported that way,
marked `resource` — and lists none of these fourteen at all. Every link to the fourteen comes from
a blog body.

- **`PAGE_ARTICLES` in `blog-category-overrides.mjs`** holds them, one category each, every
  assignment naming a sibling already in the archive the way the eleven post overrides do.
  Pages carry no category at all, so this is required rather than a fallback.
- **Posts are converted first and pages appended.** The converter's `mkKey` is one run-scoped
  counter; interleaving them would rewrite every `_key` in all 167 existing files. The gate held —
  `git diff --name-only src/content/blog` returned nothing after the run.
- **Four have titles close to an existing post** (`how-can-a-truck-accident-lawyer-help-me` vs
  `how-can-truck-accident-lawyer-help-denver`, and three others). Checked: 5–12% body similarity.
  They are distinct articles, not duplicates.

## The light template

`src/components/practice/area/` — `AreaArticle`, `AreaSidebar`, `AreaFaqs` — plus
`practice/CityAreas`. Built like the blog post, by request, and **deliberately separate from the
heavy `practice/detail/` kit**, which stays reserved for special cases.

```
AreaArticle   .parea       cream    grid 1.8fr / 1fr, same ratio as the post page
  ├ h1 · PostContents · Prose · AreaFaqs
  └ AreaSidebar  .pside    form → practice areas → related articles
CityAreas     .cityareas   alt      other practice areas in this city, grouped by topic
ContactDetails .ct         cream    unchanged
```

**It is a sibling of `PostArticle`, not a reuse of it**, and the reason is not preference. Their
props are typed against `BlogPost` / `BlogPostArticle`, which are already the GROQ projections
they will be after the swap — and more decisively, `PostArticle` places its sidebar with
`.post :global(.pside)`, bounded by an element in its own template as the conventions require. A
`.parea` wrapper cannot match that rule, and adding `.parea` to PostArticle's stylesheet is
exactly the **ancestor** blind spot `README.md` documents that `check:styles` cannot catch.

What IS shared: `Prose`, `PostContents`, `ContactForm`, and **`.pside*`, which moved to
`global.css`** when the second sidebar arrived — same reasoning as `.prose__*` and `.eyebrow`.

**`.dir`'s link rows moved to `practice/AreaLinkList`** now that three components draw them.
`cocounsel/PracticeAreaLinks` is knowingly still separate — different glyph, different ramp, and
no diff script watching that page. **`diff-comp-practice-areas.py` reads `arealist__link` now**; a
class rename in that component breaks it, which is the point.

## Surfaces: the light page's band is `--alt`, and that is load-bearing

`.parea` cream → `.cityareas` **alt** → `.ct` cream. Cream in the middle would have put three
identical surfaces in a row, which nothing in the build checks for. `--forest` was the other
candidate — it is what `RelatedPosts` occupies in that slot on the post page — but it would mean
re-colouring the whole chevroned link treatment for dark and makes a *light* template's foot
heavier than its body. Reordering `ContactDetails` above the band was rejected outright:
`#contact` is what every `.btn` on the page targets.

**The surface order for both branches is now written into `[slug].astro` as a comment.** It is
still unchecked by anything; re-read it after any reorder.

## The import

**`scripts/import-practice-areas.mjs`**, same architecture as the blog import and now literally
the same converter.

- **`scripts/lib/wp-portable-text.mjs`** is that converter, extracted. It had to be:
  `import-blog-posts.mjs` ends in a bare top-level `await main()`, so importing `convertBody`
  from it ran a 167-post import as a side effect and handed you its mutable module state. It is a
  factory now — **one converter per run**, because `mkKey` is a single run-scoped counter and a
  second instance (or a different iteration order) rewrites every `_key` in all 167 blog files.
  The gate on that change is `git status --porcelain src/content/blog` coming back empty after a
  re-run. It did, and it still must.
- **`scripts/practice-area-pages.mjs`** is the manifest: every live page is in
  `PRACTICE_AREA_PAGES` or in `EXCLUDED_SLUGS` with a reason, and **a page in neither throws**.
  That is the whole anti-silent-drop guarantee. There is no programmatic discriminator and looking
  for one is the trap — `template-landing.php` covers only 70 of the 109, `parent` is useless
  (162 of 195 sit at the root), and five pages that read as articles are **linked from the
  directory as practice areas**, so excluding them by shape would ship five 404s at cutover.
- **`city` and `topic` are both written down, not inferred.** Slug prefixes cannot carry city:
  `motorcycle-accident-lawyer-denver` puts it last, `nursing-home-abuse-lawyer` and
  `rtd-denver-accidents` carry none. `topic` is invented here — nothing upstream has one.
- **No featured images**, unlike the blog import: the template has no hero, and the motorcycle
  page's `featured_media` is a 150px attorney thumbnail. Body images come through the walk.

### Two things the import found that the blog import did not

**The FAQ accordion is real content and is NOT in `content.rendered`.** Not in `acf` either
(empty array), and there is no FAQ post type. It lives only in the rendered HTML, inside
`div.faq-block`. 28 of the 109 pages carry one, 153 items in total, ~570 words on the motorcycle
page alone. **So each page is fetched twice** — JSON for the body, HTML for the FAQ — and the FAQ
has its own audit that throws on a count mismatch. The query is scoped to `.faq-block
.accordion-item` because a bare `.accordion-item` matches **53** times on one of these pages: the
theme's sidebar band is the same Bootstrap markup.

**The image audit caught a second bug of the shape it was written for.**
`thornton-personal-injury-attorney` has an `<h2><a><img></a></h2>` — a heading holding nothing but
a linked image. The heading branch only walked inline spans, so the image AND the heading both
vanished and the run looked clean. `liftMedia()` now runs on headings as well as paragraphs. Three
images came back. **Keep the audit.**

### Deliberate conversions, all warned about

- **436 `maps.app.goo.gl` neighbourhood links dropped to plain text** — SEO filler, `rel=nofollow`,
  35 of one page's 81 links. Same treatment `inlineSpans` already gives `href="#"`: the
  neighbourhood names survive as words. `TODO(launch)` for the firm.
- **Headings arriving wrapped in `<strong>`** are flattened — a third of these pages do it, and
  bold inside an already-bold Anton heading renders wrong.
- Self-linking body links are kept but **warned** — the pages carry a hand-maintained "Find a
  Lawyer Near You" list that includes the page it is on.

## The fidelity audit — and why it is committed

**`scripts/audit-practice-area-fidelity.py`.** No comp exists for this template, so the source is
the check: 109 of 109 pages at ≥99% similarity against live, with h2 / h3 / image / list-item /
FAQ counts asserted exactly on top of the ratio.

This file's previous version recorded the blog import at "167 of 167 at ≥99%". That was a real
measurement taken by a script nobody kept — `grep -rn SequenceMatcher scripts/ src/` finds
nothing. **A number that cannot be re-checked cannot fail.** This one can, and was tested by
deleting a heading and a paragraph from a built page (90.5%, caught) before being trusted.

Two measurement traps it hit first, both worth not re-deriving:

- **Compare word sequences, not characters, with `autojunk=False`.** `SequenceMatcher` discards
  any element appearing in more than 1% of a sequence longer than 200 — on a character sequence
  that is most of the alphabet. It scored a page with three words missing at **88%**; the same
  page scores 99.9% correctly.
- **`content.rendered` has no H1** — WordPress keeps it in `title` — so the built page's title
  reads as four words gained on every page unless the source side adds it.

It also strips a TinyMCE selection bookmark that got saved into
`denver-medical-malpractice-lawyer`'s body. That one is the **source** being wrong; the built page
is the corrected one.

Not wired into `npm run check` — it needs the network, like the five diff scripts. Build first.

## What this closed

- **Dead body links: 149 across 42 paths → ZERO.** 2,013 internal links across 236 paths, every
  one either built or redirected. Three things got there: the practice-area import, the fourteen
  article-pages, and nine `LEGACY_PATH_FORMS` redirects (below).
- **Nine legacy URL shapes now redirect** rather than 404 — `/news/<slug>` from before the blog
  moved to the root, `/practice-areas/<slug>` from the hub linking its children relatively without
  a `../`, and `/why-hire-personal-injury-attorney` plus its testimonials child. Every destination
  is a page this build serves; most are redirects WordPress already performs. `vercel.json` is 68
  rules now, still generated — don't hand-edit it.
  That hub-relative link bug is also **why three pages were recorded as having "no page
  anywhere"**: the hub's own links 404, so live pages looked absent.
- **The three Practice Areas entries "with no page anywhere"** — Legal Malpractice, Life Insurance
  Bad Faith, Pet Insurance Bad Faith — **all three are live pages** and are now imported and
  linked. They looked absent because the legacy hub links them relative without a `../`, so they
  404 under `/practice-areas/` too.
- **`AreaDirectory`'s header comment**, which claimed nine groups and a Grand Junction group that
  does not exist.

`assertDirectoryJoin()` runs on `/practice-areas` and **throws at build time** if a directory
entry loses its page or a page loses its group. It was tested by breaking an href; it names the
entry and both files to fix.

## Next

1. **The 9 remaining dead links on the homepage.** Eight are `data/news.ts`, every `href` a literal
   `"#"`, marked `TODO(content)` rather than `TODO(launch)` — which is how they stayed off the
   launch list. The ninth is the Car Accidents checklist teaser. `#` must not reach production.
2. **Move both collections into Sanity.** The blog and the practice areas are now two collections
   with the same contract, and the getters are already the projections. Plus the four Portable
   Text object types the post template deferred (`callout`, `phoneBand`, `attorneyCard`,
   `pullQuote`), whose intended home is commented in `prose/components.ts` — and which the
   practice-area chrome maps onto almost exactly.
3. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton, JSON-LD, `sitemap.xml`,
   `robots.txt`, editor-managed redirects. **The practice-area pages already carry real
   `metaTitle` / `metaDescription` from the live site's own meta**, so that layer has something
   true to start from. `BlogPosting` JSON-LD belongs to this phase. Note that **every page links
   `/sitemap.xml` and no sitemap is built**, so that URL 404s today — now across 315 pages.
4. `/studio-polish ux` — audits the filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment.

## Open

**Decide**

- **Three live Denver pages were excluded as duplicates** and want a ruling:
  `personal-injury-attorney` (duplicates the homepage), `car-accident` and
  `traffic-collision-lawyer` (both overlap `denver-car-accident-lawyer`, which the heavy template
  serves).
- **Five cities have pages but no route into them** beyond their own city band — Lakewood and
  Thornton have no directory group at all, and Greeley / Fort Collins / Grand Junction were
  already flagged. 41 pages between them, reachable today only from each other.
- **The `AREA_TO_BLOG_CATEGORY` map in `blog.ts` is inferred, not authored.** It decides which
  posts a practice area's sidebar shows. Keyed on the area slug rather than its topic, because
  topic is five buckets and would put car-accident posts on the motorcycle page — which is what
  the live site does. In Sanity this wants to be a per-page reference list.
- **Auto Insurance & Accident Claims has no tab** — 13 posts carry it second, none first.
- **`site:` in `astro.config.mjs`** — www vs apex, still unsettled.
- **Two crash types on the heavy detail page** — rear-end and head-on.
- **The three Denver crash figures are unsourced**, and `[year]` renders live in all three labels.
- **`src/content` is now 39M** (29M blog, 9.6M practice areas), mostly images. Fine for git today;
  worth watching.

**Waiting on the firm** — content, not code. `README.md` has the full table. Unchanged: the seven
attorney emails, the office address and hours, the `$70M+ / 20 Years` stat claims. **The
practice-area pages carry the legacy `(303) 756-3812` inside imported body copy** in places —
`firmDetails` is not consulted for text that came from WordPress.

**Waiting on the designer**

- **No comp exists for the light practice-area template.** It was specified in conversation as
  "like the blog post, with a different sidebar and a different bottom band" and built that way.
  Worth a look before 109 pages ship on it.
- **Confirm the second Car Accidents design is final.** Less urgent than it was — that kit is now
  explicitly the special-case template rather than the model for everything.
- **Two comps arrived with that redesign and are not built**: `DH - Attorney Bio v1.html` — and
  **the built bio has no diff script, so nothing is checking it** — and `DH - Blog - What to do
  after a car accident.html`.
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

- **No comp specifies a mobile layout for anything** except one Car Accidents hero block.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size with
  different checksums. Nobody has said which is final.

**Blockers for launch, not for building**

- `/api/consult` does not exist. Two form components are rendered in **five** places — now on 109
  more pages through `AreaSidebar` — and all of them 404 on submit. One endpoint, not two: a
  hidden `kind` field tells the payloads apart.
- The production URL is not yet a Sanity CORS origin, so the deployed `/admin` loads but fails
  sign-in. `http://localhost:4321` is registered — don't move dev off 4321.

## Two bugs worth not re-deriving

**`hidden` does not hide an element that sets its own `display`.** `blogFeed.ts` hides cards by
writing the `hidden` attribute, but `.pcard` is `display: flex`, and `hidden` only carries
`display: none` from the UA stylesheet. `.pcard[hidden]` fixes it — **any element `blogFeed.ts`
hides needs the same if it sets a display.**

**A scoped rule competing with a class you were handed is a tie, not a win.**
`.thumb-mark[data-astro-cid-…]` is specificity (0,2,0) — an attribute selector counts the same as
a class — which exactly ties `.pcard__thumb .pcard__img`, and PostCard's styles are emitted later.
The fix is not to out-specify it: the placeholder's inner element is `position: absolute; inset: 0`,
which no caller styles.

## How categories work

**No archive pages.** `/category/<slug>/` is redirect-only; it lands on `/news/?category=<slug>`
and `blogFeed.ts` presses the matching tab on load, then `arriveAt()` scrolls to the tab row.
A post belongs to exactly one category — the first its source record lists — by request. 22 tabs,
not 23: a category no post *leads* with can never be reached.

## URLs carry a trailing slash

`/about/`, not `/about`. Three layers agree: `trailingSlash: "always"` in `astro.config.mjs`,
`"trailingSlash": true` in `vercel.json`, and `ROUTES` plus every helper in `routePaths.ts`.
`normalizePath` deliberately did NOT change — it is the *comparison* form, slash-free.

`vercel.json` is **generated** by `scripts/build-redirects.ts` on every build from
`src/data/redirects.ts`. Don't hand-edit it. **No practice-area redirect was needed**: the flat
root shape means an imported page's slug IS its legacy URL, so adding one removes a redirect
rather than creating one.

## Shared pieces to reach for

- **`components/practice/area/`** — the light template. **`components/practice/detail/`** — the
  heavy kit, special cases only.
- **`practice/AreaLinkList`** — chevroned link rows, used by the directory and every city band.
- **`lib/portableText.ts`'s `toPlainText()`** — Portable Text to a string, for JSON-LD.
- **`scripts/lib/wp-portable-text.mjs`** — WordPress HTML to Portable Text, both importers.
- **`PostThumb.astro`** — every post card's art, both branches.
- **`media/PlayButton.astro`** owns the pulse. **Three components still hand-roll a play circle**
  and so do not pulse: `testimonials/VideoReviewCard`, `team/AttorneyBio`,
  `practice/detail/MoreOnClaims`.
- **`scripts/rail.ts`** — one module behind every rail, wired by name. **`TestimonialRail` and
  `home/AttorneysBand` still do not declare `data-rail-nav`.**
- **`scripts/blogFeed.ts`** — the index's filter *and* its pager. One owner, deliberately.
- **`scripts/sectionNav.ts`**, **`Eyebrow.astro`**, **`lib/headings.ts`**, **`lib/readTime.ts`**,
  **`lib/dates.ts`'s `formatPostDate`**, **`ContactForm`'s `variant` prop**, **`ReviewRating`**,
  **`AttorneyCard`'s `layout` prop**, **`AwardsBar`'s `tone` prop**, **`StatsBand`**.
- **Portable Text carries images.** `ptImage(src, alt)` composes with `pt()` by spreading.
  Registered under `type` — **singular**, astro-portabletext's key.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates**, and `.arrow-link__label` on the
  label whenever that link is underlined.

## Traps worth knowing before touching a section

- **A text decoration on a flex container reaches the arrow inside it.** The fix is
  `.arrow-link__label`.
- **A light card inside `.section--forest` must declare its own heading colour**, or it renders at
  1.08:1.
- **Animate one hover on one clock.** `text-decoration` cannot be animated; declare the underline
  transparent up front and transition `text-decoration-color`.
- **Surfaces are positional, and nothing checks them.** After any reorder, list every section's
  surface in document order and confirm no two adjacent match.
- **Token names can mislead.** `--dh-cream-50` reads like a hover state but is 1.009:1 against
  `--dh-cream-100`.
- **An animation's value outranks a normal declaration, even paused at frame zero.**
- **`overflow: hidden` clips the shadow of anything flush to the edge.**
- **`space-between` centres a middle item only when the outer two are equal width.**
- **Grep a root class name before using it.** Still shared: `.feat` (`blog/FeaturedPost` +
  `practice/FeaturedAreas`) and `.stats` (`StatsBand` + `home/hero/HeroStats`).
- **`unesc()` in the diff scripts strips tags**, so `built_text` cannot see attribute values.
  Assertions about `alt`, `href` or `target` must read `built`.

## The mobile heroes

`Hero.astro`, `PageHeader.astro`'s `tone="photo"` and `DetailHero.astro` share one construction
below their breakpoints: the photograph is a **band across the top**, sized off the viewport
WIDTH, with the copy beneath or over its lower half. **The light practice-area template has no
hero at all** — it opens on its title, the way the blog post does.

- Sized off **width**, not content — `cover` on a full-height portrait box takes its crop out of
  the SIDES, 42–49% of the frame. Off width it is 6%.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`**.
- **Art direction is a hand-built `<picture>`, not `Picture.astro`** — two crops can only be
  chosen by `media`.

## Studio

Elite brand theme applied at scaffold time: light-locked palette, ELITE emblem as the workspace
`icon`, centred login card. Cosmetic only and fails gracefully — worth a glance after major Sanity
upgrades. The desk is empty because there are no content types yet. Expected — both collections
live in `src/content/` for now, on purpose.
