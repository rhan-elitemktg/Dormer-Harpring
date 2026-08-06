# Dormer Harpring — session handoff

Marketing site for **Dormer Harpring**, a Denver personal-injury law firm. Built by Elite
Legal Marketing. Replaces a WordPress site.

## Stack

Astro 7 (static, TS strict) · Sanity 6 embedded Studio at `/admin` · Vercel · React (only
to host the Studio). One `npm run dev` serves both site and Studio on port 4321.

- Sanity project `74nyy5mh`, dataset `production`. `.env` is gitignored; the same two
  `PUBLIC_SANITY_*` vars are set in Vercel (all environments, **not** marked Sensitive —
  they're public by design and you want to be able to read them back).
- `sanity.config.ts` reads env from `import.meta.env` **or** `process.env` — the browser
  Studio gets the first, the Sanity CLI (`schema extract` / `typegen`) only the second.
- Fonts are **self-hosted via Astro's Fonts API** (`astro.config.mjs`), not the comps'
  render-blocking `fonts.googleapis.com` request. Five families: Anton (display headings),
  Hanken Grotesk (body), Geist (nav/eyebrows/numerals), Newsreader (pull quotes), Caveat
  (signatures).
- `site:` in `astro.config.mjs` is `https://www.denvertrial.com`. **Unconfirmed** — there's
  a `TODO(launch)` to settle www vs apex before the first production deploy. Every canonical
  tag, `og:url`, and sitemap entry derives from it.

## Where we are

Phases 0 → 3g are done and merged. Build is green: **35 pages, 293 optimized images.**

| Phase | Scope | State |
|---|---|---|
| 0 | Design tokens, shell scaffolding, asset pipeline | done |
| 1 | Header, mobile drawer, footer | done |
| 2a–2h | Homepage, section by section | done |
| 3a–3g | Thank You, Contact, Testimonials, Case Results, Co-Counsel, Community Involvement, Attorneys index, Attorney bio | done |

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

**Pages built:** `index`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `meet-our-attorneys/` + `meet-our-attorneys/[slug]`, plus
`tokens.astro` (an internal design-token reference page, not public-facing).

**Pages still to build**, all of which have comps waiting:

- About
- Practice Areas (index)
- Car Accidents (the practice-area detail template — the largest comp at 187 KB)
- Blog index
- Blog post template
- Privacy policy / disclaimer — **no comp exists**; needs design or a plain-text treatment.
  `/new-seo-setup` later expects a `legalPage` type for these.
- 404 — no comp either.

## Architecture — read this before touching data

**Content is currently static TypeScript in `src/data/*.ts`. Sanity holds nothing yet;
`src/sanity/schemaTypes/index.ts` is still an empty array.**

This is deliberate, not an oversight. Each module in `src/data/` is a documented
**"SANITY SWAP POINT"** — every export is already shaped the way the future GROQ projection
will return it: flat, pre-coalesced, free of presentation. The getters are already `async`,
so when the CMS phase lands each function body becomes a `sanityClient.fetch(...)` and the
call sites don't move.

Two rules the data layer holds to, and which any new work must also hold to:

1. **No component owns content.** Components take props; the page fetches and passes down.
   Component-level private arrays drift out of sync with the data module and nobody notices
   until migration.
2. **No hex codes, style strings, or SVG markup in the data layer.** Those get re-derived in
   CSS. No editor will ever type a hex code into the CMS, so it must not be in the shape.

The flow is: `src/pages/*.astro` → `await` getters from `src/data/*.ts` → props into
components. `src/pages/index.astro` is the clearest example — 26 getters in one
`Promise.all`, then 14 section components.

Data modules: `attorneys`, `awards`, `caseResults`, `coCounsel`, `community`,
`communityPage`, `contact`, `contactPage`, `coreValues`, `faqs`, `home`, `navigation`,
`news`, `portableText`, `practiceAreas`, `site`, `stats`, `team`, `teamPage`,
`testimonials`, `thankYou`.

## Design source of truth

`~/Downloads/Dormer Harpring/Dormer Harpring Claude Files/` (791 MB, from the designer).
**It needs triage — roughly half is dead weight from abandoned directions.**

**Canonical:** the 16 `DH - *.html` files at the folder root. Self-contained, no dependency
on `_ds/` or the `homepage-v8/v9.css` files. All 46 local asset references resolve — nothing
missing. `DH - Index.html` is the designer's directory page linking them all. Images live in
`wireframes/assets/` and `uploads/`.

**Ignore these — all stale:**

| Item | Why |
|---|---|
| `v4`–`v7`, `new_v1`–`new_v3`, root `*.jsx` | Earlier React/Babel generation |
| `production-build/` | `build.mjs` targets `Dormer Harpring - Homepage V4.html`, which isn't in the folder — the script is broken. Moot anyway, we're on Astro |
| `_ds/` (both design systems) | Declare a *different* font stack (Libre Caslon Display, Archivo, Roboto Condensed, Alex Brush, Cormorant Garamond). Only Anton overlaps the approved pages |
| `homepage-v8.css` / `v9.css`, `old/`, `scraps/` | Not referenced by any approved page |

**The designer's `CLAUDE.md` in that folder is partly stale.** It claims "Single font: Geist
(used for everything)" — the approved pages use five families. Its layout notes do hold
(`.wrap{max-width:1660px}` with no horizontal padding is confirmed in the markup). Verify
before trusting any individual line.

The comps use `{{ }}` template placeholders (`{{ t.img }}`, `{{ a.href }}`,
`{{ activeArea.img }}`). That's the designer having already marked what's repeatable data —
those loops map onto Sanity document types, the static text onto page-singleton fields.

**Open question for the designer:** `DH - Homepage approved.html` and
`DH - Homepage approved v2.html` are the same byte size but different checksums. Nobody has
said which is final. The homepage was built from the comps as they stood; worth confirming
nothing was missed.

Also unresolved: whether the copy in the comps is final or placeholder.

## Studio state

Elite brand theme is applied (scaffold-time `/studio-polish brand`): light-locked palette,
ELITE emblem as workspace `icon`, centered login card. The login-card layout uses a scoped
CSS hook into Sanity's internal DOM, attached to the icon component because
`studio.components.layout` doesn't wrap the unauthenticated login screen. Cosmetic only,
fails gracefully — worth a glance after major Sanity upgrades.

Desk is empty because there are no content types yet. That's expected.

`http://localhost:4321` is registered as a Sanity CORS origin with credentials. **The
production URL still needs adding** to Sanity → API → CORS origins with credentials, or the
deployed `/admin` will load but fail sign-in.

## Repo

Branch **`dh_internals`**, 3 commits ahead of origin (the Attorney-bio polish commits).
`master` is the PR target; work merges via PR (last was #17).

Commit style: sentence-case, describes the visible change ("Attorney bio: email in the
contact line, awards carousel, smaller pull quote"), phase-tagged where it completes a phase.

## What comes next

1. Finish the remaining page templates (About, Practice Areas, Car Accidents detail, Blog,
   Blog post).
2. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter
   body to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical.
3. `/new-seo-setup` — per-page meta, Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. Needs the real pages and
   content types to attach to, hence last.
4. `/studio-polish ux` — desk grouping into Pages/Collections/Site Settings, unique icons,
   length caps, preview fixes. Audits the filled-out schema, so it also waits.
5. Settle the `site:` TODO (www vs apex) before the first production deploy.
