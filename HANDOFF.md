# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-07._

## State

Everything is merged to `master` and nothing is in flight. Build is green: **35 pages**, 285
optimized images, `npm run check` passing.

Run `git status` for where you are. This file deliberately does **not** name the working
branch — that line went stale three times in the session that wrote it, twice within minutes
of being written.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

Phases 0 → 3g are done: design tokens and shell, header/drawer/footer, the homepage section
by section, then Thank You, Contact, Testimonials, Case Results, Co-Counsel, Community
Involvement, the Attorneys index and the Attorney bio.

**Built:** `index`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `meet-our-attorneys/` + `meet-our-attorneys/[slug]`, and
`tokens.astro` (an internal design-token reference, not public-facing).

The `[slug]` route serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

## Next

Remaining templates, ordered easiest → hardest by section count (the order this project has
been working in). All five comps exist.

| Page | Sections | Notes |
|---|---|---|
| **Practice Areas** | 7 | **Next up**, and the `pa_index` branch exists for it. Comp: `DH - Practice Areas.html`. Two of the seven already exist as components — "The people in your corner." is `AttorneysBand.astro`, "Serving injured Coloradans" is `ServiceAreaBand.astro`. `src/data/practiceAreas.ts` already has `getPracticeSection()`, `getHomePracticeAreas()`, `getCatastrophicAreas()`, `getPracticePromise()`. That leaves three new: the hero ("How we help injured Coloradans."), "Our core practice areas.", and "Every case we handle, by location." |
| About | 11 | Three exist (those two plus `CoreValues.astro`). New: "We take the cases other firms turn down.", "You only get one shot at this.", "What you can expect when you hire us.", and an "In their words." testimonials variant. |
| Blog index | 6 | Fewer sections than About but more new work — introduces a post content type. `src/data/news.ts` has an `InsightPost` shape and `getInsightPosts()` from the homepage feed; posts will still need slugs, dates, probably categories. |
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

**Waiting on the firm** — these are content, not code. `README.md` has the full table; the
short version is that 12 `TODO(launch)` markers are open in `src/`, covering the seven
attorney emails (six inferred from a pattern), the office address and hours, the `$70M+ /
20 Years` stat claims, and K.C.'s facts band — which currently duplicates Sean's copy
verbatim, and two of its three cells are false on K.C.'s page and contradicted by his own
body copy on it.

**Waiting on the designer**

- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size
  with different checksums. Nobody has said which is final. The homepage was built from the
  comps as they stood.
- Whether the copy in the comps is final or placeholder.

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
