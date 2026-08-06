# Dormer-Harpring

Marketing site for **Dormer Harpring** — Astro + Sanity (embedded Studio at `/admin`) + Vercel.

`npm run dev` runs both the site and the Studio on port 4321.

Requires `.env` (gitignored):

```sh
PUBLIC_SANITY_PROJECT_ID="74nyy5mh"
PUBLIC_SANITY_DATASET="production"
```

## Checks

`npm run build` catches compile errors. Two things it can't catch, both silent
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
| **Video** | Partly solved. The **six client testimonials are real and live** on the `@denvertrial` YouTube channel — ids verified against YouTube's oEmbed endpoint — and `/testimonials` links straight to them. Everything else (the homepage's firm video, the FAQ video, the homepage rail's posters) is still inert: those need their own ids, and then a lightbox to replace the link-out. The `[data-video]` panels become real `<button>`s at that point. |
| **Wistia migration** | Everything is moving to Wistia. Nothing outside `src/lib/video.ts` builds a video URL, and each record carries `{ provider, id }` rather than a link — so the move is a data change: set `WISTIA_ACCOUNT` and flip `provider` on each record. The YouTube branch can be deleted once no record uses it. |
| **Video posters** | All six testimonials were shot vertically, so every thumbnail YouTube serves is a 9:16 title card letterboxed into 16:9 against a blurred copy of itself — mostly blur, and showing a stock river clip rather than the client. The cards use the design package's own client portraits instead. A still lifted from each video would beat both. |
| **Nav submenus** | About and Practice Areas use the current site's IA; Locations is proposed and needs sign-off. "Locations" has no hub page, so its parent renders as plain text. The team sits inside About as "Our Team"; the comps' top-level "Attorneys" item is gone, and "Testimonials" takes the slot. |
| **"En Español"** | Renders in the header (every comp shows it) with no target. |
| **Phone** | `(866) 683-6894` site-wide, from `firmDetails`. The live site still publishes `(303) 756-3812` in its JSON-LD and on its contact page — decide whether that one is retired or kept as a local number, and settle the display vs CallRail tracking split, before launch. |
| **Text number** | `(720) 734-6230`, from every comp. The live site publishes `(720) 730-7997` (864 uses) and has the comps' number only inside commented-out markup. One of the two is stale — confirm which. |
| **Email** | The contact page shows `info@dormerharpring.com`, which is the comp's. **The live site publishes no contact address anywhere** — the only one in its markup is a WordPress author account leaking into blog JSON-LD. Confirm it exists, or clear `firmDetails.email` and the card disappears on its own. |
| **Attorney emails** | Each bio's contact line shows `<first name>@dormerharpring.com` — seven addresses, of which **only Sean's comes from a source** (the comp) and the other six are inferred from that pattern. Same problem as above, multiplied: verify all seven, or clear `email` on the profile in `src/data/team.ts` and the line closes up to phone and city. |
| **Office hours** | `Mo-Fr 09:00-17:00`, which is what the live site's JSON-LD asserts. The Contact comp shows **8:30am – 5:30pm**. `hours` and `hoursDisplay` sit together in `firmDetails` so the page and the structured data cannot drift apart; both change together. |
| **Third-party tags** | The old site loads GA4, GTM, CallRail, Clarity, Ahrefs, Intaker and reCAPTCHA — roughly 600 KB. Recommend GTM only, with the rest configured inside it. The contact page's Google Maps embed also sets cookies on load, so it belongs in the same consent decision. |
| **Duplicate case results** | Three of the 89 results on `/results` are the same cases the homepage leads with, in different words — the King Soopers slip-and-fall is "Denied → $2.1M" on one and "$250K offered → $2.1M" on the other. Both are the comps'. They become one document each at the Sanity phase; which wording is right is the firm's call. |
| **Team portraits** | Solved for 25 of 27. The comps ship generic stand-ins for three attorneys and nothing for the rest; the live site's Meet Our Attorneys page carries a real, consistent set — one backdrop, one lighting setup, 460×580 apiece — and those are now in `src/assets/team/`. **Alexandra Petroff and Dinorah Gutierrez** appear in the comp but nowhere on the live site, so they have no photograph; their cards fall back to a monogram. |
| **Eyebrow contrast** | Section eyebrows are 12px uppercase gold on cream. The comps use `#C79A54` (≈2.5:1) on News/Insights/Community and `#B0873C` (≈3.1:1) elsewhere; both fall short of WCAG AA, and neither qualifies as large text at this size. Built to match the comps — worth a decision before launch. |

**Do not add `AggregateRating` structured data.** The homepage's "5.0 on Google"
card is presentational copy only. The current site marks the firm up as a
`Product` carrying review stars, which is a Google policy violation and one of
the things this rebuild fixes.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
