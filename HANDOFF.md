# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-10._

## State

Build is green: **38 pages**, 327 optimized images, `npm run check` passing. The Blog index
is merged and signed off. Nothing is in flight — the branch you are on is a fresh one off
`master` for the next template.

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

### What the Blog work established

**A comp can be quoting the live site rather than inventing.** The Blog index comp's
featured post and first four cards are the real top of the blog — same titles, same dates,
same reviewer as `/news` pages 1–2 in the scrape — and the Blog Post comp is a full worked
example of the first of them. Its other eight cards exist nowhere in the 167 legacy posts.
Nothing about the markup distinguishes the two halves. **Check the next comp the same way**:
take a title from its `data-dc-script` block and grep the scrape for it before assuming
anything is placeholder.

Three decisions from that page still constrain what comes next:

- **The eight invented posts ship with `href: null`** and render without a link, rather than
  being replaced with real ones. So `getBlogPosts()` is a mix, and anything iterating it has
  to handle a null href.
- **Category tabs filter client-side.** No `/category/<slug>` archive is built, and the live
  WordPress ones are deliberately not linked.
- **`blogFeed.ts` owns that feed's visibility instead of `loadMore.ts`** — a filter and a
  pager both writing `hidden` on the same cards race, and which you get depends on click
  order. `loadMore.ts` still serves the reviews and the case results; its comment records
  why it did not get the blog.

### Shared pieces to reach for

New pages should use these rather than re-solving them. All are in use on two or more pages
already, so a change to one is a change to all of them — check before editing.

- **`lib/dates.ts`'s `formatPostDate`** — ISO in, "June 23, 2026" out, pinned to UTC so the
  build machine's timezone cannot shift a published date by a day. The Blog post template
  needs the same byline the index cards carry.
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
been working in). Both comps exist.

| Page | Sections | Notes |
|---|---|---|
| **Blog post** | 3 | **Next up.** See the section below — the comp is smaller than its section count suggests, but the sidebar is most of the work. |
| Car Accidents | 29 | The practice-area **detail** template and by far the largest comp — 29 sections, 88 placeholders. Last. |

### What the Blog post template needs

Three sections: the article with its sidebar, a dark three-card "Related posts" band, and
the contact block this site already builds. `Prose` and the `[slug]` + `getStaticPaths`
pattern from the attorney bios both carry over, so the article body is the easy half.

**The comp renders one specific post, and it is a real one** — "Can you sue a trampoline
park if you signed a waiver?", which is the Blog index's featured post and a live legacy
article. So the comp gives the full treatment of a single post, and
`can-you-sue-a-trampoline-park-if-you-signed-a-waiver/index.html` in the scrape gives its
actual body. The comp's key-takeaways block is that post's own, near-verbatim.

Only the **five real posts** can get a page; the other eight have no body and no slug. Build
those five and the Blog index's five links stop being cutover liabilities and become pages
this site serves.

What the type does not have yet:

- **`body`** — Portable Text. `pt()` is the authoring shim; the legacy markup is the source.
- **`readTime`** — the comp's byline reads "· 7 min read", which the index's cards do not
  show. `InsightPost` in `news.ts` already carries one, so match that field name.
- **Key takeaways** — a list block above the body, on every legacy post as well as the comp.

Three things worth deciding before building rather than during:

- **The sidebar is the bulk of it**: an author card with a click-away popover, a categories
  list, a consultation form card, and a related-articles card. The popover is the only new
  interaction on the page.
- **The two Blog comps disagree about the categories.** The index's tab row is Auto
  Accident, Personal Injury, Product Liability, Premises Liability, Trials. The post's
  sidebar is the same five with Product and Premises **swapped** and a sixth, **"Colorado
  Law"**, added — which is probably the legacy `laws` category that `blog.ts` already calls
  "Laws". Exactly the drift `AGENTS.md` warns about; pick one and record which.
- **The sidebar's five "related articles" are all posts that do not exist** — every one of
  them is among the eight the index leaves unlinked. The three cards in the dark band at the
  foot are the real ones. So the sidebar list needs a real source or it needs dropping;
  it cannot ship as five dead entries.

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
it — and **who is in the About page's founders photograph**. The man on the left is
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
