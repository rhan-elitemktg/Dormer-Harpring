/**
 * THE NINE CITIES, ONCE — the dropdown two document types file themselves under.
 *
 * It was a private const in `practiceArea.ts` until `featuredPracticeArea`
 * arrived needing the same list. Two copies of nine values is two places a
 * tenth city has to be added, and this file already carries that warning about
 * the DESK: a document whose city matches no group is invisible there, so the
 * schema's list and `GROUPED` in `sanity/structure` must be changed together.
 * A third place to keep in step was not worth the copy.
 *
 * THE ORDER IS THE DIRECTORY'S OWN, leading with the firm's city rather than
 * running alphabetically — the same order `/practice-areas` prints and the
 * desk groups by.
 *
 * ADDING A TENTH CITY IS THREE EDITS, not one: this list, `GROUPED` in
 * `sanity/structure/index.ts`, and a `city` document in Collections → Cities,
 * which is what `getCities()` reads for the sidebar heading. The first two are
 * a closed list an editor cannot escape; the third is the prose name.
 */
export const CITIES = [
  { title: "Denver", value: "denver" },
  { title: "Aurora", value: "aurora" },
  { title: "Boulder", value: "boulder" },
  { title: "Highlands Ranch", value: "highlands-ranch" },
  { title: "Lakewood", value: "lakewood" },
  { title: "Thornton", value: "thornton" },
  { title: "Greeley", value: "greeley" },
  { title: "Fort Collins", value: "fort-collins" },
  { title: "Grand Junction", value: "grand-junction" },
];

// NOT `as const`. Sanity's `options.list` takes a MUTABLE array, and a readonly
// tuple fails to assign to it — the schema then does not typecheck at all.
