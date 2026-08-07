// Date presentation, kept out of the data layer.
//
// Records carry ISO dates because that is what they are — `blogPost` gets a
// `datetime` field in Sanity, and the post template's JSON-LD and the sitemap
// both need it machine-readable. Turning one into "June 23, 2026" is
// presentation, and the data modules are free of that by rule.

/**
 * "2026-06-23" → "June 23, 2026", the long US form the comps and the live site
 * both use.
 *
 * PINNED TO UTC. `new Date("2026-06-23")` parses as UTC midnight, so formatting
 * it in any timezone west of Greenwich renders the day before — the build
 * machine's timezone would silently decide the date on a published post.
 */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
