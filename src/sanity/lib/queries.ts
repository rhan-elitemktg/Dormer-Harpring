// Every GROQ query the site runs.
//
// ONE MODULE, AND `getStaticPaths` IS THE REASON. Astro hoists that function
// into its own module context, so a module-level `const QUERY = defineQuery(…)`
// in a page's frontmatter is NOT in scope inside it — the page throws
// `ReferenceError: QUERY is not defined` at request time, with a green build.
// Queries defined here are imported, which is in scope, and both `[slug].astro`
// files need that.
//
// It is also what `overloadClientMethods` reads: typegen scans for
// `defineQuery` calls and types `sanityClient.fetch(THAT_QUERY)` from the
// query's own text, so a projection's return type is derived rather than
// annotated. Run `npm run typegen` after changing anything here or the types
// describe the previous version.
//
// THE PROJECTIONS DO THE COALESCING. That division of labour predates Sanity
// here: the content files keep the source's shape and the getter reshapes.
// A projection is what does that after the swap, which is why these return the
// interface's shape rather than the document's.
import { defineQuery } from "groq";

/**
 * Firm-wide facts.
 *
 * FILTERED ON BOTH `_type` AND `_id`, and both earn their place. `_id` is what
 * the desk pins the singleton to and it is the cheapest possible lookup. `_type`
 * is what TYPEGEN needs: an id on its own tells it nothing about shape, so the
 * generated result type comes back as a union across every document type in the
 * dataset — one all-null variant per type — and every field reads as possibly
 * null no matter how the schema is validated. With `_type` the projection types
 * itself.
 *
 * `geo` is flattened out of Sanity's `geopoint` — that type carries `_type` and
 * an optional `alt` the site has no use for, and `FirmAddress`'s neighbours are
 * all flat.
 *
 * There is no `phoneE164` / `smsE164` here because there are no such fields:
 * both are derived from the displayed number in `data/site.ts`. See
 * `sanity/lib/phone.ts`.
 */
export const FIRM_DETAILS_QUERY = defineQuery(`*[_type == "firmDetails" && _id == "firmDetails"][0]{
  name,
  legalName,
  phone,
  sms,
  email,
  address{ street, unit, city, region, postalCode, country },
  "geo": { "lat": geo.lat, "lng": geo.lng },
  mapUrl,
  mapPlaceCid,
  hours,
  hoursDisplay,
  socials[]{ name, href },
  "directoryProfiles": coalesce(directoryProfiles, [])
}`);

/**
 * The three dropdown menus and the footer's lists.
 *
 * The main nav's SIX TOP-LEVEL ITEMS ARE NOT IN HERE. They are code-owned in
 * `data/navigation.ts` so an editor cannot rename, reorder or delete one — see
 * the note there. This query returns only what hangs beneath them.
 */
export const NAVIGATION_QUERY = defineQuery(`*[_type == "navigation" && _id == "navigation"][0]{
  "aboutMenu": coalesce(aboutMenu[]{ label, href }, []),
  "practiceAreasMenu": coalesce(practiceAreasMenu[]{ label, href }, []),
  "locationsMenu": coalesce(locationsMenu[]{ label, href }, []),
  "footerPracticeAreas": coalesce(footerPracticeAreas[]{ label, href }, []),
  "footerNav": coalesce(footerNav[]{ label, href }, []),
  "serviceAreas": coalesce(serviceAreas, [])
}`);

/**
 * The consultation band and the contact card — copy only.
 *
 * No phone number, no address, no email: every VALUE on those cards is derived
 * from Firm Details at render time. See `data/contact.ts`.
 */
export const CONTACT_SETTINGS_QUERY = defineQuery(`*[_type == "contactSettings" && _id == "contactSettings"][0]{
  eyebrow,
  title,
  "reassurances": coalesce(reassurances, []),
  callPrompt,
  callBadge,
  form{ title, lede, submitLabel, disclaimer },
  photoAlt,
  callCard{ label, note },
  textCard{ label, note },
  emailCard{ label, note },
  officeCard{ label, note },
  hours{ label, note }
}`);

/** The dark "by the numbers" band. */
export const FIRM_STATS_QUERY = defineQuery(`*[_type == "firmStats" && _id == "firmStats"][0]{
  "stats": coalesce(stats[]{ _key, big, label }, [])
}`);
