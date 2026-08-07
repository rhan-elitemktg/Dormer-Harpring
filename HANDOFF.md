# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-07._

## State

Build is green: **38 pages**, 327 optimized images, `npm run check` passing. About is
merged. **The Blog index is built and has had one round of review notes from Rhan, but is
not merged** — see `git status` for the branch, and open a PR against `master`. Those notes
are applied (see below); it has not yet had the full desktop-and-mobile pass About went
through, so expect another round.

Run `git status` for where you are. This file deliberately does **not** name the working
branch — that line went stale three times in the session that wrote it, twice within minutes
of being written.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

Phases 0 → 3j are done: design tokens and shell, header/drawer/footer, the homepage section
by section, then Thank You, Contact, Testimonials, Case Results, Co-Counsel, Community
Involvement, the Attorneys index, the Attorney bio, Practice Areas, About and the Blog index.

**Built:** `index`, `about`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `practice-areas`, `news` (the blog index), `meet-our-attorneys/` +
`meet-our-attorneys/[slug]`, and `tokens.astro` (an internal design-token reference, not
public-facing).

The `[slug]` route serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

`scripts/diff-comp-blog.py` is the third comp-diff script, after the Practice Areas and
About ones. Each **asserts its page's deliberate differences** as well as diffing the text,
so a later session that reverts one is told rather than left to guess — the blog's are nine.
Worth copying again for the Blog post and Car Accidents pages. None are wired into
`npm run check`, which has to stay runnable without the design folder; run them by hand.

### What the Blog index turned up, and what was decided

**The comp's feed is 5 real posts and 8 invented ones.** Its featured post and first four
cards are the live blog's June 2026 entries verbatim — same titles, same dates, same
reviewer as `/news` pages 1–2 in the scrape. The other eight exist nowhere in the 167 legacy
posts, and four of them are the placeholder articles the homepage's insights tab already
carries. This is the first comp found to be quoting the live site rather than inventing;
check the next one the same way.

Rhan chose, with the alternatives on the table:

- **Ship the comp's thirteen verbatim.** The five real ones link to their legacy slugs; the
  eight invented ones get `href: null` and render without a link — the same treatment
  Practice Areas gives its three page-less entries. The alternative considered and rejected
  was filling the eight from the real feed, which would have made every card link at the
  cost of eight deviations from the comp.
- **The category tabs filter client-side.** They do not link to `/category/<slug>`; those
  archives are live WordPress and this build does not serve them, so linking would have put
  five more URLs on the cutover list.

One consequence worth knowing: `blogFeed.ts` owns the feed's visibility **instead of**
`loadMore.ts` — a filter and a pager both writing `hidden` on the same cards race, and which
you get depends on click order; the note in `loadMore.ts` records this.

### The review notes, and what they changed

Rhan's first round on the built page. All five are applied, and the two structural ones are
asserted in `diff-comp-blog.py` so a later session cannot quietly restore the comp's order.

- **The category row moved below the featured panel**, where the comp puts it directly under
  the page header. As the comp has it, a 560px-tall panel separates the tabs from the twelve
  cards they filter. Spacing was rebalanced rather than just reordered: 72px above the tabs,
  40px below, so the label and the row read as one block with the grid.
- **The featured post is no longer filtered.** It is the page's editorial lead, not a member
  of the feed, and hiding it made the top of the page collapse and re-expand on every tab
  press. A category matching no card now shows the featured post above the empty-state line.
- **Cards fade up when a category is picked** — 6px, 240ms, 25ms stagger capped at 8. Set
  only on a filter change, never on load, where it would collide with `.lazy-fade` on the
  images. The global reduced-motion guard collapses animation *duration* but not *delay*, so
  `PostCard` carries its own `prefers-reduced-motion` rule; without it a card would sit at
  opacity 0 for the length of its delay.
- **The tab row is a scrolling rail at every width**, replacing the comp's fixed six-column
  grid — same construction as the homepage practice tablist below 980px, gutter bleed
  included. The comp draws six categories; the live blog has **twenty-three**, and the CMS
  phase lets an editor add more. `flex: 1 1 0` keeps six looking like the comp's grid, and
  because a flex item will not shrink below its min-content width, the row starts scrolling
  on its own once they stop fitting — no count threshold to maintain.
- `.pcard__meta` bottom margin down to 4px.

### Shared pieces the About work produced

New pages should reach for these rather than re-solving them. All are in use on two or more
pages already, so a change to one is a change to all of them — check before editing.

- **`ReviewRating.astro`** — the white "300+ Client Reviews · 5.0 on Google" card. Extracted
  from `TestimonialRail`, which held the only copy.
- **`AttorneyCard`'s `layout` prop** — `"rail"` fixes the card at 272px for the homepage,
  `"grid"` lets the track set it for About. The play glyph is centred in both; the About
  comp puts it bottom-left and that was **not** adopted.
- **`AwardsBar`'s `tone` prop** — `lifted` (default) is the comps' near-white; `sunk` is for
  pages where the band follows a plain cream section and would otherwise be invisible. Not a
  global change, because the homepage runs this band under `FirmIntro`, which is already
  `--surface-sunk`.
- **`.hero-cta` / `.hero-cta__note`** in `global.css` — the one-button-plus-gold-note row
  under four photo heroes. They each carried a byte-identical copy.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
  `.btn--block-sm` is gone. Verified that nothing sets a competing width, and that the three
  rows pairing two buttons all wrap.
- **`.arrow` on every arrow inside something that navigates.** Three documented exclusions,
  each commented where it lives: `.pa__tab`'s chevron marks selection, `.attys__cta`'s badge
  scales instead of sliding, and the carousel prev/next are controls rather than CTAs.
- **`MobileNav`'s `subItemsOf`** — a parent with children renders as a `<summary>`, which
  toggles rather than navigates, so its own page is unreachable from the drawer. This adds a
  link to it when no child already points there. Don't hand-author one in `navigation.ts`.

### The mobile heroes

`Hero.astro` and `PageHeader.astro`'s `tone="photo"` share one construction below their
breakpoints, and it is worth reading the comments before touching either. The photograph is
a **band across the top**, sized off the viewport WIDTH; the copy starts 72% down it and
overlaps the lower half under a bottom-to-top wash.

Three things that look arbitrary and are not:

- The band is sized off **width**, not content. `cover` on a full-height portrait box takes
  its whole crop out of the SIDES — measured at 42–49% of the frame across phone widths,
  which is the outer two of the four attorneys. Off width it is 6%.
- The **0.72 and the wash stops are proportions of the band**, because the band is itself a
  proportion of the viewport. What has to hold is the copy's relationship to the faces, which
  sit at 12–32% of the frame in every crop — not a pixel count.
- The mobile background is **flat `--dh-forest-500`, not `--grad-forest`**. The wash has to
  end in exactly the colour behind the band's foot, and the radial is a different green at
  every y.

## Next

Remaining templates, ordered easiest → hardest by section count (the order this project has
been working in). All four comps exist.

| Page | Sections | Notes |
|---|---|---|
| **Blog post** | 3 | **Next up.** The type is built — `BlogPost` in `src/data/blog.ts`, with the slug already in `href`. Reuses the proven `[slug]` + `Prose` pattern from the attorney bios. Only five posts have a slug to build a page from, and none has a body yet; the legacy post markup in the scrape is the source for both. Getting those five built is also what turns the index's five links from cutover liabilities into pages this site serves. |
| Car Accidents | 29 | The practice-area **detail** template and by far the largest comp — 29 sections, 88 placeholders. Last. |

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment; `/new-seo-setup` later expects a `legalPage` type for the former.

After the templates:

1. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter
   body to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical.
2. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. Needs real pages and
   content types to attach to, hence after.
3. `/studio-polish ux` — desk grouping into Pages/Collections/Site Settings, unique icons,
   length caps, preview fixes. Audits the filled-out schema, so it also waits.

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

- `/practice-areas`'s directory ships **87 links to legacy WordPress URLs that this build
  does not serve** — the whole point of the section, and the same thing the nav and footer
  already do with 21 of them, but at four times the scale. They resolve today because the
  WordPress site is still live at those paths, and they keep resolving after cutover only if
  the practice-area detail pages are built or redirected first. Nothing renders 404 while
  both sites are up; the day this one replaces it, all 87 do. The Car Accidents template
  (last on the list above) is the first of those pages.
- The Blog index adds **five more legacy links to the same pile** — the featured post and
  four cards point at live WordPress post URLs this build does not serve. Same mechanism as
  the 87 above and the same fix: the Blog post template, which is next.
- Eight of the Blog index's twelve cards **have no post behind them at all** and render
  without a link. README.md's table has the full account. Either real articles replace them
  or they come out; a blog index two-thirds of whose cards go nowhere cannot ship.
- Three entries the Practice Areas comp lists have **no page anywhere** — Legal Malpractice,
  Life Insurance Bad Faith, Pet Insurance Bad Faith. The legacy hub's own links to them are
  broken (written relative, so they resolve under `/practice-areas/`). They render as plain
  text via `href: null` rather than as dead links. Marked `TODO(launch)`.

**Waiting on the firm** — these are content, not code. `README.md` has the full table; the
short version is that 16 `TODO(launch)` markers are open in `src/`, covering the seven
attorney emails (six inferred from a pattern), the office address and hours, the `$70M+ /
20 Years` stat claims, K.C.'s facts band — which currently duplicates Sean's copy verbatim,
and two of its three cells are false on K.C.'s page and contradicted by his own body copy on
it — and, new, **who is in the About page's founders photograph**. The man on the left is
unmistakably K.C.; the man on the right wears glasses and is clean-shaven where Sean's
headshot has neither, so the alt text names him by inference. The comp's own alt text there
was "Michael Dormer and Zachary Harpring" — two people who do not exist — so it is not a
source for this.

**Waiting on the designer**

- **No comp specifies a mobile layout for anything** — every comp is a desktop frame, and the
  drawer, the mobile heroes and the stacked CTA rows are all ours. The most visible of those
  is the homepage hero: on a phone the photograph is now a band across the TOP with the copy
  over its lower half, where it used to be a strip anchored to the hero's bottom. Rhan asked
  for that and signed it off, but the designer has not seen it and the homepage is nominally
  an approved page.
- **The Blog index's layout departs from its comp in three visible ways**, all at Rhan's
  request and none of them mobile-only: the category row sits under the featured panel rather
  than above it, the featured post stays visible through every filter, and the tab row is a
  scrolling rail rather than a fixed six-column grid. The last one is forced by content — the
  comp draws six categories and the live blog has twenty-three. Same standing as the mobile
  hero above: signed off by Rhan, not seen by the designer.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size
  with different checksums. Nobody has said which is final. The homepage was built from the
  comps as they stood.
- Whether the copy in the comps is final or placeholder.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately.
  The package draws these subjects twice — the shapes the homepage comps inline, and the
  `assets/pa-icons-line/*.svg` files Practice Areas and Car Accidents load. `PracticeIcon`
  now carries one set, the `pa-icons-line` one, so brain injury looks the same on every
  page. Confirm that's the intended drawing before launch; reverting is one file.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them and appear on the legacy hub.
  The page matches the comp, so those eight are unreachable from it. Add three groups, or
  leave them to the nav?
- That section's heading is "Every case we handle, by **location**", but the comp's last two
  groups — "Premises Liability" and "Other Legal Services" — are topical. Built as the comp
  has it. Either the heading or those two groups wants changing.
- The About comp and the homepage comp carry the **same six core values with two of them
  written differently** — "We don't" / "We're" on the homepage, "We do not" / "We are" on
  About. It is one singleton serving both pages, so it keeps the homepage's wording (that
  comp is the approved one). Same shape of thing in the reviews panel: About trims two of the
  three review headlines by a clause. Both are asserted in `diff-comp-about.py`, so reversing
  either is a one-line change there plus one in the data.

**Blockers for launch, not for building**

- `/api/consult` does not exist. Both forms post to it and 404 on submit.
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
