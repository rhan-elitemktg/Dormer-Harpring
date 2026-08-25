# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-24._

## State

Build is green: **329 pages** (330 with `/admin`), `npm run check` passing, all five comp-diff
scripts exiting 0, and the fidelity audit reporting 104 of 104 pages at ≥99% against the live
source. A full sweep of **every `<a>` in `dist/` — 42,599 internal links across 329 pages —
finds four dead targets**: the three the footer links on every page (`/privacy-policy/`,
`/editorial-guidelines/`, `/sitemap.xml`) and one relative href inside an imported blog body.
Both are item 1 and item 2 under Next. That sweep is ad hoc and **not committed**; the earlier
"2,013 body links, none unserved" figure came from a script nobody kept, and it counted body
links only, which is how 984 footer 404s stayed invisible.

Run `git status` for where you are; this file deliberately does **not** name the working branch,
because that line went stale three times in the session that first wrote it.

**The practice-area pages are imported and there is a template for them.** 104 pages across nine
cities, on a light template built like the blog post. That is the single biggest change since the
last handoff and it moves the project's biggest dependency off the critical path.

**The blog archive is 186 posts, not 167.** WordPress has two post types and the article-shaped
content is spread across both — see below.

Marker inventory: **33 `TODO(launch)`, 5 `TODO(video)`, 4 `TODO(sanity)`, 1 `TODO(content)`.**
Grep all four before launch, not just the first — and **grep with the colon**. `TODO(launch)` also
appears in eleven comments that DISCUSS a marker rather than being one, which is how this line
previously read 43. `grep -rn "TODO(launch):"` is the count that means anything.

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

## The directory is synced to the live hub, not to the comp

`/practice-areas`'s "Browse All" directory was the comp's 90 entries in 8 groups. The live hub
carries **110 in 11**, and the gap was not cosmetic: three whole city groups (Greeley, Fort
Collins, Grand Junction) and six Denver pages — the five branded-truck pages and Daycare
Injuries. **All nineteen destinations were already built and served**, just unlinked from the one
page whose job is to link them. The comp is not an inventory; the live hub is the firm's own list.

- **`scripts/diff-comp-practice-areas.py` still compares strictly.** It was not loosened into a
  subset check, which would have stopped catching a dropped entry. Instead the departures are
  declared — `ADDED_GROUPS`, `ADDED_ITEMS`, `RENAMED` — applied to the comp's arrays, and the
  result compared for exact equality. Adding an entry without declaring it still fails.
- **THE TWO TOPICAL GROUPS ARE FOLDED INTO DENVER.** "Premises Liability" and "Other Legal
  Services" were geographic outliers under a heading that reads "by location" — a mismatch the
  data module flagged and tolerated from the start. Every one of their eight entries pointed at a
  Denver page, so they fold in cleanly and the heading is now true of the whole section. **Nine
  groups, 102 entries, Denver 48.**

  **The fold dropped two duplicates**: `denver-premises-liability-lawyer` and
  `denver-negligent-ice-snow-removal-attorneys` were each listed twice on the page, once per
  group. Dropping the first is also the requested relabel — the surviving entry is Denver's plain
  **"Premises Liability"**, not the topical group's "Premises Liability Overview".

  `diff-comp-practice-areas.py` now **fails on any duplicate within a group**. Folding is how one
  gets introduced and reading a 48-entry column is not how one gets found. It also has
  `REMOVED_GROUPS` with an assertion that the removal took, after `REMOVED_ITEMS` silently removed
  three of five on a previous change.
- **EVERY LABEL IS THE HUB'S NOW, with two exceptions, and both are the word "Overview".** The
  comp shortens most of them — "E-Scooter Accidents" for "Dockless Bike / E-Scooter Accidents",
  and so on — and the hub's wording is the firm's own, so it wins. Except:
  - **the personal-injury row**, "Personal Injury" in every group. The hub says "Personal Injury
    Overview" in four, "Personal Injuries" in Denver and "Personal Injury" in the rest.
  - **Denver's product-liability entry**, plain "Product Liability". The hub calls that one
    "Product Liability Overview" and every other city's plain, so it was the only "Overview" left
    once the personal-injury rows and "Premises Liability Overview" went.

  Both by request, both for the same reason: an "Overview" on one row of a column where five
  siblings have none reads as a mistake rather than a distinction. **There is no "Overview" label
  anywhere on the page now.** That also flattened `RENAMED` in the diff script, which had been
  keyed by group for exactly that one entry.
- **A LABEL LIVES IN THREE PLACES and they must not drift**: `practiceAreas.ts`, the manifest in
  `scripts/practice-area-pages.mjs`, and the page's own content JSON, which the importer writes
  from the manifest. Change all three or re-run the import. One slug breaks the one-to-one —
  `denver-premises-liability-lawyer` is "Premises Liability" in the Denver column and "Premises
  Liability Overview" in the topical group, both the hub's; the manifest holds the topical form.
- **Grand Junction reads car → truck → motorcycle.** The hub has that one group the other way
  round and its two siblings this way. Normalised, by request — the only ordering departure.
- **The hub's "Privacy Policy/Disclaimer" entry was deliberately NOT added.** No privacy page
  exists; `ROUTES.privacy` is reserved, not built.

**The page no longer mirrors the hub's structure**, only its links: nine city groups against the
hub's eleven, and its two topical groups folded away. What still differs entry-for-entry: the five
personal-injury rows (relabelled), the privacy link (no page), and the five slip-and-fall articles
that moved to the blog. Re-checkable — extract the hub's `practice-area-item`
blocks and compare labels and slugs group by group.

Verified after: build green at 329 pages, `npm run check` clean, all five comp diffs at 0, the
fidelity audit still 104 of 104, and every internal link on the built page resolving except the
three site-wide ones below.

## The light template

`src/components/practice/area/` — `AreaArticle`, `AreaSidebar`, `AreaFaqs`. Built like the blog
post, by request, and **deliberately separate from the heavy `practice/detail/` kit**, which stays
reserved for special cases.

```
AreaArticle    .parea      cream   grid 1.8fr / 1fr, same ratio as the post page
  ├ .parea__cat · .parea__title · .parea__meta
  ├ PostContents · Prose · AreaFaqs
  ├ .parea__fact          spans both columns, row 2
  └ AreaSidebar  .pside   form → practice areas → related articles
AwardsBar      .awards     SUNK    the homepage band, in the city band's old slot
ContactDetails .ct         cream   unchanged
```

**NO PAGE HEADER, and it took three passes to get back there.** The template opened on its own
title, then gained Testimonials' photo band, then `/results/`' forest band, then lost both — all
by request. It now opens the way the post comp does: the site header runs straight into the cream
article. The whole hero apparatus is gone from `getPracticeAreaPageCopy()` — no `photo`,
`photoMobile`, `photoAlt`, `minHeight` — and `[slug].astro` imports no `PageHeader` at all.

**If a header is ever asked for again, the title MOVES.** Two `<h1>`s cannot happen, and that is
the thing to settle before styling anything. It has now been moved out and back twice.

**`.parea__cat`, `.parea__title` and `.parea__meta` carry `.post__*`'s rules byte-identical** —
verified against the built CSS, not just written to match.

**The eyebrow is the firm's tagline** — "Tough lawyers for tough cases", the same on all 104,
where the post page prints its category. **It has been four things**: the city, then the constant
"Practice Area", then the city again, then this. The city kept stuttering against the 84 titles
that open with one ("Denver" over "Denver Truck Accident Lawyer"), and trimming the title instead
was declined — see below. It lives on `PracticeAreaPageCopy`, not on the article, because it is
one string for every page.

Note it is **not a category**, which is what the slot holds on the post page. These are service
pages and have no taxonomy above them, so the slot took marketing copy instead.

**The meta line is the post's minus the reviewer** — written by the firm, the date, the read time.
No reviewer there, because the fact-check band at the foot now names one and a byline reviewer
would say it twice. The date is WordPress's `modified` when there is one (all 104 have one)
labelled "Updated", falling back to `date` labelled "Posted" — publishing dates run back to 2016
on copy revised this year. `FIRM` is **exported from `blog.ts`** rather than re-typed, so the
firm's own byline has one home.

**`readTime` is derived AFTER the dropped sections, not before**, so the figure describes what the
reader actually gets.

### THE CITY STAYS IN THE H1 — an SEO call that was asked for and declined

Trimming the city out of the title, leaving it only in the eyebrow, was requested **conditional on
it not affecting SEO**. It would, on two counts, so it was not done:

- **These 104 pages rank on exactly that phrase today.** The H1 is the primary on-page heading for
  a local-intent query, and the whole point of a `<city> <practice area> lawyer` landing page is
  that phrase. Doing it AT CUTOVER, alongside a replatform, is the part that really settles it: if
  traffic moves afterwards nobody can tell which change did it.
- **It is not a mechanical edit.** The titles come in five shapes — 84 `<City> …`, 9 `… <City>`,
  5 `… in <City>, Colorado`, 1 `<City>, CO …`, and 9 with no city in them at all — so stripping
  the city by pattern yields `"Brain Injury Attorney in , Colorado"` and `", CO Car Accident
  Lawyer"`. Doing it properly is 100 hand-authored titles, not a find-and-replace.

The `<title>` tag is a separate field (`metaTitle`, the live site's own) and was never in scope.
Worth revisiting post-launch with real traffic data, one city at a time.

### Two body sections the template drops

Removed by request, because the page already says both things somewhere better:

| Heading | Why | Where it still says it |
|---|---|---|
| `<City> <Area> Lawyer Near Me` | office address, phone, GeoCoordinates | the footer, on every page |
| `<City> <Area> Resources` | a bullet list of the firm's own articles | the sidebar's Related articles |

**A third, `Awards and Accolades`, is dropped on all 30 pages that carry it** — an h2 and the
firm's six award badges, byte-identical every time, and `AwardsBar` now renders those same six
under the article. It lives in `DROPPED_EVERYWHERE` rather than the per-slug list because it is an
exact whole-heading match on a string with one meaning, where "Near Me" and "Resources" are two
words that also appear in real editorial copy. **180 images left the body copy**; 51 prose figures
remain across all 104 pages.

**Dropped in the getter, never in the content files** — `content.config.ts` states the rule: the
files keep WordPress's version and the getter coalesces, because a GROQ projection is what does
the coalescing after the swap. It also means re-running the importer cannot put them back.

**WRITTEN DOWN, NOT MATCHED BY PATTERN, and that is the whole point.** A pattern on "Near Me" and
"Resources" catches fourteen headings and one of them is not this chrome at all:
`thornton-bicycle-accident-lawyer`'s "Bicycle Accident Resources in Thornton, Colorado" is Bike
Thornton and Bicycle Colorado with their addresses and phone numbers — unique editorial copy that
neither reason covers. So `DROPPED_SECTIONS` and `KEPT_SECTIONS` list every candidate and **a
candidate in neither THROWS**, the same guarantee `PRACTICE_AREA_PAGES` gives the importer. A
declared drop the body no longer contains throws too.

13 sections across 11 pages, 78 blocks, 50 list items, 48 links, plus the 30 award blocks.
**Both lists are duplicated in `scripts/audit-practice-area-fidelity.py`** — a `.py` script cannot
import a `.ts` module — and drift between the two shows up on the next run in both directions.

### The city band is GONE, and the awards bar has its slot

`practice/CityAreas.astro` is deleted. It was grouped by topic, then flattened to one grid, then
removed outright — all by request. **The sidebar's Practice Areas card is the only route to a
sibling now**, which is why its "View All" link is load-bearing rather than a convenience. Do not
drop it to tidy the card.

### The sidebar card: named, windowed, self-highlighting

Three more changes by request, and the second and third only work together.

- **The heading names the city** — "Denver Practice Areas". A whole string from
  `getPracticeAreaSidebarLinks()`, not a name the template interpolates.
- **`more` renders unconditionally** and reads "View All Practice Areas". It used to appear only when the city
  had more areas than the card holds, which meant **the four-page cities offered no route to the
  directory at all**.
- **The current page is IN the list, highlighted, not dropped.**

**WHICH FORCED A WINDOW RATHER THAN A HEAD, and that is the part worth not re-deriving.** The card
holds twelve and Denver has 48. A plain `.slice(0, 12)` would drop the current page out of its own
card on 36 of them, and highlighting something that is not on screen is not a highlight. So the
slice is **centred on the current page and clamped at both ends** — the reader sees where they sit
among the city's areas with neighbours either side, and the "View All" link carries the rest. A city with
twelve or fewer shows all of them and the window never moves.

The highlighted row is a **`<span>`, not a link to the page you are already on** (the convention
`AreaLinkList` set for unlinked rows) and carries `aria-current="page"`.

**TEXT ONLY, NO BACKGROUND**, by request — it briefly carried a `--dh-gold-tint` block bled to the
card's edges.

**THE LABEL IS `--dh-gold-deep` AT 3.29:1, KNOWINGLY. Do not "fix" it back.** That is under AA's
4.5 for text this size — `--text-md` tops out at 16px, short of the 18.66px bold that would exempt
it. It was measured, raised, and chosen at Rhan's request over the alternative, which was
`--dh-ink` at 14.08:1 with `font-weight: 800` alone carrying the highlight. The 800 stays either
way and does more work at low contrast than it would at high: heavier strokes are what keep the
label legible.

**What would fix it properly is a token, not a tweak.** The gold ladder stops at
`--dh-gold-deep`, which was itself darkened to pass on CREAM, not on white. A `--dh-gold-deeper`
at ~4.5:1 would serve this and anything else that ever wants gold text on a white card. Not
invented for one use; worth doing if a second one appears.

**Not `--accent`** either: red is what every row in this card turns on hover, and a permanently
red row reads as one stuck mid-hover.

Re-checkable, and it is the check that matters here: every built practice-area page's
`pside-areas` card should have **exactly one** `--current` row, a "View All Practice Areas"
link, no self-link, and
every other row a same-city practice area. 104 cards, 1,010 rows, all clean.

### The five `resource` pages moved to the blog — practice areas are 104 now

WordPress filed five articles under practice areas and the legacy hub lists them in its Premises
Liability group, so the import kept them there, marked `resource: true`. They are articles by
every measure — 539–748 words, no FAQ, article titles, no body images — against a real
practice-area page's 1,500–3,000 words and an FAQ accordion.

**What surfaced it**: one of them sat in the "Practice areas" sidebar card on **54 Denver pages**.
The card caps at twelve and sorts by label, and `10 Things To Do…` sorts before every letter, so
that one made the cut everywhere while the other four sat just outside it — latent, not absent.

| Moved to `src/content/blog/` | Category |
|---|---|
| `10-things-to-do-after-a-slip-and-fall-accident` | Slip and Fall |
| `should-you-hire-a-lawyer-for-a-slip-and-fall-injury-case` | Slip and Fall |
| `types-of-slip-and-fall-accidents` | Slip and Fall |
| `what-are-colorados-slip-and-fall-laws` | Slip and Fall |
| `colorado-premises-liability-law` | Premises Liability — the one that is not about a fall |

- **NO SLUG CHANGED, so no redirect was needed.** All five URLs are flat at the root and still
  resolve; `[slug].astro` serves them from the other branch now. The page count stayed 329.
- **Hand-converted, not re-imported.** The bodies were already Portable Text from the same
  converter, and re-running the blog import risks rewriting `_key`s across all 181 existing files
  (see below). Only `excerpt` was missing; it was fetched from the same `/wp/v2/pages` records the
  importer reads, and title / dates / `legacyId` were asserted equal to the live source before the
  move. The written files are in the importer's own field order.
- **BOTH MANIFESTS WERE UPDATED, so a re-import agrees**: the five are in `EXCLUDED_SLUGS` in
  `scripts/practice-area-pages.mjs` and in `PAGE_ARTICLES` in `blog-category-overrides.mjs`.
  Without that pair, the next import puts them straight back.
- **The hub's Premises Liability group is four entries.** This is the **only** place the directory
  drops something the live hub links — everything else in that file is an addition or a rename. A
  removal there does NOT remove the page; check the collection before assuming a slug is gone.
- `REMOVED_ITEMS` in `diff-comp-practice-areas.py` declares it, **matched after the rename** — the
  trap is that three of the five read identically in the comp and the hub and two do not, so a
  half-comp half-renamed list silently removes three and leaves two. It did, first try. There is
  now an assertion that every `REMOVED_ITEMS` entry actually took.
- **`resource: true` is a flag no page sets now.** The field, and the sidebar filter that reads
  it, both stay: the SHAPE recurs — the firm files articles under practice areas — and the next
  import may bring another.

Blog archive is **186**; `/news` renders 185 cards plus the featured panel. Slip and Fall now
holds 6 and Premises Liability 3, and both already led a post, so neither tab is new.

Re-checkable: walk every built practice-area page's `pside-areas` card and assert each href is a
practice-area page in that page's own city. 970 links across 104 cards, all clean.

`getCityAreaLinks()` and `getCityBandTitles()` went with it. **`src/data/cities.ts` has been
orphaned and un-orphaned three times** in as many changes — out with the city band, back for a
city eyebrow, out when the eyebrow became the tagline, and back again for the sidebar's "Denver
Practice Areas" heading. It IS imported today. Do not delete it on the strength of one grep. Kept rather than deleted — it is the only place the nine cities are written
down in prose, and `footer/ServiceAreaBand.astro` still points at it for the `serviceCity`
documents the CMS phase needs — but `City.bandTitle` was pruned (nine strings heading a band that
does not exist) and `getTopics()` was already unrendered. **Its header promised an
`assertCityCoverage()` that has never existed**; that claim is gone too. Fair game to delete the
whole module if the CMS phase decides otherwise.

**`AwardsBar` fills the slot, `tone="sunk"`.** Not the default `lifted`, which is `--dh-cream-50`
— 1.009:1 against `.parea`'s cream-100, the invisible-surface trap. Exactly the About page's
reasoning for the same choice. Without it the page ran cream → cream.

### The fact-check band, on BOTH templates

`AreaArticle` renders `.parea__fact`, `.post__fact`'s markup and rules verbatim, spanning both
columns on row 2 — and **the copy on both is new, by request**:

> This page has been written, edited, and reviewed by a team of legal writers following our
> comprehensive editorial guidelines. This page was approved by attorney, K.C. Harpring, a Denver
> personal injury attorney with extensive legal expertise.

- **One source for both**: `reviewedBy()` in `blog.ts`, with `getReviewedBy()` beside it for
  callers that have no reviewer key of their own. "This page", not "this article", because the one
  string serves 104 service pages as well as 186 posts. The name is interpolated from the roster,
  not typed — the comp says "KC Harpring" and the live site "KC Harping".
- **"our comprehensive editorial guidelines" is NOT a link.** `/editorial-guidelines/` is reserved
  and unbuilt; linking it would ship a 404 on 290 pages. Make it a link when the page lands.
- **The attorney's name IS a link**, to their profile — the affordance the old copy already had.
- **It retired a `TODO(launch)`.** The old copy claimed "tried personal injury cases to verdict in
  Colorado courts for more than 20 years", one of README's unverified stat claims; the new wording
  makes no numeric claim. `diff-comp-blog-post.py` now asserts that string is **absent**, so it
  cannot creep back unreviewed. The homepage's `20 Years` stat is still unconfirmed.
- `factCheck` is derived, not stored — the practice-area collection has no field for it, the same
  way WordPress has none for the blog's. It sits on the article rather than the page copy because
  in Sanity it becomes an overridable per-document field.

**It is a sibling of `PostArticle`, not a reuse of it**, and the reason is not preference. Their
props are typed against `BlogPost` / `BlogPostArticle`, which are already the GROQ projections
they will be after the swap — and more decisively, `PostArticle` places its sidebar with
`.post :global(.pside)`, bounded by an element in its own template as the conventions require. A
`.parea` wrapper cannot match that rule, and adding `.parea` to PostArticle's stylesheet is
exactly the **ancestor** blind spot `README.md` documents that `check:styles` cannot catch.

What IS shared: `Prose`, `PostContents`, `ContactForm`, and **`.pside*`, which moved to
`global.css`** when the second sidebar arrived — same reasoning as `.prose__*` and `.eyebrow`.

**`.dir`'s link rows live in `practice/AreaLinkList`.** Extracted when a third component drew
them; `AreaDirectory` is the only caller left inside `practice/` now that the city band is gone,
and it stays extracted anyway — **`diff-comp-practice-areas.py` reads `arealist__link`**, so
folding it back would move a class a committed check depends on. `cocounsel/PracticeAreaLinks` is
knowingly still separate: different glyph, different ramp, and no diff script watching that page.

## `/practice-areas` runs cream → WHITE → forest

`.dir` is `--dh-white`, not `--surface-page`. It and `.feat` above it were both cream-100, so the
directory read as a continuation of the featured grid rather than a section of its own — the
adjacent-identical-surfaces trap, which nothing in the build checks for. Lightening it was the
request, and only two tokens are lighter than cream-100: `--dh-cream-50` at 1.009:1, invisible,
and white at **1.070:1 — a bigger step than `--surface-alt` manages at 1.046:1**. `.feat`'s cards
are already white, so the band uses a colour the page had established.

**`.feat`'s bottom padding is load-bearing and was `0`.** It ended flush and borrowed the
directory's top padding, which only worked while the two shared a surface. Both are
`--space-section` now. Full order: photo hero → `.feat` cream → `.dir` white → StatsBand forest →
WhyUs cream-50 → AttorneysBand sunk → ContactDetails cream. No two adjacent match.

## Surfaces: the light page's second band is `sunk`, and that is load-bearing

`.parea` cream → `.awards` **sunk** → `.ct` cream. Cream in the middle would put
three identical surfaces in a row, which nothing in the build checks for, and `lifted` — the
awards bar's own default — is cream-50, which is 1.009:1 against cream-100 and would look like
nothing at all. Reordering `ContactDetails` up was rejected outright when this slot first came up:
`#contact` is what every `.btn` on the page targets.

That slot has now held three things: a topic-grouped city band on `--alt`, then a flat one, then
this. If a fourth arrives, the constraint is the same — **not cream, and visibly not cream**.

**The surface order for both branches is written into `[slug].astro` as a comment.** It is still
unchecked by anything; re-read it after any reorder.

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
  for one is the trap — `template-landing.php` covers only 69 of the 109, `parent` is useless
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
`div.faq-block`. 28 of the 109 imported pages carried one, 153 items in total, ~570 words on the motorcycle
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
the check: 104 of 104 pages at ≥99% similarity against live, with h2 / h3 / image / list-item /
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

1. **Three dead links sit in the FOOTER, on 328 of 329 pages.** `/privacy-policy/`,
   `/editorial-guidelines/` and `/sitemap.xml`. All three are linked from every page and none is
   built. Both pages are in `RESERVED_PATHS` and both slugs are in `EXCLUDED_SLUGS`, so this is
   known-and-unbuilt rather than lost — but it is 984 dead links, not three, and it dwarfs the
   homepage's nine. The sitemap belongs to item 5; the two pages need a design decision.
2. **One dead link in an imported blog body.** `5-steps-to-take-after-a-truck-accident` carries
   `href="practice-areas/traffic-collision-lawyer/truck-accident"` — RELATIVE, so it resolves
   under the post's own path and 404s. Broken on the live site too. The intended destination is
   `/denver-truck-accident-lawyer/`; `traffic-collision-lawyer` is one of the three excluded
   duplicates. **The importer's link walk does not reject relative hrefs** — worth a check, since
   this one was found by a sweep rather than by anything committed.
3. **The 9 remaining dead links on the homepage.** Eight are `data/news.ts`, every `href` a literal
   `"#"`, marked `TODO(content)` rather than `TODO(launch)` — which is how they stayed off the
   launch list. The ninth is the Car Accidents checklist teaser. `#` must not reach production.
4. **Move both collections into Sanity.** The blog and the practice areas are now two collections
   with the same contract, and the getters are already the projections. Plus the four Portable
   Text object types the post template deferred (`callout`, `phoneBand`, `attorneyCard`,
   `pullQuote`), whose intended home is commented in `prose/components.ts` — and which the
   practice-area chrome maps onto almost exactly.
5. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton, JSON-LD, `sitemap.xml`,
   `robots.txt`, editor-managed redirects. **The practice-area pages already carry real
   `metaTitle` / `metaDescription` from the live site's own meta**, so that layer has something
   true to start from. `BlogPosting` JSON-LD belongs to this phase. Note that **every page links
   `/sitemap.xml` and no sitemap is built**, so that URL 404s today — now across 329 pages.
6. `/studio-polish ux` — audits the filled-out schema, so it waits.

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment.

## Open

**Decide**

- **Three live Denver pages were excluded as duplicates** and want a ruling:
  `personal-injury-attorney` (duplicates the homepage), `car-accident` and
  `traffic-collision-lawyer` (both overlap `denver-car-accident-lawyer`, which the heavy template
  serves).
- **The `AREA_TO_BLOG_CATEGORY` map in `blog.ts` is inferred, not authored.** It decides which
  posts a practice area's sidebar shows. Keyed on the area slug rather than its topic, because
  topic is five buckets and would put car-accident posts on the motorcycle page — which is what
  the live site does. In Sanity this wants to be a per-page reference list.
- **Auto Insurance & Accident Claims has no tab** — 13 posts carry it second, none first.
- **`site:` in `astro.config.mjs`** — www vs apex, still unsettled.
- **Two crash types on the heavy detail page** — rear-end and head-on.
- **The three Denver crash figures are unsourced**, and `[year]` renders live in all three labels.
- **`src/content` is now 39M** (30M blog, 8.7M practice areas), mostly images. Fine for git today;
  worth watching.

**Waiting on the firm** — content, not code. `README.md` has the full table. Unchanged: the seven
attorney emails, the office address and hours, the `$70M+ / 20 Years` stat claims. **The
practice-area pages carry the legacy `(303) 756-3812` inside imported body copy** in places —
`firmDetails` is not consulted for text that came from WordPress.

**Waiting on the designer**

- **No comp exists for the light practice-area template.** It was specified in conversation as
  "like the blog post, with a different sidebar and a different bottom band" and built that way.
  Worth a look before 104 pages ship on it.
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

- `/api/consult` does not exist. Two form components are rendered from **six** call sites and
  reach **326 of the 329 built pages** — the light template put one on 104 more through
  `AreaSidebar` — and every one of them 404s on submit. One endpoint, not two: a hidden `kind`
  field tells the payloads apart.
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
- **`practice/AreaLinkList`** — chevroned link rows. One caller now (`AreaDirectory`); see above.
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

## Two prose rules that changed, site-wide

Both live in `global.css` and therefore reach the blog as well as the practice areas.

- **Body images are `max-width: 100%`, not `width: 100%`.** The old rule stretched every image to
  the 760px measure, which upscaled the 150px and 300px sources among them past their own pixels.
  A photograph wider than the column still fills it; a small one renders at its own size.
  `ProseImage`'s `sizes` still describes the column, which is fine: it is an upper bound, and a
  small source's srcset carries no candidate above its intrinsic width.
- **`.prose__link:hover` now reads as a hover.** It always existed — `color` alone, #e14a32 to
  #cf6624, about 1.2:1 against each other, with no transition, so it landed instantly and was easy
  to miss. The underline thickens to 2px as well, and both animate on one clock.
  `transition` names the longhands rather than `all`, because `text-decoration` itself cannot be
  animated but `text-decoration-color` and `-thickness` can.

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
