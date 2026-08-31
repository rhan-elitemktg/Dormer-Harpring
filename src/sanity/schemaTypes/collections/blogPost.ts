// One article on the blog.
//
// 186 OF THEM, AND THEY ARE THE SITE'S LARGEST COLLECTION. `/news` renders the
// feed, `[slug].astro` builds a page each, every practice-area sidebar draws a
// Related-articles card and the three utility pages draw a Latest-articles one.
// Change a title here and every one of those follows.
//
// WHAT IS *NOT* A FIELD, and each omission is a decision:
//
//   author       All 186 are the firm. `FIRM` in `data/blog.ts` is the one home
//                for that byline and `practiceAreaPages.ts` already imports it
//                rather than re-typing it. A field here would be a second copy
//                of the firm's own name and profile link, on 186 documents.
//   readTime     Derived from the body. A stored one is a number that goes
//                stale the moment a paragraph is added, silently.
//   href         `blogPath(slug)`. Storing it invites an editor to change one
//                and not the other.
//
// `factCheck` IS a field, and empty on all 186 — see below. That is the
// difference between "derived" and "overridable", and it is worth the field.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { DocumentTextIcon } from "@sanity/icons/DocumentText";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "article", title: "The article", default: true },
    { name: "card", title: "How it appears in the feed" },
    { name: "meta", title: "SEO, dates & provenance" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "article",
      description: "The article's own H1, and the heading on every card that links to it.",
      validation: (rule) => rule.required(),
    }),

    /*
     * THE LIVE URL. These 186 slugs are flat at the root — `/<slug>/` — which is
     * how an imported post's legacy URL survives cutover with no redirect. That
     * is also why changing one is not cosmetic: the old URL stops resolving and
     * nothing here can tell you what used to link to it.
     *
     * `source: "title"` is safe on THIS type, unlike on blogCategory: a post's
     * slug really is its title slugified, so the Generate button produces the
     * right answer for a new post. It is the existing 186 that must not be
     * regenerated, which is what the description says.
     */
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      group: "article",
      description:
        "The page's address — /<slug>/. Safe to generate for a NEW post. Do not change it on " +
        "an existing one: the old URL stops working and anything linking to it breaks.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "excerpt",
      title: "Summary",
      type: "text",
      rows: 3,
      group: "card",
      description:
        "Two or three sentences. Prints on the card in the feed, in every Related-articles " +
        "list, and under the title on the featured panel.",
      validation: (rule) => rule.required(),
    }),

    /*
     * EVERY CATEGORY THE SOURCE LISTS, IN ITS ORDER — and the FIRST one is the
     * one the site uses.
     *
     * A post belongs to exactly one category on this site, by request: cards
     * print one, the tab row filters on one, and a post in two tabs is a post
     * that appears twice in one feed. WordPress lets a post carry several and 28
     * of the 186 do. Storing only the first would throw away data and make the
     * choice unreviewable, so the whole list is kept and the getter narrows —
     * which is also what a GROQ projection does after this.
     *
     * A `reference`, not a string: it cannot dangle, so a category cannot be
     * deleted out from under a post without the Studio saying so.
     */
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      group: "card",
      of: [{ type: "reference", to: [{ type: "blogCategory" }] }],
      description:
        "THE FIRST ONE IS THE CATEGORY THE SITE SHOWS — on the card, and as the tab this post " +
        "is filed under. Drag another to the top to change it. The rest are kept from the " +
        "legacy site and are not rendered anywhere.",
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "body",
      title: "Article",
      type: "richText",
      group: "article",
      validation: (rule) => rule.required().min(1),
    }),

    /*
     * OVERRIDABLE, NOT STORED — and empty on all 186 today.
     *
     * The band at the foot of an article names the attorney who approved it and
     * makes a specific claim about them, so it is per-post rather than template
     * chrome. WordPress has no field for it, so the import leaves this empty and
     * `getBlogPostArticles()` derives the sentence from `reviewer`. Filling it in
     * here overrides that for one post, which is the path an editor takes for an
     * article reviewed differently.
     *
     * Leave it EMPTY to get the standard band. That is the normal case.
     */
    defineField({
      name: "factCheck",
      title: "Fact-check band (override)",
      type: "richText",
      group: "article",
      description:
        "Leave this EMPTY unless this post needs different wording — the standard band is " +
        "written from the reviewer below and appears automatically.",
    }),

    /*
     * A REFERENCE, so the name on 186 bylines cannot drift from the roster. It
     * already had drifted before the roster became the source: the comp writes
     * "KC Harpring" and the live site "KC Harping", where the firm's own roster
     * says "K.C. Harpring".
     */
    defineField({
      name: "reviewer",
      title: "Reviewed by",
      type: "reference",
      group: "article",
      to: [{ type: "teamMember" }],
      description:
        "The attorney credited in the band at the foot of the article. Their name and profile " +
        "link are read from their Team record, so this cannot go out of step with it.",
      validation: (rule) => rule.required(),
    }),

    /*
     * OPTIONAL, AND 125 OF THE 186 HAVE NONE — the legacy site simply never set
     * one. `PostThumb.astro` draws a branded placeholder instead, which is the
     * common case rather than the exception. It replaced a per-category
     * fallback photograph that made every card in a category look identical.
     *
     * `alt` IS READ IN EXACTLY ONE PLACE, and the field says so rather than
     * pretending otherwise. On a card this image is decorative — the card's own
     * heading names the post and the byline names the firm — so it renders with
     * an empty alt, which is the correct markup and tells a screen reader to
     * skip it. On the FEATURED panel the same photograph is the page's own art,
     * large and above the fold, and there it is announced. Empty on 60 of the
     * 61 imported posts that carry an image, which is right rather than a gap.
     */
    defineField({
      name: "image",
      title: "Card image",
      type: "image",
      group: "card",
      options: { hotspot: true },
      description:
        "OPTIONAL. Without one the card shows the branded placeholder, which most posts do. " +
        "Set the hotspot — the cards crop to it.",
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description:
            "Only read when this post is FEATURED, where the photograph is large and the " +
            "page's own art. On an ordinary card it is decorative and deliberately " +
            "announced as nothing, so you can leave this empty.",
        }),
      ],
    }),

    /*
     * ONE POST, AND NOTHING HERE ENFORCES THAT.
     *
     * A boolean on 186 documents cannot express "exactly one", and a validator
     * that queried its siblings would run on every keystroke to answer a
     * question the getter can answer once. `getFeaturedPost()` throws when the
     * count is not one, naming both — so the failure lands at build time with
     * something useful to say rather than as a silent second panel.
     */
    defineField({
      name: "featured",
      title: "Feature this post",
      type: "boolean",
      group: "card",
      initialValue: false,
      description:
        "Puts this post in the large panel at the top of /news, and takes it out of the feed " +
        "below. EXACTLY ONE post must have this ticked — tick another and untick this one.",
    }),

    /*
     * A WALL CLOCK, NOT AN INSTANT, and the difference is load-bearing.
     *
     * These arrive from WordPress as the firm's own local time with no offset
     * (`2016-05-10T21:46:00`) and are stored with a `Z` so every machine agrees
     * on the CALENDAR DATE — the only part the site renders. See `lib/dates.ts`,
     * which had to be fixed for the same reason: an offset-less string parses as
     * the build machine's local time, and eleven of these cross midnight that
     * way.
     *
     * The time is kept rather than reduced to a date because 29 posts share a
     * date with another, and it is what orders them in the feed.
     */
    defineField({
      name: "publishedAt",
      title: "Published",
      type: "datetime",
      group: "meta",
      description:
        "Orders the feed, newest first, and prints under the title. Only the DATE is ever " +
        "shown; the time breaks ties between posts published on the same day.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "modifiedAt",
      title: "Last updated",
      type: "datetime",
      group: "meta",
      /* IT MEANS SOMETHING DIFFERENT NOW, and the title changed with it. This
         was "Last edited on the legacy site" — an import artifact that nothing
         read. The Studio stamps it on publish whenever the body changed (see
         `src/sanity/actions/stampModified.ts`), so it is a live editorial date,
         and `sitemap.xml` uses it as the post's last-modified date.

         The imported WordPress values are the baseline rather than noise: 162
         of the 186 posts carry a modified date that differs from their publish
         date, which is real history `_updatedAt` cannot recover. */
      readOnly: true,
      description:
        "Given to Google as this post's last-modified date. Set for you when you publish a " +
        "change to the body — editing the title, the excerpt or the SEO tab deliberately does " +
        "not touch it.",
    }),
    defineField({
      name: "legacyId",
      /* HIDDEN. It is read by no query and by nothing in src/ — only the
         import and migration scripts, which reach it through the API, where
         `hidden` has no effect. Its own description told editors to leave it
         alone, which is a field whose whole purpose is to be ignored.
         Safe to hide because it is not required on either type: the trap
         HANDOFF records is hiding a REQUIRED field, which makes a document
         impossible to publish with no visible reason why. */
      hidden: true,
      title: "WordPress post ID",
      type: "number",
      group: "meta",
      description:
        "Identity on the legacy site, so a re-import can match this post after its title or " +
        "slug changes. Not shown anywhere. Leave it alone.",
      readOnly: true,
    }),

    /* IN THE `meta` TAB, not at the foot of the form. Optional, and every one
       of its five values falls back to what the page already renders — see the
       note on the `seo` object type. */
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "meta",
    }),
  ],

  orderings: [
    {
      name: "newest",
      title: "Newest first",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    { name: "title", title: "Title", by: [{ field: "title", direction: "asc" }] },
  ],

  preview: {
    select: { title: "title", date: "publishedAt", media: "image", featured: "featured" },
    prepare({ title, date, media, featured }) {
      // The date alone, in the list. `toLocaleDateString` with an explicit UTC
      // zone for the same reason `formatPostDate` pins one: the Studio runs in
      // the editor's timezone and would otherwise show a different day than the
      // site does.
      const on = date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })
        : "No date";
      return { title, subtitle: featured ? `★ Featured · ${on}` : on, media };
    },
  },
});
