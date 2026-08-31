// The four utility pages: privacy policy, editorial guidelines, sitemap, 404.
//
// SANITY: four `sitePage` documents at fixed ids — `privacy`, `editorial`,
// `sitemap`, `notFound`. One type, four singletons; the note on the schema type
// has why it is one type and why they are still pinned rather than a collection.
//
// WHY ONE MODULE FOR FOUR PAGES. They are the same document in every way that
// matters — a title, a lede, a body, no taxonomy above them and no collection
// beneath — and each is a singleton. Splitting them into three files would put
// three one-export modules beside each other.
//
// NOTE none of these carries an `eyebrow` the way `PracticeAreaPageCopy` does.
// The practice-area template's eyebrow is the firm's tagline, marketing copy
// standing in for a taxonomy. On a privacy policy it would read as a slogan
// stapled to a legal notice, and on a 404 it would be noise above an apology.
import { sanityClient } from "sanity:client";
import {
  EDITORIAL_PAGE_QUERY,
  NOT_FOUND_PAGE_QUERY,
  PRIVACY_PAGE_QUERY,
  SITEMAP_PAGE_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";

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
 * factual rather than editorial — the wording is the firm's own throughout.
 * They are recorded here rather than in the Studio because they are facts about
 * the MIGRATION, not instructions to an editor; the stored document is the
 * corrected text, and re-transcribing from the live page would undo all three:
 *
 *  1. THE PHONE NUMBER IS THE FIRM'S CURRENT ONE. The live page closes on
 *     "(303) 747-4404", which is not the number the firm publishes — the same
 *     third number the trampoline-waiver article carries, and one of the six
 *     the imported bodies were normalised off. `scripts/check-phone.py` fails
 *     the build if any retired number reappears anywhere, including here.
 *  2. THE SOURCE'S OWN <h2> IS DROPPED and its three <h3>s promoted to <h2>.
 *     The live body opens on "Privacy Policy for Personal Injury Law Firm
 *     Dormer Harpring", which is the page title said twice — WordPress renders
 *     no H1 from `content.rendered`, so on the live page that h2 IS the
 *     heading. Here the template renders the title as the H1, so keeping it
 *     would print the same sentence twice and start the document at h3.
 *  3. `updated.at` is WordPress's `modified` (2026-01-20), not its `date`
 *     (2019-01-17). Same call the practice-area template makes and for the same
 *     reason: a 2019 stamp on a policy revised this year reads as stale rather
 *     than settled.
 *
 * TODO(launch): this is the firm's existing policy and it is thin by modern
 * standards — no CCPA/GDPR section, no cookie disclosure, no retention period,
 * no contact route for a data request. The site also loads third-party tags
 * (README's row) and embeds a Google Map that sets cookies on load, neither of
 * which this text mentions. Shipped as-is because rewriting a law firm's
 * privacy policy is the firm's call, not this build's — but it should be
 * reviewed before launch rather than shipped because it was already there.
 */
export async function getPrivacyPolicyPage(): Promise<LegalPage> {
  const page = await once("sitePage:privacy", async () =>
    required(await sanityClient.fetch(PRIVACY_PAGE_QUERY), "Privacy Policy", "Pages → Utility pages")
  );

  const updated = required(page.updated, "Privacy Policy's last-updated stamp");
  return {
    title: page.title,
    body: page.body as PortableTextBlock[],
    // Coalesced on their own lines rather than in a cast: the schema leaves both
    // optional because the other two `sitePage` documents have no stamp, and a
    // policy that silently printed "Last updated " with no date would be worse
    // than one that fails the build.
    updatedAt: required(updated.at, "Privacy Policy's last-updated date"),
    updatedLabel: required(updated.label, "Privacy Policy's last-updated label"),
  };
}

/**
 * The editorial guidelines, transcribed from the live page at
 * `https://www.denvertrial.com/editorial-guidelines/` (WordPress page id 14093).
 *
 * WHY THIS PAGE EXISTS AT ALL, given it was on nobody's list: the cutover URL
 * audit found it. It is live, in the live sitemap, and 106 blocks of real
 * editorial standards — and after the audit's other seventeen findings were
 * redirected it was the ONLY would-be 404 left. `ROUTES.editorialGuidelines` and `RESERVED_PATHS` had reserved its path
 * all along, so something always intended it to exist; nothing had built it.
 *
 * NO DEPARTURES FROM THE SOURCE, unlike the privacy policy's three. The
 * converter reported zero warnings, the page carries no links and no phone
 * number, and its 66 bullets came through as list items rather than flattening
 * to paragraphs. Nothing needed correcting, so nothing was.
 *
 * `updated.at` is WordPress's `modified`, which for this page equals its `date`
 * — it has not been revised since publication. The label is "Last reviewed"
 * rather than the privacy policy's "Last updated": a set of standards is
 * something a firm re-affirms rather than edits, and the wording is the
 * editor's to change.
 *
 * NOT LINKED FROM THE FOOTER, which matches the site being replaced — the live
 * footer does not link it either. It is listed on `/sitemap/`, the page whose
 * whole job is to list every URL this site serves.
 */
export async function getEditorialGuidelinesPage(): Promise<LegalPage> {
  const page = await once("sitePage:editorial", async () =>
    required(
      await sanityClient.fetch(EDITORIAL_PAGE_QUERY),
      "Editorial Guidelines",
      "Pages → Utility pages"
    )
  );

  const updated = required(page.updated, "Editorial Guidelines' last-reviewed stamp");
  return {
    title: page.title,
    body: page.body as PortableTextBlock[],
    // Coalesced on their own lines rather than in a cast, for the reason
    // `getPrivacyPolicyPage` gives: the schema leaves both optional because the
    // sitemap and the 404 have no stamp.
    updatedAt: required(updated.at, "Editorial Guidelines' last-reviewed date"),
    updatedLabel: required(updated.label, "Editorial Guidelines' last-reviewed label"),
  };
}

/**
 * The HTML sitemap at `/sitemap/`, which the footer links.
 *
 * NOT `sitemap.xml`, and the difference is the point. An XML sitemap is a
 * crawler file, referenced from robots.txt rather than from a footer, and every
 * URL in it is built from `site:` in astro.config.mjs — now settled on www, so
 * the ~330 absolute URLs it would generate are no longer a guess. It still
 * belongs to `/new-seo-setup` with robots.txt and the canonical layer, which is
 * where HANDOFF.md files it; what is left there is the work, not a decision.
 *
 * What the footer wants, and what this is, is the human page: every URL the
 * site serves, grouped, on one page a visitor can actually read.
 *
 * THE GROUPS ARE NOT STORED. They are composed in `src/pages/sitemap.astro`
 * from the getters that already own each collection — the practice-area
 * directory, the blog feed, the footer nav — because a second hand-maintained
 * list of every page on the site is a list that goes stale the first time
 * anything is added. Only the page's own copy is a field.
 */
export async function getSitemapPage(): Promise<SitePage> {
  const page = await once("sitePage:sitemap", async () =>
    required(await sanityClient.fetch(SITEMAP_PAGE_QUERY), "Sitemap", "Pages → Utility pages")
  );
  return { title: page.title, lede: page.lede ?? undefined, body: page.body as PortableTextBlock[] };
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
  const page = await once("sitePage:notFound", async () =>
    required(await sanityClient.fetch(NOT_FOUND_PAGE_QUERY), "404", "Pages → Utility pages")
  );
  return {
    title: page.title,
    lede: page.lede ?? undefined,
    body: page.body as PortableTextBlock[],
    linksTitle: required(page.linksTitle, "the 404's heading above its links"),
    links: page.links,
  };
}
