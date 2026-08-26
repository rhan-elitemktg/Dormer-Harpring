# Dormer Harpring

## Read HANDOFF.md now, before anything else

`HANDOFF.md` holds the current state — what's built, what's next, what's open, and what is
deliberately unfinished. **This file does not, on purpose**, so what you have in front of you
is only half the picture. Read it at the start of every session, including when the request
looks small enough not to need it: the last three things that went wrong here were all
already written down.

Also read `README.md` when the task touches setup, the three `check:` scripts, or anything on
the pre-launch decision list.

---

Marketing site for a Denver personal-injury law firm, built by Elite Legal Marketing to
replace a WordPress site. Astro 7 (static, TS strict) · Sanity 6 Studio embedded at `/admin`
· Vercel · React only to host the Studio.

> `CLAUDE.md` is a symlink to this file — one source of truth, read by both Claude Code and
> other agent tools. Edit this file; don't replace the link with a copy.

**This file is the durable half — architecture and conventions.** Don't put status in it: it
loads every session, and stale status is worse than none.

## Commands

```sh
npm run dev                  # site + Studio, both on :4321
npm run build && npm run check
```

`npm run check` is not optional. It runs four linters for four failure modes the build
cannot see, all of which fail **silently** — README.md has the full explanation:

- `check:types` — `astro check`. The build strips types without checking them, so a type
  error ships green. It ran for the first time with **9 errors already in the tree**, one of
  them a genuinely broken reference. Runs at `--minimumSeverity error`: warnings and hints
  are not the gate, and `src/sanity/eliteTheme.js` is a vendored minified file whose single
  56KB line otherwise buries the output in ~700KB of noise.
- `check:styles` — a scoped CSS rule that can never match, because the class it targets was
  passed to a child component and so never carries this file's `data-astro-cid`.
- `check:tokens` — an undefined `var()`, which invalidates its whole declaration rather than
  degrading. `padding: var(--space-11) var(--space-13)` with no `--space-13` renders *no*
  padding, not most of it.
- `check:links` — an `<a>` pointing at a page that was never built. Astro renders whatever
  string it is handed, so this is a green build and a production 404. It caught 984 of them
  in the footer, on every page of the site.

**TypeScript must stay on 6.x.** The 7.0 native compiler does not expose the programmatic API
`astro check` needs, and the CLI fails outright — a routine `npm i -D typescript` installs 7
and breaks `check:types`.

`check:styles` and `check:links` read `dist/`, so build first. `check:types` does not, which is
why it runs first in the chain: it gives a real signal without a build. Dev runs on 4321 and that exact origin is
registered with Sanity CORS — don't move it.

## Architecture: the Sanity swap

**Content is static TypeScript in `src/data/*.ts`. Sanity holds nothing yet and
`src/sanity/schemaTypes/index.ts` is an empty array. This is deliberate, not unfinished.**

Every module in `src/data/` is a documented `SANITY SWAP POINT`. Each export is already
shaped the way the future GROQ projection will return it — flat, pre-coalesced, free of
presentation — and every getter is already `async`. When the CMS phase lands, each function
body becomes a `sanityClient.fetch(...)` and no call site moves.

Two rules that hold the shape, and that new work must also hold:

1. **No component owns content.** Components take props; the page fetches and passes down.
   A private array inside a component drifts out of sync with the data module and nobody
   finds out until migration. `src/pages/index.astro` is the reference: 26 getters in one
   `Promise.all`, then 14 section components.
2. **No hex codes, style strings, or SVG markup in the data layer.** Those get re-derived in
   CSS. No editor will ever type a hex code into a CMS, so it must not be in the shape.

Flow is always: `src/pages/*.astro` → `await` getters from `src/data/*.ts` → props into
components.

## Conventions

**Single sources of truth. Nothing bypasses these.**

| Concern | Goes through | Why |
|---|---|---|
| Images | `components/media/Picture.astro` — never `<Image>` or a bare `<img>` | These become Sanity assets; the swap is one file instead of every component |
| Internal URLs | `ROUTES` / helpers in `src/lib/routePaths.ts` — never a hardcoded href | The sitemap, nav, and future editor-managed redirects all derive from it |
| Video URLs | `src/lib/video.ts` — records carry `{ provider, id }`, never a link | YouTube → Wistia must be a data change, not a grep through components |
| JSON-LD | `src/lib/schema.ts` | |
| `<head>` metadata | `src/lib/seo.ts`, threaded through `layouts/Layout.astro` | Already accepts a `seo` prop so the editable-SEO layer attaches with no page edits |
| Colour, spacing, type | design tokens in `src/styles/global.css` — never a raw hex | `check:tokens` enforces it |

**Scoped styles.** A `class` you pass to a child lands on *that child's* markup and carries
the child's `data-astro-cid`, not yours. So bound `:global()` by an element in your **own**
template, never by a class you handed to a child. If the child has no such wrapper, the
styling belongs to the child as a prop. `check:styles` catches the target case but not the
ancestor case — worked example in README.md.

**Fonts** are self-hosted through Astro's Fonts API in `astro.config.mjs`, not the comps'
render-blocking `fonts.googleapis.com` request. Five families, exposed as tokens: Anton
(`--font-display`), Hanken Grotesk (`--font-body`), Geist (`--font-ui`), Newsreader
(`--font-serif`), Caveat (`--font-script`).

**Rails** — the testimonials band, the homepage attorneys rail, and the two awards carousels
— are all driven by the one self-executing `src/scripts/rail.ts`, wired by name through
`data-rail` / `data-rail-prev` / `data-rail-dots`. Card rails use arrows at every width;
awards carousels use dots below 760px. Nothing renders both.

## Comments

This codebase comments **why, not what**, and the comments are load-bearing — several record
decisions that look like bugs otherwise ("`flex-start` is load-bearing here", "not sticky,
by request"). Two obligations:

- When you change behaviour a comment describes, **update the comment in the same edit.** A
  comment that contradicts the code is worse than no comment.
- When you remove something the comps contain, say so *and* say it was deliberate — or the
  next session rebuilds it from the comp as a missing feature.

`TODO(launch)` marks anything to resolve before going live, usually content the firm must
confirm rather than code. Grep for it; README.md's table is the long form.

## Design source of truth

`~/Downloads/Dormer Harpring/Dormer Harpring Claude Files/`

**Canonical: only the 16 `DH - *.html` files at the folder root.** Self-contained, and every
asset reference resolves. `DH - Index.html` links them all.

**Everything else there is stale** — `v4`–`v7`, `new_v1`–`new_v3`, root `*.jsx`,
`production-build/` (its build script targets a file that isn't in the folder), both `_ds/`
design systems (they declare a *different* font stack), `homepage-v8.css`, `v9.css`, `old/`,
`scraps/`.

**The designer's own `CLAUDE.md` in that folder is partly wrong** — it claims a single Geist
font where the approved pages use five. Its layout notes do hold (`.wrap{max-width:1660px}`,
no horizontal padding). Verify against the markup before trusting any line of it.

`{{ }}` placeholders in the comps mark what the designer treated as repeatable data: those
loops become Sanity document types, the static text becomes page-singleton fields.

**The values behind those placeholders are IN THE FILE — read them before you build.** Every
comp ends with a `<script type="text/x-dc" data-dc-script>` block holding a `renderVals()`
that returns the real arrays: the card copy, the list items, the group titles, the stats,
in the designer's intended order. `<sc-for list="{{ featured }}" hint-placeholder-count="9">`
is not "nine unspecified cards" — it is nine specific cards defined 300 lines further down.

So: **open the tail of the comp, not just its markup.** A page built from the markup alone
gets the layout right and every string, every label and every ordering wrong, and it looks
finished. That has cost this project a full rebuild of one page already. If a comp seems to
have no content, `grep -n 'data-dc-script'` it before sourcing that content anywhere else.

`scripts/diff-comp-practice-areas.py` is the check that catches it — it diffs the built page
against that block's arrays and fails on any text or ordering difference. Worth copying for
the next content-heavy page; neither linter can see this class of error, because the build is
green whenever the *layout* is right.

Two corollaries worth knowing:

- **The comp is the source for content; the live-site scrape is the source for URLs.** The
  comps' links are all `href="#"` — they specify labels and order, never destinations. The
  scrape at `~/Downloads/Dormer Harpring/sitesucker/www.denvertrial.com` is the only place
  the real URLs exist. Its WordPress body class separates the two kinds of page cleanly:
  `page page-id-*` is a service page, `single single-post` is a blog post.
- **Two comps can carry different copy for the same thing.** The homepage and Practice Areas
  ship different blurbs for the same nine practice areas — a short label on one, a
  two-sentence pitch on the other. Don't collapse them into one shared field on the
  assumption they are one string; check both.

## Where things live

```
src/data/       SANITY SWAP POINTs — all content, all getters async
src/pages/      routes; fetch data and pass props down
src/components/ grouped by page (home/, team/, contact/…), shared ones at the root
src/layouts/    Layout.astro — the shell: head, fonts, global CSS, site JSON-LD
src/lib/        routePaths · schema · seo · video
src/styles/     global.css — tokens, .btn, .container, .section, .prose, .rail-dots
src/scripts/    rail · loadMore · phoneMask (self-executing, imported by components)
src/assets/     optimized images, by subject
scripts/        three of the four check:* linters · prep-assets.mjs (comp extraction)
                (check:types is `astro check`, not a script here)
                diff-comp-practice-areas.py (built page vs comp content, run by hand)
```

## Hard noes

- **Never add `AggregateRating` structured data.** The "5.0 on Google" card is presentational
  copy only. The site being replaced marks the firm up as a `Product` carrying review stars —
  a Google policy violation, and one of the things this rebuild exists to fix.
- Don't ship an href to a page that doesn't exist. `RESERVED_PATHS` in `routePaths.ts` tracks
  what's promised but unbuilt.
- Don't port the comps' fake form success panels. They told every visitor their case had been
  received while discarding it. `/api/consult` does not exist yet.
- `site:` in `astro.config.mjs` is `https://www.denvertrial.com` and is **unconfirmed** — www
  vs apex is an open `TODO(launch)`, and every canonical tag, `og:url`, and sitemap entry
  derives from it.

## Working agreements

- Branch off `master`; work merges by PR. Commit subjects are sentence-case and name the
  visible change ("Attorney bio: email in the contact line, awards carousel, smaller pull
  quote"), with a body explaining the reasoning and flagging anything left deliberately
  unfinished or reversed.
- Verify before reporting. `npm run build && npm run check` at minimum; for anything visual,
  measure it in the browser rather than asserting it looks right.
- Mark placeholder or unverified content `TODO(launch)` in the data layer the moment you add
  it, not later.
- Finishing a stretch of work? Update `HANDOFF.md` — not this file.
