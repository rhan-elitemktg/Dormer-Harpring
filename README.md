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

## Before launch

Everything below is deliberately unfinished, not overlooked.

| Item | State |
|---|---|
| **Consultation form** | `ContactForm.astro` posts to `/api/consult`, which **does not exist**. Needs a server adapter plus a mail provider, then a 303 to `/thank-you`. Until then the form 404s on submit. The comp's fake success panel was deliberately not ported — it told every visitor their case had been received while discarding it. |
| **Video** | 18 play buttons across the homepage are inert. Needs a host (YouTube? Wistia?) and IDs, then a lightbox. The `[data-video]` panels become real `<button>`s at that point. |
| **Nav submenus** | About and Practice Areas use the current site's IA; Attorneys and Locations are proposed and need sign-off. "Locations" has no hub page, so its parent renders as plain text. |
| **"En Español"** | Renders in the header (every comp shows it) with no target. |
| **Phone** | `(303) 756-3812` site-wide. Decide the display vs CallRail tracking split before any number swap goes in. |
| **Third-party tags** | The old site loads GA4, GTM, CallRail, Clarity, Ahrefs, Intaker and reCAPTCHA — roughly 600 KB. Recommend GTM only, with the rest configured inside it. |
| **Attorney portraits** | Three of seven attorneys have photography. The homepage rail takes the rest as they arrive. |
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
