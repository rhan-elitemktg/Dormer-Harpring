// One verdict or settlement.
//
// The largest hand-authored set on the site: 89 on /results, seven more on
// /co-counsel and three on the homepage.
//
// THREE LISTS, NOT ONE, AND THE DUPLICATES ARE REAL. Six of the co-counsel
// seven appear in the archive in the SAME words, and three of the homepage's
// appear there in DIFFERENT ones — the King Soopers slip-and-fall is
// "Slip and Fall on Melted Snow / Denied / $2.1M" in the archive and
// "Slip & Fall / $250K offered / $2.1M" on the homepage. Both are the comps'.
//
// They are migrated FAITHFULLY rather than merged, and that is a deliberate
// refusal: merging means choosing which wording the firm publishes about a real
// case it really won, and that is the firm's call, not a migration's. What the
// move does do is put the duplicates side by side in one list where they can
// actually be seen, which is how the decision gets made.
//
// TODO(launch): reconcile the three differently-worded pairs with the firm,
// then delete the loser and point the homepage at the survivor.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CaseIcon } from "@sanity/icons/Case";

export const caseResult = defineType({
  name: "caseResult",
  title: "Case Result",
  type: "document",
  icon: CaseIcon,
  fields: [
    defineField({
      name: "tag",
      title: "Case type",
      type: "string",
      description: 'The kind of case — "Rear-End Car Accident".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "recovered",
      title: "Recovered",
      type: "string",
      description: 'The figure, or the word "Confidential".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "offered",
      title: "Offered before we took over",
      type: "string",
      description: 'The insurer\'s offer. "Denied" and "—" are both in use.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "badge",
      title: "Outcome",
      type: "string",
      description: "The pill on the card.",
      options: {
        list: [
          { title: "Trial Win", value: "Trial Win" },
          { title: "Settlement", value: "Settlement" },
          { title: "Judgment", value: "Judgment" },
          { title: "Trial Counsel", value: "Trial Counsel" },
          { title: "Co-Counsel", value: "Co-Counsel" },
          { title: "Local Counsel", value: "Local Counsel" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "wonInCourt",
      title: "Won in a courtroom",
      type: "boolean",
      initialValue: false,
      description:
        "Fills the pill in rather than outlining it — won at trial rather than negotiated. " +
        "SEPARATE from the outcome above, because the two do not track: a Trial Counsel " +
        "result may be either.",
    }),
    defineField({
      name: "story",
      title: "What happened",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shownOn",
      title: "Appears on",
      type: "string",
      description:
        "Which list this record belongs to. Some cases are currently in two lists in " +
        "different words — see the note on this type.",
      options: {
        list: [
          { title: "Results archive", value: "results" },
          { title: "Co-Counsel", value: "co-counsel" },
          { title: "Homepage", value: "home" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description: "Low numbers first, within its list. The archive reads largest recovery first.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    { name: "position", title: "Position", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "tag", recovered: "recovered", shownOn: "shownOn" },
    prepare: ({ title, recovered, shownOn }) => ({
      title: `${title} — ${recovered}`,
      subtitle: shownOn,
    }),
  },
});
