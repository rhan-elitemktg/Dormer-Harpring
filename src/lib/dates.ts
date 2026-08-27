// Date presentation, kept out of the data layer.
//
// Records carry ISO dates because that is what they are — `blogPost` gets a
// `datetime` field in Sanity, and the post template's JSON-LD and the sitemap
// both need it machine-readable. Turning one into "June 23, 2026" is
// presentation, and the data modules are free of that by rule.

/**
 * An ISO string with an explicit timezone, so `new Date()` cannot guess.
 *
 * ALL 580 IMPORTED TIMESTAMPS ARRIVE WITHOUT ONE — WordPress's REST `date`
 * field is the site's own wall clock, written `2016-05-10T21:46:00` with no
 * offset. JavaScript parses that form as the RUNNING MACHINE'S local time, so
 * the same content rendered a different day depending on where it was built:
 * on Vercel (UTC) that post is "May 10, 2016"; on a laptop in Denver it was
 * "May 11, 2016". Eleven of the 580 sit at 19:00 or later and cross midnight
 * that way.
 *
 * A date-only string (`2026-06-23`, what the hand-authored records carry) is
 * ALREADY parsed as UTC by the spec, so it must be left alone — `2026-06-23Z`
 * is not a valid date at all and yields `Invalid Date`.
 *
 * So: a `T` with no trailing `Z` or `±HH:MM` is a wall clock, and the wall
 * clock is the firm's own. Reading it as UTC and formatting in UTC is what
 * makes the CALENDAR DATE the fixed thing, which is the only part of these
 * timestamps the site ever renders.
 */
function withZone(iso: string): string {
  if (!iso.includes("T")) return iso;
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
}

/**
 * "2026-06-23" → "June 23, 2026", the long US form the comps and the live site
 * both use.
 *
 * PINNED TO UTC, at both ends. `new Date("2026-06-23")` parses as UTC midnight,
 * so formatting it anywhere west of Greenwich renders the day before; and an
 * offset-less timestamp parses as local, so reading it anywhere west of
 * Greenwich renders the day after. `withZone` closes the second half — without
 * it the build machine's timezone silently decides the date on a published post.
 */
export function formatPostDate(iso: string): string {
  return new Date(withZone(iso)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
