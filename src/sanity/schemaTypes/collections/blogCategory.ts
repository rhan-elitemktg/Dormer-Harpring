// A blog category — the taxonomy behind /news's tab row.
//
// TWENTY-THREE, IMPORTED FROM WORDPRESS, and the first type of Phase 3. A
// collection by the rule that governs this group: `/news` draws the tab row
// from it, every post card prints its category, and every post page and
// practice-area sidebar reads one. Change the title here and all of them follow.
//
// THE SLUG IS NOT DERIVABLE FROM THE TITLE, and it is not decoration either.
// Two of the twenty-three prove both halves: "Jury Trial Wins" is filed under
// `verdicts`, and "Auto Insurance & Accident Claims" under
// `auto-insurance-accident-claims` — the ampersand drops rather than becoming
// "and". The value is the legacy WordPress term slug, and 24 redirects in
// `src/data/redirects.ts` plus the tab filter in `src/scripts/blogFeed.ts` are
// keyed on it. So it is typed rather than generated, and the description says
// what breaks.
//
// NO `order` FIELD. The row is ordered by how many posts lead with each
// category, then alphabetically — see `getBlogCategories()`. That is derived,
// and a number an editor could set beside it would be a second answer to the
// same question.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { TagIcon } from "@sanity/icons/Tag";

export const blogCategory = defineType({
  name: "blogCategory",
  title: "Blog Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "Name",
      type: "string",
      description: 'As it appears on the tab and on every card — "Slip and Fall".',
      validation: (rule) => rule.required(),
    }),

    /*
     * NO `options.source`. The Generate button would offer `jury-trial-wins`
     * for the category whose real slug is `verdicts`, and one press of it
     * silently breaks a live redirect. An editor typing the value has to know
     * what it is; an editor pressing a button does not.
     */
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      description:
        "The legacy WordPress slug. This is a LIVE URL — /category/<slug>/ redirects into the " +
        "blog on it, and the tab filter matches on it. Changing it breaks both. It is often " +
        'not the name: "Jury Trial Wins" is filed under "verdicts".',
      options: { maxLength: 60 },
      validation: (rule) => rule.required(),
    }),

    /*
     * PROVENANCE, and it earns its place here where a `legacyKey` on
     * hand-authored content would not: WordPress still exists and can be
     * re-queried, so this is how a re-import matches on identity rather than on
     * a title someone has since edited.
     */
    defineField({
      name: "legacyId",
      title: "WordPress term ID",
      type: "number",
      description:
        "Identity on the legacy site, so a re-import can match this record after its name " +
        "changes. Not shown anywhere. Leave it alone.",
      readOnly: true,
    }),
  ],
  orderings: [
    { name: "title", title: "Name", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
