// The homepage. A singleton.
//
// FIELDS ARE IN THE ORDER THE PAGE RENDERS THEM, top to bottom, so an editor
// scrolling this form is walking down the page. The bands that come from
// somewhere else are the gaps in that sequence: the results strip, the awards
// bar and the testimonial rail are Collections; Why Us, the attorney rail and
// the core values are on Shared Sections because a second page renders each of
// them word for word; the consultation band is Site Settings.
//
// SEVEN OF THESE LISTS APPEAR ON EXACTLY ONE PAGE — this one. Five were
// collections until Phase 2f, which is the wrong group for them: a Collection
// exists for content reused in more than one place, and an editor looking for
// the press cards was hunting a global list for something that only ever
// renders here. Phase 3d added the two card rails out of `data/practiceAreas.ts`
// for the same reason, and Phase 4 added this page's COPY around them.
//
// ARRAY POSITION IS THE ORDER, so the `order: number` each list carried is gone
// and editors drag instead. That is a real change for the mosaic — see the note
// on `communityPhotos`.
//
// SEVEN SECTIONS, NOT SIXTEEN FIELDS. This document was a long scroll and the
// fix was not tabs: each band is a collapsible SECTION object, and the arrays
// that used to sit beside their band — the cards, the FAQs, the mosaic — live
// inside the one they belong to. See `section.ts`.
import { defineField, defineType } from "sanity";
// Subpath, not the barrel — see the note in sanity/structure/index.ts.
import { HomeIcon } from "@sanity/icons/Home";
import { SECTION } from "./section";
import { validateHref } from "../objects/link";
import { faqItemFields, faqItemPreview } from "./faqItemFields";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,
  fields: [
    /*
     * THE HERO. `headline` is an ARRAY OF LINES, not one string with breaks in
     * it, because the comp hard-breaks after "All in." and a `<br>` typed into a
     * content field is markup in a content field — the thing the data layer has
     * refused since day one. One entry per rendered line.
     */
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      options: SECTION,
      description: "The first screen — everything above the results strip.",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          description: "The small line above the headline.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "headline",
          type: "array",
          of: [{ type: "string" }],
          description:
            "ONE ENTRY PER RENDERED LINE — the design breaks the headline deliberately. Two " +
            "entries draw two lines; one entry draws one.",
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "primaryCta",
          title: "Button",
          type: "object",
          options: { columns: 2 },
          fields: [
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "href",
              title: "Destination",
              type: "string",
              validation: (rule) => rule.required().custom(validateHref),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "videoCta",
          title: "Video link",
          type: "object",
          description: "The play affordance beside the button. Opens the film in a popover.",
          fields: [
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
            /*
             * THE ONE VIDEO ON THIS PAGE THAT IS ALREADY REAL. Every other slot
             * on the site carries the same stand-in id, waiting for the firm to
             * re-host its films; this is "Dormer Harpring — Who We Are", the
             * finished 3:20 film, which happens to share that id. Do not read it
             * as a placeholder and do not grep the id to find placeholders.
             */
            /*
             * A BARE ID, NOT A `videoRef` OBJECT. The object carries
             * `{provider, id}` and hides the provider, so the Studio drew an
             * accordion around a single input. The projection puts the pair
             * back together, so `lib/video.ts` still sees `{provider, id}` and
             * the rule that nothing may store a video URL is untouched.
             *
             * The attorney film was flattened this way already; this is the
             * same call applied to the slots Phase 2 left alone.
             */
            defineField({
              name: "videoId",
              title: "Video ID",
              type: "string",
              description:
                "Wistia's hashed id — b4n3r4pchd. The id ONLY, not the whole URL: it is the " +
                "last part of the media's address in Wistia.",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),

      /*
       * THE HERO'S FOUR FIGURES, AND THEY ARE NOT THE "BY THE NUMBERS" BAND.
       *
       * Two of the four repeat a figure that also appears in Site Settings → Firm
       * Stats ("$70M+" and "20 Years"). That is the one duplication in this schema
       * that is deliberate rather than an oversight: the two bands carry different
       * labels for those two, and one of these four ("We Come / To you") has no
       * counterpart there at all. They are two lists, not one list read twice —
       * the same call the practice-area cards make against the directory.
       *
       * The cost is real and is named here so nobody has to rediscover it:
       * changing "$70M+" means changing it in BOTH places. README tracks whether
       * the claim itself is one the firm can stand behind.
       */
        defineField({
          name: "stats",
          title: "Hero figures",
          type: "array",
          description:
            "The four figures across the foot of the hero. NOT the dark by-the-numbers band — " +
            "that is Site Settings → Firm Stats, and two of these figures also appear there. " +
            "Change both.",
          of: [
            {
              type: "object",
              name: "heroStat",
              options: { columns: 2 },
              fields: [
                defineField({
                  name: "big",
                  title: "Figure",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "big", subtitle: "label" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    /*
     * THE FIRM INTRODUCTION — the long cream band under the results strip.
     *
     * `body` is the only rich-text field on this page. Everything else here is a
     * label in a fixed design slot, and turning one of those into Portable Text
     * would add a wrapper element to the markup in exchange for a link nobody
     * wants inside a stat label.
     */
    /*
     * THE RESULTS STRIP — three case-result cards on forest, under the hero.
     *
     * ONLY THE COPY IS HERE. The three figures are `caseResult` documents in
     * Collections, because they render on /results as well; this is the band's
     * own heading and the link out of it, which render nowhere else.
     *
     * Both strings were HARDCODED IN `home/RecentResults.astro` until now — a
     * component owning content, which this codebase's first rule forbids. It
     * survived the Sanity readiness sweep because that sweep looked for content
     * ARRAYS in component frontmatter, and these are two bare strings in markup.
     */
    defineField({
      name: "resultsStrip",
      title: "Results strip",
      type: "object",
      options: SECTION,
      description:
        "The band under the hero. The three figures themselves are Case Results, in " +
        "Collections — they appear on the Results page too.",
      fields: [
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "ctaLabel",
          title: "Link to all results",
          type: "string",
          description: "The destination is /results/ and is not editable — routing owns URLs.",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "firmIntro",
      title: "Firm introduction",
      type: "object",
      options: SECTION,
      fields: [
        defineField({
          name: "title",
          type: "array",
          of: [{ type: "string" }],
          description: "One entry per rendered line, as in the hero.",
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "tagline",
          type: "string",
          description: "The italic line carrying the hand-drawn underline.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "body",
          type: "simpleText",
          description: "Three paragraphs in the design. Bold and links render; nothing else does.",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "helpTitle", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "helpPoints",
          title: "How we help",
          type: "array",
          description: "Each row renders its lead in bold, then the detail after it.",
          of: [
            {
              type: "object",
              name: "helpPoint",
              fields: [
                defineField({
                  name: "lead",
                  type: "string",
                  description: "The bold opening — a full sentence, with its full stop.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "text",
                  type: "text",
                  rows: 2,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "lead", subtitle: "text" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "videoLabel", type: "string", validation: (rule) => rule.required() }),
        // TODO(video): the firm film. One of the slots still carrying the
        // stand-in id — the YouTube original it maps to is in YOUTUBE_ORIGINS
        // in src/lib/video.ts, and five of those eight are unlisted.
        defineField({
          name: "videoId",
          title: "Video ID",
          type: "string",
          description:
            "The film the band's play button opens. Wistia's hashed id — the id ONLY, not " +
            "the whole URL.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "quote",
          title: "Attorney quote card",
          type: "object",
          fields: [
            defineField({ name: "text", type: "text", rows: 4, validation: (rule) => rule.required() }),
            /*
             * THE PERSON IS A REFERENCE; THE NAME AND ROLE COME OFF THE ROSTER.
             *
             * They were two typed strings, which is two places the firm's own
             * roster could be contradicted — the exact failure this project has
             * already had with a name spelling ("KC Harpring" in the comps,
             * "KC Harping" on the live site) and with the fact-check byline.
             * A reference cannot dangle and cannot disagree.
             *
             * The projection resolves it straight back to `{name, role}`, so
             * `AttorneyQuoteCard` reads exactly what it always did. Same
             * pattern Phase 4f used for the award, the testimonial and the five
             * attorneys the Car Accidents rail names.
             */
            defineField({
              name: "attorney",
              title: "Who said it",
              type: "reference",
              to: [{ type: "teamMember" }],
              options: { filter: 'kind in ["partner", "attorney"]' },
              description:
                "Their name and title are printed from Collections → Team, so this card cannot " +
                "disagree with the roster.",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "aside",
          title: "Consultation card",
          type: "object",
          fields: [
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "text", type: "text", rows: 2, validation: (rule) => rule.required() }),
            defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
          ],
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    /* The heading and labels around the two lists below it. */
    defineField({
      name: "practiceSection",
      title: "Practice areas band",
      type: "object",
      options: SECTION,
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "title",
          type: "array",
          of: [{ type: "string" }],
          description: "One entry per rendered line.",
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "tabsLabel",
          title: "Tab row label",
          type: "string",
          description:
            "Names the tab row above the cards. It is also what a screen reader announces for " +
            "the row, so it has to read as a description of the row rather than as a heading.",
          validation: (rule) => rule.required(),
        }),

      /*
       * THE SIX PRACTICE-AREA CARDS, and they are COPY rather than pointers.
       *
       * The obvious modelling — a reference to the `practiceArea` document, with
       * the name and blurb read off it — is wrong here, and the data says so. This
       * rail calls one card "Bicycle Accidents" where the page it links is filed
       * as "Bike Accidents", and "Slip & Fall" where the page is "Slip and Fall
       * Accidents". Its blurb is a one-line label where /practice-areas ships a
       * two-sentence pitch for the same area. Four of the cards appear in both
       * lists with the SAME href and DIFFERENT copy — so they are two lists of
       * cards, not one list read twice.
       *
       * That also means the destination is a plain href rather than a reference:
       * one of the six points at `/denver-car-accident-lawyer/`, which the heavy
       * hand-authored template serves and which is therefore not a `practiceArea`
       * document at all. `check:links` is what catches a dead one.
       */
        defineField({
          name: "cards",
          title: "Practice area cards",
          type: "array",
          description:
            "The rail under the hero. Its wording is its own — this is not the same copy as the " +
            "Practice Areas page's grid, and four of these areas appear on both with different " +
            "blurbs. Drag to reorder.",
          of: [
            {
              type: "object",
              name: "areaCard",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                /*
                 * HIDDEN, BY REQUEST — and the icon still draws. The tab keeps
                 * its glyph; what came off is a free-text developer key that an
                 * editor had no way to get right and no reason to touch.
                 *
                 * IT IS A CLOSED LIST RATHER THAN A FREE STRING NOW, which is
                 * what makes hiding it safe. A hidden `required()` field with no
                 * initial value is a trap: a new card would fail validation
                 * showing an error for a field that is not on screen. Every new
                 * card gets a real glyph instead, and changing which one is a
                 * developer's job the same way adding a glyph already was.
                 */
                defineField({
                  name: "iconKey",
                  title: "Icon",
                  type: "string",
                  hidden: true,
                  initialValue: "car-accident",
                  options: {
                    list: [
                      "car-accident",
                      "truck-accident",
                      "motorcycle-accident",
                      "bicycle-accident",
                      "slip-and-fall",
                      "brain-injury",
                      "wrongful-death",
                      "dog-bite",
                      "pedestrian-accident",
                      "spinal-cord",
                    ],
                  },
                  description:
                    "The tab's glyph, from components/icons/PracticeIcon.astro. Hidden because " +
                    "it is not editorial — a key with no glyph draws nothing.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "blurb",
                  type: "text",
                  rows: 2,
                  description: "One line. The Practice Areas page's version of the same card is longer.",
                  validation: (rule) => rule.required(),
                }),
                /*
                 * THE PANEL'S CLOSING LINE, per card rather than per band.
                 *
                 * It was one `practicePromise` string passed to all nine
                 * panels, so every practice area made the reader the same
                 * promise. A car-accident panel and a wrongful-death panel are
                 * not reassuring someone about the same thing.
                 */
                defineField({
                  name: "closing",
                  title: "Closing line",
                  type: "text",
                  rows: 2,
                  description: "The reassurance under this panel's copy.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
                defineField({
                  name: "image",
                  type: "image",
                  options: { hotspot: true },
                  description: "Without one the card falls back to an icon plate.",
                }),
              ],
              preview: { select: { title: "name", subtitle: "href", media: "image" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "catastrophicTitle",
          title: "Panels heading",
          type: "string",
          description: "Above the four catastrophic-injury panels.",
          validation: (rule) => rule.required(),
        }),

      /*
       * THE FOUR CATASTROPHIC-INJURY PANELS. Same shape one field short — these
       * carry no photograph, and their one line of copy is an `insight` rather
       * than a blurb, which is the field name the component reads.
       */
        defineField({
          name: "catastrophic",
          title: "Catastrophic injury panels",
          type: "array",
          description: "The four panels further down the page. No photographs — these draw an icon.",
          of: [
            {
              type: "object",
              name: "catastrophicArea",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "iconKey",
                  title: "Icon",
                  type: "string",
                  description: "Must match an icon in components/icons/PracticeIcon.astro.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "insight",
                  type: "text",
                  rows: 2,
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "href",
                  title: "Destination",
                  type: "string",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
              ],
              preview: { select: { title: "name", subtitle: "insight" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "ask",
          title: "Closing prompt",
          type: "object",
          options: { columns: 2 },
          fields: [
            defineField({ name: "text", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "cta",
              title: "Link text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
],
      validation: (rule) => rule.required(),
    }),

    /*
     * THE PROMISE CAROUSEL. The comp carries an `href` per slide and a derived
     * "3 of 3" counter beside them; no markup renders either, so neither is a
     * field. Labels are stored in sentence case — the design shouts them in CSS.
     */
    defineField({
      name: "promise",
      title: "Promise carousel",
      type: "object",
      options: SECTION,
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "slides",
          type: "array",
          description: "One slide per dot. Drag to reorder — the first one shows on load.",
          of: [
            {
              type: "object",
              name: "promiseSlide",
              fields: [
                defineField({
                  name: "label",
                  type: "string",
                  description: "Sentence case. The design capitalises it.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "body",
                  type: "text",
                  rows: 4,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "label", subtitle: "body" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),

    /*
     * THE FAQ BAND'S COPY. Its `ask` card is the one image this page's copy
     * owns: a portrait inside a card, which is editor content by the same line
     * that keeps page-header photographs and band backgrounds out of the CMS.
     */
    defineField({
      name: "faqSection",
      title: "FAQ band",
      type: "object",
      options: SECTION,
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({
          name: "items",
          title: "Questions",
          type: "array",
          description: "The accordion. Drag to reorder — the top question opens first.",
          of: [{ type: "object", fields: faqItemFields, preview: faqItemPreview }],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "ask",
          title: "Ask card",
          type: "object",
          description: "The card at the foot of the accordion, for a question that is not on it.",
          fields: [
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "body", type: "text", rows: 2, validation: (rule) => rule.required() }),
            defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "ctaHref",
              title: "Destination",
              type: "string",
              // The Car Accidents page renders this same band with its own
              // anchor, because that page carries a contact section of its own
              // and the button should scroll rather than navigate away.
              description: "Where the button goes.",
              validation: (rule) => rule.required().custom(validateHref),
            }),
            defineField({
              name: "portrait",
              type: "image",
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "portraitAlt",
              title: "Portrait alt text",
              type: "string",
              description: "Who is in the photograph — a screen reader reads this instead of it.",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.required(),
        }),
],
      validation: (rule) => rule.required(),
    }),

    /*
     * THE TWO-TAB FEED'S COPY. Two headings rather than one with a flag,
     * matching the two lists below: press mentions point off-site at somebody
     * else's publication, insight teasers point in-site at the firm's own.
     */
    defineField({
      name: "feedSection",
      title: "News & insights band",
      type: "object",
      options: SECTION,
      fields: [
        defineField({
          name: "tabs",
          title: "Tab labels",
          type: "object",
          options: { columns: 2 },
          fields: [
            defineField({ name: "news", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "insights", type: "string", validation: (rule) => rule.required() }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "news",
          title: "In the news tab",
          type: "object",
          fields: [
            defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
            defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "insights",
          title: "Insights tab",
          type: "object",
          fields: [
            defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
            defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
          ],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "mentions",
          title: "Press Mentions",
          type: "array",
          description: "The feed's first tab — the firm in someone else's publication.",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "outlet", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "logo",
                  type: "image",
                  description: "The outlet's mark, shown on the card.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "date",
                  type: "string",
                  description: 'Typed as shown — "Mar 2026". A display string, not a date.',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "headline",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "href",
                  title: "Link to the article",
                  type: "string",
                  // TODO(content): four of these point at "#". The articles are real
                  // and published (FOX31, Denver7, OutThere Colorado, The Mountain
                  // Mail) and their URLs are findable; nobody has found them.
                  description:
                    "The published article's URL. A bare # is a PLACEHOLDER and must not ship — " +
                    "the link checker counts them and fails when the count changes without being " +
                    "declared.",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
              ],
              preview: { select: { title: "headline", subtitle: "outlet", media: "logo" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "teasers",
          title: "Insight Teasers",
          type: "array",
          description: "The feed's second tab.",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "category",
                  type: "string",
                  description: "Also picks the card's tint.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "iconKey",
                  title: "Icon",
                  type: "string",
                  description:
                    "Must match a glyph in components/icons/InsightIcon.astro. A key with no glyph " +
                    "draws an empty plate — a new one needs a developer.",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "readTime",
                  type: "string",
                  description: 'As shown — "4 min read".',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "href",
                  title: "Link to the article",
                  type: "string",
                  // TODO(content): all four point at "#" — they teaser articles
                  // nobody has written. Unlike the press mentions there is no real
                  // destination to find: either the articles get written or the
                  // section comes out.
                  description: "A bare # is a placeholder and must not ship.",
                  validation: (rule) => rule.required().custom(validateHref),
                }),
              ],
              preview: { select: { title: "title", subtitle: "category" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "communitySection",
      title: "Community band",
      type: "object",
      options: SECTION,
      description:
        "The heading above the photo mosaic. The Community Involvement PAGE has its own " +
        "heading and its own partner cards — this is the homepage's summary of that work.",
      fields: [
        defineField({ name: "eyebrow", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "lede", type: "text", rows: 3, validation: (rule) => rule.required() }),
        defineField({ name: "ctaLabel", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "photos",
          title: "Community Photos",
          type: "array",
          // THE ORDER IS A LAYOUT CONSTRAINT AND THIS IS THE ONLY PLACE IT IS NOW
          // WRITTEN DOWN WHERE THE PERSON CHANGING IT WILL SEE IT. It used to live
          // in a comment in src/data/community.ts, which was safe while an editor
          // reordered by typing a number into a form; they drag now, and the person
          // dragging never opens that file.
          description:
            "The mosaic is a 12-column grid and the widths have to add up ROW BY ROW: 5+3+4, " +
            "then 4+5+3, then one full-width 12. Reordering without keeping each row at twelve " +
            "leaves a gap on the page.",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "image",
                  type: "image",
                  options: { hotspot: true },
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "org",
                  title: "Organisation",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "span",
                  title: "Width",
                  type: "number",
                  // `span` IS CONTENT HERE, NOT PRESENTATION, and that is a genuine
                  // exception to the rule that layout stays in CSS. Each
                  // photograph's width is a composition decision about THAT
                  // photograph — a wide group shot and a tall portrait are not
                  // interchangeable at the same width.
                  description:
                    "How many of the mosaic's twelve columns this photograph fills. Only these " +
                    "four widths are drawn — anything else breaks the row.",
                  options: {
                    list: [
                      { title: "Quarter (3)", value: 3 },
                      { title: "Third (4)", value: 4 },
                      { title: "Wide (5)", value: 5 },
                      { title: "Full row (12)", value: 12 },
                    ],
                  },
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "org", subtitle: "caption", media: "image" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: "charities",
          title: "Charity Partners",
          type: "array",
          // TODO(sanity): one asset per organisation. Several of these logos are
          // also on the Community Involvement page's partner cards, and they are
          // separate uploads today.
          description: "The logo strip under the mosaic.",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
                defineField({
                  name: "logo",
                  type: "image",
                  description: "Reads as the logo's alt text via the name above.",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: { select: { title: "name", media: "logo" } },
            },
          ],
          validation: (rule) => rule.required().min(1),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
],
  preview: { prepare: () => ({ title: "Homepage" }) },
});
