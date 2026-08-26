// One client's testimonial — filmed or written.
//
// ONE RECORD PER CLIENT, TWO PRESENTATIONS, and the merge was decided by the
// data rather than by preference. The homepage rail and the /testimonials page
// were two separate lists in the codebase, and they overlap:
//
//   The five VIDEO records are byte-identical across both — same video id, same
//   poster, same person. Keeping them as two records would put the firm's real
//   Wistia id in two places, so swapping the 44 stand-in ids would have to
//   happen twice and could half-happen. That is the "second phone number"
//   failure this codebase has already had once.
//
//   The three WRITTEN records that appear in both carry the SAME review with a
//   shorter pull quote and a trimmed body on the card. That is one review
//   edited for a smaller space, not two reviews.
//
// So a record holds the full review AND its card form, and two booleans say
// where it appears. A client who is only on one of the two pages simply leaves
// the other unticked.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CommentIcon } from "@sanity/icons/Comment";

const isVideo = ({ parent }: { parent?: { format?: string } }) => parent?.format !== "video";
const isWritten = ({ parent }: { parent?: { format?: string } }) => parent?.format !== "written";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: CommentIcon,
  groups: [
    { name: "review", title: "The review", default: true },
    { name: "placement", title: "Where it appears" },
  ],
  fields: [
    /*
     * STABLE, AND NAMED FROM ELSEWHERE. The heavy Car Accidents page keys one
     * of its result stories into a video review by this. Same shape as the
     * award key — see that type for what happened when it was dropped.
     *
     * TODO(sanity): becomes a real `reference` when carAccidents.ts moves.
     */
    defineField({
      name: "key",
      title: "Reference key",
      type: "slug",
      group: "review",
      description:
        "A short stable handle — evelyn, lisa-kelly. Another page names a specific review by " +
        "this, so changing it can break the build. Safe to leave alone.",
      options: { source: "name", maxLength: 40 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Client",
      type: "string",
      group: "review",
      description: 'As they should be credited — "Evelyn", "Chris and Lynn Collins".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "format",
      title: "Filmed or written",
      type: "string",
      group: "review",
      options: {
        list: [
          { title: "Filmed", value: "video" },
          { title: "Written", value: "written" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "video",
      title: "The film",
      type: "videoRef",
      group: "review",
      hidden: isVideo,
    }),
    defineField({
      name: "poster",
      title: "Poster frame",
      type: "image",
      group: "review",
      options: { hotspot: true },
      description:
        "The still behind the play button. These are the design package's portraits today; a " +
        "frame lifted from each film would beat them.",
      hidden: isVideo,
    }),
    defineField({
      name: "length",
      title: "Runtime",
      type: "string",
      group: "review",
      description: 'As shown on the poster — "2:14".',
      hidden: isVideo,
    }),

    defineField({
      name: "quote",
      title: "Pull quote",
      type: "text",
      rows: 3,
      group: "review",
      description:
        "The client's own words, set larger than the body. On the /testimonials page this is " +
        "what a filmed review shows beside the play button.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Full review",
      type: "text",
      rows: 5,
      group: "review",
      hidden: isWritten,
    }),
    defineField({
      name: "source",
      title: "Left on",
      type: "string",
      group: "review",
      initialValue: "google",
      description: "Drives the platform glyph on the card.",
      options: { list: [{ title: "Google", value: "google" }] },
      hidden: isWritten,
    }),

    defineField({
      name: "onReviewsPage",
      title: "Show on the Testimonials page",
      type: "boolean",
      group: "placement",
      initialValue: true,
    }),
    defineField({
      name: "reviewOrder",
      title: "Position on the Testimonials page",
      type: "number",
      group: "placement",
      hidden: ({ parent }) => !parent?.onReviewsPage,
    }),
    defineField({
      name: "onHomeRail",
      title: "Show in the homepage rail",
      type: "boolean",
      group: "placement",
      initialValue: false,
      description:
        "The rail alternates filmed and written, so adding one usually means reordering its " +
        "neighbours too.",
    }),
    defineField({
      name: "railOrder",
      title: "Position in the rail",
      type: "number",
      group: "placement",
      hidden: ({ parent }) => !parent?.onHomeRail,
    }),
    defineField({
      name: "railHeadline",
      title: "Card headline",
      type: "string",
      group: "placement",
      description:
        "The pull quote TRIMMED for the smaller card — the full one overflows it. Written " +
        "reviews only; a filmed card shows the poster and the runtime instead.",
      hidden: ({ parent }) => !parent?.onHomeRail || parent?.format !== "written",
    }),
    defineField({
      name: "railBody",
      title: "Card text",
      type: "text",
      rows: 3,
      group: "placement",
      description: "The shorter version of the review for the card.",
      hidden: ({ parent }) => !parent?.onHomeRail || parent?.format !== "written",
    }),
  ],
  orderings: [
    { name: "position", title: "Testimonials page order", by: [{ field: "reviewOrder", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", format: "format", quote: "quote", media: "poster" },
    prepare: ({ title, format, quote, media }) => ({
      title,
      subtitle: `${format === "video" ? "Filmed" : "Written"} — ${String(quote ?? "").slice(0, 48)}`,
      media,
    }),
  },
});
