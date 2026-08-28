// One imported practice-area page — the light template's content.
//
// 104 OF THEM, ACROSS NINE CITIES, and they are the firm's service pages: the
// thing a local-intent search lands on. Distinct from the ONE hand-authored
// `PracticeAreaDetail` behind the heavy 17-section kit in `data/carAccidents.ts`,
// which stays reserved for special cases and is a page document, not this. The
// two never merge — a heavy detail page is seventeen typed sections of authored
// content, and this is a title, a body and an FAQ.
//
// WHY A COLLECTION AND NOT 104 PAGE DOCUMENTS. It passes the rule this group is
// built on twice over: the sidebar's Practice Areas card lists a city's siblings
// on every one of these pages — 1,010 rows across 104 cards — and the
// `/practice-areas` directory and `/sitemap/` both draw from the same records.
// A label changed here changes all three.
//
// THE BODY IS THE TRIMMED ONE, NOT WORDPRESS'S. Three chrome sections were
// dropped at migration rather than at render — see `scripts/migrate-practice-
// areas-3c.ts`, which carries the manifest and the reasoning. That is a
// departure from `content.config.ts`'s "files keep the source's shape and the
// getter coalesces" rule, and it was a deliberate one: dropping a section means
// walking from an h2 to the next h2, which GROQ cannot express, so leaving it in
// the getter would have kept it there permanently AND shown editors three
// sections that never appear on the page.
//
// WHAT IS *NOT* A FIELD:
//
//   readTime   Derived from the body, after the drop, so the figure describes
//              what the reader actually gets.
//   factCheck  Derived from the reviewer, same sentence as the blog's. There is
//              no per-page override here as there is on `blogPost`, because the
//              band is identical on all 104 and nobody has asked to vary one.
//   href       `practiceAreaPath(slug)`.
//   eyebrow    The firm's tagline, one string for all 104 — page copy, Phase 4.
import { defineArrayMember, defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { CaseIcon } from "@sanity/icons/Case";
// SHARED WITH `featuredPracticeArea`, which files itself by the same nine.
import { CITIES } from "./cities";

/**
 * The nine cities, and the five topics.
 *
 * BOTH ARE CLOSED LISTS, AND THE DESK DEPENDS ON IT. `structure/index.ts` splits
 * this collection into one group per city, and a document whose city matches
 * none of them is invisible there — content that exists and cannot be reached.
 * Adding a tenth city means adding it in BOTH places in the same change, the
 * same contract `teamMember.kind` carries.
 *
 * `topic` is invented by this project — nothing upstream has one. It groups a
 * city's pages and is written down in `scripts/practice-area-pages.mjs` rather
 * than inferred, because a slug cannot carry it: `nursing-home-abuse-lawyer`
 * names no city and no topic at all.
 */
const TOPICS = [
  { title: "Motor vehicle", value: "motor-vehicle" },
  { title: "Premises", value: "premises" },
  { title: "Catastrophic", value: "catastrophic" },
  { title: "Professional", value: "professional" },
  { title: "Other", value: "other" },
];

/**
 * One row of the FAQ accordion.
 *
 * AN ANONYMOUS INLINE OBJECT, following `teamMember.awards[]` and the five
 * arrays Phase 2f put on the page documents. Array members are never registered
 * as global types, so this needs no name and cannot collide with one.
 *
 * IT IS *NOT* `faqItemFields`, and the two look closer than they are. That
 * shared array serves the homepage and Car Accidents accordions, whose answer is
 * a PLAIN STRING — deliberately, because those feed FAQPage structured data
 * directly and an answer with lists inside it is not valid there. These 153
 * answers carry paragraphs, bullets, bold and links, so the answer is Portable
 * Text and `toPlainText()` in `lib/portableText.ts` is what makes the structured
 * data out of it. Two shapes, two reasons, no shared type.
 */
const faqItem = defineArrayMember({
  type: "object",
  name: "faq",
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      type: "answerText",
      description:
        "Also read by Google as the answer in search results, flattened to plain text — so " +
        "it has to make sense on its own.",
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: "question" } },
});

export const practiceArea = defineType({
  name: "practiceArea",
  title: "Practice Area",
  type: "document",
  icon: CaseIcon,
  groups: [
    { name: "page", title: "The page", default: true },
    { name: "filing", title: "How it is filed" },
    { name: "meta", title: "SEO & provenance" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "page",
      description:
        'The page\'s own H1 — "Denver Truck Accident Lawyer". NOT derivable from the slug: ' +
        '"denver-uber-accident-lawyer" is titled "Denver Rideshare Accident Lawyer".',
      validation: (rule) => rule.required(),
    }),

    /*
     * THE LIVE URL, and these are the ones that rank. The legacy site is flat at
     * the root, so an imported page's slug IS its existing address and no
     * redirect was needed at cutover. Change one and that stops being true.
     */
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      group: "page",
      description:
        "The page's address — /<slug>/. This is the LIVE URL these pages rank on today. " +
        "Changing it breaks that ranking and every link pointing here.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    /*
     * THE SHORT FORM, and it is a separate field because it is a different
     * string, not a truncation. "Brain Injuries", not "Denver Brain Injury
     * Lawyer". Where the page is in the `/practice-areas` directory this is that
     * entry's label verbatim, so the two lists cannot drift.
     */
    defineField({
      name: "label",
      title: "Short name",
      type: "string",
      group: "page",
      description:
        'How this page is listed in the sidebar and the directory — "Brain Injuries", not ' +
        '"Denver Brain Injury Lawyer". Not a shortened title: it drops the city, because ' +
        "every entry in the list is already that city's.",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "body",
      title: "Article",
      type: "richText",
      group: "page",
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: "faqs",
      title: "FAQ accordion",
      type: "array",
      group: "page",
      of: [faqItem],
      description:
        "Optional — 28 of the 104 have one. Also published as FAQPage structured data, so an " +
        "answer has to read as an answer on its own.",
    }),

    defineField({
      name: "city",
      title: "City",
      type: "string",
      group: "filing",
      options: { list: CITIES, layout: "dropdown" },
      description:
        "Which city's list this page belongs to — it decides the sidebar card and the " +
        "directory group. The desk is split by this, so a page with the wrong one is filed " +
        "under the wrong city everywhere at once.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "topic",
      title: "Topic",
      type: "string",
      group: "filing",
      options: { list: TOPICS, layout: "dropdown" },
      description:
        "A coarse grouping this project invented; the legacy site has nothing like it. " +
        "Nothing renders it today.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "statewide",
      title: "Colorado-wide",
      type: "boolean",
      group: "filing",
      initialValue: false,
      description:
        "The subject is statewide rather than local — the two colorado-* pages. They are " +
        "still filed under a city, because the firm's own directory files them under Denver.",
    }),

    /*
     * A FLAG NO PAGE SETS TODAY, kept because the SHAPE recurs.
     *
     * WordPress filed five articles under practice areas and the legacy hub
     * linked them as practice areas, so the import had to keep them or ship five
     * 404s. They moved to the blog once that was understood — they are articles
     * by every measure, 539–748 words with no FAQ. The field and the sidebar
     * filter that reads it both stay: the firm does this, and the next import
     * may bring another.
     */
    defineField({
      name: "resource",
      title: "Really an article",
      type: "boolean",
      group: "filing",
      initialValue: false,
      description:
        "Tick only for a page the directory links AS a practice area that is really a blog " +
        "article. It is then kept out of the sidebar's Practice Areas card. No page needs " +
        "this today.",
    }),

    /*
     * THE LIVE SITE'S OWN META, not copy invented here — this is what these 104
     * pages rank with. `/new-seo-setup` builds the rest of the layer on top; the
     * `seo` object was stubbed early precisely so this had somewhere to land.
     */
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "meta",
    }),

    /*
     * NEITHER DATE IS RENDERED AS A DATE ON THESE PAGES — the meta line prints
     * `modifiedAt` labelled "Updated" when there is one, and all 104 have one.
     * Both are stored with an explicit `Z`; see `blogPost.publishedAt` and
     * `lib/dates.ts` for why the wall clock is read as UTC.
     */
    defineField({
      name: "publishedAt",
      title: "First published",
      type: "datetime",
      group: "meta",
      description:
        "Only shown when there is no Updated date, and every page has one — so in practice " +
        "this is provenance. Publishing dates here run back to 2016 on copy revised this year.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "modifiedAt",
      title: "Last updated",
      type: "datetime",
      group: "meta",
      description: 'Printed under the title as "Updated <date>".',
    }),
    defineField({
      name: "legacyId",
      title: "WordPress page ID",
      type: "number",
      group: "meta",
      description:
        "Identity on the legacy site, so a re-import can match this page after its title or " +
        "slug changes. Not shown anywhere. Leave it alone.",
      readOnly: true,
    }),
  ],

  orderings: [
    { name: "label", title: "Short name", by: [{ field: "label", direction: "asc" }] },
    {
      name: "city",
      title: "City, then name",
      by: [
        { field: "city", direction: "asc" },
        { field: "label", direction: "asc" },
      ],
    },
  ],

  preview: {
    select: { title: "title", label: "label", city: "city", faqs: "faqs" },
    prepare({ title, label, city, faqs }) {
      const count = Array.isArray(faqs) ? faqs.length : 0;
      const named = CITIES.find((entry) => entry.value === city)?.title ?? city ?? "No city";
      return {
        title,
        // The short name is what the sidebar and directory print, and it is the
        // thing most likely to be wrong — so it is on the row rather than
        // hidden one click in.
        subtitle: `${named} · ${label ?? "no short name"}${count ? ` · ${count} FAQ` : ""}`,
      };
    },
  },
});
