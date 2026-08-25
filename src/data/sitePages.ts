// SANITY SWAP POINT — the three utility pages: privacy policy, sitemap, 404.
//
// `src/sanity/lib/sitePages.ts` will be: three async functions, each returning
// the projection of a page singleton. Bodies become `sanityClient.fetch(...)`
// and no call site moves.
//
// WHY ONE MODULE FOR THREE PAGES. They are the same document type in every way
// that matters — a title, a lede, a body, no taxonomy above them and no
// collection beneath them — and each is a singleton. Splitting them into three
// files would put three one-export modules beside each other. In Sanity this is
// one `sitePage` type with three documents, or three singletons in one desk
// group; either way they arrive together.
//
// NOTE none of these carries an `eyebrow` the way `PracticeAreaPageCopy` does.
// The practice-area template's eyebrow is the firm's tagline, marketing copy
// standing in for a taxonomy. On a privacy policy it would read as a slogan
// stapled to a legal notice, and on a 404 it would be noise above an apology.
import { pt } from "./portableText";
import type { PortableTextBlock } from "./portableText";
import { getFirmDetails } from "./site";
import { ROUTES } from "../lib/routePaths";

export interface SitePage {
  title: string;
  /** One sentence under the H1. Optional — the privacy policy has none. */
  lede?: string;
  body: PortableTextBlock[];
}

/** A `SitePage` that also stamps when it last changed. */
export interface LegalPage extends SitePage {
  /** ISO. Rendered as "Last updated <date>" and as the <time> datetime. */
  updatedAt: string;
  updatedLabel: string;
}

/**
 * The privacy policy, transcribed from the live page at
 * `https://www.denvertrial.com/privacy-policy/` (WordPress page id 1061).
 *
 * THREE DELIBERATE DEPARTURES FROM THE SOURCE, all of them structural or
 * factual rather than editorial — the wording is the firm's own throughout:
 *
 *  1. THE PHONE NUMBER IS READ FROM `firmDetails`, NOT TRANSCRIBED. The live
 *     page closes on "(303) 747-4404", which is not the number the firm
 *     publishes — the same third number the trampoline-waiver article carries,
 *     and one of the six the imported bodies were normalised off. site.ts is
 *     the only place a phone number may live.
 *  2. THE SOURCE'S OWN <h2> IS DROPPED and its three <h3>s promoted to <h2>.
 *     The live body opens on "Privacy Policy for Personal Injury Law Firm
 *     Dormer Harpring", which is the page title said twice — WordPress renders
 *     no H1 from `content.rendered`, so on the live page that h2 IS the
 *     heading. Here the template renders the title as the H1, so keeping it
 *     would print the same sentence twice and start the document at h3.
 *  3. `updatedAt` is WordPress's `modified` (2026-01-20), not its `date`
 *     (2019-01-17). Same call the practice-area template makes and for the same
 *     reason: a 2019 stamp on a policy revised this year reads as stale rather
 *     than settled.
 *
 * TODO(launch): this is the firm's existing policy and it is thin by modern
 * standards — no CCPA/GDPR section, no cookie disclosure, no retention period,
 * no contact route for a data request. The site also loads third-party tags
 * (README's row) and embeds a Google Map that sets cookies on load, neither of
 * which this text mentions. Transcribed as-is because rewriting a law firm's
 * privacy policy is the firm's call, not this build's — but it should be
 * reviewed before launch rather than shipped because it was already there.
 */
export async function getPrivacyPolicyPage(): Promise<LegalPage> {
  const firm = await getFirmDetails();

  return {
    title: "Privacy Policy",
    updatedAt: "2026-01-20",
    updatedLabel: "Last updated",
    body: pt(
      "This page explains the privacy policy and practices for Dormer Harpring, a " +
        "personal injury law firm located in Denver, Colorado. We do not sell, distribute " +
        "or share personally identifiable information with third parties unless the law " +
        "requires us to do so. We always work diligently to ensure and prevent the " +
        "unauthorized sale or use of your personal information.",

      "## Personal Information Collection",
      "We may use this website to collect certain personally identifiable information. " +
        "This may include your name, contact information, and other data. We may also " +
        "collect additional personal or non-personal information about you in the future " +
        "or collect certain information about other visitors.",
      "We may record your location, IP address, the URLs of the website that directed you " +
        "to our site, the URLs of the pages you visit on our website, the dates and times " +
        "of each visit, and/or information about the computer hardware and software you " +
        "use, as well as other information that may be available. Dormer Harpring uses " +
        "this information only for the operation and maintenance of our website and also " +
        "to provide general statistics regarding the use of our services.",

      "## Details About the Use of Collected Information",
      "Dormer Harpring may collect and use your personal information as part of the " +
        "operation of our website. We also use this information to deliver the information " +
        "or service that you request. We also use it to improve your browsing experience " +
        "and the experience of other visitors by personalizing the site. We may use " +
        "information about the content you visit and services you use alone or in " +
        "conjunction with information collected from other users. This helps us tailor our " +
        "services to better suit the needs and interests of our users.",
      "At Dormer Harpring, we do not sell, rent, or lease any of our customer lists or " +
        "information to third parties. However, we reserve the right to disclose any " +
        "information that we obtain through our website to appropriate authorities, " +
        "without notice, if required by law or any governmental agency.",

      "## Security Disclaimer for Our Website",
      "Information sent through contact forms and emails to Dormer Harpring may not be " +
        "secure. Therefore, you choose to share this information at your own risk if you " +
        "submit anything via our website. If you would like to schedule an appointment, " +
        `you can always call us at [${firm.phone}](tel:${firm.phoneE164}) for immediate ` +
        "assistance."
    ),
  };
}

/**
 * The HTML sitemap at `/sitemap/`, which the footer links.
 *
 * NOT `sitemap.xml`, and the difference is the point. An XML sitemap is a
 * crawler file, referenced from robots.txt rather than from a footer, and every
 * URL in it is built from `site:` in astro.config.mjs — which is still an open
 * www-vs-apex decision. Generating one now would bake that guess into ~330
 * absolute URLs. It belongs to `/new-seo-setup` with robots.txt and the
 * canonical layer, which is where HANDOFF.md already files it.
 *
 * What the footer wants, and what this is, is the human page: every URL the
 * site serves, grouped, on one page a visitor can actually read.
 *
 * The GROUPS are not stored here. They are composed in `src/pages/sitemap.astro`
 * from the getters that already own each collection — the practice-area
 * directory, the blog feed, the footer nav — because a second hand-maintained
 * list of every page on the site is a list that goes stale the first time
 * anything is added. Only the page's own copy lives here.
 */
export async function getSitemapPage(): Promise<SitePage> {
  return {
    title: "Sitemap",
    lede:
      "Every page on this site, in one place. If you are looking for something " +
      "specific and cannot find it here, call us — we would rather point you at it " +
      "than have you keep hunting.",
    body: [],
  };
}

export interface NotFoundPage extends SitePage {
  linksTitle: string;
  links: { _key: string; label: string; description: string; href: string }[];
}

/**
 * The 404 page.
 *
 * Astro builds `src/pages/404.astro` to `dist/404.html`, and Vercel serves that
 * for any unmatched path on a static deployment — no config, no adapter, no
 * route entry. It is NOT in `RESERVED_PATHS`: nothing links it and no redirect
 * may target it, because a redirect to a 404 page returns 200 with 404 content,
 * which is the soft-404 pattern Google penalises. The status code has to come
 * from the server not finding a file.
 *
 * WHY IT OFFERS ROUTES RATHER THAN A SEARCH BOX. This site has no search — the
 * blog index filters client-side over a list it already has, which is not the
 * same thing and would find nothing outside `/news`. A box that returns nothing
 * is worse than no box.
 *
 * The four destinations are the ones a mistyped or dead URL most plausibly
 * wanted: the ~300 legacy URLs that 404 here are practice-area pages and blog
 * posts, in that order.
 */
export async function getNotFoundPage(): Promise<NotFoundPage> {
  return {
    title: "We couldn't find that page",
    lede:
      "The link may be out of date, or the address may have a typo in it. Nothing " +
      "is lost — here is where most people were heading.",
    body: [],
    linksTitle: "Try one of these",
    links: [
      {
        _key: "practice-areas",
        label: "Practice areas",
        description: "Every case type we handle, by city.",
        href: ROUTES.practiceAreas,
      },
      {
        _key: "blog",
        label: "Articles & insights",
        description: "Plain-English answers to the questions we get asked most.",
        href: ROUTES.blog,
      },
      {
        _key: "attorneys",
        label: "Meet our attorneys",
        description: "The people who would handle your case.",
        href: ROUTES.attorneys,
      },
      {
        _key: "contact",
        label: "Free consultation",
        description: "Tell us what happened. No obligation.",
        href: ROUTES.contact,
      },
    ],
  };
}
