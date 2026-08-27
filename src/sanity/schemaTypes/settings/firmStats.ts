// The dark "by the numbers" band. A singleton.
//
// A SINGLETON RATHER THAN PAGE CONTENT because seven of the fourteen comps
// carry this band with identical figures, and four numbers duplicated across
// seven pages is four numbers that will disagree within a year.
//
// The "$70M+" and "20 Years" figures are unverified claims the firm has to
// stand behind. The marker for that lives in `src/data/stats.ts` and NOT here:
// one launch item wants one marker, or closing it leaves the other behind and
// the pre-launch grep counts it twice. Same reason this file does not repeat
// the reasoning — that is in stats.ts too.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { BarChartIcon } from "@sanity/icons/BarChart";

export const firmStats = defineType({
  name: "firmStats",
  title: "Firm Stats",
  type: "document",
  icon: BarChartIcon,
  fields: [
    defineField({
      name: "stats",
      title: "Statistics",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "big",
              title: "Figure",
              type: "string",
              description: "The number itself — \"$70M+\", \"No Fee\".",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: "The line under it — \"Recovered for clients\".",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "big", subtitle: "label" } },
        },
      ],
      description:
        "The band is drawn for four. Fewer leaves gaps and more wraps to a second row.",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((stats) =>
            Array.isArray(stats) && stats.length === 4
              ? true
              : "The band is designed for exactly four figures."
          )
          .warning(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Firm Stats" }),
  },
});
