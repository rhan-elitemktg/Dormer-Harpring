# Dormer-Harpring

Marketing site for **Dormer Harpring** — Astro + Sanity (embedded Studio at `/admin`) + Vercel.

`npm run dev` runs both the site and the Studio on port 4321.

Requires `.env` (gitignored):

```sh
PUBLIC_SANITY_PROJECT_ID="74nyy5mh"
PUBLIC_SANITY_DATASET="production"
```

## Checks

`npm run build` catches compile errors. Three things it can't catch, all silent
by construction — run them on every commit:

```sh
npm run build && npm run check
```

- **`check:styles`** — a class passed as a prop to a child component lands on
  that child's markup and never receives the parent's `data-astro-cid`, so the
  parent's scoped rule matches nothing. The build succeeds and the styling is
  simply gone. An HTML diff can't see it either.
- **`check:tokens`** — an undefined `var()` doesn't degrade, it invalidates the
  whole declaration. `padding: var(--space-11) var(--space-13)` with no
  `--space-13` renders *no* padding, not most of it.
- **`check:links`** — an `<a>` whose target was never built. Nothing else in the
  build looks at links at all, which is how three footer hrefs stayed dead on
  every page of the site — 984 links — through five comp-diff scripts and two
  linters. It also fails on `href="#"`, on a document-relative href (it resolves
  under whatever page it lands on, so it's a 404 that moves), and on a `tel:`
  that isn't E.164. Known-broken links are **declared with a reason** in the
  tables at the top of `scripts/check-links.py`, and a declaration that stops
  being true fails too — so closing an item can't leave the table stale.

`check:styles` has one known blind spot: it catches a passed-in class used as
the **target** of a scoped rule, but not one used as its **ancestor**.

```css
/* In a page that renders <PageHeader class="cr-header" />. Compiles, matches
   nothing: `.cr-header` lands on PageHeader's <section>, which never carries
   this file's cid. */
.cr-header :global(.ph__title) { font-size: var(--display-page-sm); }
```

The rule to follow: **bound `:global()` by an element in your own template**,
never by a class you handed to a child. If the child has no such wrapper, the
styling belongs to the child as a prop.

## Before launch

Everything below is deliberately unfinished, not overlooked.

| Item | State |
|---|---|
| **Forms** | `ContactForm.astro` and `CoCounselForm.astro` both post to `/api/consult`, which **does not exist**. Needs a server adapter plus a mail provider, then a 303 to `/thank-you`. Until then they 404 on submit. One endpoint, not two: a hidden `kind` field (`consultation` / `co-counsel`) tells them apart, so the handler branches rather than the infrastructure doubling — the payloads differ and probably want different inboxes. The comps' fake success panels were deliberately not ported; they told every visitor their case had been received while discarding it. |
| **Video** | **Solved structurally, blocked on content.** Every play affordance on the site is a Wistia popover — nine of them, 178 triggers across 30 pages — and no record says `youtube` any more. But **44 slots point at one stand-in** (`PLACEHOLDER_VIDEO` in `lib/video.ts`), so the whole video layer is currently one film. Each record names the YouTube id it should map to. Needs the firm's re-hosted ids. |
| **Wistia migration** | Done for the wiring. `lib/video.ts` still owns every URL and each record still carries `{ provider, id }`, so swapping an id stays a data change. `WISTIA_ACCOUNT` is **still empty** — the media JSON exposes only account ids (154783 / yrknbv2cuk), never the vanity subdomain, so it has to come from the dashboard. Until then the no-JS fallback href is Wistia's own hosted player: works, unbranded. The `youtube` branch is unused but kept, since the provider swap is the point of the shape. |
| **Video posters** | The cards use the design package's own client portraits, which is still the right call — a still lifted from each film would beat them. Re-hosting is the moment to do it, since the files are in hand. Separately, `faq-video-cover.jpg` is 607×609 — square — in a 16/10 box, so `object-fit: cover` crops roughly its bottom 40%. |
| **Nav submenus** | About and Practice Areas use the current site's IA; Locations is proposed and needs sign-off. "Locations" has no hub page, so its parent renders as plain text. The team sits inside About as "Our Team"; the comps' top-level "Attorneys" item is gone, and "Testimonials" takes the slot. |
| **"En Español"** | Renders in the header (every comp shows it) with no target. |
| **Phone** | **Settled: `(303) 756-3812`**, from `firmDetails`, everywhere. This reverses the earlier `(866) 683-6894` — the comps' number, which this project had recorded as the firm's choice and which the firm has now confirmed it is not. The 866 number is **retired, not kept as a fallback**. Imported WordPress body copy carried SIX different firm numbers and was rewritten to match; the three non-firm numbers in it (Denver Police non-emergency, Bike Thornton, Bicycle Colorado) were deliberately left alone. Still open: the display vs CallRail tracking split, if dynamic insertion returns. |
| **Text number** | **Settled: `(720) 730-7997`**, from `firmDetails`. The comps' `(720) 734-6230` (29 files) is retired — same call as the phone above, and for the same reason: the live site publishes 730-7997 864 times and carries the comps' number only inside commented-out markup. Both comp numbers are now asserted absent in `diff-comp-about.py` and `diff-comp-blog.py`. |
| **Email** | The contact page shows `info@dormerharpring.com`, which is the comp's. **The live site publishes no contact address anywhere** — the only one in its markup is a WordPress author account leaking into blog JSON-LD. Confirm it exists, or clear `firmDetails.email` and the card disappears on its own. |
| **Attorney emails** | Each bio's contact line shows `<first name>@dormerharpring.com` — seven addresses, of which **only Sean's comes from a source** (the comp) and the other six are inferred from that pattern. Same problem as above, multiplied: verify all seven, or clear `email` on the profile in `src/data/team.ts` and the line closes up to phone and city. |
| **Office hours** | `Mo-Fr 09:00-17:00`, which is what the live site's JSON-LD asserts. The Contact comp shows **8:30am – 5:30pm**. `hours` and `hoursDisplay` sit together in `firmDetails` so the page and the structured data cannot drift apart; both change together. |
| **Third-party tags** | The old site loads GA4, GTM, CallRail, Clarity, Ahrefs, Intaker and reCAPTCHA — roughly 600 KB. Recommend GTM only, with the rest configured inside it. The contact page's Google Maps embed also sets cookies on load, so it belongs in the same consent decision. |
| **Duplicate case results** | Three of the 89 results on `/results` are the same cases the homepage leads with, in different words — the King Soopers slip-and-fall is "Denied → $2.1M" on one and "$250K offered → $2.1M" on the other. Both are the comps'. They become one document each at the Sanity phase; which wording is right is the firm's call. |
| **Blog posts** | Settled by the import. The comp's thirteen feed cards — five real, eight the designer's invention — are gone: `getBlogPosts()` IS the imported archive, so the index serves real posts and nothing ships with `href: null`. **The archive is 186, not 167**: WordPress holds 167 `post` records and fourteen more articles filed as `page` records (`PAGE_ARTICLES` in `scripts/blog-category-overrides.mjs` says which and why), and five more moved over from the practice-area import. 23 categories, 22 of which get a tab. Still interim — `src/content/blog`, not Sanity, by request. |
| **Blog post pages** | All 186 are built and served flat at the root, which is the legacy URL shape. The hand-authored trampoline-waiver article still wins over its imported copy — it is the legacy article *with* corrections — and `getImportedPosts()` drops any slug a hand-authored article claims. Nothing outstanding here. |
| **Blog body copy** | The built article is the live one, verbatim, with **two deliberate departures**, both asserted in `scripts/diff-comp-blog-post.py`: the live copy's second paragraph stops mid-clause ("…understand what those waivers.") and is completed here, and its closing `(303) 747-4404` is read from `firmDetails` instead. Confirm the wording of the first with the firm; the phone is settled. |
| **Fact-check band** | The blog post's footer band claims the reviewing attorney has tried cases "for more than 20 years". Same unverified claim as the homepage's `20 Years` stat. |
| **Car accident figures** | The detail page ships **six unsourced numbers**, all the comp's. Three are city data — "1 in 4" hit-and-run, 5,900 injury crashes, 84 fatal — each dated "**[year]**" and sourced to "**[CDOT / DRCOG / Denver Open Data]**", both the comp's own placeholders. Three are the firm's own closed-case data — 3.4× over first offer, 41 cases to verdict, 1 in 5 callers told they don't need a lawyer — under a disclaimer that names the period "**[date range]**". Source the three or drop the band; fix the period or drop the three. Colorado's advertising rules care about the second set. |
| **Statute citations** | The page cites four Colorado statutes (10-4-635, 13-80-101, 24-10-109, 13-21-111). The comp links **all of them to `law.justia.com/codes/colorado/`** — the index, not the section — so they ship as **text, not links**. Either point each at its own statute or leave them as citations. |
| **"What to do after a car accident"** | The page teases an 8-step checklist and the comp links it at **`DH - Blog - What to do after a car accident.html`**, a post comp that arrived with the redesign and that this build does not serve. It carries the eight steps **and** the glove-box card, both cut from the Car Accidents page. The teaser currently renders its label with **no link**. Build the article, then set `ctaHref` in `carAccidents.ts`. |
| **Eight promised articles** | "More on car accident claims" lists eight pieces — who was at fault, who pays my medical bills, policy limits, first offers, adjusters, damages, suing a government entity, venue. **All eight are subjects the first design covered on-page and the second cut.** None exists as a post. The comp points all eight at the blog index, which this build serves, so they are not dead links — but "Read the answer" landing on an index with no such answer is a launch problem. Write them, or cut the section back. |
| **Reviewed-by date** | The detail hero says "Updated July 2026" and names K.C. Harpring. It has to move whenever the copy is reviewed, and the five credential lines under it — including the $10M verdict and the 2006 admission — want confirming. |
| **Two crash types have no page** | Six of the page's eight crash-type tiles link to a live legacy URL. **Rear-end** and **head-on** match nothing on the legacy site, so they render as plain tiles. Either those two pages get built or the tiles come out. |
| **Attorney `sameAs`** | The comp's `Attorney` structured data points every attorney's `sameAs` at the Colorado Supreme Court's attorney **search form** and at `linkedin.com` — neither identifies the person, so neither is ported. Real bar-record and LinkedIn URLs per attorney would make `sameAs` worth adding. |
| **Team portraits** | Solved for 25 of 27. The comps ship generic stand-ins for three attorneys and nothing for the rest; the live site's Meet Our Attorneys page carries a real, consistent set — one backdrop, one lighting setup, 460×580 apiece — and those are now in `src/assets/team/`. **Alexandra Petroff and Dinorah Gutierrez** appear in the comp but nowhere on the live site, so they have no photograph; their cards fall back to a monogram. |
| **Eyebrow contrast** | Section eyebrows are 12px uppercase gold on cream. The comps use `#C79A54` (≈2.5:1) on News/Insights/Community and `#B0873C` (≈3.1:1) elsewhere; both fall short of WCAG AA, and neither qualifies as large text at this size. Built to match the comps — worth a decision before launch. |

| **Privacy policy** | Built at `/privacy-policy/`, transcribed from the live page. **Thin by modern standards** — no CCPA/GDPR section, no cookie disclosure, no retention period, no route for a data request — and the site loads third-party tags and embeds a Google Map that sets cookies on load, none of which it mentions. Shipped as the firm's own existing text rather than rewritten, because rewriting a law firm's privacy policy is the firm's call. Review before launch. |
| **`sitemap.xml`** | Still not built, and now not linked either. `/sitemap/` is the human page the footer points at; the XML file is a crawler artifact whose every URL is absolute off `site:` — the open www-vs-apex decision — so it belongs to `/new-seo-setup` with `robots.txt`. |
| **Four practice areas are in no directory group** | Defective Helmets, Autonomous Vehicle Accidents, Drunk Driving Accidents and Taxi Accidents, all Denver. All four are built and reachable from sibling sidebars (7–19 inbound links each), but the live hub does not list them and the directory is synced to the hub — so `/practice-areas` does not either. `/sitemap/` lists them because it reads the collection. Add them to the directory, or confirm hub-only. |

| **Favicon** | The firm's DH monogram, taken from the live site's WordPress site-icon and shipped as `favicon.ico` (16+32), `icon-192.png` and `apple-touch-icon.png`. Until now the site served **Astro's default logo**. **No SVG**: no vector source for the mark exists in the comps or `src/assets`, and hand-tracing a monogram is design work rather than a conversion. The mark's green `#314641` is **not on this site's forest ramp** (nearest is `--dh-forest-100` `#2c3b31`; the chrome is `#151e19`) — it is the legacy site's colour, carried over as-is. Worth a decision with the designer. |

| **Unlisted YouTube videos** | The `@denvertrial` channel holds **20 videos the site knows about: 15 public and 5 unlisted** — Evelyn, Joel, Elijah, an unnamed testimonial and Sean's 2024 profile. **Nothing public can enumerate an unlisted video**; those five were found by working backwards from ids in the codebase, so a migration driven off the channel listing would have left five dead embeds. **There may be more than five** — only YouTube Studio's Content list holds the true total, and nobody has checked it. Download from Studio or Takeout: those give the original masters and include unlisted videos. |

**Do not add `AggregateRating` structured data.** The homepage's "5.0 on Google"
card is presentational copy only. The current site marks the firm up as a
`Product` carrying review stars, which is a Google policy violation and one of
the things this rebuild fixes.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Site and Studio together on `localhost:4321` |
| `npm run build` | Build to `./dist/` |
| `npm run check` | The three silent-failure linters above — run after a build |
| `npm run preview` | Preview the build locally |
| `npm run prep:assets` | One-off: pull and downsample comp images into `src/assets/` |

## Project docs

| File | Holds |
| :--- | :--- |
| `AGENTS.md` (= `CLAUDE.md`) | Architecture, conventions, the design source of truth. Durable. |
| `HANDOFF.md` | What's built, what's next, what's open. Rewritten each session. |
| this file | Setup, the checks, and the pre-launch decisions above. |
