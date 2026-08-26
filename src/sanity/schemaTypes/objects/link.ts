// The `link` annotation — the one way text becomes a link, anywhere.
//
// NAMED `link`, AND THE NAME IS LOAD-BEARING. `proseComponents` in
// `components/prose/components.ts` maps `mark.link` to `ProseLink.astro`, and
// an unmapped mark falls through SILENTLY — the words stay and the link
// disappears with no warning. The 290 imported documents already carry
// `markDefs: [{ _type: "link", _key, href }]` from the WordPress converter, so
// this shape is also what they upload as.
//
// ONE FIELD, `href`, AND NO `openInNewTab`. `ProseLink.astro` decides target
// and rel from the href itself — "the check is on the href rather than a flag,
// so an editor pasting a full URL gets it right". A boolean here would be a
// second source of truth for a fact the href already carries, and the two would
// drift the first time someone toggled one without editing the other.
//
// TODO(sanity): internal links become a `reference` in Phase 2. It cannot be
// declared yet — a `reference` with an empty `to` array is a schema error, and
// no page or collection document types exist until then. The validation below
// is the interim guard, and it is a real one: a Deploy-Hook rebuild runs
// `npm run build`, not `npm run check`, so `check:links` does not see an
// editor-typed href before it ships.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { LinkIcon } from "@sanity/icons/Link";

/**
 * Accepted href shapes, checked in the Studio at the moment of typing.
 *
 *   /about/            internal, absolute, WITH a trailing slash
 *   https://…          external
 *   tel:+13037563812   E.164 only — `tel: 303 747 4404` does not reliably dial,
 *                      and 68 imported hrefs were malformed in nine spellings
 *   mailto:…
 *   #anchor            same-page
 *
 * The trailing slash is not fussiness: `trailingSlash: "always"` in
 * astro.config.mjs, `"trailingSlash": true` in vercel.json and every helper in
 * `lib/routePaths.ts` all agree on it, and ~300 indexed legacy URLs carry one.
 * A slash-less internal href is a 308 the visitor pays for.
 */
export function validateHref(href: unknown): true | string {
  if (typeof href !== "string" || href.trim() === "") return "Add a link destination.";
  const value = href.trim();

  if (value.startsWith("#")) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(value)) return true;
  if (/^tel:\+[1-9]\d{1,14}$/.test(value)) return true;
  if (/^tel:/i.test(value)) {
    return "Phone links must be E.164 — tel:+13037563812, no spaces, brackets or dashes.";
  }
  if (value.startsWith("/")) {
    return value.endsWith("/") || /\.[a-z0-9]+$/i.test(value)
      ? true
      : `Internal links need a trailing slash — "${value}/" rather than "${value}".`;
  }
  return "Use a full URL (https://…) or an internal path starting and ending with /.";
}

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path like /about/ (with the trailing slash), a full https:// URL, " +
        "tel:+13037563812, mailto:… or #anchor. External links open in a new tab automatically.",
      validation: (rule) => rule.custom(validateHref),
    }),
  ],
});
