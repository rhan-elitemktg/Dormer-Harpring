# Handoff — current state

Where the project is right now. **Volatile by design** — rewrite it, don't append to it.

Architecture, conventions and the design source of truth live in `AGENTS.md` (symlinked as
`CLAUDE.md`, loaded automatically). Pre-launch decisions live in `README.md`. Don't restate
either here, and don't record anything `git log` already knows.

_Last updated: 2026-08-28._

## THE CUTOVER URL AUDIT IS DONE: 18 WOULD-BE 404s, NOW ZERO

**369 live URLs checked against what this build serves. 323 served directly, 46 redirected,
0 that would 404, 0 redirects pointing at an unbuilt page.** The audit that two earlier
sessions did by hand is now a repeatable method, and the method is the part worth keeping.

### THREE SOURCES, AND THE THIRD IS THE ONE THAT MATTERS

- **Yoast's `sitemap_index.xml`** → `post-sitemap.xml` (168) + `page-sitemap.xml` (186).
- **The WordPress REST API** → 362 paths. **It lists nine pages the sitemap does not**, because
  Yoast omits noindexed ones. `/reviews/`, `/demo/` and `/landing-page/` are all in this gap.
- **The sitesucker scrape** → 317, after dropping `/wp-content`, `/wp-includes`, `/wp-json` and
  `/category/` (which is 404 on the live site — a scrape artifact, not a URL).

**NONE OF THE THREE LISTS A REDIRECT SOURCE, AND THAT IS A HOLE THE SIZE OF THE PROBLEM.** A
sitemap and a REST index both enumerate canonical DESTINATIONS. A URL that 301s appears in
neither — so an audit built on those two looks complete while being blind to exactly the class
of URL that most needs a rule. Six were found only by **deriving candidates and probing**: for
every path the other sources DO list, take its root-slug form and each of its parent forms, drop
anything already served or redirected, and request the rest. That returned
`/personal-injury-attorney/`, `/car-accident/`, `/traffic-collision-lawyer/`,
`/client-review-testimonial/` and both former attorneys' root slugs — every one a live 301.

It is the same method that found the 23 attorney bios, run as a sweep instead of by hand.
**Re-run it before launch**: the live site is still being published to, which is how the 2026
Big Little Gala write-up was missed by the sweep that found the other 24.

### WHAT THE 18 WERE, AND HOW EACH WAS CLOSED

**Replicated — WordPress already answers these, and the chain was followed to its END** rather
than copied a hop at a time, so `/car-accident/` goes straight to `/denver-car-accident-lawyer/`
instead of through two 301s: `/announcements/`, `/new-homepage/`, `/client-review-testimonial/`,
`/personal-injury-attorney/`, `/practice-areas/personal-injury-attorney/`, `/car-accident/`,
`/practice-areas/traffic-collision-lawyer/car-accident/`. Plus the 2026 gala, into
`COMMUNITY_WRITE_UPS` beside the 2025 one.

**Ruled on — the live site serves a 200 and this build chooses not to.** Each carries its reason
in `redirects.ts`:

| URL(s) | Ruling |
|---|---|
| Petroff and Gutierrez, both forms each | → `/meet-our-attorneys/`. The "no redirect, by request" call on record was about Nelson and Jewel, whose pages WordPress has since REMOVED — it never covered these two, whose pages are live and indexed. |
| `/reviews/` | → `/testimonials/`, **not rebuilt**. The live page carries `AggregateRating` and `ratingValue` — the exact Product-with-stars violation this rebuild exists to fix. Rebuilding it is the one path that risks recreating it. |
| `/traffic-collision-lawyer/` + `/practice-areas/` form | → `/denver-car-accident-lawyer/`. Its CHILD already 301s there on WordPress, so the parent matching it makes the branch coherent instead of half-redirected. |
| `/demo/`, `/landing-page/` | → home. Theme scaffolding titled "Millions+ Recovered", in no sitemap, never linked. |

**Built — `/editorial-guidelines/`**, the only one of the 18 that became a page. See below.

`redirects.ts` is **196 rules** now, up from 162.

### `/editorial-guidelines/` IS BUILT, AND IT COST ONE LINE IN `KINDS`

Live, indexed, and **`ROUTES.editorialGuidelines` plus `RESERVED_PATHS` had reserved its path
from the beginning** — something always intended it to exist and nothing built it. It was the
last would-be 404 on the list.

**It is a FOURTH `sitePage` document, not a fourth page type.** Adding it cost one entry in
`KINDS`, one in `UTILITY_PAGES`, one query, one getter and one route — no schema file, no
projection shape, no desk group. That is the argument for that type's one-type-many-singletons
shape, made after the fact rather than in the abstract.

`updated{}` used to be `hidden: isNot("privacy")` and is now `isNotOneOf("privacy",
"editorial")`: the two WRITTEN documents stamp a date, the two GENERATED ones do not. Its label
is **"Last reviewed"**, not the policy's "Last updated" — a set of standards is re-affirmed
rather than edited.

**Converted through `scripts/lib/wp-portable-text.mjs`, the same path both imports used**: 106
blocks, zero converter warnings, zero duplicate `_key`s, and **66 bullets that stayed list items
instead of flattening to paragraphs**. No links and no phone number in the source, so unlike the
privacy policy there are **no departures** — nothing needed correcting.

**NOT IN THE FOOTER, and that is deliberate: the live site does not link it either.** `/sitemap/`
is the only page that links it, which makes that list load-bearing rather than a courtesy —
drop the entry and the page is an orphan only a crawler with the old URL can reach. The comment
in `sitemap.astro` that called it "reserved, never built" is corrected, and `consult` takes its
place in the excluded-by-name pair.

## `/api/consult` IS BUILT, AND THE SITE IS STILL STATIC

**The first launch blocker is closed in code.** `src/pages/api/consult.ts` serves both forms —
326 call sites across 327 of the 329 pages — and what is left is configuration, not work.

**`@astrojs/vercel` is installed and `output` is UNTOUCHED.** The endpoint sets
`export const prerender = false`; every other page still prerenders. That was the reason for
choosing an Astro route over a root `api/consult.ts` Vercel function: a root function lands
outside `src/`, where **`astro check` would never see it** — a hole in the type gate at exactly
the one place the site runs server code. `check:types` now reads 264 files, up from 263.

**PROVEN OUTPUT-NEUTRAL, and the number that matters is not the one `compare-builds.py`
prints.** Adding the adapter moves every page from `dist/<path>` to `dist/client/<path>`, so a
naive compare reports 329 removed and 330 added. Re-rooted and re-hashed, the truth is:

  2 byte-identical · 327 identical once one string is undone · 0 changed · 0 added · 0 missing

That one string is the form `action` gaining a trailing slash. Which is the second finding:

### THE FORM ACTION NEEDED THE TRAILING SLASH, AND IT IS NOT COSMETIC

`vercel.json` sets `trailingSlash: true`, so a POST to a bare `/api/consult` earns a **308 that
re-sends the entire body**. The action is `ROUTES.consult` — `/api/consult/` — so the form posts
straight to the function. It is in `ROUTES` rather than a literal because the convention says no
internal URL is ever a literal in a component; it is deliberately NOT in `RESERVED_PATHS`, which
guards the ROOT slug namespace, and this path is nested.

### THE ADAPTER MOVED `dist/`, AND FOUR SCRIPTS READ IT

`check-links.py`, `compare-builds.py`, `check-scoped-styles.py` and the `check:styles` npm script
all pointed at `dist/`. Left alone, `check:links` derives every served path with a `/client`
prefix and `check:styles` loses its `dist/admin/*` exclusion — so it would start scanning the
Studio's 56KB minified bundle. All four now point at `dist/client`. **The full gate is green with
identical numbers**: 33,619 links, 328 pages, 329 served paths, 162 redirects.

### THE TWO FORMS' HONEYPOTS HAVE DIFFERENT NAMES

`company` on the consultation form, `website` on the co-counsel one. **Nothing in either file
says so**, and checking only one would accept every bot on the other. The endpoint checks both
for both kinds — a real submission fills neither, so there is no reason to be precise. A trapped
bot gets the **same 303 a person gets**: telling it apart is how a spammer learns.

### `curl -X POST` GETS A 403, AND IT IS NOT A BUG IN THE ROUTE

Astro's `security.checkOrigin` defaults ON and rejects a POST whose `Origin` does not match,
**before the module is reached** — so a bare curl gets `403 Cross-site POST form submissions are
forbidden` and none of the handler runs. Browsers always send `Origin` on a form submit, so real
traffic is unaffected and this is free CSRF cover. Test with
`-H "Origin: http://localhost:4321"`. This is recorded in the route's own header comment too,
because it will otherwise read as a broken endpoint.

**Every branch was exercised against a running dev server**, not reasoned about: 405 on GET, 303
on each honeypot, 400 on a missing field / a bad phone format / an unknown `kind`, 303 to
`/thank-you/` on an open-redirect attempt (`redirectTo` is validated against `ROUTES`, not
trusted), and a 500 whose log names exactly which variables are unset.

### WHAT IS LEFT ON IT

- **Provision Resend** — `vercel link`, then `vercel integration add resend/resend-email`. The
  repo is not linked to a Vercel project yet, and this needs the account holder. Resend is the
  only `messaging` product in the Marketplace, so it is the pick by default rather than by
  preference.
- **Four variables**: `RESEND_API_KEY`, `CONSULT_TO_EMAIL`, `CONSULT_FROM_EMAIL`, and optionally
  `COCOUNSEL_TO_EMAIL` (falls back to `CONSULT_TO_EMAIL`). The From domain must be verified in
  Resend or the send is refused. **The firm has to name the inboxes** — they are environment
  variables and not content precisely so that naming them is not a deploy.
- **A designed error page.** The failure is a plain-text 500 naming the firm's phone number.
  Deliberately blunt — visibly broken beats invisibly broken, the same argument that kept the
  comps' fake success panel out — but it wants the light template's shell like the other three
  utility pages. `TODO(launch)` in the route.

## The Sanity integration — Phases 0 through 6 are in

**775 documents in Sanity, and `src/data/` no longer holds page copy.** Every route's strings
are a field on a page document; the data layer is 5,724 lines down to 4,724, and
`carAccidents.ts` alone went from 1,227 to 598. Only `portableText.ts` (an authoring shim) and
`redirects.ts` (the redirect table, which becomes editor-managed in `/new-seo-setup`) do not
read Sanity.

**Phase 4 was six slices and every one was output-neutral.** Cumulatively: **327 of 329 pages
byte-identical, 2 image-URLs-only, 0 changed.** The two are the homepage and Car Accidents,
which are the only pages where an image moved — the FAQ ask card's portrait in 4a and five card
images in 4f. Per slice:

| | What moved | Diff |
|---|---|---|
| 4a | The homepage's nine copy getters, plus Why Us → `sharedSections` | 327 identical, 2 images |
| 4b | Eight route singletons: about, team, contact, thank-you, testimonials, results, co-counsel, blog index | 329 identical |
| 4c | The two article templates, and one sidebar form for both | 329 identical |
| 4d | Privacy, sitemap and 404 — three documents of one `sitePage` type | 329 identical |
| 4e | `practiceAreasPage` and `communityPage` copy | 329 identical |
| 4f | The heavy Car Accidents page: fifteen sections, 270 strings, 89 array members | 328 identical, 1 image |

**Read the per-slice commits, not the cumulative number.** Each slice was seeded, verified
against the code, swept for dead literals, swapped, built and diffed on its own.

### What is built

- `sanity.cli.ts` + `npm run typegen`. `npm run backup` exports the dataset (documents only)
  to wherever you point it — take one before anything destructive. Phase 4's is at
  `scratch/backups/pre-phase4.tar.gz`.
- `src/sanity/lib/` — `image.ts` (CDN URLs), `queries.ts` (56 `defineQuery` projections),
  `fetch.ts` (`required()` and `once()`).
- `Picture.astro` has THREE branches: a local import, a Sanity asset, and a plain URL on a
  host we do not control. The third takes a `remoteSize` because dimensions cannot be read
  off a URL, and omitting them shifts the layout as the image lands.
- Field types: `richText`, `answerText`, `simpleText`, `inlineText`, `link`, `navLink`,
  `seo`. (`videoRef` was an eighth and is deleted — see below.)
- **Ten** collection types, **twelve page types** (fourteen documents — `sitePage` is three) and
  **three** Site Settings singletons, in a desk of five groups plus one loose document: Pages /
  Practice Areas / Blog / Collections / Shared Sections / Site Settings. Every page type with more than one band holds its fields in
  collapsible SECTIONS — see below.
- `scripts/lib/sanity.py` — one GROQ reader for every Python check. `lib/firm.py` is one
  query on top of it.

### A CATCH-ALL CANNOT SEE A TYPE PLACED TWICE

The desk renders anything not in a group under a divider at the foot, so a new document type is
never invisible. It measured against `[...PAGES, ...COLLECTIONS, ...SETTINGS]`. Splitting
Practice Areas and Blog out of Collections moved four types off that list while leaving them on
screen — `practiceArea`, `blogPost`, `blogCategory`, `carAccidentsPage` — so the Studio drew
**each of them twice**, once in its group and once under the divider.

**`sitePage` had been doing it since the utility pages were built** and nobody noticed until
four more joined it. Found by eye, in the Studio, not by any check.

**THE GUARD COULD NOT HAVE CAUGHT THIS.** It exists so a type placed NOWHERE stays reachable,
and to it a type placed TWICE is identical — both are simply "not in the set". So the fix is
that the list cannot be forgotten rather than a second check that could be: `PLACED` derives
from the group definitions and from `SINGLETON_TYPES`.

**ANYTHING MOVED OUT OF `PAGES` OR `SETTINGS` NEEDS ADDING BACK BY HAND.** `SINGLETON_TYPES` is
built from those two arrays, so a singleton placed anywhere else drops out of it silently —
which shows the editor a generic list beside the pinned document, with edits to the second copy
going nowhere. Two are hand-placed today: `sharedSections`, a top-level row of its own below
Collections, and `sitePage`, which is the three utility documents. `carAccidentsPage` was a
third until 6d made it a collection member — see the note at the top of this file.

### THERE WERE TWO SETS OF FIRM FIGURES AND THEY NEARLY AGREED

`firmStats` drew the dark band on seven pages; `homePage.hero.stats` drew the homepage hero.
Three of four matched on the number and differed only in label — "Recovered for clients"
against "Recovered" — and the fourth was a different claim: "Small · Caseload by design"
against "We Come · To you".

**Two records meant "$70M+" had two homes, and it is one of README's unverified claims** — so
confirming it before launch meant editing both, or editing one and shipping a contradiction.

One record now, on `sharedSections`, **in the hero's shorter wording by request**. So the
homepage did not move and the SEVEN BAND PAGES DID, which is the opposite of what the direction
of the move suggests — worth knowing when reading that byte-diff. `getHomeStats()` and
`HomeStat` are gone; both surfaces read `getFirmStats()`.

**IT WENT TO SHARED SECTIONS RATHER THAN SITE SETTINGS, and the line is worth keeping.**
`firmDetails` is data the site DERIVES from — the phone becomes a `tel:` href and JSON-LD, the
address becomes the footer and the map pin. `firmStats` is a band the site DISPLAYS. Settings
holds the first kind. That leaves Site Settings three documents.

**The About comp diff went red on it and the departure is declared — but not by pinning the new
labels.** Those are editable, so pinning them means the check goes red every time an editor does
their job. It asserts the INVARIANT the change created instead: the About band and the homepage
hero render the same four figures. True whatever anyone types; fails the moment someone
re-splits them.

### 24 LIVE COMMUNITY WRITE-UPS HAD NO HOME, AND WOULD HAVE 404'd

The live `/community-involvement/` page links about eighteen articles — `/craig-hospital/`,
`/we-dont-waste/`, `/project-angel-heart/` and the rest. **All 24 return 200 today, none was
served or redirected here**, and nothing in the build could say so: `check:links` only sees
links the built site EMITS, and our community page never linked them.

**They are WordPress PAGES, not posts** — the third bucket of that shape this project has hit,
after the fourteen article-pages that went into the blog and the five slip-and-fall ones. The
importer's manifest excluded every one as a "community involvement write-up", which was right
for THAT import and left them nowhere.

**REDIRECTED TO `/community-involvement/`, NOT IMPORTED, and the lengths are why.** They run 32
to 560 words — photo-led notes about a volunteering day. Craig Hospital's is a caption.
Twenty-four of those in `/news` would be a quarter of the feed. The content is not lost: the
page they land on carries the same eleven organisations as cards.

**THE CARDS ARE NOT LINKS ANY MORE, and that closed a `TODO(sanity)`.** Every card pointed at
`/news/` because the write-ups were never imported — eleven cards, one destination, none of it
the story the card described. Now that those slugs redirect HERE, a linked card would send a
reader from this page to this page. Same call the footer's service-area chips record, and the
`:hover` lift went with the anchor for the same reason: a hover on something unclickable reads
as a control that has broken.

### A REASON IN THE MANIFEST IS DOCUMENTATION, AND 28 WERE WRONG

`EXCLUDED_SLUGS` had "community involvement write-up" on 23 attorney and staff BIO pages, three
former staff and two scratch pages. Every exclusion was correct and every explanation was not —
on a map whose entire job is to say why a page was skipped. Relabelled.

**Nothing checks a reason against reality**, and that is still true. This was found by auditing
what the live community page links, not by the build.

### THE ROOT-SLUG ATTORNEY BIOS WERE A SECOND CUTOVER 404 — CLOSED

The live site serves every bio at the ROOT as well as under `/meet-our-attorneys/`, and this
site served only the nested form: **23 URLs carrying the firm's own attorneys' names, all
returning 200, none redirected.**

**Both forms are the SAME PAGE — verified, all 23, at 100% content similarity** rather than
assumed from the URL shape. That is what made a one-to-one redirect unambiguous instead of a
guess about which bio WordPress considers canonical.

`attorneyPath()` builds the destination rather than 23 hand-typed paths, which would be 23
chances to disagree with the trailing slash three layers already settle.

**Found by reading the live site, not by anything here** — the same way the community write-ups
were. Nothing in this build can see a URL the old site has and this one does not, and that gap
has now produced 47 would-be 404s across two sessions. **A cutover URL audit belongs on the
launch list**: every live path, against what this site serves plus `vercel.json`.

### A CITY HAS TWO KINDS OF PRACTICE-AREA PAGE

**`practiceArea` is the imported default and `featuredPracticeArea` is the hand-built one**, and
each of the nine cities opens into both:

```
Practice Areas → Denver → Default   (48)
                          Featured   (1)
```

Car Accidents was `carAccidentsPage`, a singleton, which put the firm's biggest page nowhere
near its siblings and made it a permanent special case. Nothing about the page changed —
**329 of 329 byte-identical** — it just stopped being a one-off.

**IT WAS SAFE TO DO WITH ONE MEMBER because the route was already plural.**
`getPracticeAreaDetails()` returned an array, `[slug].astro` mapped over it, and `DetailPage`
takes a plain `PracticeAreaDetail` — the heavy kit was already generic over its data. Only the
document was singular. A second designed page is now a document plus one line of routing.

**THE SLUG IS STILL IN CODE, and becoming a collection did not change that.** `FEATURED` in
`data/carAccidents.ts` maps each document's `key` to its URL and **throws by name on a key it
does not route**. That costs nothing: eighteen sections bound to specific components means a
featured page needs a developer regardless, so a line in that map is part of a change that was
already happening — where an editable slug is ~300 legacy redirects pointing at nothing.

**Eight of the nine cities show an empty Featured list**, deliberately: the structure states the
model rather than the current contents, so commissioning a second one is a document rather than
a desk change.

### AN UNREGISTERED TEMPLATE BREAKS THE WHOLE PANE, NOT ONE LIST

Each city now names an initial-value template PER TYPE — `${type}-by-city` — and only
`practiceArea`'s was registered in `sanity.config.ts`. The Studio then refused to read the
structure at all:

> template id (`templateId`) is required for initial value template item nodes

**Not a missing create button. Practice Areas would not open.** And `check:desk` was green
throughout, because placement was correct and the pane was still broken.

`check:desk` now asserts it, scoped to that one loop. **A first attempt that tried to infer
every template from every group produced 22 false failures** — a check that answers a question
it cannot actually see is worse than no check. Tested by unregistering the template and watching
it go red.

`featuredPracticeArea` is out of the global "create new" menu for the same reason `practiceArea`
and `teamMember` are: the global button sets no `city`, so a page created there matches none of
the nine filters and is invisible.

### `git grep` DOES NOT SEE UNTRACKED FILES, AND THE MARKER COUNT READ 32

**A FIFTH REASON THIS LINE HAS BEEN WRONG.** Moving the Car Accidents schema to a new file
dropped the count from 41 to 32 launch markers and 8 to 7 video — nine and one, exactly what the
moved file carries. Nothing was lost: the new file was UNTRACKED, and `git grep` skips untracked
files, so the markers were there and uncounted.

**Measure with `git grep --untracked` when a phase adds a file**, or after staging. The plain
form is right for a clean tree and silently low for a change in progress — which is exactly when
this count gets taken.

### THE DESK IS FIVE GROUPS, AND TWO PAGE TYPES ARE GONE

Pages / **Practice Areas** / **Blog** / Collections / Site Settings, by request.

**The two biggest collections left Collections.** Practice Areas is 104 documents across nine
cities and the blog is 186 posts plus 23 categories — between them the great majority of the
site's content, and both sat two clicks down a list beside five-record lookup tables. They are
top-level groups now. Collections is the six an editor reaches for occasionally: Team,
Testimonials, Case Results, Awards, Core Values, Cities.

**Blog Posts and Blog Categories are one group because they are one editorial job.** A post
belongs to exactly one category and the category list exists to serve the posts.

**CAR ACCIDENTS IS NOT A SINGLETON ANY MORE** — see the note at the top of this file. It is a
`featuredPracticeArea` document, filed under Denver beside the imported pages, and it came out
of `SINGLETON_TYPES` with the change.

**Anything moved OUT of `PAGES` or `SETTINGS` still needs adding back to `SINGLETON_TYPES`
explicitly.** That list is built from those two arrays, so a singleton placed anywhere else
drops out of it silently — which shows an editor the document twice, once pinned and once as a
generic list, with edits to the second going nowhere. `sharedSections` is the one that needs it
today.

**`groupItems()` exists because the alternative was reaching into a built list item.** Practice
Areas needs its nine city lists placed beside the Car Accidents singleton rather than nested a
level deeper, and the first attempt got them by calling `collection()` and pulling
`.serialize().child.items` back out — which depends on the shape Sanity's builder happens to
serialise to. Both callers share the helper now.

### THE TWO ARTICLE TEMPLATES ARE DELETED, REVERSING PHASE 4c

`blogPostTemplate` and `practiceAreaTemplate` held twelve strings between them and are gone —
schema types, documents and desk rows. Their chrome is a `TEMPLATE` constant in `blog.ts` and
`practiceAreaPages.ts`.

**Eleven of the twelve are interface labels** — "In this article", "Categories", "Read more",
"Posted", "Updated", "Written by" — that no editor was ever going to open a document to change,
against two permanent rows in the Pages list.

**THE TWELFTH IS MARKETING COPY AND WENT INTO CODE ANYWAY, KNOWINGLY.** The practice-area
eyebrow is "Tough lawyers for tough cases", on all 104 pages, and this file records that it has
already been four different things by request — the city, then "Practice Area", then the city
again, then this. Changing it is a code change and a deploy now. **If it is changed a fifth
time, it belongs on `sharedSections`** beside the awards bar's label, for exactly the reason
that one is there; the constant's own comment says so.

**The sidebar form both templates borrow is still editable.** It is on `sharedSections`, was
never part of either template document, and only the labels became constants. The fact-check
SENTENCE is still derived from the roster.

`scripts/migrate-templates-4c.ts` records the reversal in its header. It cannot run again — it
would import documents of a type that no longer exists — but the third thing it did, seeding
`sharedSections.sidebarForm`, still stands.

### `videoRef` IS UNWOUND, AND THE TYPE IS DELETED

The hero, the firm intro and both FAQ accordions went in 6a; the six filmed testimonials in 6b;
the Car Accidents page's two video panels in 6e. Every video field is a bare `videoId` string
and **every projection reassembles `{provider, id}` as a literal**, so `lib/video.ts` still
receives the pair and is still the only place one becomes a URL.

**THE LAST ONE OUTLASTED TWO SWEEPS BECAUSE IT IS CALLED `film`**, not `video`, and it sits
inside a `videoPanel` object rather than at a document's top level — so neither the field-name
sweep nor a read of that page's eighteen sections surfaced it, and this file carried a claim
that none was left. **`git grep videoRef` finds it in one line.** When a sweep's result is going
into a claim, run the sweep that cannot miss.

**The `videoRef` object type is deleted**, since nothing declared a field of it — a registered
type drawing nothing is the dead-literal shape this file warns about elsewhere. **Its reasoning
moved to `lib/video.ts` rather than going with it**: why the `youtube` branch is deliberately
kept unused, and that a per-record swap means a stored `provider` beside `videoId`, never a URL
in a field. A comment beside a thing does not survive the thing, and this project has lost that
argument three times.

**Only six of the eighteen testimonials carry a film**, because `video` is conditional on
`format == "video"`. The migration emits those six alone — writing the written twelve would be
twelve no-op rewrites, and any bug in the script would then reach every record rather than the
six it means to.

### THREE BANDS OWNED THEIR OWN COPY, AND THE READINESS SWEEP COULD NOT SEE THEM

Found by eye, in a page-by-page Studio review — not by any check. `RecentResults`
hardcoded "Outstanding results." and its link label in markup, `AwardsBar` declared
`eyebrow = "Recognized & awarded"` as a PROP DEFAULT that no caller overrode, and
`TestimonialRail` carried its eyebrow, heading and button the same way.

**This file claimed the opposite and was not wrong so much as narrow**: "No component owns
content. All 127 checked — not one declares a content array in its frontmatter." That sweep
looked for content ARRAYS in FRONTMATTER. A bare string in markup, and a default in a props
destructure, are neither — so three bands walked straight past the check whose whole job was
this rule. **A sweep is only as good as the shape it looks for**, and the shape here was
narrower than the rule it was testing.

Where each landed follows the existing rule rather than where they were noticed:

- **The results strip is on `homePage`.** It renders nowhere else.
- **The awards bar and the testimonial rail are on `sharedSections`**, now five bands rather
  than three. The bar renders on nearly every page of the site and the rail on thirty — the
  homepage, all 26 attorney bios and Car Accidents. Putting either on the Homepage would mean
  editing the homepage to change 330 pages. **About keeps its own heading** over the same
  testimonials, from its own document, which is exactly the case this split exists to serve.

### A FIELD MOVING FROM A BAND TO ITS ITEMS IS A CONTENT DECISION, NOT A TIDY-UP

Three did in 6a, and each was one string doing a job that wanted many:

| Was | Now | Why |
|---|---|---|
| `practiceSection.closing` | each card's `closing` | one reassurance was handed to all six panels |
| `faqSection.answerCtaLabel` | each question's `ctaLabel` | twenty open answers offered the same words |
| each FAQ's typed `videoLength` | derived from Wistia | nothing checked the typed value against the film |

**The first two are seeded from the value they replaced**, so the page is byte-identical until
someone edits one. **`getHomePracticeAreas()` now throws by name when a card has no closing
line** — it used to be impossible to be missing, and an empty one would render a panel that
just stops.

**CAR ACCIDENTS FOLLOWED THE FAQ CHANGES WITHOUT BEING ASKED**, because `faqItemFields` is one
array shared by both accordions. Its twelve questions had no button label of their own — they
read the homepage's — so the migration seeded them from there. Worth knowing before editing
that file: it is not homepage-only.

### THE DURATION COMES OFF THE SAME oEMBED CALL AS THE POSTER

`wistiaDuration()` in `lib/video.ts`, beside `wistiaPosterUrl()`. Both now read one memoised
`wistiaOembed(id)` rather than fetching separately — one request per distinct id for the whole
build, which today is ONE, because all twenty FAQs point at the same stand-in.

**That is the only content change 6a made**: the rows read "3 min" where the typed value said
"2 min", because the placeholder film is three minutes long. 327 of 329 pages byte-identical,
2 changed, both explained.

`diff-comp-car-accidents.py` went red on it, which is the check working. **The departure is
declared and matched STRUCTURALLY** — every row carries a duration, and the set is NOT the
comp's — never pinned to "3 min". Pinning it would assert the placeholder is correct and go
red on the change that fixes it, which is the same reasoning that file already applies to
`PLACEHOLDER_VIDEO`.

### A CSS ONE-LINER MOVED 315 PAGES AND CHANGED NOTHING

Adding `height: 100%` to `RailVideoCard` rehashed `TestimonialRail.*.css` — and **blog posts
link that chunk**, because `[slug].astro` imports the component for its Car Accidents branch,
so the bundle is shared across every page that route serves.

**Both trees were built, the bundle hash normalised alongside the image URLs, and the pages
re-classified: 329 of 329 identical.** That is the Phase 3b procedure and it is the only way
through this class of result — a mechanical difference across 315 pages will bury a real one
in the same bucket. **Do not read a large CHANGED count as a finding until the known
mechanical difference is normalised out.**

The fix itself is worth keeping: `.vcard` had `min-height` and no `height`, and **Wistia moves
the card into a div of its own**, so the flex item that stretches is that div and the card
inside stayed at 440px beside a taller quote. Fourth instance of the pattern this file already
warns about under "the one thing to read before touching a popover".

### HIDING A REQUIRED FIELD IS A TRAP

`iconKey` came off the practice card's form by request, with the icons still drawing. A hidden
`required()` field with no initial value would fail validation on a NEW card while showing an
error for a field that is not on screen — unresolvable in the Studio.

So it is a **closed list with an initial value** now rather than a free-text key. Same shape
as `videoRef`'s hidden `provider`, and the same reason: hide a field only once it cannot be
the thing blocking a save.

### A COMMENT WITH A BACKTICK CANNOT GO INSIDE A GROQ TEMPLATE LITERAL

It closes the string. `queries.ts` then failed to parse and `astro check` reported **192 errors
across the repo**, none of them where the problem was. Comments about a projection go ABOVE
`defineQuery(`, which is where every other one in that file already is.

### A SPENT MIGRATION MUST NOT BE WHAT TURNS THE TYPE GATE RED

`migrate-home-4a.ts` read `getPracticePromise()` and `faqSection.answerCtaLabel`, both of which
6a removed. Its swap happened long ago and it refuses to re-run, but `check:types` is wired
into `npm run check` for the whole repo — so a script that can no longer typecheck breaks a
gate everyone shares. The dangling references were deleted and its header records why.

**Every Phase 4 migration is in this position.** One that reads a getter a later phase removes
will do the same thing again.

### EVERY PAGE DOCUMENT IS AN ACCORDION OF SECTIONS

**Every page type with more than one band holds its fields in collapsible section objects**, one
per rendered band, collapsed by default. A form opens as a list of band NAMES rather than a
scroll of every field on the page. `SECTION` in `schemaTypes/pages/section.ts` is the one
constant they all spread — whether these default to open or closed is one decision and it
should be changeable in one place.

Done in three slices, each seeded, verified, swapped, built and diffed on its own, and **all
three were output-neutral: 329 of 329 pages byte-identical, three times.**

| | Pages | What moved |
|---|---|---|
| 5a | about, team, testimonials, co-counsel, contact, thank-you, blog index | loose header strings into a `header` object |
| 5b | community, practice areas, the three utility pages | each band's heading flattened into the band, its list joining as `items` |
| 5c | homepage, car accidents | five arrays merged into the band that renders them |

**THREE DOCUMENTS ARE DELIBERATELY STILL FLAT.** `resultsPage` is four fields drawing ONE band,
and the two templates are label sets that no band owns — an accordion holding a document's only
section is a click that buys nothing. It is the same reason Phase 4 gave those three no field
groups either.

**THE TABS CAME OFF PRACTICE AREAS AND CAR ACCIDENTS.** Phase 4 gave them Sanity field `groups`
— three and six. `/studio-polish` records the call from the first build that tabs on top of
accordions make an editor tab AND expand, so the two idioms do not go together. Car Accidents
is one collapsed list of eighteen rows now. **Collections and Settings keep their tabs** — seven
documents — and that is not an inconsistency to tidy: a team member is a person, not a page of
bands.

**A SANITY-TO-SANITY RESHAPE HAS NO CODE-SIDE SOURCE TO ASSERT AGAINST.** Every Phase 4
migration read a literal out of `src/data/` and checked it was still there. There is no such
anchor here, so `scripts/migrate-sections-5.ts` guards differently: it walks both documents to
their LEAVES, sorts, and refuses to write unless the value multiset is identical. Only paths may
change. `_key`s ride along as leaves, which is what would catch an array quietly losing a member.

Three things that migration needed which the Phase 4 ones did not:

- **A section is routinely NAMED AFTER the array it swallows** — `partners[]` became
  `partners.items`, `directory[]` became `directory.entries`. So it collects, THEN deletes, THEN
  assigns. Asserting the target name is free before starting would reject the commonest case in
  the slice.
- **A dotted source path**, so a heading object can be flattened INTO the section that now holds
  its list, with the emptied parent pruned rather than left behind as `featuredHeading: {}`.
- **An optional source, marked with a trailing `?`**, for the three utility pages alone: `links`
  exists on the 404 and `lede` on two of three. Everywhere else a missing source throws, so
  absence is opt-in rather than tolerated.

### `--verify` REPORTED A PERFECT RESHAPE AS A FAILED IMPORT

It asserted each old source path was gone. But a section named after the array it swallowed
means `partners` legitimately still exists — as an object now — so the check went red on two of
the three pages in 5b while the data was exactly right.

**The check was measuring the wrong thing and its answer looked like a real finding**, which is
the same shape as every wrong marker count in this file. It skips the assertion when the source
IS the section or sits inside it. Worth remembering that a guard written for one slice does not
automatically hold for the next one.

### THE ALIASES TWO PROJECTIONS NEEDED ARE GONE

`featuredHeading` / `directoryHeading` / `sponsorshipsHeading` were named as matched pairs in
the Studio, beside the lists they headed, while the interfaces had called them `featured` and
`directory` since before Sanity existed — so each projection renamed one. **Making the heading
and its list one section let the field take the interface's name without costing an editor
anything**, because the thing they now meet is the band rather than the heading.

**One alias survives and it is load-bearing**: the community page renders its partner cards
TWICE, as the volunteer grid and as the logo strip, so one section holds two headings and the
projection still hands the getter both names.

### `kind` STAYS OUTSIDE THE ACCORDION ON THE THREE UTILITY PAGES

It is read-only and it is how an editor knows whether they opened the 404 or the privacy policy.
The schema's own comment says hiding it would be tidier and wrong; folding it into a collapsed
section is that same mistake one step softer. `links` became ONE conditional section rather than
two conditional fields, so the two documents that never show it get no row at all — a collapsed
row that opens onto nothing is worse than no row.

### THE PAGES GROUP IS ELEVEN ROUTES AND A UTILITY SUB-LIST

**Superseded in part — read "THE DESK IS FIVE GROUPS" at the top of this file first.** The two
TEMPLATES are deleted and Car Accidents leads the Practice Areas group; what follows is why the
remaining rows are ordered as they are, which still holds.

**In the order of the main nav, then the pages the nav does not reach** — an editor reads down
the list the way a visitor reads across the header. Alphabetical would put Thank You between
Results and Testimonials and Contact above everything.

**The two TEMPLATES that used to sit here are deleted** — their twelve interface labels are
`TEMPLATE` constants in `blog.ts` and `practiceAreaPages.ts` now. See the note at the top of
this file for what that traded away.

**The three utility pages are three documents of ONE type.** They are the same document in
every way that matters — a title, an optional lede, a body, no taxonomy above and no collection
beneath — so three near-identical schema files would be three places to keep in step. Each is
still pinned to its own `_id`, because there is no route that would serve a fourth. `sitePage`
is in `SINGLETON_TYPES` for the same reason every other singleton type is: a generic list
beside the three pinned ones lets an editor fill in a copy nothing reads. The desk needed a
second helper for it — `singleton()` pins a type to an id of the same NAME, and here three ids
share one type.

### `getHomeWhyUs` WAS MISSED FOR A PHASE, AND THE METHOD IS WHY

`sharedSections` recorded that exactly two section getters render on more than one page. The
sweep behind that number was

```sh
grep -roE '\bget[A-Z][A-Za-z]*Section\(' src/pages | sort | uniq -c
```

which can only find getters whose NAME ends in "Section" — and Why Us is `getHomeWhyUs`. There
are three. **Grep the call sites, not the naming convention:**

```sh
for g in $(grep -hoE 'export async function (get\w+)' src/data/*.ts | awk '{print $4}'); do
  printf '%-28s ' "$g"; grep -rl "\b$g(" src/pages | tr '\n' ' '; echo
done
```

A convention is not a fact about the code, and this one was two-thirds true.

### A SENTINEL THAT ALSO APPEARS IN A COMMENT IS A GUARD THAT CANNOT FIRE

Every Phase 4 migration refuses to run once its source has moved, asserted **per getter**
against a string that exists only inside the literal it migrates — a module-shaped check
("does this file import `sanity:client`?") stopped meaning anything the moment one getter in a
module could move without the others.

Tested by running each `--verify` after its swap. In 4a, seven of eight sentinels fired and the
eighth did not: `community.ts` opens on `// "Rooted in Denver." — the homepage's community
mosaic`, so the plain `includes()` still found the string and the guard reported a literal that
was gone. **Strip comments before looking.** Same shape that has made this project's
`TODO(launch)` count wrong four times.

### A COMMENT BESIDE A LITERAL CANNOT SURVIVE THAT LITERAL MOVING TO A CMS

**It happened for the third time, and the count caught it.** `TODO(launch)` read 41 before
Phase 4 and **36** after: ten subjects in `carAccidents.ts` and one in `coCounsel.ts` lost
their marker when their literal became a field. All eleven are back, on the fields they mark.

It reads 41 again and **that is a coincidence, not a proof** — eleven markers moved into the
schema, two collapsed into one (both crash-type tiles with no page are one `href` field now),
and one is genuinely new (the co-counsel page's unverified "$300,000 average" claim, which had
no marker before). Two more were briefly DUPLICATED, which is the same failure one step on:
moving a marker onto a field while leaving a copy on the interface is how closing one leaves
the other behind.

**A marker belongs where the thing it marks is EDITED.** After Phase 4 that is usually a schema
field, not a data module. Earlier precedents still hold: the trampoline article's marker lives
in `diff-comp-blog-post.py` because no file in `src/` owns that sentence any more, and
`YOUTUBE_ORIGINS` in `lib/video.ts` holds eight ids recovered from git history.

**Re-measure with `git grep` after every phase. Do not subtract.** Current inventory:
**41 `TODO(launch)`, 8 `TODO(video)`, 9 `TODO(sanity)`, 3 `TODO(content)`.** Phase 4 closed
two `TODO(sanity)` — the award and testimonial key references, below — and added one for the
Homepage document's form, which **Phase 5 has now closed in its turn**.

### PAGE-HEADER ART DID NOT MOVE, AND NEITHER DID ITS ALT TEXT

The line Phase 2 drew still holds and Phase 4 extended it with one rule:

> **A photograph belonging to a CARD whose copy is editable moves with that card. A photograph
> that is the page's or a band's backdrop stays a local import.**

So the FAQ ask card's portrait, the two Car Accidents video posters, its two feature-card
posters and its reviewer's portrait are Sanity assets; the eight page headers, the
art-directed "why us" pair and the timeline's backdrop are not.

**The alt text stayed with the photograph, and that is the half worth not undoing.** An alt
that describes a picture the editor cannot see or change is a field that drifts with nothing
checking it — and About's carries a live `TODO(launch)` about who is actually in the frame,
which would not have survived the move. Eight `photoAlt`/`imageAlt` strings are the only prose
left in `src/data/`, besides the fact-check sentence below.

**`PageHeader` is why the art itself did not move**: it art-directs a panorama above 760px and
a portrait crop below through a hand-built `<picture>` running `getImage()` over both sources.
Making that editable is a rewrite of the component, not a data change. **If the client wants
page art editable, the answer is to move `PageHeader` and all eight headers at once** — not one
page at a time.

### THE FACT-CHECK SENTENCE IS THE ONE STRING PHASE 4 DID NOT MOVE

`factCheckLabel` — the tag above the band — is a field on both templates. The SENTENCE inside
it is not, and this is a named gap rather than an oversight: it interpolates the reviewing
attorney's name and links to their bio, both read from the roster. The comp spells him "KC
Harpring" and the live site "KC Harping"; `byline()` takes whatever Collections → Team says.
Storing the sentence freezes that name on 290 pages.

**Making it editable needs a decision nobody has made** — either a placeholder syntax for the
one substitution, or dropping the per-post derivation so an editor types the name and a check
asserts it matches a published team member. Nothing is blocked today: all 186 posts name the
same reviewer, `blogPost.factCheck` already exists as the per-document override, and 0 of 186
use it.

### THE SIDEBAR FORM IS ONE FIELD FOR TWO TEMPLATES

Its copy is byte-identical across the 290 pages the two article templates serve, so it lives
once on `sharedSections` and both getters read it. The 4c seed **asserts the two sources agree
before collapsing them** and refuses to write if they have diverged — picking a winner silently
is how one of them quietly disappears.

It is the site's THIRD set of form copy. The page-foot form is on `contactSettings` and says
something different again; Co-Counsel's referral form is its own.

### THREE KEY-STRINGS BECAME REAL REFERENCES IN 4f

The Car Accidents page named an award, a testimonial and five attorneys by STRING key, and this
file has recorded why that mattered since Phase 2: renaming a key rendered the wrong badge, and
it broke a build once. They are `reference` fields now and a reference cannot dangle. The
reviewer's name and bio link come off the roster too, so the page can no longer disagree with
it about a spelling.

**The keys survive**: the projections resolve each reference back to `key.current`, because the
components read a key and the whole migration rests on no call site moving. What the key stops
being is the only thing standing between a rename and the wrong badge.

**The reviewer is joined on the HREF, not the name** — the same trap Phase 2 hit, where three
of four card records matched the roster on a key and the fourth did not, and the href was the
authoritative half. Every join in 4f is asserted before anything is written.

### EIGHTEEN NAMED SECTIONS, NOT A PAGE BUILDER

The Car Accidents page is the largest document in the dataset — a `featuredPracticeArea` since
6d, `carAccidentsPage` before it — and every section on it is a named
field bound to a component that draws it one way — the triage rows are a coloured-pill list,
the timeline a numbered rail over a phase table, the results cards put an "offered" figure
beside a "recovered" one. An array of interchangeable blocks would let an editor reorder or
delete the thing that made the design work, and this is the SECOND design this page has had.

**Adding a section is a code change, and that cost is the guarantee** — the same trade the
navigation singleton makes with its three named menus.

Four things stayed in code besides the art, each for a reason worth not re-deriving:

- **The section anchors.** `CA_SECTION_IDS` is read by the nav's hrefs AND by the sections' own
  `id` attributes. Two things that must agree get one source, so the Studio stores which
  SECTION a nav item jumps to and the getter builds the anchor. The seed asserts each item's
  existing href already matches its own section key before relying on that.
- **The slug and the join key.** Routing, and `routePaths.ts` owns URLs here. A slug an editor
  could edit is ~300 legacy redirects pointing at nothing, with a green build.
- **The map's title.** The literal carried a second copy of the firm's name.
- **The counts.** The seed asserts all 22 — a section that quietly lost a row is exactly what a
  270-string migration hides.

### `scripts/check-phone.py` — the open item Phase 4 made necessary

`check:links` validates a `tel:` href's FORMAT and would pass `tel:+13037474404`, the retired
number, happily. This validates the VALUE, and Phase 4 is why it exists rather than staying on
the "worth doing" list: **two page documents now store the firm's number as CONTENT** — the
Thank You lede and the privacy policy's closing sentence both carry it as text and inside a
`tel:` link, because a link mid-sentence is what Portable Text is for.

```sh
python3 scripts/check-phone.py        # reads dist/, so build first
```

Two assertions. Every dialable link reaches the firm's own number, read from the same
`firmDetails` the site renders from; and **none of the seven RETIRED numbers appears anywhere**
— as an href, as displayed text, or in an attribute. A closed list of named numbers rather than
a regex over phone-shaped strings, which would also match sixty-odd Shutterstock asset ids, two
X status ids and a PACER document id. The three numbers in the body copy that are NOT the
firm's — Denver Police non-emergency, Bike Thornton, Bicycle Colorado — are deliberately absent
from it, and so is the `(303) 555-0100` form hint.

2,373 dialable links across 329 pages, all correct. **Tested in four directions before being
trusted**: a wrong `tel:`, a retired number in displayed text only, a `KNOWN_TEL` declaration
nothing matches, and an empty `dist/`. Not in `npm run check` — it needs the network, like the
five comp diffs and the fidelity audit.

### A COLLECTION IS FOR CONTENT REUSED IN MORE THAN ONE PLACE


That is the rule Phase 2f set, and it is the client's: the Collections group exists so a
record is changed once and every page that shows it follows. A type that renders on one page
is a field on that page's document, and filing it as a collection makes an editor hunt a
global list for something that only ever appears in one spot.

Counted against the build, not argued — **pages whose getter runs**, which is not the same as
pages carrying a given record. Re-measure that way or the number means something else: probing
for one award's alt text reads 116 rather than the band's 111, because five attorney bios draw
the same badges as accolades, and probing for a core value's title reads 329, because
"Community" is in the footer nav on every page.

| Staying | Pages | | Moved to a page document | Pages |
|---|---|---|---|---|
| Blog Posts | 294 | | Press Mentions | 1 |
| Blog Categories | 187 | | Insight Teasers | 1 |
| Awards | 111 | | Community Photos | 1 |
| Practice Areas | 107 | | Charity Partners | 1 |
| Cities | 107 | | Community Partners | 1 |
| Team | 29 | | Sponsorships | 1 |
| Testimonials | 27 | | FAQs | 2 |
| Core Values | 5 | | Practice-area card rails | 1 each |
| Case Results | 3 | | The directory | 3 |

**Before adding a collection, count the pages it renders on.** The directory is the one
borderline call in Phase 3 — it renders on three pages, but it is one editorial list about
one page, so it lives on `practiceAreasPage` and the other two read it from there.

### THE DIRECTORY IS REFERENCES; THE CARD RAILS ARE NOT

Both were `practiceAreas.ts` literals and they went two different ways, decided by the data
rather than by preference. Read this before modelling anything else that points at a page.

- **99 of the directory's 100 page rows print the referenced page's own short name.** So the
  row is a `reference` and the label is an OVERRIDE, stored once — on
  `denver-premises-liability-lawyer`, which the firm's hub calls "Premises Liability" in the
  Denver column and "Premises Liability Overview" as a heading. Storing a label on each row
  would have been 99 chances for the list and the page to disagree.
- **A card renames almost everything it links to.** The homepage rail says "Bicycle
  Accidents" for a page filed as "Bike Accidents", "Slip & Fall" for "Slip and Fall
  Accidents", "Traumatic Brain Injury" for "Brain Injuries". Its blurb differs from
  `/practice-areas`' blurb for the same area, and **four cards appear on both pages with the
  same href and different copy**. So a card is copy that happens to link somewhere, and it
  stores its own name and its own href.

**TWO DIRECTORY ROWS CANNOT BE REFERENCES, and both are real.** "Personal Injury" points at
the HOMEPAGE, which doubles as the firm's Denver personal-injury overview the way the legacy
hub does; "Car Accidents" points at the one slug the heavy hand-authored template serves,
which is a practice-area page but not a `practiceArea` DOCUMENT. They are a second array
member type (`customEntry`) rather than an optional href beside the reference — two fields
where an editor must know to fill exactly one is a validator's job, where "add a Practice
area" or "add Another link" needs no explaining. **The migration asserts there are exactly
two**; a third means something changed that wants a look.

This is what the `link` type's own `TODO(sanity)` was waiting for — "internal links become a
`reference` … it cannot be declared yet, no document types exist". They exist now, and 100
rows an editor would otherwise type as URLs is the list that most needed it.

### THE STORED PRACTICE-AREA BODY IS THE TRIMMED ONE

A deliberate departure from the rule `content.config.ts` used to state — that files keep
WordPress's shape and the getter coalesces, because a projection does the coalescing after a
swap. **GROQ cannot express a heading-boundary walk**, and dropping "Near Me", "Resources"
and "Awards and Accolades" means running from a chrome h2 to the next h2. Leaving it in the
getter would have kept it there permanently AND shown editors three sections that never reach
the page. 280 chrome blocks and 180 of the 231 body images never uploaded.

**The manifest lives in `scripts/migrate-practice-areas-3c.ts` now, and the script proves the
copy is faithful**: it re-derives every body through the site's own
`getPracticeAreaArticles()` over the same input and refuses to write unless all 104 match
block for block. `scripts/audit-practice-area-fidelity.py` keeps its own copy and needs it —
that one compares against live WordPress, which still carries every section.

### GROQ's `order()` IS CODEPOINT ORDER, NOT COLLATION

`| order(label asc)` put "RTD Denver Accidents" before "Rideshare Accidents" and "UPS Truck
Accident" before "Uninsured and Underinsured Motorcyclist Accidents", because every capital
sorts before every lowercase letter. `localeCompare` compares letters first and case last,
which is what a reader scanning an alphabetical column expects. It moved two pairs across 22
of the 104 sidebar cards, and only the byte-diff caught it.

**Sort a human-readable list in the getter.** Use `order()` for dates and explicit `order`
fields, where codepoints and intent agree.

### `pt()` GAVE ONE ARTICLE 28 DUPLICATE BLOCK KEYS

It numbered blocks `b0`, `b1`, … from zero WITHIN THE CALL, so a body assembled from more
than one call — `[...pt(…), ptImage(…), ...pt(…)]`, the documented way to place an image
mid-article — carried every key twice. Invisible on the site, because `_key` never reaches
the markup; **fatal on upload, because Sanity requires uniqueness within an array and a
collision is a silently dropped item, not an error.** Half that article would have vanished
behind a green import.

Fixed in the shim with a per-call prefix derived from the call's own content — a counter
would give the same body different keys on every build and make a migration's output
irreproducible. **Phase 4 moved every remaining `pt()` body through it and each of its six
migrations asserts `_key` uniqueness on the whole payload before writing** — a green import
that loses half a privacy policy is the failure being guarded against, and the assertion walks
the document rather than checking one array.

### THE BUILD MACHINE'S TIMEZONE DECIDED A POST'S DATE

All 580 imported timestamps arrive without an offset — WordPress's `date` is the site's own
wall clock — and JavaScript parses that form as the RUNNING machine's local time. Eleven sit
at 19:00 or later, so west of Greenwich they crossed midnight and rendered the following day.
Production was never affected (Vercel builds in UTC), which is exactly why nobody found it.

`withZone` in `lib/dates.ts` reads an offset-less timestamp as UTC. A date-only string is
left alone — the spec already parses `2026-06-23` as UTC midnight, and `2026-06-23Z` is
`Invalid Date`, which would have shipped as the words "Invalid Date" on the featured post.

### A CHECK THAT AUDITED ZERO PAGES REPORTED SUCCESS

`audit-practice-area-fidelity.py` enumerated its slugs from
`src/content/practice-areas/*.json`. Phase 3c deleted that directory, and the script printed
**"MATCHES SOURCE" with exit 0 having checked nothing** — the silent-failure shape four
linters exist to catch, in the script whose whole job is catching it.

Two fixes, and the second is the one that generalises: it reads its slugs from the dataset,
and **an empty list is a hard failure whatever the cause**, because zero pages agree with
anything. **Any check that enumerates should assert it found something.**

### `scripts/compare-builds.py` is the check the whole migration rests on

A raw byte-diff dies the moment an image moves — one award badge changes the markup on 111
pages. This normalises `src` and `srcset` on `<img>`/`<source>` ONLY, so every page lands in
IDENTICAL, IMAGES-only or CHANGED, and everything else — alt, width, height, class, every
byte of prose — is still compared strictly.

```sh
python3 scripts/compare-builds.py snapshot before.json   # then build, then:
python3 scripts/compare-builds.py compare before.json
```

`dist/admin/` is excluded: its bundle hash moves on every schema change.

**IT IS NOT ENOUGH ON ITS OWN WHEN A DATE FORMAT CHANGES.** Phase 3b moved 187 pages into
CHANGED for one mechanical reason (`<time datetime>` gaining a `Z`), which buried a real
content change in the same bucket. The way through is to build BOTH trees, normalise the
known-mechanical difference as well as the image URLs, and re-classify — anything left is the
finding. That is how the category reorder and the sidebar sort regression were both isolated.

### `astro dev` HUNG AFTER PHASE 3, AND THE BUILD LOOKED FINE

Every URL timed out — not slow, hung, with nothing in the terminal saying why. The build was
10 seconds throughout, which is exactly what made it invisible.

**`once()` was production-only.** That was right while the site read local files: a build
reads a dataset that cannot change under it, where an editor saving in the Studio expects the
next reload to show it. Phase 3 broke the assumption underneath it — 290 of the 330 pages now
route through one `[slug].astro`, whose `getStaticPaths` calls `getRelatedPosts()` **372
times**, and each of those re-derives the whole feed. Measured with no cache: **nine minutes
of network for one dev request**, blog branch alone.

`once()` now caches for **five seconds in dev** and forever in a build. Everything inside one
`getStaticPaths` run shares a fetch; a reload a few seconds later reads the dataset again, so
a save still shows on the next reload. Warm dev requests went from timing out to **20ms**.

**THE GENERAL SHAPE IS WORTH REMEMBERING: a getter that is cheap per page becomes O(pages)
network reads the moment its source moves behind HTTP, and only dev shows it.** The build
never did, because `once()` covered it there.

**Phase 4 added 22 more `once()` keys and did not slow anything**, because every one of them is
a SINGLETON read once per build rather than a per-page getter — 56 round trips total, against
330 pages. The shape to watch for is still the other one: a getter called from inside
`getStaticPaths`. Time a dev request as well as a build whenever one of those appears.

`toPost()` also resolved a byline per row — 185 lookups per `getBlogPosts()`. `credits()`
reads the roster once and returns a Map; a linear `.find()` over 26 people, 185 times, across
372 calls is 1.8 million comparisons for an answer that does not change.

### A STUDIO EDIT DOES NOT SHOW IN DEV ON THE TWO DYNAMIC ROUTES

Publish a change and 290 of the 330 pages keep serving the old value until a
source file is touched. **`npm run dev:refresh`**, or restart the dev server.

`astro dev` caches what `getStaticPaths` returns and re-runs it only when the module graph
changes. That was invisible while the content lived in `src/content/` — the content-collection
loader has its own invalidation, so saving a JSON file triggered it. Phase 3 moved the content
behind HTTP, where nothing tells Astro anything happened.

**The static pages are fine**: they re-run their frontmatter per request, so `once()`'s
five-second dev window is all that stands between a publish and a reload showing it. **A BUILD
IS NEVER AFFECTED** — it runs `getStaticPaths` once, from cold, which is why this can be true
while `npm run build` shows the change immediately.

Diagnosed the long way once already: check the DATASET first (a draft is invisible — the client
reads `perspective: "published"`), then a fresh build, then dev. If the build shows it and dev
does not, it is this. The real fix is Sanity's live content / Visual Editing, which is Phase 5.

### A GREEN BUILD CAN LIE. Delete `dist/` first.

Three builds in a row reported "332 page(s) built" and exited 0 while the data behind them
was already gone — Astro was writing over a stale `dist/`. A FAILED build leaves a partial
`dist/` behind too, which reads as a site that lost 325 pages. `rm -rf dist && npm run build`
before trusting a build that is meant to prove something.

### Five things that will bite

1. **`once()` in `sanity/lib/fetch.ts` is not optional.** The first Sanity-backed build took
   **3m35s against 44s** — every page renders the header, the footer and usually the contact
   band, so four singletons became ~2,000 round trips. Every getter added in Phase 3 uses it;
   one that skips it costs a round trip per page against 294 pages.
2. **Filter queries on `_type` as well as `_id`.** An id alone tells typegen nothing about
   shape, so the result type comes back as a union across every document type — one all-null
   variant each — and every field reads as possibly null however the schema is validated.
3. **`@sanity/icons` lies about its own runtime.** `index.d.ts` declares every named icon;
   the barrel exports none of them. `import { CogIcon } from "@sanity/icons"` TYPECHECKS and
   dies at bundle time. Import from the subpath: `@sanity/icons/Cog`.
4. **typegen parses every matched file as TypeScript**, so a `.d.ts` is a parse error.
   Declaration files, the vendored `eliteTheme.js` and typegen's own output are excluded in
   `sanity.cli.ts`.
5. **`getStaticPaths` cannot see module scope.** Both `[slug].astro` files are affected;
   `sanity/lib/queries.ts` exists so queries can be imported rather than closed over.

### `scripts/lib/stub-vite-modules.ts` — how a Node script reads a data module

Three things in `src/data/*.ts` only exist inside an Astro build, and all three are answered
through `node:module`'s `registerHooks`: image imports, `sanity:client`, and `astro:content`.
Call `registerDataModuleHooks()` BEFORE the dynamic import and use `await import()` — static
imports hoist above it.

**THE CLIENT HAS TWO MODES AND PHASE 3 IS WHY.** `"throw"` is right while Sanity is empty and
the code is the source of truth: a seed calling an already-swapped getter would otherwise
write a document full of nothing. `"live"` builds a real client configured exactly as
`astro.config.mjs` configures the site's — needed the moment a migration must READ content
earlier phases moved, which 3b did for the reviewer, the firm's phone and the taxonomy.

**THE "ALREADY SWAPPED" GUARD MOVED, AND HAD TO.** It read the module for an import of
`sanity:client` and refused if it found one — which stopped meaning anything the moment ONE
getter in a module moved. Phase 3a swapped the categories in `blog.ts`; the 186 posts were
still entirely in code. **Each migration now asserts against the SOURCE IT READS**, which is
a question a module-shaped check cannot answer.

Two smaller traps in that file, both of which cost a round trip: a `\0`-prefixed virtual URL
cannot resolve a bare import (`ERR_INVALID_URL` walking up to `node_modules`), so the stubs
are `file:` URLs pointing at files that do not exist; and `\"` inside a template literal
collapses to `"` in the emitted source, which is a syntax error rather than an escape.

### THE DRAG-ORDER PLUGIN IS PINNED, AND CANNOT BE UPGRADED

`@sanity/orderable-document-list` is held at **2.0.10** and `sanity-plugin-utils` at
**2.0.12** by an `overrides` entry. Both are the last releases on `@sanity/ui` 3.x.

The plugin's current release needs `@sanity/ui` 4, which imports `./tooltip` — a subpath 3.x
does not export — and `astro dev` dies during dependency optimisation. **There is no
combination that fixes this upward.** `sanity` 6.11 does use ui 4, and upgrading to it made
things worse (five copies of `@sanity/ui` instead of three), because `@sanity/astro` still
pins ui 3 through `@sanity/visual-editing` — and so does its own latest release. The
ecosystem is mid-migration between those majors.

So: one `@sanity/ui` on disk, deduped across the Studio, visual-editing and the plugin. This
resolves itself when `@sanity/astro` moves to ui 4, at which point `sanity` and the plugin go
up together. Until then, `npm install <anything>` can re-introduce the conflict — check
`npm ls @sanity/ui` returns a single deduped 3.5.1.

**An `npm install` also re-resolves transitive ranges.** Two of them bumped 142 packages,
including `@csstools/*`, which rehashed every CSS chunk and made 296 pages differ for no
reason. Restore the lockfile and add the one package onto it rather than accepting the churn.

### A drag handle nothing reads is worse than no drag handle

The desk's grouped-list helper only offered `orderableDocumentListDeskItem`, which writes an
`orderRank` field as rows move. That is right for Team, whose page renders it. It is wrong
for the 104 practice areas, which are sorted by their short name and store no position — a
control that appears to work, saves a field and changes nothing on the site.

So the helper takes an `orderable` flag. **The plain variant needs an initial-value template**
to set the group's field, which the plugin's list does for free: without it a page created
inside Denver has no `city`, matches none of the nine filters, and is invisible in the desk.
`practiceArea` is out of the global create menu for the same reason `teamMember` is.

### Coalescing goes in the projection or on its own line — never in a cast

`as FirmDetails` typechecks and hides a real mismatch: a projection returns `null` where the
interfaces say `undefined`, and the two are not the same to a component doing
`{firm.email && …}`. `getFirmDetails()` handles four fields explicitly and **throws** on a
missing map pin rather than defaulting to 0 — a real coordinate in the Gulf of Guinea that
would ship as the firm's location in its structured data.

`required()` throws when a singleton is absent. **Hard cutover, no fallbacks**: a getter that
quietly falls back to a literal is a second copy of the content that can ship by accident.

`required()` CANNOT throw on a collection query — GROQ returns `[]` for a type with no
documents, never null. Every collection getter needs a real guard downstream, and each of the
Phase 3 ones has one: `getBlogPosts()` throws by slug on a post with no category,
`getFeaturedPost()` throws unless exactly one post is featured, and `assertDirectoryJoin()`
names every directory entry whose page is missing.

### `href` IS NEVER PROJECTED

Every Phase 3 query returns a slug and the getter calls `blogPath()` / `practiceAreaPath()`.
Three layers already agree on the trailing slash — `astro.config.mjs`, `vercel.json` and
`routePaths.ts` — and a GROQ string concat must not become a fourth. Same reason `TEAM_QUERY`
returns no href and derives it from `hasProfile`.

The same rule sends a byline through `byline()` rather than projecting `{name, href}`: one
place turns a roster entry into a credit.

### The main nav's top level is code, on purpose

`TOP_LEVEL` in `src/data/navigation.ts` holds the six items — labels, destinations, order,
existence. The Studio owns the second level down: three dropdown lists, plus the footer's
columns and chips. **One NAMED field per menu, not a generic list with a parent key** — an
editor cannot invent a menu or attach one to the wrong parent.

`external` is derived from the href, not stored. Forget a checkbox on a pasted `https://` URL
and the link opens in the same tab with no glyph and nothing reports it; `ProseLink` already
worked this way.

### Three collections have keys that are named from somewhere else

`award`, `testimonial` and `teamMember` each carry a `key` slug projected as `_key`. **That
key is content:** renaming one fails the build rather than quietly rendering the wrong badge.

**ALL THREE ARE REAL `reference` FIELDS NOW** — the blog's in 3b, the award and testimonial
pair in 4f, along with the five attorneys the Car Accidents rail names and its reviewer. The
keys survive: every projection resolves the reference back to `key.current`, because the
components read a key and the whole migration rests on no call site moving. What a key stops
being is the only thing standing between a rename and the wrong record.

Sweep before any later migration — this is the command that found all three:

```sh
grep -rnoE '\b[a-z]+Key\b' src/data/*.ts | awk -F: '{print $1": "$3}' | sort | uniq -c
```

### Repeated bands split THREE ways, and you have to check which

| Part of a REPEATED band | Goes to |
|---|---|
| Its **items** — the six values, the awards, the testimonial records | a Collection |
| Its **heading, identical on every page it appears on** | the `sharedSections` singleton |
| Its **heading, different per page** | that page's own singleton |

**A band that is NOT repeated splits none of these ways — all of it belongs to its page.**
That is what Phase 2f corrected and what 3d confirmed: the two card rails render once each
and are arrays on the page that renders them.

The third row is not hypothetical: `TestimonialRail` and `about/InTheirWords` render the SAME
records under DIFFERENT headings, About's coming from its own page document.

**THREE getters are shared, not two** — core values (5 pages), the attorneys band (2) and Why
Us (2). The `*Section(` grep this section used to carry found only the first two, because Why
Us is `getHomeWhyUs`; see the note at the top of this file for the sweep that finds all three.
Everything else is one-page and lives on that page's document.

**Phase 4 added a FOURTH thing to `sharedSections` that is not a heading at all** — the sidebar
consultation form's copy, identical across the 290 pages the two article templates serve. Same
rule, same reason: one record, changed once.

### The Studio is shaped for editors, not for the schema

**Team opens into four groups** — Founding Partners (2), Attorneys (5), Staff (16), Office
Dogs (3) — filtered on `kind`, which is `required()` and a closed list, so the four are
exhaustive for anything publishable. **Practice Areas opens into nine**, one per city, the
same way. **A fifth value must be added in BOTH places at once**: the schema's option list
and `GROUPED` in `sanity/structure`. A document matching none of the filters is invisible in
the desk.

`kind` is **hidden** in the form, by request — the group is implied by which list you created
in. The cost, recorded because it is a surprise: **nobody can move a person between groups in
the Studio.** A paralegal who becomes an attorney needs the field un-hidden or an API edit.
`city` on a practice area is NOT hidden, so that one can be moved.

**Each group shows only its own fields.** What each uses was counted, not guessed: card bio,
accolades, figures band, bio eyebrow and the film are partners-only; the standfirst is
staff-only (16 of 20, and no attorney or partner has one); "in loving memory" is dogs-only.

**The team page sorts by GROUP first, then rank.** The desk shows four filtered lists but
`orderRank` is one global sequence and the page renders partners then everyone else flat — so
a drag inside Attorneys used to move the row against the whole roster. Sorting by group makes
interleaving impossible rather than merely absent.

### The attorney rail is one checkbox

It had five fields; four were removed by request and each was duplicating something: a
position (the rail follows the team page's drag order now), a homepage/About choice (the rail
is the rail), a city (dropped from the card), and a second film.

**The rail now leads with Sean Dormer, not K.C. Harpring** — it follows the team page, which
always did. Visible on the homepage and About; dragging the two partners changes both
together. Declared in `diff-comp-about.py`.

A film is OPTIONAL on the card: without one the portrait keeps its frame and loses the play
glyph and its scrim.

### The attorney bio's portrait IS the play button

The film used to render as a 16:9 poster block in the body, which meant a second image
uploaded and described for a video the person's own photograph already illustrates. The film
is now a bare Wistia id and the poster fields are gone.

**A poster frame falls back to the film's own Wistia thumbnail**, and that is live on the
testimonial cards. `wistiaPosterUrl` in `lib/video.ts` uses oEmbed — there is no derivable
URL, because thumbnails live under a per-delivery hash the media id does not contain, and the
obvious guess is a 404. Memoised per id.

### DEAD LITERALS SURVIVE A GETTER SWAP, AND NOTHING REPORTS THEM

`team.ts` carried `PROFILES` — 1,054 lines of bio data — for four commits after
`getTeamProfiles()` started reading Sanity. Nothing referenced it and nothing complained: an
unused module-level const is not an error.

**Phase 3 swept after every slice, and every slice had some.** 3a stranded a nine-entry
`CATEGORIES` map of which EIGHT were already dead before the phase began, one of them holding
a `_key` that disagreed with its own slug. 3b stranded fifteen symbols — twelve practice-area
photographs, `getCollection`, `getFirmDetails`, `ptImage`. 3d stranded twelve more, including
one image imported TWICE under two names and `locationPath`, which had 55 call sites and now
has none.

**Phase 4 swept after every slice too, and the sweep found things two phases old.** 4b stranded
thirteen symbols, SIX of which had been dead since PHASE 2: `testimonials.ts` still imported
five client portraits and a video cover whose records became Sanity assets two phases earlier,
and nothing had reported them. 4f took `carAccidents.ts` from 1,227 lines to 598 and stranded
nothing, because the swap rewrote its import block in the same edit.

**`git grep -c` the symbol, and check the count is more than one.** Most of those names also
appear as substrings in prose or in `AREA_TO_BLOG_CATEGORY`, so a bare grep reads a dead
import as live. The sweep that found them parses the import clauses and then looks for each
binding in the file with its comments stripped — a bare grep counts the import line itself.

### A COMMENT BESIDE A LITERAL CANNOT SURVIVE THAT LITERAL MOVING TO A CMS

It happened in Phase 2 — every record's `TODO(video): was YouTube <id>` comment went with it,
eight of them, unnoticed for four commits, recovered from git history into `YOUTUBE_ORIGINS`
in `src/lib/video.ts`. Five of those eight are UNLISTED and cannot be re-derived from
anything public.

**It happened again in Phase 3b, and the marker count is what caught it.** The trampoline
article's body carried `TODO(launch): confirm the intended wording with the firm` beside the
sentence the live site truncates. The body became a `blogPost` document and the comment went
with it. 41 launch markers before the phase, 40 after, nothing closed.

Recovered into `scripts/diff-comp-blog-post.py`, beside the assertion that still proves the
departure. **A check is the right home for a marker whose subject is now editable** — no file
in `src/` owns that sentence any more, and the assertion is the thing that still runs.

**Re-measure with `git grep` after every phase. Do not subtract.**

### Seeding, as it works

A script reads the source → NDJSON → `sanity dataset import`. Images ride along as
`_sanityAsset` with an ABSOLUTE `file://` path, and the importer hashes each file so a repeat
reuses the existing asset rather than uploading twice.

- **Seed FIRST, verify, then swap the getter.** Swapping is a one-way door.
- **Seeded documents get generated ids**, so `--replace` has nothing to match on and a second
  import ADDS a second set. `scripts/sanity-purge.ts <types> --yes` first. Singletons are the
  exception — fixed ids, so `--replace` really does replace, which is why 3d used it and the
  three collection migrations did not.
- **A document that gains fields across slices must be re-emitted WHOLE.** 3d writes
  `homePage`, which already carried five arrays from Phase 2f; it reads the document back,
  merges, and **refuses to write at all if the read comes back without `faqs[]`**.
- **A PLAIN `JSON.stringify` DEEP-COMPARE IS WRONG AGAINST SANITY.** It returns a stored
  object's keys alphabetically where an assembled member carries them in schema order.
  `canon()` sorts keys at every depth; both `migrate-pages-2f.ts` and `migrate-practice-cards-3d.ts`
  carry it.
- **A query right after a write can be stale.** Re-query, or use the CLI.

**Every migration asserts its joins before writing anything.** 3b asserts 23 categories and
exactly one reviewer; 3c asserts its own trimmed body matches the site's for all 104; 3d
asserts exactly two non-reference directory rows; 4f asserts all three of its key-to-reference
joins and all 22 of the page's section counts. A seed that silently drops the rows it could
not match is how a whole column disappears from a page nobody re-reads.

**Four Phase 4 migrations read a document back and merged**, and each refuses to write when the
read comes back without the list it must keep — `homePage.faqs`, `sharedSections.attorneysBand`,
`practiceAreasPage.directory`, `communityPage.partners`, `carAccidentsPage.faqs`. That guard is
the only thing between a copy migration and deleting three earlier phases.

**`--verify` COMPARES SANITY AGAINST THE CODE, so it only means anything before the swap.**
Every Phase 4 script says so in its header and refuses to run afterwards. Run it between the
import and the swap; after the swap it is comparing the dataset with itself.

**A SEED THAT WIDENS AN INTERFACE BREAKS ITS OWN READ.** Moving the FAQ ask card's portrait to
Sanity widened `FaqSection.ask.portrait` to `ImageMetadata | SanityImageSource`, and the
migration script that produced it stopped typechecking on its own `.src`. Discriminate on a
field only one member has (`"src" in image`), never with a type predicate — a predicate over
`SanityImageSource` narrows the false branch to `never`. The discrimination is also a real
assertion: an image that is already a reference means the getter has moved.

### Not done, and known

- **The production URL is still not a Sanity CORS origin**, so the deployed `/admin` loads and
  fails sign-in. `http://localhost:4321` is registered — don't move dev off 4321.
- **No webhook.** Publishing changes nothing on the live site until someone redeploys. Phase 5.
- **Nothing is wired for Visual Editing**, so array projections omit `_key` where the interface
  has none.
- ~~**Testimonials still nest their video field.**~~ **CLOSED in 6b.** Nothing nests a video
  field any more — see the note at the top of this file.
- **`routePaths.ts` exports `locationPath` and nothing calls it.** One of five identical
  helpers that name the kinds of URL this site has; whether that set should shrink is a
  routing question, not a migration one.
- ~~**The Homepage document is sixteen fields and the form is a long scroll.**~~ **CLOSED.** It
  is seven sections now, and Practice Areas and Car Accidents traded their Phase 4 tabs for the
  same accordion. See the top of this file.
- **The fact-check SENTENCE is still derived**, not editable. See the note at the top of this
  file for what making it editable would need.

## State

**The team is 26 people, not 30.** Alexandra Petroff, Dinorah Gutierrez, Ella Nelson and Morgan
Jewel no longer work at the firm and were deleted from the dataset by Rhan.

**THIS PARAGRAPH SAID THE WRONG TWO, IN BOTH DIRECTIONS — re-checked against the live site:**

| | Live at `/<slug>/` and `/meet-our-attorneys/<slug>/` | This file used to say |
|---|---|---|
| Ella Nelson, Morgan Jewel | **404 on both** — WordPress has removed them | "the LIVE site still serves" them |
| Alexandra Petroff, Dinorah Gutierrez | **200 on both** | "never appeared on the live site at all" |

So the "no redirect, by request" decision was taken about two pages that no longer exist, and
the two that DO exist were believed not to. **Four live URLs 404 at cutover, not two**, and they
belong to the pair nobody has ruled on. Open: redirect them to `/meet-our-attorneys/`, or let
them go the way the other two were meant to.

**The 23 CURRENT bios are handled**, in both forms — see `ATTORNEY_ROOT_SLUGS` in
`data/redirects.ts`.

Nothing internal points at them: the team page and `/sitemap/` both read the collection, so
their links went with them. `check:links` is clean at **33,619 links across 328 pages, 162
redirect rules** — the count fell by eleven when the community cards stopped being links, and
the rules rose from 68 with the 24 community write-ups and 23 attorney bios, each in both slash
forms.

Build is green: **330 pages in 10 seconds** — 328 that render a site header and footer, plus
`404.html` and `/admin`. It was 47s before Phase 3; Astro no longer optimises 202 body and card
images, because they come off Sanity's CDN. Phase 4 did not slow it: it added 22 `once()` keys,
so a build now makes **56 HTTP round trips total** rather than per page. `npm run check` passes
(five linters — `check:desk` is the newest) and `check-phone.py` passes.

**THE FIVE COMP DIFFS CANNOT RUN RIGHT NOW.** macOS Downloads access is refusing the design
folder again — see below; the tell is that plain `head` fails too. They were green when last
runnable and nothing since has touched comp content, but that is an argument, not a result.
**Re-run them when access returns.**

The fidelity audit reports 104 of 104 pages at ≥99% against the live source — last run after
Phase 3c, and nothing since has touched practice-area body copy.

**Almost every string on this site is editable, and the comp diffs are the thing that still
holds it to a design.** The exception is deliberate and recent: the two article templates' twelve
interface labels went back into code by request — see the note at the top of this file, including
the one of them that is marketing copy. Three of the five diffs carry DECLARED DEPARTURES for things an
editor legitimately controls. `diff-comp-about.py` no longer pins the attorney grid to the
comp's four names in order — who is on the rail and in what order are both editorial acts
now, so it asserts the comp's four are PRESENT and reports extras. It still fails when one of
them disappears or two swap; tested both ways. Its `EXPECTED` table also declares the
founding partner's name spelling, the missing city, and the rail leading with Sean.

**A check that goes red every time someone does their job is a check that gets ignored.** That
is the line to hold as more content becomes editable — loosen what an editor legitimately
changes, keep what would be a regression.

**`Operation not permitted` ON EVERYTHING UNDER `~/Downloads/Dormer Harpring/` IS BACK.** It is
macOS Downloads access, not the scripts — **the tell is that plain `head` fails too**, and it
does. It cleared on its own once before and nothing in the repo ever had to change for it.

While it holds, the five comp diffs cannot run at all: they read the design folder, which is
why they are not in `npm run check`. Do not read their absence as a pass.

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
scripts cannot affect its result. Run it when the practice-area bodies or the importer change,
and background it when you do. It reads its slugs from the DATASET now — see "A check that
audited zero pages reported success" above for what it did on the commit that deleted the
directory it used to read.

**`npm run check` is FIVE linters now, and one of them could never fail.**
`scripts/check-desk.py` is the newest — a document type the Studio desk draws TWICE, or not at
all. It was written after five duplicate rows were found BY EYE in the Studio, past everything
else here; the note at the top of this file has what happened. **It reads source rather than
`dist/`**, so it runs second, beside `check:types`, and needs no build. **Tested in seven
directions before being trusted** — a type in no group, a type in two, a group the `PLACED` set
does not reference, a typo'd type name, a renamed not-a-group, a lost hand-placed singleton, and
a reformat that must NOT fail because it changes nothing. `npm run check` itself was run red and
green to prove the chain carries the exit code.

`scripts/check-links.py` — 33,619 internal links across 328 pages today, every target
resolved against what `dist/` actually serves plus `vercel.json`. (It read 33,754 when written; the count fell from 39,484
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

Marker inventory: **41 `TODO(launch)`, 8 `TODO(video)`, 9 `TODO(sanity)`, 3 `TODO(content)`.**
Phase 5 closed one — the Homepage document's "sixteen fields and a long scroll", which is what
the accordion answered. **41 / 8 / 3 are unchanged and that was measured, not assumed**: the
count was re-run before and after the three slices, because a reshape that moves a field is
exactly the shape that has taken a comment with it three times.
Re-measured with `git grep` after Phase 4, which briefly lost ELEVEN launch markers and
duplicated two more — see "A comment beside a literal cannot survive that literal moving to a
CMS" above for what happened and why 41 → 41 is a coincidence rather than a proof. Phase 4
closed two `TODO(sanity)` and added one.

**THE VIDEO FIGURE WAS WRONG, AND IT IS A FOURTH REASON FOR THIS LINE TO BE WRONG.** It read 6
here, with a note saying it "fell from 8 to 6 because two were DELETED WITH THE LITERAL they
annotated". The deletion was real — see "The YouTube mapping was almost lost" — but the count
was never re-measured after the recovery: `YOUTUBE_ORIGINS` brought the ids back and the
comment ABOVE it quotes the deleted marker's own wording, so the grep sees it again. Measured
at the commit that made the claim, `git grep` already returned 8.

So the failure was not the method this time; it was reasoning about a delta instead of
re-running the count. **Re-measure, do not subtract.** One of the eight is a discussion rather
than a marker (`src/lib/video.ts`, the sentence quoting the deleted comments), which the colon
cannot filter because it quotes the colon form too — seven are real.

A falling marker count is still not automatically progress; check what closed it.

**USE `git grep`, AND THE METHOD IS PART OF THE NUMBER.** This line has now been wrong four
times, each for a different reason. It read 43 when the grep counted eleven comments that
DISCUSS a marker rather than being one — the colon fixed that. It read 38 against a count
silently scoped to `src/` and `scripts/`. And a `grep -rn … .` with `grep -v '^./HANDOFF.md'`
reads 41, because BSD grep strips the `./` and the exclusion never matches, so this file's own
examples count themselves.

`git grep` has none of those problems: it is repo-scoped, respects `.gitignore`, and takes
real pathspecs.

```sh
git grep -F -c "TODO(launch):" -- . ':!HANDOFF.md' ':!README.md' | awk -F: '{s+=$2} END {print s}'
```

Phases 0 and 1 added **no new launch items** — 39 before, 39 after, measured that way at both
commits. One briefly appeared when the `firmStats` schema repeated `stats.ts`'s
unverified-claims marker; a second marker for one item is how closing it leaves the other
behind.
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
  `git diff --name-only src/content/blog` returned nothing after the run. That gate is gone with
  the directory; the `_key`s themselves are in Sanity, uploaded verbatim.
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

**DROPPED AT MIGRATION SINCE PHASE 3c, not in the getter.** It used to run on every build, under
`content.config.ts`'s rule that the files keep WordPress's version and the getter coalesces —
because a projection is what does the coalescing after a swap. That rule does not reach this
case: a heading-boundary walk is not something GROQ can express. The manifest is in
`scripts/migrate-practice-areas-3c.ts` now and the stored body is already trimmed. See the
section at the top of this file.

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

| Moved to the blog | Category |
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
  The gate on that change was `git status --porcelain src/content/blog` coming back empty after a
  re-run. It did. The directory is gone now, so a re-run writes a fresh one and the gate becomes
  a diff against what Sanity holds — `migrate-blog-3b.ts --verify` is that diff.
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
`git status --porcelain src/content` after any converter change — which now means: re-import to a
fresh directory, then diff it against the dataset before importing anything.

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

### PLACEHOLDER_VIDEO — 33 slots, one stand-in, and only 3 are greppable

`lib/video.ts` exports it; every un-migrated slot points at it, by request, so the whole site
works today. **Sanity now gives an editor somewhere to type a real id, which is what the
constant was always waiting for.**

**GREPPING `PLACEHOLDER_VIDEO` NO LONGER FINDS THEM ALL**, and that changed quietly when the
content moved. Only 3 slots are still code-side — two panels in `carAccidents.ts` and the FAQ
band in `home.ts`. The other 30 are FIELDS holding the stand-in id as data: 20 FAQs (8 in
`homePage.faqs[]`, 12 in `carAccidentsPage.faqs[]` — no longer a collection), 6 testimonials,
4 team films. The full sweep is a grep AND a query, both written at the top of `lib/video.ts`;
**the FAQ half of that query changed in Phase 2f** and now reads the two page documents.

**`home.ts` writes the hero's id as a LITERAL, deliberately.** The hero's video is correct and
finished; the placeholders only happen to share an id. So do not grep the id itself in code —
that wrongly includes the hero.

**The YouTube mapping is in `YOUTUBE_ORIGINS` in `lib/video.ts`, NOT in comments beside the
records any more.** It used to be, and moving those records into Sanity deleted the comments
with them — all eight, across two slices, unnoticed for four commits. Recovered from git
history. Five of the eight are unlisted and cannot be re-derived from anything public.

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
now SETTLED on www, so those ~330 URLs are no longer a guess and this is unblocked work. It
stays with `/new-seo-setup` because that is where robots.txt and the canonical layer land. The footer points at the human page instead.

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

1. **The 9 remaining dead links** — the ONLY dead links left on the site. `KNOWN_DEAD` in
   `check-links.py` is empty. Eight are `homePage.pressMentions[]` and
   `homePage.insightTeasers[]`, read through `data/news.ts`, every `href` a literal `"#"`,
   marked `TODO(content)` rather than `TODO(launch)` — which is how they stayed off the launch
   list. The ninth is the Car Accidents checklist teaser, which IS a `TODO(launch)`: unlike the
   homepage's eight it promises "8 things to do after a car accident" to a reader who has just
   been in one. **All nine are editable in the Studio now**, so filling one in is an editor's
   job rather than a code change — lower the `KNOWN_PLACEHOLDER` count in the same change or
   `check:links` fails. It is keyed **by count**, so removing one without lowering the number
   fails. The four news mentions are real published articles (FOX31, Denver7, OutThere
   Colorado, The Mountain Mail) and their URLs are findable; the four insight teasers and the
   checklist point at articles nobody has written. `#` must not reach production.
2. **Real Wistia ids.** 33 slots still point at one stand-in, which is the whole site's video
   layer resting on a single film — and after Phase 4 **only ONE is still in code**
   (`lib/video.ts`'s constant itself). The rest are FIELDS: 20 FAQs, 6 testimonials, 4 team
   films, the homepage's firm intro, and the two Car Accidents video panels. **The YouTube ids
   they map to are in `YOUTUBE_ORIGINS` in `src/lib/video.ts`** — no longer in comments beside
   their records, because those records moved to Sanity and took the comments with them. Five
   of the eight are unlisted and cannot be re-derived. Blocked on the firm re-hosting the
   videos, and on someone checking YouTube Studio for unlisted ones beyond those five.

   **Grepping `PLACEHOLDER_VIDEO` no longer finds them** — the full sweep is a grep AND a
   query, both written down at the top of `src/lib/video.ts`, and **the query half is stale**:
   every record it reads has changed shape, from a `video{provider,id}` object to a bare
   `videoId` string. Rewrite it before trusting it — a GROQ filter on a field that no longer
   exists returns nothing and reads as "no placeholders left".
3. **One Wistia player per popover, initialised eagerly** — 15 on the homepage, 20 on
   `/denver-car-accident-lawyer/`. Inherent to the class-based embed; wants a pass before launch.
4. ~~**Sanity Phases 2, 2f, 3 and 4.**~~ **ALL DONE.** 775 documents across **ten** collection
   types, **twelve** page types and **four** settings singletons, 279 image assets,
   and no page copy left in `src/data/`. Every slice ended byte-identical or with every changed
   page explained. The findings that will matter next are at the top of this file; the ones
   most likely to bite are `pt()`'s duplicate keys, GROQ's codepoint `order()`, and that a
   comment beside a literal does not survive the literal.
5. **The four Portable Text object types the post template deferred** — `callout`, `phoneBand`,
   `attorneyCard`, `pullQuote`, whose intended home is commented in `prose/components.ts`, and
   which the practice-area chrome maps onto almost exactly. **Deliberately NOT in Phases 3 or
   4**: nothing in the 290 imported documents uses them and no renderer exists, so adding them
   would ship four editor controls that draw nothing. They want a renderer first.
6. **Sanity Phase 5 — the webhook and CORS are what is left.** Publishing changes nothing on
   the live site until someone redeploys, and the production URL is still not a CORS origin, so
   the deployed `/admin` loads and fails sign-in. **The `/studio-polish ux` half is DONE**: every
   page document with more than one band is an accordion of sections, which is what the
   Homepage's sixteen loose fields wanted and what took the tabs off the other two. See the top
   of this file.
7. **A CUTOVER URL AUDIT — every live path against what this site serves.** Two sessions have
   each turned up a batch by hand: 24 community write-ups and 23 root-slug attorney bios, 47
   would-be 404s, both found by reading denvertrial.com rather than by anything in this build.
   **Nothing here can see a URL the old site has and this one does not** — `check:links` only
   validates links this site EMITS. Enumerate the live site's paths (its REST API lists posts
   and pages; the sitesucker scrape is the other half) and resolve each against `dist/` plus
   `vercel.json`. Four are already known and unruled: Alexandra Petroff's and Dinorah
   Gutierrez's bios, live in both URL forms, belonging to staff the roster no longer carries.
8. `/new-seo-setup` — per-page meta, a Global SEO Settings singleton, JSON-LD, `sitemap.xml`,
   `robots.txt`, editor-managed redirects. **The practice-area pages already carry real
   `metaTitle` / `metaDescription` from the live site's own meta** on all 104 `practiceArea`
   documents, and Phase 4f put the Car Accidents page's on a `seo` object too — so this layer
   has something true to start from and the field type is already proven on two shapes.
   `BlogPosting` JSON-LD belongs here, and so does `sitemap.xml` — **which nothing links any
   more**: the footer points at the human `/sitemap/`. The XML file's every URL is absolute off
   `site:` — settled on www, so it is unblocked work rather than a blocked decision.
9. **`redirects.ts` is the last data module holding content**, and it is deliberate: the
   redirect table becomes editor-managed in `/new-seo-setup`. It is **162 rules now**, up from
    68, and two thirds of that growth is cutover work rather than legacy URL shapes.
    `portableText.ts` is the only other non-Sanity module and it is an authoring shim rather
    than content — **`blog.ts` is now the only file in `src/` that CALLS `pt()` at all**, for
    the one fact-check sentence, so the shim is one caller away from being types only. Its
    TYPES are still load-bearing everywhere.

No comp exists for **privacy / disclaimer**, **sitemap** or **404**. All three are built on the
light template's shell anyway — see below.

## Sanity readiness

Written before the integration started, and kept because most of it is still the record of how
the checks were made rather than a to-do list. **What was a blocker is closed; what was a green
light was re-checked at upload.**

**The four green lights, all re-checkable:**

- **35,179 `_key`s across both collections: zero duplicates, zero missing.** This is the one that
  would have bitten during upload, because Sanity requires `_key` uniqueness WITHIN each array
  and a collision surfaces as a silently dropped array item rather than an error. **It was
  re-checked on the PAYLOAD, not just the source, and that is the version to copy** — 17,716
  keys in the blog's NDJSON and 17,239 in the practice areas', zero duplicates in any array.
  The source check would not have caught `pt()`'s 28 colliding keys, because those are
  generated at build time and exist in no file.
- **290 slugs, zero collisions** between the 186 blog posts and the 104 practice areas. They
  share `[slug].astro` at the root, so a collision is a page that cannot be served.
- **80 async getters, and the data layer is clean**: no hex codes, no SVG markup, no style
  strings. The convention held.
- **No component owns content** — but read the note at the top of this file before trusting
  that line. All 127 were checked for a content ARRAY in their FRONTMATTER, and three bands
  were owning bare strings in MARKUP and a prop DEFAULT, which that sweep could not see. Those
  three are fields now; the sweep has still never been re-run in a shape that would find a
  fourth.

**The blockers, in the order they bite:**

1. ~~**There is no Sanity client.**~~ **CLOSED in Phase 0.** `@sanity/astro`'s `sanity:client`
   is imported by twenty data modules now, and by `src/sanity/lib/image.ts`. The client is configured entirely in `astro.config.mjs` —
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
4. ~~**The asset surface is 112 distinct images** plus 203 in the content collections.~~
   **DONE.** 277 image assets are in Sanity and `src/content`'s 39M has left the tree. The
   split held: large decorative art (page-header photographs, band backgrounds, the two logos)
   is still a local import through Astro's build pipeline; card, body and interactive images
   are Sanity assets on its CDN. `Picture.astro` branches, so each move was a data change.
   Eleven practice-area photographs and `consult.jpg` are now unreferenced by `src/` but stay
   on disk — `npm run backup` is `--no-assets`, so git is the only copy of the originals.

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
- ~~**Three live Denver pages were excluded as duplicates** and want a ruling.~~ **RULED —
  all three redirect.** `personal-injury-attorney` → home and the other two →
  `denver-car-accident-lawyer`, in both URL forms each. See the audit section at the top.
- **The `AREA_TO_BLOG_CATEGORY` map in `blog.ts` is inferred, not authored.** It decides which
  posts a practice area's sidebar shows. Keyed on the area slug rather than its topic, because
  topic is five buckets and would put car-accident posts on the motorcycle page — which is what
  the live site does. In Sanity this wants to be a `relatedPosts` reference array on the
  `practiceArea` document, and **Phase 4f proved the pattern on three cross-references at once**,
  so the shape is settled. What is left is a content decision for the firm — which five articles
  belong on each of 104 pages — not a migration step.
- **Auto Insurance & Accident Claims has no tab** — 13 posts carry it second, none first.
- ~~**`site:` in `astro.config.mjs`** — www vs apex.~~ **SETTLED: www**, and every comment
  that called it open has been corrected — there were TEN, across `astro.config.mjs`,
  `check-links.py` (twice), `Footer.astro`, `sitePages.ts`, `routePaths.ts`, `sitemap.astro`,
  `AGENTS.md`, `README.md` and this file. The reason is cutover risk, not taste: www is the
  shape the legacy site serves and therefore the shape Google holds for ~300 indexed URLs, so
  keeping it changes no canonical that is already ranking. **Vercel must serve www as the
  PRIMARY domain**, apex redirecting to it; reversing that without moving `site:` points every
  canonical tag at a redirect.
- **Two crash types on the heavy detail page** — rear-end and head-on.
- **The three Denver crash figures are unsourced**, and `[year]` renders live in all three labels.
- **`src/assets` holds twelve images nothing references.** Eleven practice-area photographs and
  `consult.jpg`, all now Sanity assets. Kept because git is the only copy of the originals
  outside Sanity; delete them only alongside a decision about asset backup.
- ~~**Two former staff have live bio pages the roster no longer carries.**~~ **RULED — all four
  URLs redirect to `/meet-our-attorneys/`.** See the audit section at the top.
- **The two article templates' twelve labels are code now**, and one of them is marketing copy:
  the practice-area eyebrow, "Tough lawyers for tough cases", on all 104 pages, already changed
  four times by request. Changing it a fifth time is a deploy. If that happens, it belongs on
  `sharedSections` beside the awards bar's label — the constant's own comment says so.
- **Three Phase 4 migrations have broken the type gate**, each when a later phase removed a
  getter they read: `migrate-home-4a.ts` twice and `migrate-car-accidents-4f.ts` once, the last
  cascading one root error into 32. They are spent and cannot run — their documents no longer
  exist — but `check:types` gates the whole repo. Decide whether they are documentation (delete
  them; git and the per-slice commits are the real record) or code, rather than patching a
  fourth time.
- ~~**`check:links` validates a `tel:` href's FORMAT but not its VALUE.**~~ **CLOSED in Phase
  4** — `scripts/check-phone.py`, and Phase 4 is what made it necessary rather than merely
  worth doing: two page documents now store the firm's number as CONTENT. See the note above.

**Waiting on the firm** — content, not code. `README.md` has the full table. Unchanged: the seven
attorney emails, the office address and hours, the `$70M+ / 20 Years` stat claims — **which are
now one record rather than two**, at Shared Sections → Firm figures.

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

- ~~`/api/consult` does not exist.~~ **BUILT — see the top of this file.** Two form components
  from **six** call sites reach **327 of the 329 built pages** (counted from the build, not
  estimated; the earlier 326 was one short). What remains is provisioning Resend and setting
  four variables — configuration, not code.
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

**The desk is no longer empty.** `structureTool({ structure })` draws five groups and one loose
document — Pages, Practice Areas, Blog, Collections, Shared Sections, Site Settings — from
`src/sanity/structure/index.ts`.
Pages holds **twelve rows**: eleven routes in NAV ORDER, then a "Utility pages" sub-list. **That
is twelve page TYPES and fourteen documents** — `sitePage` is three pinned documents behind that
one row. See "THE DESK IS FIVE GROUPS" at the top for what moved and why. Collections holds
**six** types, Blog two, Practice Areas **two** (the imported default and the featured one), and
Shared Sections is one pinned document on its own row. A document type added to `schemaTypes`
but not placed in one of those arrays shows up under a divider at the bottom rather than
becoming invisible. **That catch-all is blind to the opposite case** — a type placed TWICE looks
identical to it — which is why `check:desk` exists; see the note at the top of this file.

Singletons are enforced by `documentId()` in the structure, not by a schema option — there is
no `singleton: true`. `SINGLETON_TYPES` is what keeps them out of the catch-all, so a
singleton is never shown twice with edits to the second copy going nowhere.
