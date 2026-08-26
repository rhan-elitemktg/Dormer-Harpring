# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-26._

## The Sanity integration has started — Phases 0 and 1 are in

**The pipeline exists and four documents are through it.** `src/data/` is 4 of 28 modules
Sanity-backed; the other 24 still return literals and are untouched.

The agreed shape, decided with Rhan before any code:

| | |
|---|---|
| Desk | **Pages → Collections → Site Settings**. The client's order, NOT the build order |
| Build order | Foundation → Settings → Collections → Pages, because pages reference collections |
| Imported content | All 290 blog + practice-area documents move; `src/content/` retires (Phase 3) |
| Editable surface | Every visible string, **except the main nav's top level** |
| Publish → live | Sanity webhook → Vercel Deploy Hook. The site stays a pure static build |

**THE VERIFICATION THAT MATTERS IS THE BYTE-DIFF, and it is available to every later phase.**
A content migration should be output-neutral, so hash all 332 built pages before and after and
account for every difference. Phases 0 and 1 both came back with **331 of 332 identical** —
the only page that changed is `dist/admin/index.html`, and only its Studio bundle hash. Do not
lose this check by making a cosmetic change in the same commit as a migration.

### What is built

- `sanity.cli.ts` + `npm run typegen` (`sanity schema extract && sanity typegen generate`).
- `src/sanity/lib/` — `image.ts` (Sanity CDN URLs), `queries.ts` (every `defineQuery`),
  `fetch.ts` (`required()` and `once()`).
- `Picture.astro` and `ProseImage.astro` branch on local-import vs Sanity asset. Props are
  identical either way, so moving an image into the Studio is a data change.
- Field types: `richText`, `simpleText`, `inlineText`, `link`, `navLink`, `seo`.
- The desk, with a catch-all that surfaces any document type not placed in a group.
- Four singletons: Firm Details, Navigation, Contact & Consultation, Firm Stats.

### Five things that will bite the next phase

1. **`once()` in `sanity/lib/fetch.ts` is not optional.** The first Sanity-backed build took
   **3m35s against 44s** — every page renders the header, the footer and usually the contact
   band, so four singletons became roughly two thousand round trips. With `once()` it is back
   at 43.6s. Any new getter that does not use it re-introduces this, and the arithmetic
   against 186 posts and 104 practice areas is a build nobody waits for.
2. **Filter queries on `_type` as well as `_id`.** An id alone tells typegen nothing about
   shape, so the generated result type is a union across every document type in the dataset —
   one all-null variant each — and every field reads as possibly null however the schema is
   validated. With `_type` the projection types itself.
3. **`@sanity/icons` lies about its own runtime.** `index.d.ts` declares every named icon and
   the barrel exports none of them (it exports a lazy map). `import { CogIcon } from
   "@sanity/icons"` TYPECHECKS and then dies at bundle time. Import from the subpath:
   `@sanity/icons/Cog`. `check:types` cannot catch this; only a build can.
4. **typegen parses every matched file as ordinary TypeScript**, so a `.d.ts` is a parse
   error. Declaration files, the vendored `eliteTheme.js` and typegen's own output are
   excluded in `sanity.cli.ts`. Widening that glob re-breaks it.
5. **`getStaticPaths` still cannot see module scope.** Both `[slug].astro` files are affected.
   `src/sanity/lib/queries.ts` exists so queries can be imported rather than closed over.

### Coalescing goes in the projection or on its own line — never in a cast

`as FirmDetails` typechecks and hides a real mismatch: a projection returns `null` where the
interfaces say `undefined`, and the two are not the same to a component doing
`{firm.email && …}`. `getFirmDetails()` handles four fields explicitly, and **throws** on a
missing map pin rather than defaulting to 0 — a real coordinate in the Gulf of Guinea that
would ship as the firm's location in its structured data.

`required()` throws when a singleton is absent. **Hard cutover, no fallbacks**: a getter that
quietly falls back to a literal is a second copy of the content that can ship by accident,
which is precisely the failure this codebase already had with a phone number.

### The main nav's top level is code, on purpose

`TOP_LEVEL` in `src/data/navigation.ts` holds the six items — labels, destinations, order,
existence. The Studio cannot rename one, reorder them, add a seventh or delete one. It owns
the second level down: three dropdown lists, plus the footer's columns and chips.

**One NAMED field per menu, not a generic list with a parent key.** An editor cannot invent a
menu or attach one to the wrong parent, and a menu appearing under Results — which has none by
design — is a code change. That constraint IS the guarantee that was asked for. The footer
stays fully editable: it is flat, and the request was about the main nav.

`external` is **derived from the href now, not stored.** The flag was a checkbox someone had
to remember; forget it on a pasted `https://` URL and the link opens in the same tab with no
glyph and nothing reports it. `ProseLink` already worked this way, so it is now one rule.

### The three Python checks that read `site.ts` are repointed

`diff-comp-about.py`, `diff-comp-blog.py` and `diff-comp-blog-post.py` each pulled the phone
out of `src/data/site.ts` by regex. That literal is gone, so `.group(1)` threw on `None` —
a declaration that stopped being true failing loudly rather than passing quietly. They query
the same dataset the build queries now, through **`scripts/lib/firm.py`**. The dataset is
public-read, so no token; it does need the network, which these scripts already did.

Tested in both directions: the built page's number swapped for the retired `(303) 747-4404`
exits 1, restoring it exits 0.

### Seeding: the pattern the later phases reuse

`scripts/seed-settings.ts` reads the values out of the static modules and writes NDJSON for
`sanity dataset import --replace`. NDJSON rather than `client.create()` calls because it uses
the CLI's own credentials (no write token to mint or store), `--replace` makes a re-run
idempotent, and it is the only route that can carry images via `_sanityAsset` — which Phase 3
needs for 203 body images. Proving it on four documents was cheaper than proving it on 313.

**`scripts/lib/stub-assets.ts` is what makes that possible at all.** A plain Node script
cannot import anything under `src/data/`: those modules import images, which outside Astro is
`ERR_UNKNOWN_FILE_EXTENSION`, and the whole module fails to load. A `node:module` hook answers
image imports with a stub. Import it BEFORE the dynamic import, and use `await import()` —
static imports hoist above it.

Payloads land in `scratch/`, which is gitignored: the script is the record, not its output.

### Not done, and known

- **The production URL is still not a Sanity CORS origin**, so the deployed `/admin` loads and
  fails sign-in. `http://localhost:4321` is registered — don't move dev off 4321.
- **No webhook yet.** Publishing in the Studio changes nothing on the live site until someone
  redeploys. That is Phase 5.
- **Nothing is wired for Visual Editing**, so array projections omit `_key` where the
  interface has none. Adding it is what that phase is for.

## State

Build is green: **332 pages** — 330 that render a site header and footer, plus `404.html` and
`/admin`. `npm run check` passes and the fidelity audit reports 104 of 104 pages at ≥99% against
the live source.

**The five comp-diff scripts run again, and all five are at 0.** The `Operation not permitted`
on everything under `~/Downloads/Dormer Harpring/` is gone — it was macOS Downloads access, it
came back on its own, and nothing in the repo ever had to change for it. If it returns, the tell
is that plain `head` fails too, not just the scripts.

**One of the five had gone stale while it could not run, and it failed in the right direction.**
`diff-comp-car-accidents.py` declared "the result video card links to the real testimonial",
asserting `youtube.com/watch?v=kFdrOgblr6A` in the built page. The Wistia migration made every
play affordance a popover, so that declaration stopped being true and the script went red on the
declaration rather than passing quietly — the both-directions contract earning its keep on a
check that had been dark for a while. Rewritten to match what the card does now.

**It is matched STRUCTURALLY, not by Wistia id, and that is the part not to undo.** That slot is
`PLACEHOLDER_VIDEO` like the other 43; pinning the id would assert that the placeholder is
correct and would go red on the very change that fixes it. It matches the popover wrapper around
the `res res--vid` anchor instead, and holds the page to having no `youtube.com/watch` link left
anywhere on it — the only youtube URL that survives is the footer's `@denvertrial` channel.

Departures for that page are still **19**: one declaration replaced by one declaration.

**Testing a break on this page needs the right wrapper, and the obvious way is wrong.** All 20
popovers on `/denver-car-accident-lawyer/` carry the same `wistia_async_b4n3r4pchd` class, so a
first-occurrence replace to break the result card hits a different card and the check passes —
which reads as a weak assertion when it is really a bad test. Find the `res res--vid` anchor and
walk back to the wrapper before it.

**Every video on the site is a Wistia popover now**, and that work turned up a pattern worth
reading before touching anything near one — see "Video" below.

**Do not re-run the fidelity audit as part of a routine sweep.** It fetches all 104 practice-area
pages from the live WordPress site and has taken anywhere from two minutes to over an hour. It
only checks imported practice-area body copy, so a change to components, chrome or the check
scripts cannot affect its result. Run it when `src/content/practice-areas/` or the importer
changed, and background it when you do.

**`npm run check` is FOUR linters now, and one of them could never fail.**
`scripts/check-links.py` is the new one — 33,754 internal links across 330 pages, every target
resolved against what `dist/` actually serves plus `vercel.json`. (The count fell from 39,484
when the eighteen footer city chips stopped being links — 5,904 of them — and Editorial
Guidelines left the footer.) The link sweep is no longer
ad hoc: the "42,599 links, four dead targets" figure in the last version of this file came from
a throwaway, like the "2,013 body links, none unserved" figure before it, and a number that
cannot be re-checked cannot fail.

**`check:styles` printed its findings and exited 0** — for its entire life. `npm run check` is
`&&`-chained, so a scoped rule that could never match its target has never once failed the
build. Proven by feeding it a deliberately broken page. Fixed. If anything in `dist/` was
relying on that, it surfaces on the next run; nothing did today.

**`KNOWN_DEAD` IS EMPTY.** The footer's three — `/privacy-policy/`, `/editorial-guidelines/` and
`/sitemap.xml`, 984 dead links across every page — are all closed. Each was closed by a change
that made `check:links` FAIL on the now-stale declaration rather than pass quietly, which is why
the table shrank instead of growing. **The only dead links left on the site are the nine
`href="#"` placeholders**, declared by count in `KNOWN_PLACEHOLDER`. Item 1 under Next.

The relative href that was item 2 is fixed, and 49 malformed `tel:` hrefs with it — see below.

Run `git status` for where you are; this file deliberately does **not** name the working branch,
because that line went stale three times in the session that first wrote it.

**The practice-area pages are imported and there is a template for them.** 104 pages across nine
cities, on a light template built like the blog post. That is the single biggest change since the
last handoff and it moves the project's biggest dependency off the critical path.

**The blog archive is 186 posts, not 167.** WordPress has two post types and the article-shaped
content is spread across both — see below.

Marker inventory: **39 `TODO(launch)`, 14 `TODO(video)`, 5 `TODO(sanity)`, 1 `TODO(content)`.**
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

## The link check — and the linter that could not fail

`scripts/check-links.py`, wired into `npm run check` alongside the other two. It reads `dist/`,
so build first.

**Why it exists.** Nothing in the build looks at links. Astro renders whatever string a
component hands it, so an href to a page that was never built is a green build and a production
404. The footer's three proved it: 984 dead links, on every page, past five comp-diff scripts
and two linters. The sweeps that did find them — this file's "42,599 links, four dead targets"
and the earlier "2,013 body links, none unserved" — were both written ad hoc and thrown away,
and the second counted body links only, which is exactly how the footer's stayed invisible.

**Four failure classes**: `DEAD` (nothing serves it and nothing redirects it — redirect
*destinations* are resolved too, because a redirect landing on nothing is the same bug one hop
later), `PLACEHOLDER` (`href="#"`), `RELATIVE` (an internal href with no leading slash: a 404
that moves, because it resolves under whatever page it lands on), and `TEL` (a `tel:`/`sms:`
that is not E.164).

**IT FAILS IN BOTH DIRECTIONS, and the second one is the point.** Known breakage is declared
with a reason in `KNOWN_DEAD` / `KNOWN_PLACEHOLDER` / `KNOWN_RELATIVE` / `KNOWN_TEL` — the
contract `PRACTICE_AREA_PAGES` gives the importer. Undeclared breakage fails; **a declaration
that has stopped being true also fails**, until it is deleted. Without that half an exemption
table only ever grows, and closing an item leaves no trace. All six paths were tested by
breaking something and watching the check go red.

`KNOWN_PLACEHOLDER` is keyed **by count**, not by page, so removing one of the homepage's eight
without lowering the number fails.

**`check:styles` had never been able to fail.** It printed its ✗ lines and returned 0, and
`npm run check` is `&&`-chained, so a scoped rule that could never match its target went green
every single time since the script was written. The linter guarding a silent failure mode was
itself failing silently. It exits 1 now. **Worth checking the same thing about any script this
project trusts** — `check:tokens` and all five comp diffs were verified to exit non-zero.

### THE PHONE NUMBER IS `(303) 756-3812`, and the 866 number is retired

**Settled by the firm, and it reverses what this codebase said.** `site.ts` recorded
`(866) 683-6894` — the comps' number — as "the firm's choice". It was not. The correct number is
the one the live site publishes in its JSON-LD and on its contact page, and it is now
`firmDetails.phone` / `phoneE164`, so the header, footer, every `tel:` href, the JSON-LD and the
Thank You lede all follow from one line.

The 866 number is **retired, not kept as a fallback**: a second number in the data layer is a
second number that can ship by accident. It appears on **0 pages** now.

**The imported body copy carried SIX different firm numbers, not two.** This is the part worth
not re-deriving — the last version of this file said "197 of 329 pages" off a two-number count,
and that was wrong:

| In imported copy | Count | |
|---|---|---|
| `(303) 747-4404` | 240 text + 69 `tel:` | the main one, in five spellings |
| `303-756-3812` | 10 | already right, wrong display format |
| `(720) 571-8186` | 4 | "call Dormer Harpring at …", four blog posts |
| `(303) 747-4407` | 2 | last digit differs, same sentence shape |
| `(303) 474-4404` | 2 | 747 transposed, `thornton-spinal-cord-injury-lawyer` |
| `(303) 647-9990` | 1 | "Dormer Harpring … Call us at …" |

All 330 rewritten. Every one was verified by reading its whole block, not its span — the number
is usually its own span, because it was a link on the live site, so 90 characters of context
shows nothing.

**THREE NUMBERS IN THE SAME COPY ARE NOT THE FIRM'S AND WERE LEFT ALONE**: `(720) 913-2000` (the
Denver Police non-emergency line, on two posts) and `(303) 538-7200` / `(303) 417-1544` (Bike
Thornton and Bicycle Colorado, on `thornton-bicycle-accident-lawyer`). **A regex over
phone-shaped strings is the trap here** — it also matches sixty-odd Shutterstock asset ids in
image filenames, two X/Twitter status ids and a PACER document id. The replacement list is
written down, the same way `DROPPED_SECTIONS` is.

`(303) 555-0100` is **not** a firm number either: it is the `placeholder` and `title` hint on the
two forms' phone inputs, an example of the format the VISITOR should type, on 326 pages. 555-01xx
is the reserved fictional range. `site.ts` used to claim it "is not used anywhere", which was
wrong in a way that invited someone to grep for it and delete it.

**Four committed checks had to change with it**, and three of them were asserting the old number:

- `diff-comp-blog-post.py` asserted `"(866) 683-6894" in built_text and "756-3812" not in
  built_text` — it was forbidding the right answer.
- `diff-comp-about.py` and `diff-comp-blog.py` compare the comps' info-card values against the
  built page, and the comps carry the 866 number. The phone is now excluded from that comparison
  and asserted as a **declared departure** instead, which was tested by reverting the number and
  watching it fail.
- All three now read the number out of `src/data/site.ts` by regex rather than repeating the
  literal. A `.py` script cannot import a `.ts` module, but it can read one.
- `audit-practice-area-fidelity.py` folds every firm number to one token on **both** sides. It
  would otherwise have passed on luck: one word in ~2,000 is a 0.05% delta against a 99%
  threshold, so a real content departure of that size reads as noise too.

**The `tel:` hrefs were separately malformed** — 68 of them, in nine spellings, including
`tel:(303) 747-4404` and `tel: 303 747 4404`. The ones with a space after the colon do not
reliably dial. `normalizeHref()` in the converter emits E.164 now, so the import cannot
reintroduce them, and `check:links` fails on any that appear.

**Applied surgically, never by re-importing.** `mkKey` is a single run-scoped counter and a
re-run rewrites every `_key` across all 313 content files. Every changed line was confirmed to be
a phone line and nothing else; the 35,179 `_key`s are untouched. Same gate as always —
`git status --porcelain src/content` after any converter change.

## Video — every play affordance is a Wistia popover

**No record says `youtube` any more.** Nine affordances, seven wired, two deliberately not:

| | |
|---|---|
| `Hero` · `FirmIntro` · `FaqItem` | were inert — now popovers |
| `RailVideoCard` · `DetailVideo` | were inert — now popovers |
| `VideoReviewCard` · `AttorneyBio` · `ResultStories` | were link-outs to YouTube — now popovers |
| `AttorneyCard` | portrait opens the film, name/role go to the bio (see below) |
| `MoreOnClaims` | still decorative — the card is already a link to an article |

178 popover anchors across 30 pages, each with a working href as its no-JS fallback.

### THE ONE THING TO READ BEFORE TOUCHING A POPOVER

**Wistia moves the trigger into a `div.wistia_click_to_play` of its own.** That single fact broke
three unrelated things, each of which looked like a different bug and cost a round trip to
diagnose:

1. **Layout collapse.** `VideoPopover`'s wrapper is `display: contents` so the caller's `<a>`
   keeps its parent's grid/flex place. Wistia's div takes that role instead, leaving the `<a>` a
   plain inline child of it — so `.faq__video` and `.vcard`, which relied on a tag default for
   `display`, computed to `inline` and collapsed to **0×0**. Their posters are `position:
   absolute; inset: 0`, so a 0×0 box is a 0×0 image. Both declare `display: block` now.
2. **`.lazy-fade` stopped working.** Re-creating the nodes dropped the per-image load listeners,
   so `.is-loaded` never landed and posters sat at `opacity: 0` — correctly sized, fully
   downloaded, invisible. Fixed in `Layout.astro`, not worked around: it delegates from the
   document **with capture** now, which survives node replacement *and* covers a lazy image that
   decodes whenever the reader scrolls to it. A timed re-run cannot cover that second case and
   the first attempt at this wrongly tried.
3. **`height: 100%` stopped resolving.** `.vcard` on `/testimonials` inherits the grid row's
   height through its `<li>`, which is what puts the name on the floor of the card. Wistia's div
   sits between them at `height: auto`, so the tallest card matched by coincidence and the rest
   came up short. Fixed on the `<li>`: `display: grid` makes whatever is inside it a lone grid
   item, and a lone grid item stretches on **both** axes — so it needs no rule on a child whose
   class belongs to Wistia.

**The pattern: anything that assumed the trigger is a direct child of its parent, or that its
nodes survive, is wrong once Wistia initialises.** Before launch, sweep for `height: 100%`,
`align-self`, `:first-child`/`nth-child` and per-node listeners anywhere near a popover — three
were found one at a time and there is no reason to think that was all of them.

### How it is wired, and why not the other way

Wistia's own class-based popover: `wistia_embed wistia_async_<id> popover=true
popoverContent=link` on the wrapper, with the caller's `<a>` inside.

**Driving it from `Wistia.api(id).popover.show()` instead does NOT work**, and it is worth not
re-attempting: that needs an embed initialised WITH popover options and IN LAYOUT. A
`display: none` host initialises without them and throws `Cannot read properties of undefined
(reading 'popoverborderradius')`; flipping its display afterwards does not re-initialise it.
E-v1.js also discovers embeds by POLLING, so a host created on click is not ready on that tick —
asking once and giving up is why the hero opened nothing for a while and just followed its href.

**KNOWN COST, not addressed: a page initialises one Wistia player per popover, eagerly.** Fifteen
on the homepage, twenty on `/denver-car-accident-lawyer/`. That is inherent to the class-based
embed and wants its own pass before launch. The duplicate `<script>` tags are the smaller half of
it and resolve themselves once the ids diverge.

### PLACEHOLDER_VIDEO — 44 slots, one stand-in

`lib/video.ts` exports it; every un-migrated slot points at it, by request, so the whole site
works today and the ids swap per record once Sanity gives an editor somewhere to type them.

**`home.ts` writes the hero's id as a LITERAL instead, deliberately.** The hero's video is
correct and finished; the other 44 only happen to share an id today. Grep `PLACEHOLDER_VIDEO` to
get exactly what still needs a real id — grepping the id itself wrongly includes the hero.

**Every real YouTube id is preserved in a comment beside its record**, with the video's title and
whether it was public or unlisted. Without that the mapping is gone: nobody could tell which
testimonial slot wanted which film, and five of the eight were unlisted.

### The firm's YouTube channel: 20 videos, and 5 are UNLISTED

`@denvertrial` — channel `UCW0qcYz_K1ArgbzY436FA2A`. **15 public**, and **5 unlisted that the
site embeds**: Evelyn (`kFdrOgblr6A`), Joel (`AhfhEBczLcY`), Elijah (`aqX7B7vu1ZI`), an unnamed
testimonial (`B3-hJPujs0U`) and Sean's 2024 profile (`LT-oU3yqtmA`).

**Nothing public can enumerate an unlisted video.** `yt-dlp`, the RSS feed and the channel page
all return only the 15; those five were found by working backwards from ids in the codebase. So
a migration driven off the channel listing would have quietly moved 15 videos and left five dead
embeds. **There may be more unlisted videos than these five** — only YouTube Studio's Content
list holds the complete set, and nobody has checked the true total.

Downloads are the firm's to make from Studio or Google Takeout: those give the original masters
and include unlisted videos, where anything scraping the public streams gives a re-encoded
delivery copy and cannot see them at all.

### The attorney card is two controls now

By request, and it unblocked something. The card was a single `<a>` wrapping portrait, name and
role — which is why the play glyph sat there promising a video it could not play: an `<a>` may
not contain another `<a>`. It is a `<div>` now with two siblings — `.acard__media` to the film,
`.acard__link` (wrapping name and role) to the bio. The name's hover is bound to the name's own
link rather than the card, since they are separate controls.

**This changed the About page too.** `AttorneyCard` is rendered by both `home/AttorneysBand` (the
`.attys` rail) and `about/TeamPreview` (the four-up grid). The brief named `.attys`; applying it
to one and not the other would make the same card behave differently on two pages.

`MoreOnClaims` has the same shape and was left alone — its card is already a link to an article,
so the glyph would need the same split, which is a design change rather than a wiring job.

## Nav: the current page highlights inside a dropdown

Viewing `/community-involvement/` and opening "About" shows Community Involvement in the same
treatment hover gives. Most of it already existed — `Header.astro` computes `current` through
`normalizePath` and puts `aria-current` on the top-level links; this extends it to the children
and adds the selector to the existing hover rule so the two cannot drift.

`aria-current` carries it rather than a class, matching the top-level items: the styling and what
a screen reader announces are the same fact. A child with no `href` is skipped —
`normalizePath(undefined)` would throw.

**`MobileNav` has NO current-page logic at all** — it does not import `normalizePath` and renders
no `aria-current` anywhere. Its sublinks want the same treatment and hover is not the relevant
state there, so it needs its own visual decision.

## The footer, the header and the favicon

Six changes to the footer and one to the header, all by request.

- **The text number is `(720) 730-7997`**, from `firmDetails`. The comps' `(720) 734-6230` is
  retired. **THE COMPS ARE NOW WRONG ABOUT BOTH NUMBERS** — worth knowing before trusting them
  on a third. Both are asserted absent in `diff-comp-about.py` and `diff-comp-blog.py`, as one
  declared departure read out of `site.ts` rather than repeated as a literal.
- **The 18 service-area chips are `<span>`s, not links.** They pointed at `/contact/` — eighteen
  chips, one destination. Nothing was dead, but a linked city chip promises a landing page for
  that city or an office in it, and the firm has neither; the note beside them already says
  there is one office, in RiNo. Same convention `TeamCard.astro` records. The `:hover` and the
  `transition` went with the anchor — a hover on something unclickable reads as a broken
  control. **5,904 fewer internal links.**
- **Editorial Guidelines is out of the legal bar.** No comp ever carried it. `ROUTES` and
  `RESERVED_PATHS` keep the route, and the two fact-check bands still name "our comprehensive
  editorial guidelines" in prose without linking it, so there is one place for the link to
  return to.
- **The general-purposes / prior-results disclaimer is out of the bar.** NOT gone from the site:
  `/results`, `/co-counsel` and `/testimonials` each keep their own copy, which are the three
  pages that actually publish outcomes. Recorded in a comment so it is not restored from the comp
  as a missing feature.
- **The Elite mark closes the row**, after Sitemap, linked to `elitelegalmarketing.com` with
  `rel="noopener" target="_blank"`, 32px tall at 55% opacity rising to full on hover. Rendered
  through `Picture` from `src/assets/elite-white.svg`. Two things the anchor needed that the bare
  image did not: `display: flex` on the `<a>`, because an `<img>` in an inline box sits on the
  text baseline and leaves descender space that drops it off the row's centre line; and a hover,
  on the row's existing idiom.
- **Header: "It's free. Available 24/7" is now "Free Consultation. Available 24/7."** The same
  phrase survives untouched in `contact.ts`'s form lede on 325 pages — out of scope, not missed.

**A mobile-centring pass on `.footer__bottom` was built and then reverted by request.** It is in
the reflog at `06077cf` if it comes back. The finding in it is worth keeping either way:
`space-between` is not a centring rule once a flex row wraps, because each wrapped line holds one
item and space-between leaves a lone item at flex-start.

### The favicon was Astro's default logo, on every page

Replaced with the firm's DH monogram — white on `#314641` — from the live site's WordPress
site-icon, `uploads/2020/10/cropped-favicon-1-1.jpg`. `favicon.ico` (16 + 32 as PNG payloads),
`icon-192.png`, `apple-touch-icon.png` at 180.

- **Built from the 512px ORIGINAL, not WordPress's 32px crop.** That crop is a JPEG already
  downsampled once; resizing it again compounds the artifacts. The live site still serves the
  512, and the sitesucker scrape has only the three crops.
- **No ImageMagick and no Pillow on this machine.** `sips` did the resampling and the ICO
  container is a 30-line writer — ICO takes PNG payloads, so the header is six bytes plus a
  16-byte directory entry per image.
- **NO SVG, and the `favicon.svg` link is gone** rather than left pointing at Astro's. No vector
  source for the mark exists — the comps' SVGs are the practice-area icons and `src/assets` has
  only the Elite mark — and hand-tracing a monogram is design work, not a conversion. If the firm
  produces one it goes in first and browsers prefer it over the `.ico`.
- **`TODO(launch)`: the mark's green is not this site's.** `#314641` against the nearest token
  `--dh-forest-100` `#2c3b31`, with the chrome at `#151e19` — so the tab icon is a visibly
  lighter, greyer green than the header it sits above. Carried over as-is because it is the
  firm's asset. README has the row.

## The three utility pages, on the light template's shell

`/privacy-policy/`, `/sitemap/` and `404` — built by request on the practice-area template's
look. **`KNOWN_DEAD` in `check-links.py` is now EMPTY**: the footer's 984 dead links are gone,
and the only dead links left on the site are the nine `href="#"` placeholders.

`components/page/PageArticle.astro` is a **third sibling** of `PostArticle` and `AreaArticle`,
not a reuse of either, and the reasons are AreaArticle's own one step further on:

- Reusing `AreaArticle` means fabricating a `readTime`, `publishedAt`, `author`, `faqs` and
  `factCheck` for three pages that have none.
- **It would put the fact-check band on a privacy policy** — a band that says the page was
  "written, edited, and reviewed by a team of legal writers" and names the attorney who approved
  it. True of 104 service pages and 186 articles. Not true of a 404.
- Reusing it would put the fact-check band — which asserts a named attorney approved the page —
  on a privacy policy and a 404.

So: no byline, no FAQ, no fact band, and the same three surfaces — cream `.spage` → sunk
`.awards` → cream `.ct`.

**THE SIDEBAR IS THERE, and getting it right took a correction.** It was built without one on
the argument that `AreaSidebar`'s middle card is a window centred on the CURRENT page among its
city's siblings, and these pages have no current page and no city. That was over-reading the
brief — the ask was to mimic the practice-area template, and the sidebar is most of what that
template looks like. Both objections turned out to be answerable rather than blocking:

- **`getPracticeAreaSidebarLinks("denver", "")` already handles a missing current slug.**
  `at < 0` starts the window at the head and nothing gets `current`, so the card renders as a
  plain twelve-entry list with its "View All Practice Areas" link. Verified in the built markup:
  12 rows, 0 `--current`, no self-link. Denver because it is the firm's own city and its 50
  pages are the ones a visitor is most likely to want.
- **`relatedSidebarLabel` is overridden to "Latest articles".** `PracticeAreaPageCopy` says
  "Related articles", which is a claim about subject-matching that `getRelatedPostsForArea`
  earns and a privacy policy cannot. These are the five most recent posts, so the card says so.

`AreaSidebar` is rendered by each PAGE and passed through a **named slot**, not built inside
`PageArticle` — its three cards need `PracticeAreaPageCopy`, `SidebarAreas` and a post list,
data the component has no other use for. The grid is `AreaArticle`'s, ratio and breakpoints
identical, including releasing every explicit placement at 980px.

**`.spage__title` is a THIRD copy of `.post__title`.** Deliberate for now: the shared thing would
be an "article head", but `.post__*` and `.parea__*` are class names the comp-diff scripts read,
so extracting means changing committed checks rather than tidying. A **fourth** caller is the
time to do it, the way `.pside*` moved to `global.css` when the second sidebar arrived.

### Privacy policy — transcribed, with three departures

From the live page (WP page id 1061). The wording is the firm's throughout; the departures are
structural or factual:

1. **The phone number is read from `firmDetails`**, not transcribed — the live page closes on
   `(303) 747-4404`, one of the six numbers the imported bodies were normalised off.
2. **The source's own `<h2>` is dropped and its three `<h3>`s promoted.** The live body opens on
   "Privacy Policy for Personal Injury Law Firm Dormer Harpring", which is the title said twice:
   WordPress renders no H1 from `content.rendered`, so on the live page that h2 IS the heading.
3. **`updatedAt` is WordPress's `modified`** (2026-01-20), not its `date` (2019-01-17) — the same
   call the practice-area template makes.

`TODO(launch)`: it is thin. No CCPA/GDPR section, no cookie disclosure, no retention period, no
route for a data request — and the site loads third-party tags and embeds a Google Map that sets
cookies on load, none of which it mentions. Shipped as the firm's own text because rewriting a
law firm's privacy policy is the firm's call. README has the row.

### `/sitemap/` is the HUMAN page, and `sitemap.xml` is still unwritten

The footer linked `/sitemap.xml` and nothing built it. An XML sitemap is a crawler file
referenced from `robots.txt`, not from a footer, and every URL in it is absolute off `site:` —
the open www-vs-apex `TODO(launch)`. Writing it now bakes that guess into ~330 URLs, so it stays
with `/new-seo-setup`. The footer points at the human page instead.

**328 links, every built page except `/thank-you/` (noIndex) and `/tokens/` (the throwaway).
Zero duplicates.** Verified by differencing the rendered hrefs against `dist/`.

**IT READS THE COLLECTION, NOT THE DIRECTORY, and that is load-bearing.** Two traps it hit:

- **Four built pages are in no directory group** — Defective Helmets, Autonomous Vehicle
  Accidents, Drunk Driving Accidents, Taxi Accidents, all Denver. The directory is synced to the
  firm's live hub and the hub does not list them. They are not orphans (7–19 inbound links each
  from sibling sidebars) but `/practice-areas` does not list them, and a sitemap built off the
  same source inherits the hole. **`assertDirectoryJoin()` does not catch this** — it walks
  directory entries looking for missing pages and never pages looking for a missing group. Its
  doc comment claimed both directions and this file claimed it threw on "a page loses its group".
  Both corrected. `TODO(launch)`: the four want a ruling.
- **The featured post is not in `getBlogPosts()`.** `/news` renders it in its own panel, so the
  feed getter excludes it — and inheriting that exclusion drops the one post the blog leads with.

The directory still supplies the group **titles and their order**, which are the firm's own; the
collection supplies the members. The heavy detail page is merged in separately, because
`getPracticeAreaPages()` filters out any slug `getPracticeAreaDetails()` claims. A page that
lands in no group **throws at build time**.

### 404

`src/pages/404.astro` → `dist/404.html`, which Vercel serves for any unmatched path on a static
deployment — no adapter, no config, no route entry.

**IT ONLY RENDERS AT A PATH WITH A TRAILING SLASH, and that is `trailingSlash: "always"`, not a
bug in the page.** `/dfgfgf/` renders it; bare `/dfgfgf` gets Astro's own built-in
`404: Not Found (trailingSlash is set to "always")` instead, because Astro rejects the
slash-less form before routing reaches any page file. Both `astro dev` and `astro preview`
behave this way. **Production should not**: `vercel.json` carries `"trailingSlash": true`, so
Vercel 308s the bare form to the slashed one first and then serves `404.html`. That last step is
reasoned from Vercel's documented behaviour, NOT measured — worth one check on the first preview
deployment. Do not "fix" it by loosening `trailingSlash`; three layers agree on it and ~300
indexed legacy URLs depend on it. **NOT in `RESERVED_PATHS`**: nothing may link
it and no redirect may point at it, because a redirect to a 404 page returns 200 with not-found
content, which is the soft-404 pattern search engines penalise. The status has to come from the
server failing to find a file. `noIndex`, verified in the built `<meta name="robots">`.

It offers four routes rather than a search box: **this site has no search.** The blog index
filters client-side over a list it already has, which would find nothing outside `/news`, and a
box that returns nothing is worse than no box.

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

1. **The 9 remaining dead links on the homepage** — the ONLY dead links left on the site.
   `KNOWN_DEAD` in `check-links.py` is empty. Eight are `data/news.ts`, every `href` a literal
   `"#"`, marked `TODO(content)` rather than `TODO(launch)` — which is how they stayed off the
   launch list. The ninth is the Car Accidents checklist teaser. `#` must not reach production.
   All nine are declared in `KNOWN_PLACEHOLDER` **by count**, so removing one without lowering
   the number fails the check. The four news mentions are real published articles (FOX31,
   Denver7, OutThere Colorado, The Mountain Mail) and their URLs are findable; the four insight
   teasers and the checklist point at articles nobody has written.
2. **Real Wistia ids.** 44 slots point at one stand-in (`PLACEHOLDER_VIDEO`), which is the whole
   site's video layer resting on a single film. Each record names the YouTube id it should map
   to. Blocked on the firm re-hosting the remaining videos — and on someone checking YouTube
   Studio for unlisted videos beyond the five the site already embeds.
3. **One Wistia player per popover, initialised eagerly** — 15 on the homepage, 20 on
   `/denver-car-accident-lawyer/`. Inherent to the class-based embed; wants a pass before launch.
4. **Sanity Phase 2 — Collections, hand-authored.** Fifteen modules, ~230 documents:
   `attorney` (27 + the two dogs) · `caseResult` (89) · `testimonial` (21) · `award` · `faq`
   (20) · `practiceArea` · `coreValue` · `city` · the four community types · `newsMention` ·
   `insight`. This is where the editable CARD images land. Four modelling calls are already
   flagged elsewhere in this file and belong in that phase: the homepage's nine practice-area
   blurbs vs `/practice-areas`' (different copy for the same nine — do not collapse them), the
   three duplicated case results, the nine `href="#"` placeholders, and `AREA_TO_BLOG_CATEGORY`
   becoming a per-page reference list.
5. **Sanity Phase 3 — Collections, imported.** 313 documents, 203 body images, script-driven.
   Bodies are already Portable Text from the same converter, so they upload unchanged — but
   **preserve the existing `_key`s rather than regenerating**: Sanity requires uniqueness
   within each array and a collision is a silently dropped item, not an error. Then
   `content.config.ts` retires. **Do not delete `practice-area-pages.mjs` or
   `blog-category-overrides.mjs` blindly** — `EXCLUDED_SLUGS`, `PAGE_ARTICLES` and the "a page
   in neither throws" contract encode decisions, not mechanics.
   Plus the four Portable Text object types the post template deferred (`callout`, `phoneBand`,
   `attorneyCard`, `pullQuote`), whose intended home is commented in `prose/components.ts` —
   and which the practice-area chrome maps onto almost exactly.
   Open in that phase: the heavy `PracticeAreaDetail` in `carAccidents.ts` — 45KB across ~20
   section interfaces for ONE page. Recommendation on the table is to keep the structure in
   code and move only its text and images.
6. **Sanity Phase 4 — Pages.** Sixteen singletons, every visible string a field. `homePage` is
   the largest (26 getters in one `Promise.all`). The two template-chrome singletons —
   `blogPostTemplate` and `practiceAreaTemplate` — sit under **Pages**, not Settings: they hold
   copy that appears ON a page, which is exactly what the SEO team will reach for.
7. **Sanity Phase 5** — the webhook, CORS, then `/studio-polish ux`, which audits the
   filled-out schema and so waits until there is one.
8. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton, JSON-LD, `sitemap.xml`,
   `robots.txt`, editor-managed redirects. **The practice-area pages already carry real
   `metaTitle` / `metaDescription` from the live site's own meta**, so that layer has something
   true to start from — and the `seo` object type is already stubbed to hold them when they
   land in Phase 3. `BlogPosting` JSON-LD belongs to this phase, and so does `sitemap.xml` — **which
   nothing links any more**: the footer points at the human `/sitemap/` now. The XML file's every
   URL is absolute off `site:`, so it cannot be written before the www-vs-apex call.

No comp exists for **privacy / disclaimer**, **sitemap** or **404**. All three are built on the
light template's shell anyway — see below.

## Sanity readiness

Audited against the whole tree before the integration starts. **The content is ready; the
tooling is not.** Nothing below is a code change waiting to happen — it is what the next session
should expect to build.

**The four green lights, all re-checkable:**

- **35,179 `_key`s across both collections: zero duplicates, zero missing.** This is the one that
  would have bitten during upload, because Sanity requires `_key` uniqueness WITHIN each array
  and a collision surfaces as a silently dropped array item rather than an error. Re-check by
  walking every array of typed objects in `src/content/**/*.json`.
- **290 slugs, zero collisions** between the 186 blog posts and the 104 practice areas. They
  share `[slug].astro` at the root, so a collision is a page that cannot be served.
- **80 async getters, and the data layer is clean**: no hex codes, no SVG markup, no style
  strings. The convention held.
- **No component owns content.** All 127 checked — not one declares a content array in its
  frontmatter.

**The blockers, in the order they bite:**

1. ~~**There is no Sanity client.**~~ **CLOSED in Phase 0.** `@sanity/astro`'s `sanity:client`
   is now imported by `src/data/{site,navigation,contact,stats}.ts` and by
   `src/sanity/lib/image.ts`. The client is configured entirely in `astro.config.mjs` —
   `IntegrationOptions` is `ClientConfig` plus the studio keys, so there is no wrapper module
   and one client serves everything. `perspective: "published"` so a draft cannot go live on
   the next deploy; `apiVersion` pinned because GROQ's behaviour is versioned by date.
2. **TypeScript is installed now, and the repo does NOT typecheck.** `typescript` and
   `@astrojs/check` are devDependencies and `npm run check:types` runs `astro check`. First run:
   **9 errors, 97 hints across 205 files.** Nothing had ever verified a type here, so this is
   accumulated, not new.

   **PIN TYPESCRIPT TO 6.x. TypeScript 7 does not work.** The 7.0 native compiler does not expose
   the programmatic API `astro check` relies on, and the CLI fails outright with a message
   pointing at withastro/roadmap#1321. `npm i -D typescript` installs 7 and breaks the check.

   **`check:types` is deliberately NOT in `npm run check`.** That chain is `&&`-ed and currently
   green; wiring a 9-error check into it turns the gate red for everything. Wire it in once the
   nine are closed, and not before.

   **Nine became SEVEN: the one genuinely broken reference is fixed.** `data/home.ts` annotated
   `getRecentResults()` as returning `CaseResult[]` without importing the type — it lives in
   `caseResults.ts` — while `home/RecentResults.astro` imported `CaseResult` FROM `data/home`,
   which never exported it. Both sides now take it from `caseResults`, which is where the four
   other callers and `coCounsel.ts` already took it and what `home.ts`'s own comment said all
   along. **Type-only: all 332 pages hash identical before and after.** It had been broken the
   whole time and the build never noticed, because Vite strips types without checking them —
   which is the argument for item 2 in one line.

   **`sanity.config.ts` is closed too — 7 down to 5.** `projectId` and `dataset` were
   `string | undefined` going into `string` fields. They are read through a `required()` helper
   that throws with the variable's name and where to set it, which narrows both.

   **THAT DOES NOT IMPROVE `npm run build`, AND THE FIRST VERSION OF THE COMMENT CLAIMED IT DID.**
   Building with `.env` moved aside still fails with "Configuration must contain `projectId`"
   from `@sanity/client`'s `initConfig` — because the client the prerender constructs is
   configured by the `sanity()` integration in `astro.config.mjs`, reading the same variables
   through Vite's `loadEnv`, and it gets there first. `sanity.config.ts` covers the two entry
   points that read it directly: the browser Studio bundle and the Sanity CLI. **Guarding
   `astro.config.mjs` is the other half and is not done.**

   Worth knowing either way: **the build already died without those variables**, so this changed
   the message, never whether it fails. Only `dist/admin/index.html` changed, and only its studio
   bundle hash — the other 331 pages are byte-identical.

   **ZERO ERRORS NOW, AND `check:types` IS IN `npm run check`.** All nine are closed and the
   gate is wired, so this stops being a list somebody has to remember. It runs FIRST in the
   chain — it is the only one that does not read `dist/`, so it gives a real signal without a
   build. **Tested in both directions**: a deliberate `const x: number = "s"` turns
   `npm run check` red, removing it turns it green.

   **It runs at `--minimumSeverity error`.** Warnings and hints are not the gate, and
   `src/sanity/eliteTheme.js` — a vendored minified file whose single 56KB line is one line —
   otherwise buries the output in ~700KB of noise. A gate nobody can read is a gate nobody runs.

   That same 56KB line is why **`awk 'length < 400'` on `astro check` output silently drops real
   errors**: a filtered count read 5 where the truth was 7. Count with `grep -c ' - error '` on
   the raw text.

   **The last two fixes, both type-only, both hash-verified against all 332 pages:**
   - `lib/headings.ts`'s `BlockLike` gained a REQUIRED `_type`, which is what actually cleared
     the three `ProseH*` errors — TypeScript's weak type detection rejects an all-optional target
     that shares no property name with its source, and `ArbitraryTypedObject`'s `[key: string]:
     any` index signature does not count as a shared name. `text` also became `unknown`, which is
     a separate choice: it is true (inline objects carry no `text`), not required.
   - `src/sanity/eliteTheme.d.ts` now declares both colour schemes present, which is a claim
     about the GENERATED module rather than about `StudioTheme` in general — checked against the
     built file. That is where the fix belongs; a non-null assertion at the use site would assert
     the same thing with none of the explanation.
3. ~~**No TypeGen path.**~~ **CLOSED in Phase 0**, but not the way the note assumed.
   `sanity.cli.ts` exists and `npm run typegen` is `sanity schema extract && sanity typegen
   generate`, writing `src/sanity/{schema.json,sanity.types.ts}` — both committed.

   **`typegen.enabled` IS DELIBERATELY OMITTED.** It regenerates during `sanity dev` /
   `sanity build`, and this Studio is EMBEDDED in Astro — neither command is ever run here, so
   the hook would never fire and setting it true would be a claim that does not hold. Run
   `npm run typegen` after any schema or query change; `check:types` is the gate that catches
   a stale run.
4. **The asset surface is 112 distinct images** imported by the data layer, plus **203 more**
   inside the content collections. `src/content` is 39M. **They split two ways** by Rhan's
   rule: large decorative art (page-header photographs, band backgrounds, the two logos) stays
   a local import through Astro's build pipeline; card and interactive images become Sanity
   assets on its CDN. `Picture.astro` already branches, so each move is a data change.

   The Sanity branch does NOT go through Astro's `<Image>`, on purpose: ~290 remote fetches
   would add minutes to every build, and Astro re-crops from the original, throwing away the
   hotspot an editor set. Dimensions are read out of the asset reference rather than fetched —
   290 images is 290 round trips — and are omitted rather than guessed when the ref is not in
   Sanity's documented shape, because a wrong width/height bakes the layout shift into the
   markup.
5. **`getStaticPaths` does not see module scope.** Astro hoists it into its own module context,
   so a module-level `const QUERY = defineQuery(...)` throws `ReferenceError` at request time.
   Define queries used inside it there, or import them. Both `[slug].astro` files are affected.
6. **The production URL is still not a Sanity CORS origin**, so the deployed `/admin` loads and
   fails sign-in. Unchanged, and still not a blocker for building. Phase 5.

**`tsconfig.json` NEEDS NO `types` ENTRY, and an earlier version of this section was wrong to
say it did.** The Sanity guide's Astro page says to add `"types": ["@sanity/astro/module"]` —
that instruction is for a project without an ambient declaration. This one has had it all along:
`src/env.d.ts` carries `/// <reference types="@sanity/astro/module" />` beside the `astro/client`
one. Verified rather than reasoned — a throwaway page importing `sanityClient` from
`sanity:client` and reading `.config().projectId` typechecked clean and added zero errors.

Adding the entry anyway would be worse than redundant: a `types` array REPLACES TypeScript's
automatic `@types` inclusion, so it trades a working setup for a narrower one. Leave it out.

**Eight stale comments were corrected**, all numeric claims the imports had overtaken: the blog
counts (167 → 186, and 107 → 125 without featured art), the fact-check sentence's audience
(109/181 → 104/186), the FAQ estimate ("65 of the legacy site's 98" → the counted 28 of 104),
and cities (109 → 104). **Verified inert by hashing all 332 built pages before and after —
byte-identical.**

The tab-row comment needed more than a number. It claimed the row renders every category; it
renders **22 of 23**. `auto-insurance-accident-claims` is unreachable because a post belongs to
exactly one category — the first its record lists — and thirteen posts carry that one second,
none first. Already an open question below; now recorded where the code is.

**Duplication found and deliberately left alone:**

- `ContactForm` / `CoCounselForm` share their label, `:focus` and honeypot rules verbatim — and
  are headed for one `/api/consult` endpoint anyway.
- `.spage__grid` / `.post__grid` / `.parea__grid` are identical, as are the three `__main` rules.
  That is **three** callers against the documented four-caller threshold for extracting, so it
  stays. Note the threshold is now one away.
- Repeated utilities: absolute-fill `object-fit: cover` in four files, visually-hidden in two,
  the awards rail in three.

## Open

**Decide**

- **Four built practice-area pages are in no directory group** — Defective Helmets, Autonomous
  Vehicle Accidents, Drunk Driving Accidents, Taxi Accidents, all Denver. The directory is synced
  to the firm's live hub and the hub does not list them. Not orphans (7–19 inbound links each
  from sibling sidebars) and `/sitemap/` lists them, but `/practice-areas` does not. Add them, or
  confirm hub-only. `assertDirectoryJoin()` cannot decide this for you — see its note.
- **The favicon's green is not the site's.** `#314641` against `--dh-forest-100` `#2c3b31`.
  Designer call.
- **`MoreOnClaims`' play glyph promises a video it cannot play.** Same shape the attorney card
  had before it was split: the card is already a link to an article, so the glyph needs its own
  control or it should go.
- **`faq-video-cover.jpg` is 607×609 — square — in a 16/10 box.** `object-fit: cover` with
  `object-position: center top` crops roughly the bottom 40%. Not a layout bug; a 16:10 crop
  would use the frame better.
- **`MobileNav` has no current-page highlight**, where the desktop nav now does.
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
attorney emails, the office address and hours, the `$70M+ / 20 Years` stat claims.

**Settled this session, so stop asking**: both phone numbers (call `(303) 756-3812`, text
`(720) 730-7997` — the comps were wrong about both), and the privacy policy, which is now built
from the live page's own text. The privacy policy is **thin** and wants a legal review before
launch, not a content answer: no CCPA/GDPR section, no cookie disclosure, no retention period,
no route for a data request, and no mention of the third-party tags or the cookie-setting map
embed. That is README's row, not a blocker for building.

**The phone number is SETTLED and no longer waiting on anyone**: `(303) 756-3812` site-wide,
including the imported body copy, which carried six different firm numbers. See above. What is
still open is only the display vs CallRail tracking split, if dynamic insertion returns.

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
- **`media/VideoPopover.astro`** — the ONE place a video opens in a popover. It renders the
  Wistia wrapper; the CALLER supplies its own `<a href={videoWatchUrl(...)}>` as the slotted
  trigger, so the caller keeps its element and its scoped styles. Read its header before
  changing it — the alternatives were tried and are recorded there.
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

- **A component script that queries `document` by a GENERIC selector reaches other
  components.** `home/PracticeSelector` looped `document.querySelectorAll('[role="tablist"]')`,
  and the homepage renders three tablists. It double-bound `home/NewsInsights`, which has its
  own near-identical handler, and it broke `home/PromiseBand` outright: those dots carry no
  `aria-controls` and are driven by PromiseBand's `show()`, so an arrow key flipped
  `aria-selected` and moved focus while the slide stayed put — the announced state and the
  visible slide disagreed, and nothing corrected it, because PromiseBand has no keydown handler.
  Both tab sets scope to their own class now.

  **An ARIA role is not an identifier and neither is user-facing text.** NewsInsights keyed off
  `[aria-label="News and insights"]`, which is copy — rewording it would have silently unwired
  the tabs. **Swept: there are only five document-level queries in the whole component tree**,
  and the other three are correct — `img.lazy-fade` (Layout's delegated capture handler, global
  on purpose), `[data-promise]`, and `.play`, which reaches only PlayButton's own instances
  because the three hand-rolled play circles use `vcard__play` / `bio__play` / `morefeat__play`.
  That is also exactly why those three do not pulse.
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
upgrades.

**The desk is no longer empty.** `structureTool({ structure })` draws three groups — Pages,
Collections, Site Settings — from `src/sanity/structure/index.ts`. Pages and Collections are
empty lists today; Site Settings holds four singletons. A document type added to `schemaTypes`
but not placed in one of the three arrays shows up under a divider at the bottom rather than
becoming invisible, which is the same silent-failure shape the four linters exist to catch.

Singletons are enforced by `documentId()` in the structure, not by a schema option — there is
no `singleton: true`. `SINGLETON_TYPES` is what keeps them out of the catch-all, so a
singleton is never shown twice with edits to the second copy going nowhere.
