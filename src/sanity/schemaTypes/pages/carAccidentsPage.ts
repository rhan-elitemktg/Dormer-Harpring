// /denver-car-accident-lawyer/ — the heavy hand-authored detail page. A
// singleton, and by some distance the largest document in this dataset.
//
// THIS IS A PAGE, NOT A PRACTICE AREA, and the difference is why it gets its own
// document rather than being one of the 104. `src/pages/[slug].astro` unions
// three page kinds and this one is `area-detail` — a hand-authored one-off, the
// only one there is, explicitly not a variant of the imported `area-page`s whose
// FAQs and bodies arrive from WordPress.
//
// FIFTEEN NAMED SECTIONS, NOT A PAGE BUILDER, and that is the whole modelling
// call. Each section below is bound to a component that draws it one way: the
// triage rows are a coloured-pill list, the timeline is a numbered rail over a
// phase table, the results cards put an "offered" figure beside a "recovered"
// one. An array of interchangeable blocks would let an editor reorder or delete
// the thing that made the design work, and this design is the second one this
// page has had — the first was 31 sections and it was cut to 17.
//
// THE COST IS THAT ADDING A SECTION IS A CODE CHANGE. That cost is the
// guarantee. It is the same trade the navigation singleton makes with its three
// named menus.
//
// TABBED, because sixteen top-level fields in one form is a scroll nobody
// finishes. The tabs follow the page top to bottom.
//
// WHAT IS NOT HERE
//
//   the page's URL and its join key   routing, and `routePaths.ts` owns URLs
//   the section anchors               `CA_SECTION_IDS` in data/carAccidents.ts,
//                                     read by BOTH the nav's hrefs and the
//                                     sections' own ids — two things that must
//                                     agree, so one place
//   the page header photograph        art-directed band art, like every other
//                                     page's; see the note in `aboutPage`
//   the "Why us" pair and the         same — two crops chosen by `media`, and a
//   timeline's photograph             band backdrop
//   the six award badges' artwork     `award` documents own the image AND its
//                                     alt text; this page owns only the ORDER
//   the testimonial on the video      a `testimonial` document owns the client's
//   result card                       portrait, pull quote and film
//   the map's title                   built from the firm's name in Firm Details
//
// WHICH PHOTOGRAPHS MOVED, in one rule: a photograph belonging to a CARD whose
// copy is editable moves with that card — the two video posters, the two
// feature-card posters, the reviewer's portrait. A photograph that is the page's
// or a band's backdrop stays a local import. One file lands on both sides of
// that line (`consult.jpg` is the timeline's backdrop and a feature card's
// poster) and that is fine: the asset store deduplicates on the file's hash.
//
// THREE CROSS-REFERENCES BECAME REAL REFERENCES HERE, which closes the
// `TODO(sanity)` the `link` type and the `award`/`testimonial` schemas have been
// carrying. This page used to name an award, a testimonial and five attorneys by
// STRING key, and a renamed key would have silently rendered the wrong badge.
// It cannot now: a reference does not dangle.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { faqItemFields, faqItemPreview } from "./faqItemFields";
import { validateHref } from "../objects/link";

/** A heading and a paragraph — four sections draw a list of these. */
const blockFields = [
  defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
  defineField({ name: "body", type: "text", rows: 3, validation: (rule) => rule.required() }),
];

const blockPreview = { select: { title: "title", subtitle: "body" } };

/**
 * A statute citation.
 *
 * TODO(launch): every one of these points at Justia's index for the Colorado
 * code rather than at the section it names, so all five land in the same place.
 * The firm should confirm the deep links — and whether Justia is the source it
 * wants cited at all, against Casetext or the state's own site.
 */
const sourceNote = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "object",
    description: "The citation line under the section.",
    fields: [
      defineField({
        name: "label",
        type: "string",
        description: 'The word before the list — "Source:" or "Sources:".',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "items",
        title: "Citations",
        type: "array",
        of: [
          {
            type: "object",
            name: "statuteSource",
            fields: [
              defineField({
                name: "label",
                type: "string",
                description: 'The citation itself — "C.R.S. 10-4-635".',
                validation: (rule) => rule.required(),
              }),
              defineField({ name: "note", type: "string" }),
              defineField({
                name: "href",
                title: "Link to the statute",
                type: "string",
                description: "Leave empty to render the citation as plain text.",
                validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
              }),
            ],
            preview: { select: { title: "label", subtitle: "href" } },
          },
        ],
        validation: (rule) => rule.required().min(1),
      }),
    ],
  });

/**
 * A video panel — a poster, a caption and the film it opens.
 *
 * TODO(video): both panels on this page still carry the stand-in Wistia id.
 * `YOUTUBE_ORIGINS` in `src/lib/video.ts` names the originals.
 */
const videoPanel = defineField({
  name: "video",
  title: "Video panel",
  type: "object",
  fields: [
    defineField({
      name: "poster",
      title: "Poster frame",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Poster alt text",
      type: "string",
      description:
        "Leave EMPTY if the caption beside it already says what the frame shows — an empty " +
        "alt tells a screen reader to skip a decorative image rather than read a filename.",
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "length",
      type: "string",
      description: 'Runtime, as shown — "1:14".',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "film", type: "videoRef", validation: (rule) => rule.required() }),
  ],
  validation: (rule) => rule.required(),
});

/** A figure and its label — three sections draw a row of these. */
const statFields = [
  defineField({
    name: "big",
    title: "Figure",
    type: "string",
    validation: (rule) => rule.required(),
  }),
  defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
];

export const carAccidentsPage = defineType({
  name: "carAccidentsPage",
  title: "Car Accidents",
  type: "document",
  icon: WarningOutlineIcon,
  groups: [
    { name: "top", title: "Top of page", default: true },
    { name: "case", title: "Do I have a case?" },
    { name: "firm", title: "Why us" },
    { name: "process", title: "What happens next" },
    { name: "more", title: "More & closing" },
    { name: "faqs", title: "FAQs" },
  ],
  fields: [
    // ── Top of page ──────────────────────────────────────────────────────────
    defineField({
      name: "seo",
      title: "Search listing",
      type: "seo",
      group: "top",
      description: "What this page's entry in a search result says.",
    }),
    defineField({
      name: "hero",
      type: "object",
      group: "top",
      description: "Everything above the section nav. Its photograph is not editable.",
      fields: [
        defineField({
          name: "trail",
          title: "Breadcrumbs",
          type: "array",
          description: "The last one is this page and has no link.",
          of: [
            {
              type: "object",
              name: "crumb",
              options: { columns: 2 },
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  description: "Leave empty on the last crumb — it is the page you are on.",
                  validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
                }),
              ],
              preview: { select: { title: "label", subtitle: "href" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "proof",
          title: "Proof figures",
          type: "array",
          description: "The three figures under the lede.",
          of: [
            {
              type: "object",
              name: "heroProof",
              fields: [
                ...statFields,
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  description: "Optional — a figure with no link is not clickable.",
                  validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
                }),
                defineField({
                  name: "google",
                  title: "Show the Google mark and stars",
                  type: "boolean",
                  description: "On the review figure only.",
                }),
              ],
              preview: { select: { title: "big", subtitle: "label" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "telLabel",
          title: "Before the phone number",
          type: "string",
          description: "The number itself comes from Firm Details.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "photoAlt",
          title: "Header photograph alt text",
          type: "string",
          description:
            "The photograph itself is not editable — it is art-directed in two crops — but " +
            "what a screen reader says in its place is.",
          validation: (rule) => rule.required(),
        }),
        /*
         * THE "REVIEWED BY" LINE — E-E-A-T signalling, and the reason this page
         * names a specific attorney rather than the firm.
         *
         * A REFERENCE, so the name and the link to the bio come from the roster
         * and cannot drift. The portrait beside it is a larger crop than the
         * roster's, so it is its own field.
         *
         * THE COMP'S FIVE CREDENTIAL LINES ARE NOT PORTED. It draws a <details>
         * holding "Licensed in Colorado since 2006", the $10M verdict and three
         * awards; by request this is one line and a link instead, and all five
         * facts are already on that bio.
         */
        defineField({
          name: "reviewer",
          title: "Reviewed by",
          type: "object",
          fields: [
            defineField({
              name: "member",
              title: "Attorney",
              type: "reference",
              to: [{ type: "teamMember" }],
              description: "Their name and the link to their bio are read from this.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "portrait",
              type: "image",
              options: { hotspot: true },
              description: "A larger crop than the one on their bio card.",
              validation: (rule) => rule.required(),
            }),
            // TODO(launch): the comp's date. It has to move when the copy is
            // actually reviewed.
            defineField({
              name: "updated",
              title: "Last reviewed",
              type: "string",
              description: 'As shown — "Updated July 2026". Typed, not a date picker, because ' +
                "the design prints the words as well as the month.",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    /*
     * THE STICKY SECTION NAV. Its DESTINATIONS are not stored: each item points
     * at one of the page's own anchors, which `CA_SECTION_IDS` in
     * `data/carAccidents.ts` owns because the sections' own `id` attributes read
     * the same object. Two things that must agree get one source.
     */
    defineField({
      name: "nav",
      title: "Section nav",
      type: "object",
      group: "top",
      description: "The sticky row of jump links. Which sections it lists is set in code.",
      fields: [
        defineField({
          name: "items",
          title: "Labels",
          type: "array",
          description:
            "One per jump link, in order. Each is bound to a section of the page — adding or " +
            "removing one is a code change, because a link needs a section to point at.",
          of: [
            {
              type: "object",
              name: "navItem",
              options: { columns: 2 },
              fields: [
                defineField({
                  name: "section",
                  title: "Jumps to",
                  type: "string",
                  readOnly: true,
                  description: "Fixed. The anchors live in code beside the sections themselves.",
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "label", subtitle: "section" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),

    // ── Do I have a case? ────────────────────────────────────────────────────
    defineField({
      name: "triage",
      title: "Recently injured band",
      type: "object",
      group: "case",
      description: "The five coloured rows near the top of the page.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        videoPanel,
        defineField({
          name: "help",
          title: "Prompt beside the video",
          type: "object",
          fields: [
            defineField({ name: "text", type: "text", rows: 2, validation: (rule) => rule.required() }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "rows",
          type: "array",
          of: [
            {
              type: "object",
              name: "triageRow",
              fields: [
                defineField({
                  name: "tone",
                  title: "Pill colour",
                  type: "string",
                  description: "What kind of thing this row is. Picks the tag's colour.",
                  options: {
                    list: [
                      { title: "Money", value: "money" },
                      { title: "Deadline", value: "deadline" },
                      { title: "Warning", value: "warn" },
                    ],
                  },
                }),
                defineField({
                  name: "tag",
                  title: "Pill text",
                  type: "string",
                  description: "Leave empty for no pill.",
                }),
                defineField({ name: "question", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "ctaHref",
                  title: "Destination",
                  type: "string",
                  description: "Usually an anchor to a section further down — #know, #case.",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
                defineField({
                  name: "stat",
                  title: "Figure beside it",
                  type: "object",
                  options: { columns: 2 },
                  fields: statFields,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "question", subtitle: "tag" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        sourceNote("sources", "Citations"),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "takeaways",
      title: "Short version band",
      type: "object",
      group: "case",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 2, validation: (rule) => rule.required() }),
        defineField({
          name: "items",
          type: "array",
          of: [{ type: "object", name: "takeaway", fields: blockFields, preview: blockPreview }],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "criteria",
      title: "Do I have a case band",
      type: "object",
      group: "case",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        videoPanel,
        defineField({
          name: "items",
          title: "The three tests",
          type: "array",
          of: [{ type: "object", name: "criterion", fields: blockFields, preview: blockPreview }],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "note",
          title: "Closing line",
          type: "text",
          rows: 2,
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    // ── Why us ───────────────────────────────────────────────────────────────
    defineField({
      name: "lawyers",
      title: "Our lawyers band",
      type: "object",
      group: "firm",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 2, validation: (rule) => rule.required() }),
        /*
         * THE CREDENTIAL LINE IS THIS PAGE'S, NOT THE ROSTER'S. It is written
         * about car accident work specifically — "Litigates MedPay and
         * first-party coverage disputes" — which is exactly the per-practice-area
         * copy a detail page owns and a team member cannot.
         *
         * The rail's length is open: adding or removing an attorney extends or
         * shortens the track rather than reflowing a grid.
         */
        defineField({
          name: "attorneys",
          type: "array",
          description: "Drag to reorder. Each card's line is about crash work specifically.",
          of: [
            {
              type: "object",
              name: "crashLawyer",
              fields: [
                defineField({
                  name: "member",
                  title: "Attorney",
                  type: "reference",
                  to: [{ type: "teamMember" }],
                  description: "Their name, role, portrait and bio link all come from this.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "cred",
                  title: "What they do on crash cases",
                  type: "text",
                  rows: 2,
                  description: "One line, specific to car accidents. Not their general bio.",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "member.name", subtitle: "cred" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "moreLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "moreHref",
          title: "Destination",
          type: "string",
          validation: (rule) => rule.required().custom(validateHref),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    /*
     * THE AWARD BADGES — ORDER ONLY.
     *
     * `award` documents own the artwork AND its alt text, and the comp's visible
     * captions and awarding-body links are both gone by request. So there is
     * nothing left for this page to hold but which six, in what order.
     *
     * A REFERENCE RATHER THAN A KEY STRING, which is what the `award` schema's
     * `TODO(sanity)` was waiting for. This page used to name each badge by key,
     * and renaming a key would have rendered the wrong badge.
     */
    defineField({
      name: "credentials",
      title: "Awards band",
      type: "object",
      group: "firm",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "badges",
          title: "Which awards, in order",
          type: "array",
          description:
            "The artwork and its alt text belong to the award itself, in Collections → Awards. " +
            "This list is only which ones appear here and in what order.",
          of: [{ type: "reference", to: [{ type: "award" }] }],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "disclaimer",
          type: "text",
          rows: 3,
          description: "A legal notice about awarding organisations. Check before rewording it.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "whyFirm",
      title: "Why Dormer Harpring band",
      type: "object",
      group: "firm",
      description: "Its two photographs are one image in two crops and are not editable.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "stats",
          title: "Figures",
          type: "array",
          of: [
            {
              type: "object",
              name: "firmStat",
              options: { columns: 2 },
              fields: statFields,
              preview: { select: { title: "big", subtitle: "label" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "disclaimer",
          type: "text",
          rows: 3,
          description: "What the figures above are based on. A claim the firm has to stand behind.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "columns",
          title: "Numbered columns",
          type: "array",
          of: [
            {
              type: "object",
              name: "whyColumn",
              fields: [
                defineField({
                  name: "n",
                  title: "Number",
                  type: "string",
                  description: 'As shown — "01".',
                  validation: (rule) => rule.required(),
                }),
                ...blockFields,
              ],
              preview: { select: { title: "title", subtitle: "n" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "ctaHref",
          title: "Destination",
          type: "string",
          validation: (rule) => rule.required().custom(validateHref),
        }),
        defineField({
          name: "photoAlt",
          title: "Photograph alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    /*
     * THE RESULTS CARDS. Two carry figures and a story; the third is a client's
     * filmed review, which is a REFERENCE to the testimonial that already holds
     * that client's portrait, pull quote and film. Storing them again here would
     * be a fourth copy of each.
     */
    defineField({
      name: "results",
      title: "Results band",
      type: "object",
      group: "firm",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "offeredLabel",
          type: "string",
          description: "Above the insurer's first number.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "recoveredLabel",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "stories",
          title: "Cards",
          type: "array",
          of: [
            {
              type: "object",
              name: "resultStory",
              fields: [
                defineField({ name: "offered", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "recovered", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "story",
                  type: "text",
                  rows: 3,
                  description: "On the two figure cards. The video card carries a quote instead.",
                }),
                defineField({ name: "changed", title: "What changed", type: "text", rows: 2 }),
                defineField({
                  name: "review",
                  title: "Client's filmed review",
                  type: "reference",
                  to: [{ type: "testimonial" }],
                  description:
                    "Set on the one card that is a video. Their portrait, quote and film all " +
                    "come from the testimonial — this card adds nothing of its own.",
                }),
              ],
              preview: { select: { title: "title", subtitle: "recovered" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "disclaimer",
          type: "text",
          rows: 3,
          description: "The prior-results notice. Legal copy — check before rewording it.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    // ── What happens next ────────────────────────────────────────────────────
    defineField({
      name: "timeline",
      title: "What happens next band",
      type: "object",
      group: "process",
      description: "Its photograph is a band backdrop and is not editable.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "lede",
          type: "text",
          rows: 3,
          // The comp drew a second, scene-setting paragraph above this one and
          // it was cut by request. This field used to be called `ledeStrong`,
          // which only meant anything in contrast to that paragraph — and named
          // a colour besides.
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "steps",
          title: "Numbered rail",
          type: "array",
          of: [
            {
              type: "object",
              name: "timelineStep",
              fields: [
                defineField({
                  name: "n",
                  title: "Number",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                ...blockFields,
              ],
              preview: { select: { title: "title", subtitle: "n" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "phases",
          title: "Phase table",
          type: "array",
          of: [
            {
              type: "object",
              name: "timelinePhase",
              fields: [
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "when",
                  title: "How long",
                  type: "string",
                  description: 'As shown — "weeks to months".',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "title", subtitle: "when" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "photoAlt",
          title: "Photograph alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "points",
          title: "Ticked list",
          type: "array",
          of: [{ type: "string" }],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "crashTypes",
      title: "Crash types band",
      type: "object",
      group: "process",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "tiles",
          type: "array",
          of: [
            {
              type: "object",
              name: "crashTile",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "linkLabel", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  description:
                    "Leave EMPTY where no page exists yet — the tile then renders unlinked " +
                    "rather than dead. Two of these are waiting on pages.",
                  validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
                }),
              ],
              preview: { select: { title: "name", subtitle: "href" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "denver",
      title: "Car accidents in Denver band",
      type: "object",
      group: "process",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "stats",
          title: "Figures",
          type: "array",
          // TODO(launch): all three of these figures are unsourced, and each
          // label ends in a literal "[year]" that renders as those five
          // characters. Both want the firm's answer before launch.
          description:
            'These three figures are UNSOURCED and each label still ends in a literal "[year]" ' +
            "that prints as those characters. Both need the firm's answer before launch.",
          of: [
            {
              type: "object",
              name: "denverStat",
              fields: [
                ...statFields,
                defineField({
                  name: "body",
                  type: "text",
                  rows: 2,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "big", subtitle: "label" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "corridors",
          title: "Roads",
          type: "array",
          of: [
            {
              type: "object",
              name: "corridor",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 2,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "name", subtitle: "body" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    // ── More & closing ───────────────────────────────────────────────────────
    /*
     * TWO "HERE IS THE SHORT ANSWER, THE LONG ONE IS AN ARTICLE" BANDS. They
     * share a shape and differ in one optional part each: the checklist draws
     * five illustrative steps, the fault band draws a labelled scale.
     */
    defineField({
      name: "checklistTeaser",
      title: "Checklist teaser",
      type: "object",
      group: "more",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "body", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "ctaHref",
          title: "Destination",
          type: "string",
          // TODO(content): a bare "#" today — the article does not exist. It is
          // the ninth and last placeholder link on this site, declared by count
          // in check-links.py.
          description:
            "A bare # is a PLACEHOLDER and must not ship. The link checker counts them and " +
            "fails when the count changes without being declared.",
          validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
        }),
        defineField({
          name: "steps",
          title: "Illustrative steps",
          type: "array",
          of: [
            {
              type: "object",
              name: "checklistStep",
              options: { columns: 2 },
              fields: [
                defineField({
                  name: "iconKey",
                  title: "Icon",
                  type: "string",
                  description:
                    "Must match a glyph in components/icons/. A key with no glyph draws an " +
                    "empty plate.",
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "label", subtitle: "iconKey" } },
            },
          ],
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "faultTeaser",
      title: "Comparative fault teaser",
      type: "object",
      group: "more",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "body", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "ctaHref",
          title: "Destination",
          type: "string",
          validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
        }),
        defineField({
          name: "scale",
          title: "Scale labels",
          type: "object",
          description: "The three points on the comparative-fault bar.",
          fields: [
            defineField({ name: "start", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "middle", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "end", type: "string", validation: (rule) => rule.required() }),
          ],
        }),
        sourceNote("source", "Citation"),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "more",
      title: "More on claims band",
      type: "object",
      group: "more",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "features",
          title: "Feature cards",
          type: "array",
          description: "The two large cards. Each has a poster frame.",
          of: [
            {
              type: "object",
              name: "moreFeature",
              fields: [
                ...blockFields,
                defineField({
                  name: "length",
                  type: "string",
                  description: 'Runtime, as shown — "2:05".',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "poster",
                  title: "Poster frame",
                  type: "image",
                  options: { hotspot: true },
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  description: "Leave empty where the article does not exist yet.",
                  validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
                }),
              ],
              preview: { select: { title: "title", subtitle: "body", media: "poster" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "cards",
          title: "Small cards",
          type: "array",
          of: [
            {
              type: "object",
              name: "moreCard",
              fields: [
                ...blockFields,
                defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  description: "Leave empty where the article does not exist yet.",
                  validation: (rule) => rule.custom((value) => (value ? validateHref(value) : true)),
                }),
              ],
              preview: blockPreview,
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "closing",
      title: "Closing band",
      type: "object",
      group: "more",
      description: "The map and the last call to action. The map's title is built from Firm Details.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "officeLabel",
          title: "Above the address",
          type: "string",
          description: "The address itself comes from Firm Details.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    // ── FAQs ─────────────────────────────────────────────────────────────────
    /*
     * TWELVE QUESTIONS THAT ONLY EVER RENDER HERE. They shared the `faq`
     * collection with the homepage's eight, split by a `shownOn` radio whose
     * only job was to undo the sharing; Phase 2f dropped both.
     */
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      group: "faqs",
      description: "The accordion. Drag to reorder — the top question opens first.",
      of: [{ type: "object", fields: faqItemFields, preview: faqItemPreview }],
      validation: (rule) => rule.required().min(1),
    }),
    /*
     * THE ACCORDION'S OWN HEADING, which is NOT the homepage's. The two
     * accordions render through one component and share four fields — the
     * button inside an answer, the ask card's copy and its portrait — so those
     * are read from the Homepage document and only what differs is here.
     */
    defineField({
      name: "faqSection",
      title: "FAQ band heading",
      type: "object",
      group: "faqs",
      description:
        "Only what differs from the homepage's accordion. The button inside an open answer " +
        "and the ask card at the foot are read from the Homepage document.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Car Accidents" }) },
});
