# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-10._

## State

Build is green: **39 pages**, `npm run check` passing, all four comp-diff scripts exiting 0.
The Blog post template is built and awaiting review; run `git status` for where you are.
This file deliberately does **not** name the working branch — that line went stale three
times in the session that wrote it.

Live at `https://dormer-harpring.vercel.app` — `/` and `/admin` both 200.

Phases 0 → 3k are done: design tokens and shell, header/drawer/footer, the homepage section
by section, then Thank You, Contact, Testimonials, Case Results, Co-Counsel, Community
Involvement, the Attorneys index, the Attorney bio, Practice Areas, About, the Blog index and
the Blog post.

**Built:** `index`, `about`, `contact`, `thank-you`, `testimonials`, `results`, `co-counsel`,
`community-involvement`, `practice-areas`, `news` (the blog index), `[slug]` (blog posts),
`meet-our-attorneys/` + `meet-our-attorneys/[slug]`, and `tokens.astro` (an internal
design-token reference, not public-facing).

`meet-our-attorneys/[slug]` serves 25 profiles from two layouts, picked on `member.kind`:
`AttorneyBio.astro` for the 7 attorneys, `StaffBio.astro` for the 18 staff. The 3 dogs on
the roster have no profile, so no page.

`scripts/diff-comp-blog-post.py` is the fourth comp-diff script. Each **asserts its page's
deliberate differences** as well as diffing the text, so a later session that reverts one is
told rather than left to guess — this one's are eighteen, the most of any page, because the
comp writes its own body for an article that already exists. Worth copying again for Car
Accidents. None are wired into `npm run check`, which has to stay runnable without the
design folder; run them by hand.

### Read this before building the Car Accidents template

**`src/pages/[slug].astro` is at the site root and it is the blog's.** `blogPath()` is
`/${slug}` because the legacy WordPress site is flat and ~300 live URLs depend on staying
there — and `practiceAreaPath()` is `/${slug}` too. Astro allows exactly one `[slug].astro`
per directory, so **Car Accidents cannot add a second one.** It has to union its paths into
that file's `getStaticPaths` and branch on which collection the record came from, the way
`meet-our-attorneys/[slug].astro` branches on `member.kind`. Moving practice areas under
`/practice/` instead would change the URL, which is the one thing the flat shape exists to
prevent. The note is in the file's header comment too.

### What the Blog post work established

**One post is built, and that is the scope decision, not an unfinished job.** The template
serves the trampoline-waiver article — the comp's own subject, the index's featured post, and
a live legacy article whose real body is in the scrape. The other four real posts wait for
the CMS phase, which imports all 167 from that same scrape by script; four hand-transcribed
bodies would be replaced a phase later and cannot be diffed against the source the way a
script can. Their index links are unchanged: legacy URLs, live today, unserved after cutover.

Three things that constrain what comes next:

- **The four in-body CTA blocks are deferred, not dropped.** The comp draws a dark callout, a
  phone band, an attorney card and a pull quote inside the article. All four become Portable
  Text **object types** an editor places anywhere in any post — `callout`, `phoneBand`,
  `attorneyCard`, `pullQuote` — rather than fixed sections of the template. The intended home
  is commented in `components/prose/components.ts`, beside the `type` map. Do not rebuild
  them as page sections from the comp.
- **`.prose__h2` and `.prose__h3` were corrected, not restyled.** They were `--display-3` and
  `--display-5`, both uppercase Anton — a guess made before any body copy existed, and
  nothing had ever rendered them (no `## ` or `### ` appeared in any data module). They are
  now the Blog Post comp's `bp-h2` and `bp-h3`: mixed case, and h3 in Hanken 700 rather than
  Anton, so it subordinates by face as well as size.
- **The article body is the live post verbatim**, including its Title Case bullet labels,
  with two departures README.md records: a sentence the live copy leaves truncated, and its
  closing phone number.

### Shared pieces to reach for

New pages should use these rather than re-solving them. All are in use on two or more pages
already, so a change to one is a change to all of them — check before editing.

- **Portable Text now carries images.** `ptImage(src, alt)` in `data/portableText.ts`
  composes with `pt()` by spreading; `ProseImage.astro` renders it through `Picture` at the
  full width of the prose measure. Registered under `type` — **singular**, which is
  astro-portabletext's key. `@portabletext/react` calls the same map `types`, and the plural
  renders nothing at all without erroring.
- **`lib/headings.ts`** — `headingId()` and `extractHeadings()`. `ProseH2`/`ProseH3` emit an
  id from the first, any contents list reads the second, so an anchor and its target cannot
  drift. Site-wide: every prose heading is a jump target now.
- **`lib/readTime.ts`** — "7 min read", counted from a body rather than typed beside it.
  `InsightPost` in `news.ts` keeps its hand-written one; those four records have no body.
- **`ContactForm`'s `variant` prop** — `panel` (default) is the white card; `sidebar` is the
  blog post's dark one. Same fields, same endpoint, same honeypot and phone mask either way.
  Its disclaimer id is now per-variant, because that page renders the component twice.
- **`blogFilterUrl(slug)`** in `routePaths.ts` — `/news?category=<slug>`. `blogFeed.ts`
  presses the matching tab on load, so a category can be linked across a page boundary
  without building the legacy `/category/*` archives. Unknown slugs fall through to the whole
  feed.
- **`lib/dates.ts`'s `formatPostDate`** — ISO in, "June 23, 2026" out, pinned to UTC so the
  build machine's timezone cannot shift a published date by a day.
- **`ReviewRating.astro`** — the white "300+ Client Reviews · 5.0 on Google" card.
- **`AttorneyCard`'s `layout` prop** — `"rail"` fixes the card at 272px for the homepage,
  `"grid"` lets the track set it for About.
- **`AwardsBar`'s `tone` prop** — `lifted` (default) is the comps' near-white; `sunk` is for
  pages where the band follows a plain cream section and would otherwise be invisible.
- **`.hero-cta` / `.hero-cta__note`** in `global.css` — the one-button-plus-gold-note row
  under four photo heroes.
- **`.btn` is full width below 640px**, as the rule rather than the exception.
- **`.arrow` on every arrow inside something that navigates.** Three documented exclusions,
  each commented where it lives: `.pa__tab`'s chevron marks selection, `.attys__cta`'s badge
  scales instead of sliding, and the carousel prev/next are controls rather than CTAs.
- **`MobileNav`'s `subItemsOf`** — a parent with children renders as a `<summary>`, which
  toggles rather than navigates. This adds a link to its own page when no child points there.

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

| Page | Sections | Notes |
|---|---|---|
| **Car Accidents** | 29 | **Next up.** The practice-area **detail** template and by far the largest comp — 29 sections, 88 placeholders. Read the root-`[slug].astro` note above before starting. |

No comp exists for **privacy / disclaimer** or **404**. Both need a design decision or a
plain-text treatment; `/new-seo-setup` later expects a `legalPage` type for the former.

After the templates:

1. **CMS phase** — write the Sanity schema types, then convert each `src/data/*.ts` getter
   body to a `sanityClient.fetch()`. The shapes are already right, so this is mechanical.
   It also owns the **blog import**: 167 posts and 23 categories out of the scrape, plus the
   four Portable Text object types the post template deferred.
2. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton with a crawl switch,
   JSON-LD, `sitemap.xml`, `robots.txt`, editor-managed redirects. **`BlogPosting` JSON-LD
   belongs to this phase**, not to the post template — `Layout.astro` has no extra-schema
   prop yet, and designing one early would be this layer's decision made blind. Posts already
   carry a machine-readable `publishedAt` for it.
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
  the practice-area detail pages are built or redirected first. The Car Accidents template is
  the first of those pages.
- **Four more of the same**, down from five: the Blog index's other real posts, plus the two
  legacy articles the built post's body links out to. Same mechanism as the 87, and the same
  fix — the blog import, not more templates.
- Eight of the Blog index's twelve cards **have no post behind them at all** and render
  without a link. README.md's table has the full account. Either real articles replace them
  or they come out; a blog index two-thirds of whose cards go nowhere cannot ship.
- Three entries the Practice Areas comp lists have **no page anywhere** — Legal Malpractice,
  Life Insurance Bad Faith, Pet Insurance Bad Faith. The legacy hub's own links to them are
  broken (written relative, so they resolve under `/practice-areas/`). They render as plain
  text via `href: null` rather than as dead links. Marked `TODO(launch)`.

**Waiting on the firm** — these are content, not code. `README.md` has the full table; the
short version is that 18 `TODO(launch)` markers are open in `src/`, covering the seven
attorney emails (six inferred from a pattern), the office address and hours, the `$70M+ /
20 Years` stat claims — which the blog post's fact-check band now repeats — K.C.'s facts
band, the two departures from the live article's copy, and **who is in the About page's
founders photograph**. The man on the left is unmistakably K.C.; the man on the right wears
glasses and is clean-shaven where Sean's headshot has neither, so the alt text names him by
inference. The comp's own alt text there was "Michael Dormer and Zachary Harpring" — two
people who do not exist — so it is not a source for this.

**Waiting on the designer**

- **No comp specifies a mobile layout for anything** — every comp is a desktop frame, and the
  drawer, the mobile heroes and the stacked CTA rows are all ours. The most visible of those
  is the homepage hero: on a phone the photograph is now a band across the TOP with the copy
  over its lower half. Rhan asked for that and signed it off, but the designer has not seen
  it and the homepage is nominally an approved page.
- **The Blog index's layout departs from its comp in three visible ways**, all at Rhan's
  request: the category row sits under the featured panel rather than above it, the featured
  post stays visible through every filter, and the tab row is a scrolling rail rather than a
  fixed six-column grid. The last is forced by content — the comp draws six categories and
  the live blog has twenty-three.
- **The Blog post departs from its comp in eighteen ways**, all listed and asserted in
  `scripts/diff-comp-blog-post.py`. Four are Rhan's requests (contents list, sidebar order,
  no author card, full-width image); the rest follow from serving the live article at its own
  URL. Same standing as the two above: signed off by Rhan, not seen by the designer.
- The comp's blog-post sidebar lists **six categories** where the index's tab row lists five,
  with two swapped and "Colorado Law" added. One `getBlogCategories()` now serves both, using
  the index's signed-off five, so they cannot drift. If the sixth is wanted it is one entry.
- `DH - Homepage approved.html` and `DH - Homepage approved v2.html` are the same byte size
  with different checksums. Nobody has said which is final.
- Whether the copy in the comps is final or placeholder.
- **The homepage's practice-area icons no longer match the homepage comp**, deliberately.
  `PracticeIcon` carries the `pa-icons-line` set so brain injury looks the same on every
  page. Confirm that's the intended drawing before launch; reverting is one file.
- The Practice Areas directory has **eight groups and omits Greeley, Fort Collins and Grand
  Junction**, which have eight live landing pages between them and appear on the legacy hub.
  The page matches the comp, so those eight are unreachable from it. Add three groups, or
  leave them to the nav?
- That section's heading is "Every case we handle, by **location**", but the comp's last two
  groups — "Premises Liability" and "Other Legal Services" — are topical. Built as the comp
  has it. Either the heading or those two groups wants changing.
- The About comp and the homepage comp carry the **same six core values with two of them
  written differently**. It is one singleton serving both pages, so it keeps the homepage's
  wording (that comp is the approved one). Same shape of thing in the reviews panel: About
  trims two of the three review headlines by a clause. Both are asserted in
  `diff-comp-about.py`.

**Blockers for launch, not for building**

- `/api/consult` does not exist. **Three** forms now post to it and 404 on submit — the
  contact band, the co-counsel referral, and the blog post's sidebar. The sidebar reuses
  `ContactForm`, so all three send one payload shape.
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
