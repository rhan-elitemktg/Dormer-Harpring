# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-07._

## State

Build is green: **37 pages**, 325 optimized images, `npm run check` passing. Practice Areas
is merged. **About is built and committed but not yet merged** — see `git status` for the
branch, and open a PR against `master` when it's approved.

Run `git status` for where you are. This file deliberately does **not** name the working
branch — that line went stale three times in the session that wrote it, twice within minutes
of being written.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

Phases 0 → 3i are done: design tokens and shell, header/drawer/footer, the homepage section
by section, then Thank You, Contact, Testimonials, Case Results, Co-Counsel, Community
Involvement, the Attorneys index, the Attorney bio, Practice Areas and About.

**Built:** `index`, `about`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `practice-areas`, `meet-our-attorneys/` +
`meet-our-attorneys/[slug]`, and `tokens.astro` (an internal design-token reference, not
public-facing).

Two shared pieces came out of the About build and now serve two pages each:
`ReviewRating.astro` (the white "300+ Client Reviews · 5.0 on Google" card, extracted from
`TestimonialRail` where it was inline) and a `layout` prop on `AttorneyCard` (`"rail"` for
the homepage's fixed 272px card with a centred play glyph, `"grid"` for About's track-width
card with the glyph bottom-left).

`scripts/diff-comp-about.py` is the second comp-diff script, built from the Practice Areas
one. It also **asserts the four deliberate differences** from the comp, so a later session
that reverts one is told rather than left to guess. Worth copying again for the Blog and Car
Accidents pages.

The `[slug]` route serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

## Next

Remaining templates, ordered easiest → hardest by section count (the order this project has
been working in). All four comps exist.

| Page | Sections | Notes |
|---|---|---|
| **Blog index** | 6 | **Next up.** Fewer sections than About was but more new work — introduces a post content type. `src/data/news.ts` has an `InsightPost` shape and `getInsightPosts()` from the homepage feed; posts will still need slugs, dates, probably categories. The comp also carries a category tab row (`.bx-tabs`) and a featured block (`.bx-feat`) — check its `data-dc-script` block for both before building. |
| Blog post | 3 | Depends on the type the index introduces. Reuses the proven `[slug]` + `Prose` pattern from the attorney bios. |
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
- Three entries the comp lists have **no page anywhere** — Legal Malpractice, Life Insurance
  Bad Faith, Pet Insurance Bad Faith. The legacy hub's own links to them are broken (written
  relative, so they resolve under `/practice-areas/`). They render as plain text via
  `href: null` rather than as dead links. Marked `TODO(launch)`.

**Waiting on the firm** — these are content, not code. `README.md` has the full table; the
short version is that 14 `TODO(launch)` markers are open in `src/`, covering the seven
attorney emails (six inferred from a pattern), the office address and hours, the `$70M+ /
20 Years` stat claims, K.C.'s facts band — which currently duplicates Sean's copy verbatim,
and two of its three cells are false on K.C.'s page and contradicted by his own body copy on
it — and, new, **who is in the About page's founders photograph**. The man on the left is
unmistakably K.C.; the man on the right wears glasses and is clean-shaven where Sean's
headshot has neither, so the alt text names him by inference. The comp's own alt text there
was "Michael Dormer and Zachary Harpring" — two people who do not exist — so it is not a
source for this.

**Waiting on the designer**

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
