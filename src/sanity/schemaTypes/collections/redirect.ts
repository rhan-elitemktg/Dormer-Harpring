// An editor-managed redirect.
//
// WHY THIS EXISTS. SEO specialists rename and retire pages constantly, and each
// one needs a 301 or the ranking is lost. Every redirect on this site until now
// has been a code change — `src/data/redirects.ts`, a commit, a deploy — which
// makes a five-second decision a developer's afternoon.
//
// THE SPLIT, DECIDED DELIBERATELY: the 196 rules in `data/redirects.ts` STAY IN
// CODE. They are migration FACTS — what the WordPress site answered at cutover,
// derived by an audit on a specific day — not editorial decisions, and 45% of
// that file is the reasoning for them. Moving them here would put 196 rules an
// editor can delete in front of them, and those rules are currently holding the
// rankings of ~46 live URLs. This type holds what the SEO team adds FROM NOW
// ON. Both are applied at the edge; see `bulk-redirects.json.ts`.
//
// THE VALIDATION IS WHERE THE VALUE IS. A redirect is three text fields and
// almost all of the ways to get it wrong are invisible until traffic drops:
// pointing one at a page that still exists takes that page off the site,
// because Vercel evaluates redirects BEFORE the filesystem. Every message below
// is written for somebody who does not read the codebase.
//
// ERRORS ARE SAFE HERE, unlike the length rules on the `seo` object. Those are
// `.warning()` because publishing fires the deploy hook and a blocking error
// over a 62-character title would stop the whole site rebuilding. An invalid
// redirect blocks publishing ONE document and nothing else.
//
// NO `sanity:client` IMPORT, DIRECTLY OR TRANSITIVELY. The Sanity CLI parses
// this file during `npm run typegen`, where that Vite virtual module does not
// resolve. `lib/routePaths` and `data/redirects` are both free of it — checked,
// not assumed — which is why the collision checks can read them. Inside a
// validator, the live dataset is reached through `context.getClient()`.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
import { isReservedPath, normalizePath } from "../../../lib/routePaths";
import { getRedirects } from "../../../data/redirects";

/** Pinned, matching the client in astro.config.mjs — GROQ behaviour is dated. */
const API_VERSION = "2026-08-01";

/** The code-owned table, read once per Studio session rather than per keystroke. */
let codeSources: Set<string> | null = null;
async function getCodeSources(): Promise<Set<string>> {
  if (!codeSources) {
    const rules = await getRedirects();
    codeSources = new Set(rules.map((rule) => normalizePath(rule.from)));
  }
  return codeSources;
}

export const redirect = defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: "source",
      title: "Old URL",
      type: "string",
      description:
        "The page someone is trying to reach, as a path starting with / — for example " +
        "/old-page-name. Leave off the https://www.denvertrial.com part.",
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true;
          const trimmed = value.trim();

          if (/^https?:\/\//i.test(trimmed)) {
            return "Enter just the path, starting with / — not the whole web address. For https://www.denvertrial.com/old-page/ you would enter /old-page/.";
          }
          if (!trimmed.startsWith("/")) {
            return "Start with a / — for example /old-page-name.";
          }

          const path = normalizePath(trimmed);

          /* THE ONE THAT CAN TAKE A PAGE OFF THE SITE. Vercel matches redirects
             before it looks for a file, so this is not a tidiness rule. */
          if (isReservedPath(path)) {
            return `${trimmed} is a page this site still has. A redirect would take it off the site — visitors and Google would be sent away from a page that works. Use a URL that no longer exists.`;
          }

          if ((await getCodeSources()).has(path)) {
            return `${trimmed} is already redirected by the site's built-in list of old addresses, set up when the site moved over. Adding it again here would do nothing. If it is going to the wrong place, ask a developer.`;
          }

          /* Duplicates. Scoped to published documents so an editor is not
             blocked by their own draft; `_id` comparison strips the drafts.
             prefix so a document never collides with itself. */
          const client = context.getClient({ apiVersion: API_VERSION });
          const id = (context.document?._id ?? "").replace(/^drafts\./, "");
          const clash = await client.fetch<string | null>(
            `*[_type == "redirect" && !(_id in path("drafts.**")) && _id != $id && source == $source][0]._id`,
            { id, source: trimmed }
          );
          if (clash) {
            return `There is already a redirect for ${trimmed}. Edit that one instead of adding a second — two rules for the same address would fight each other.`;
          }

          /* A page that exists as a practice area, blog post or attorney bio.
             These are documents rather than routes, so `isReservedPath` cannot
             see them. A WARNING rather than an error: an editor may be
             deliberately retiring the page in the same session, and blocking
             that would make the tool the obstacle. */
          const slug = path.replace(/^\//, "");
          const live = await client.fetch<string | null>(
            `*[_type in ["practiceArea", "blogPost", "featuredPracticeArea"] && slug.current == $slug][0]._id`,
            { slug }
          );
          if (live) {
            return {
              message: `There is still a page at ${trimmed}. If you are about to delete or unpublish it, this is fine — otherwise the redirect will take a working page off the site, and it will be skipped until that page is gone.`,
              level: "warning",
            };
          }

          return true;
        }),
    }),

    defineField({
      name: "destination",
      title: "Redirect to",
      type: "string",
      description:
        "Where to send them instead. A path on this site like /new-page/, or a full address " +
        "on another site.",
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true;
          const trimmed = value.trim();
          const external = /^https?:\/\//i.test(trimmed);
          if (!external && !trimmed.startsWith("/")) {
            return "Start with a / for a page on this site, or https:// for another site.";
          }

          const doc = context.document as { source?: string } | undefined;
          const source = (doc?.source ?? "").trim();
          if (source && !external && normalizePath(source) === normalizePath(trimmed)) {
            return "This sends the page to itself, which would loop forever. Choose a different destination.";
          }

          if (external) return true;

          /* A chain — the destination is itself redirected somewhere else. It
             works, but every hop is slower for a visitor and dilutes what
             Google passes on. A warning, because the fix (point at the final
             address) may not be obvious yet. */
          const dest = normalizePath(trimmed);
          if ((await getCodeSources()).has(dest)) {
            return {
              message: `${trimmed} is itself redirected somewhere else, so visitors would be bounced twice. Point this straight at the final page instead.`,
              level: "warning",
            };
          }
          const client = context.getClient({ apiVersion: API_VERSION });
          const onward = await client.fetch<string | null>(
            `*[_type == "redirect" && !(_id in path("drafts.**")) && source == $dest][0].destination`,
            { dest: trimmed }
          );
          if (onward) {
            return {
              message: `${trimmed} is itself redirected to ${onward}, so visitors would be bounced twice. Point this straight at ${onward} instead.`,
              level: "warning",
            };
          }
          return true;
        }),
    }),

    defineField({
      name: "permanent",
      title: "Permanent",
      type: "boolean",
      initialValue: true,
      description:
        "ON means the page has moved for good and search engines should transfer its ranking " +
        "to the new address — this is almost always what you want. Turn it OFF only for a " +
        "temporary diversion you intend to undo.",
    }),
  ],

  preview: {
    select: { source: "source", destination: "destination", permanent: "permanent" },
    prepare: ({ source, destination, permanent }) => ({
      title: source || "(no old URL)",
      /* The arrow rather than a label: an editor scanning this list is checking
         where things GO, and "301" means nothing to them. */
      subtitle: `→ ${destination || "(nowhere)"}${permanent === false ? "  ·  temporary" : ""}`,
    }),
  },
});
