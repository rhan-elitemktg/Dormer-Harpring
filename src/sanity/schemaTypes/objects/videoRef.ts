// A reference to a hosted video — provider and id, never a URL.
//
// NOTHING MAY STORE A VIDEO URL. `lib/video.ts` is the one place a `{provider,
// id}` pair becomes a link, so moving the firm's films from YouTube to Wistia
// was a data change rather than a grep through components. That rule is exactly
// why this is an object with two fields and not a `url`.
//
// THIS IS THE FIELD 44 SLOTS HAVE BEEN WAITING FOR. Every un-migrated video on
// the site points at one stand-in (`PLACEHOLDER_VIDEO`), because until now
// there was nowhere for an editor to type a real id. Each record's own comment
// in the codebase names the YouTube video it should map to.
//
// The Studio offers WISTIA ONLY — see the provider field below.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { PlayIcon } from "@sanity/icons/Play";

export const videoRef = defineType({
  name: "videoRef",
  title: "Video",
  type: "object",
  icon: PlayIcon,
  options: { columns: 2 },
  fields: [
    /*
     * WISTIA ONLY, BY REQUEST — and hidden rather than offered as a one-option
     * radio, which would be a control with nothing to decide.
     *
     * THE FIELD STAYS IN THE DATA because `lib/video.ts` reads it, and that
     * indirection is the whole reason moving the firm's films from YouTube to
     * Wistia was a data change rather than a grep through components. Every
     * record already says "wistia" — checked across FAQs, testimonials, the
     * attorney rail and the profile films before hiding it.
     *
     * The `youtube` branch in `lib/video.ts` is deliberately KEPT. It is unused
     * and it is the point of the shape: the next provider swap needs somewhere
     * to land. Re-offering the choice is un-hiding this field.
     */
    defineField({
      name: "provider",
      title: "Hosted on",
      type: "string",
      initialValue: "wistia",
      hidden: true,
      readOnly: true,
      options: { list: [{ title: "Wistia", value: "wistia" }] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "id",
      title: "Video ID",
      type: "string",
      description:
        "Wistia's hashed id — b4n3r4pchd. The id ONLY, not the whole URL: it is the last " +
        "part of the media's address in Wistia.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { id: "id" },
    prepare: ({ id }) => ({ title: id ?? "No video", subtitle: "Wistia" }),
  },
});
