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
    defineField({
      name: "provider",
      title: "Hosted on",
      type: "string",
      initialValue: "wistia",
      options: {
        list: [
          { title: "Wistia", value: "wistia" },
          { title: "YouTube", value: "youtube" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "id",
      title: "Video ID",
      type: "string",
      description:
        "Wistia's hashed id (b4n3r4pchd) or YouTube's 11-character one — the id ONLY, not " +
        "the whole URL. In Wistia it is the last part of the media's address; in YouTube it " +
        "is the v= parameter.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { provider: "provider", id: "id" },
    prepare: ({ provider, id }) => ({ title: id, subtitle: provider }),
  },
});
