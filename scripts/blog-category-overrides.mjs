// EDITORIAL DECISIONS, not data. Read by import-blog-posts.mjs.
//
// The legacy site leaves 11 posts with no usable category: ten tagged only
// `Uncategorized`, and one — the Glendale hit-and-run brief — tagged with
// nothing at all. Rhan's direction is that no post ships as Uncategorized, so
// each is assigned here by hand.
//
// EVERY ASSIGNMENT FOLLOWS A SIBLING ALREADY IN THE ARCHIVE rather than being
// invented, so the taxonomy stays the firm's own. The sibling is named on each
// line. No new category was needed — the existing 23 covered all 11.
export const CATEGORY_OVERRIDES = {
  // --- The Saguache County jail case. The verdict post is already
  // 'Jury Trial Wins'; these three are the filing and two press pickups, which
  // is what this firm files under News (cf. hinge-match-dating-app-sexual-
  // assault-lawsuit → News).
  "lawsuit-alleges-unconstitutional-mismanagement-of-saguache-county-jail-resulted-in-crestone-mans-suicide":
    ["news"],
  "denver-mom-sues-saguache-county-alleging-deputies-ignored-sons-suicidal-comments": ["news"],
  "colorado-jail-deputies-failed-to-check-on-inmate-after-he-made-suicidal-comments-they-didnt-find-his-body-for-8-hours":
    ["news"],

  // --- Advice articles. Each matches an existing sibling exactly.
  // cf. most-deadly-types-of-motor-vehicle-accidents → Auto Accident
  "what-injuries-commonly-cause-death-in-car-accidents": ["auto-accident"],
  "is-it-worth-getting-an-attorney-for-a-car-accident": ["auto-accident"],
  "are-slip-and-fall-injuries-covered-by-insurance": ["slip-and-fall"],
  // cf. hinge-and-match-group-file-motions-to-dismiss… → Dating Apps
  "law-firms-sue-hinge-and-match-group-after-serial-rapist-assaults-multiple-users-on-its-platform":
    ["dating-apps"],

  // --- The firm's own Client Advisory Board dinner. Its near-identical twin,
  // client-advisory-board-dinner-a-night-of-connection-laughter-and-great-food,
  // is filed under News.
  "a-night-of-great-food-conversation-and-connection": ["news"],

  // --- Third-party accident briefs, all three titled "News: …".
  //
  // FILED BY CRASH TYPE, NOT UNDER 'News'. The firm HAD a category for exactly
  // this — 'Accidents In the News' — and retired it: /category/accidents-in-the-
  // news/ now 301s to accidentnews.denvertrial.com, a separate site of theirs.
  // Recreating it here would undo that decision, so 'News' is left meaning firm
  // news and these are filed topically, where a reader browsing a crash type
  // will actually meet them.
  "news-pedestrian-seriously-hurt-after-hit-and-run-collision-in-glendale": ["pedestrian-accident"],
  "news-officials-called-to-semi-truck-collision-at-cooper-mtn": ["truck-accidents"],
  "news-heavy-traffic-delays-reported-on-6th-ave-w-in-golden-due-to-vehicle-accident": [
    "auto-accident",
  ],
};

/**
 * Posts that carry Uncategorized ALONGSIDE a real category. Only one does
 * today; the rule is applied to all posts rather than to a list, so a re-import
 * after an editor tags something Uncategorized cannot reintroduce it.
 *
 *   5-things-you-can-do-to-protect-your-personal-injury-case
 *     → ['Personal Injury', 'Uncategorized']  becomes  ['Personal Injury']
 */
export const DROPPED_CATEGORY_SLUGS = new Set(["articles"]);

/** Every post must land with at least one category; nothing may fall through
 *  to a default. import-blog-posts.mjs throws rather than guessing. */
export const REQUIRE_CATEGORY = true;
