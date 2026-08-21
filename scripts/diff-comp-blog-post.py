# Diffs the built blog post against the Blog Post comp — its static markup and
# the `renderVals()` arrays in its `data-dc-script` block — and reports any
# heading, label, card or list whose text or ORDER disagrees.
#
# Same reason as the other three: a build is green whenever the LAYOUT is right,
# so neither linter can see a page whose every string is wrong.
#
# THIS PAGE DIFFERS FROM ITS COMP MORE THAN THE OTHER THREE DO, and that is the
# point of the EXPECTED block at the foot. The comp writes its own ~600-word
# body for an article that exists on the live site at the same URL with 1,800
# words in it; the live one won. So this script diffs everything AROUND the
# body — the labels, the sidebar, the related band, the fact-check — and asserts
# the body decision rather than trying to compare two different articles.
#
# Run after `npm run build`. Exits non-zero on any difference:
#   python3 scripts/diff-comp-blog-post.py
#
# Not wired into `npm run check`, which must stay runnable without the design
# folder — this needs it. Run it by hand when touching the page or its data.

import re, html, sys

COMP = "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files/DH - Blog Post.html"
BUILT = (
    "/Users/rhanpemberton/my_apps/Dormer-Harpring/dist/"
    "can-you-sue-a-trampoline-park-if-you-signed-a-waiver/index.html"
)

comp = open(COMP, encoding="utf-8", errors="replace").read()
built = open(BUILT, encoding="utf-8", errors="replace").read()


def unesc(s):
    """Strip tags and entities, normalise quotes and whitespace."""
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def js(s):
    """A single-quoted JS string literal as it reads once unescaped."""
    return unesc(s.replace("\\'", "'").replace("\\u2019", "'"))


ok = True


def cmp(label, a, b):
    global ok
    if a == b:
        print(f"  ✓ {label}")
        return
    ok = False
    print(f"  ✗ {label}")
    for i in range(max(len(a), len(b))):
        x = a[i] if i < len(a) else "<missing>"
        y = b[i] if i < len(b) else "<missing>"
        if x != y:
            print(f"      [{i}] comp : {x!r}")
            print(f"          built: {y!r}")


def present(label, needles):
    """Each string must appear in the built page."""
    global ok
    missing = [n for n in needles if unesc(n) not in built_text]
    if missing:
        ok = False
        print(f"  ✗ {label}")
        for m in missing:
            print(f"      missing: {unesc(m)!r}")
    else:
        print(f"  ✓ {label} ({len(needles)})")


built_text = unesc(built)
markup = comp[: comp.index('<script type="text/x-dc"')]


# ---------------------------------------------------------------- article head
comp_h1 = unesc(re.search(r'<h1 class="bp-title">(.*?)</h1>', markup, re.S).group(1))
built_h1 = unesc(re.search(r"<h1[^>]*>(.*?)</h1>", built, re.S).group(1))

print("ARTICLE HEAD")
cmp("h1", [comp_h1], [built_h1])
present(
    "category, byline, date, read time",
    ["Premises Liability", "Written by", "Dormer Harpring", "reviewed by", "June 23, 2026", "7 min read"],
)


# ---------------------------------------------------------------- sidebar cards
print("\nSIDEBAR")
# The comp's card headings, in ITS order — the built order is asserted as a
# deliberate difference below, so only the labels are compared here.
comp_side = sorted(unesc(x) for x in re.findall(r'<h4>(.*?)</h4>', markup, re.S))
built_side = sorted(
    unesc(x) for x in re.findall(r'class="[^"]*\bpside__title\b[^"]*"[^>]*>(.*?)</h2>', built, re.S)
)
built_side.append(
    unesc(re.search(r'class="[^"]*\bcform__title\b[^"]*"[^>]*>(.*?)</h[23]>', built, re.S).group(1))
)
cmp("card headings", comp_side, sorted(built_side))

present(
    "form card copy",
    [
        "Get a free case review",
        "Tell us what happened. An attorney reviews every request personally.",
        # The comp's "Request my case review" is now "Review my case" — see
        # DELIBERATE DIFFERENCES.
        "Review my case",
        "Free &amp; confidential",
    ],
)


# ---------------------------------------------------------------- categories
blk = comp[comp.index("categories: [") : comp.index("relatedLinks: [")]
comp_cats = [js(c) for c in re.findall(r"'((?:[^'\\]|\\.)*)'", blk)]
built_cats = [
    unesc(x) for x in re.findall(r'class="[^"]*\bpside__cat\b[^"]*"[^>]*>(.*?)</a>', built, re.S)
]

print("\nSIDEBAR CATEGORIES")
print(f"  · comp lists {len(comp_cats)}, built lists {len(built_cats)} — see DELIBERATE DIFFERENCES")
# The card lists every category the blog has, so this is no longer a fixed
# five. What must still hold is that none of the comp's went missing — except
# "Colorado Law", which the designer invented: it is not among the live site's
# 23 and never has been, so there is nothing to import under that name. That is
# the sixth entry this comp carries and the index comp does not.
COMP_ONLY_CATEGORIES = {"Colorado Law"}
cmp(
    "the comp's categories all still present",
    [],
    [c for c in comp_cats if c not in built_cats and c not in COMP_ONLY_CATEGORIES],
)


# ---------------------------------------------------------------- related band
# `authorOpen:` also appears in the component's `state = {…}` a hundred lines
# ABOVE this array, so the closing bound has to be searched from the opening one
# — taking the first match slices backwards and silently yields nothing.
rel_start = comp.index("related: [")
blk = comp[rel_start : comp.index("authorOpen:", rel_start)]
comp_rel_cats = re.findall(r"\{ cat: '([^']+)'", blk)
comp_rel_dates = re.findall(r"date: '([^']+)'", blk)
comp_rel_titles = [js(t) for t in re.findall(r"title: '((?:[^'\\]|\\.)*)'", blk)]

cards = re.findall(r'<li class="rcard[^"]*"(.*?)</li>', built, re.S)
built_rel_cats = [
    unesc(re.search(r'class="[^"]*\brcard__cat\b[^"]*"[^>]*>(.*?)</span>', c, re.S).group(1)) for c in cards
]
built_rel_dates = [unesc(re.search(r"<time[^>]*>(.*?)</time>", c, re.S).group(1)) for c in cards]
built_rel_titles = [
    unesc(re.search(r'class="[^"]*\brcard__link\b[^"]*"[^>]*>(.*?)</a>', c, re.S).group(1)) for c in cards
]

print(f"\nRELATED BAND ({len(cards)} built, {len(comp_rel_titles)} in comp)")
present("heading", ["Related blog posts", "Read more"])
# NOT the comp's three. `getRelatedPosts` picks from the imported archive, so
# these are real posts with real pages, chosen by category — the comp's three
# are among the titles the designer invented. The count and the completeness of
# each card are what the band still owes.
cmp("three cards", [3], [len(cards)])
for name, values in (("category", built_rel_cats), ("date", built_rel_dates), ("title", built_rel_titles)):
    cmp(f"every related card has a {name}", [], [i for i, v in enumerate(values) if not v.strip()])


# ---------------------------------------------------------------- fact check
print("\nFACT CHECK")
present(
    "label and body",
    [
        "Fact-checked",
        "This article was written and reviewed by the team at Dormer Harpring and approved by "
        "founding partner",
        "who has tried personal injury cases to verdict in Colorado courts for more than 20 years.",
    ],
)


# ---------------------------------------------------------------- deliberate diffs
# Each of these IS a difference from the comp, made on purpose. Asserted so the
# diff stays honest — if one is ever reverted, this script says so.
side_html = built[built.index('class="pside') :]
comp_body = markup[markup.index('class="bp-kt"') : markup.index('class="bp-fact"')]

EXPECTED = [
    (
        "the body is the live article, not the comp's rewrite",
        "Causes of Trampoline Park Accidents" in built_text
        and "What a Colorado waiver can and cannot do" not in built_text,
        "the comp and the live post share a URL; serving the comp's ~600 words there would drop "
        "~1,200 words that rank today",
    ),
    (
        "the takeaways box is a contents list",
        "In this article" in built_text and built.count('class="toc__link') == 9,
        "by request — every entry jumps to its section; the four takeaway statements stay as the "
        "article's own first section, which is where the live post keeps them",
    ),
    (
        "no author card and no popover",
        "About the author" not in built_text and "View full profile" not in built_text,
        "by request — it repeated the byline under the title and carried the page's only new "
        "interaction",
    ),
    (
        "sidebar order is form, categories, related",
        side_html.index("Get a free case review")
        < side_html.index("Categories")
        < side_html.index("Related articles"),
        "by request — the comp leads with the author card and puts the form third; the form is the "
        "only thing in the column a reader can act on",
    ),
    (
        "the sidebar is not sticky",
        "position: sticky" not in built and "position:sticky" not in built,
        "by request — with the form first the column is taller than most viewports, and a sticky "
        "element taller than its viewport never scrolls its foot into view",
    ),
    (
        "the fact-check band spans both columns",
        re.search(r'class="[^"]*\bpost__fact\b', built) is not None
        and built.index("post__fact") < built.index("pside"),
        "by request — it speaks for the page, not for the article column it would otherwise sit under",
    ),
    (
        "the body image is full width, not floated",
        "prose__figure" in built and "float" not in built[built.index("prose__figure") - 200 :][:600],
        "by request — a 460px float inside a 760px measure sets the text in a ~270px gutter, and "
        "the comp's own rules drop the float below 980px anyway",
    ),
    (
        "the body image is the comp's premises photo, not the live post's",
        "practice-slip-and-fall" in built,
        "the live post's own image is a stock shot of a contract being signed beside a car, "
        "alt-texted 'can you sue a trampoline park'",
    ),
    (
        "no in-body CTA blocks",
        "Hurt at a trampoline park?" not in built_text
        and "Get in touch with our team" not in built_text
        and "Work with a trial lawyer, not a settlement lawyer" not in built_text,
        "by request — the callout, phone band, attorney card and pull quote become Portable Text "
        "object types in the Sanity phase, not fixed sections of this template",
    ),
    (
        "the sidebar lists every reachable category, not the comp's six",
        len(built_cats) == 22,
        "one getBlogCategories() serves this card and the index's tab row, so they cannot drift. "
        "22, not the archive's 23: a post belongs to exactly one category, so "
        "'Auto Insurance & Accident Claims' is unreachable — 13 posts carry it second and none "
        "carry it first — and a category nothing can reach is dropped rather than shipped empty. "
        "The comp drew six because six was all the placeholder feed needed",
    ),
    (
        "related articles are real posts",
        side_html.count('class="pside__article') == 5
        and "What is my personal injury claim worth?" not in built_text,
        "all five the comp lists are titles the designer invented. The card now fills from the "
        "imported archive instead, so it ships the full five it was drawn with AND every one "
        "leads to a page — it used to fall back to four for want of real posts",
    ),
    (
        "the related band leads with the same category",
        built_rel_cats[0] == built_rel_cats[1] == "Premises Liability",
        "getRelatedPosts puts same-category posts first and the rest after, each half already "
        "newest-first. With a real archive behind it that grouping is visible; against the "
        "placeholder feed it looked like plain date order. The comp's own sequence follows no "
        "rule its markup states",
    ),
    (
        "related titles come from the feed, not the comp",
        all(t not in built_text for t in comp_rel_titles),
        "getBlogPosts() is the single source for a post's title and excerpt. It is the imported "
        "archive now, so none of the comp's three appear here at all — they name posts that do "
        "not exist",
    ),
    (
        "read time is computed, not typed",
        "7 min read" in built_text,
        "the figure is derived from the body's word count — it happens to land on the comp's 7, "
        "and it stays right when the body changes",
    ),
    (
        "reviewer is the roster's 'K.C. Harpring'",
        "K.C. Harpring" in built_text and "KC Harpring" not in built_text,
        "the byline is a reference to the team singleton; the comp writes 'KC Harpring' and the "
        "live site 'KC Harping'",
    ),
    (
        "the sidebar form is the site's form",
        built.count('action="/api/consult"') == 2
        and built.count('name="company"') == 2
        and built.count("data-phone-mask") == 2
        and "Last name" not in built_text,
        "the comp splits the name in two and drops the honeypot; reusing ContactForm gives the "
        "sidebar the phone mask, the patterns and the spam trap, and /api/consult one payload shape",
    ),
    (
        # The body is otherwise verbatim — every paragraph, list item and
        # heading matches the live article word for word, including its Title
        # Case bullet labels. These are the only two departures.
        "the live article's truncated sentence is completed",
        "understand what those waivers do and do not cover" in built_text,
        "the live copy stops mid-clause at '…understand what those waivers.' — reproduced, it "
        "reads as our bug on our page. TODO(launch) on the wording",
    ),
    (
        "the phone number is the site's, not the article's",
        "(866) 683-6894" in built_text
        and "747-4404" not in built_text
        and "756-3812" not in built_text,
        "the live article closes on a third number; site.ts is the only place a phone number may "
        "live, so it is read from there rather than transcribed",
    ),
    (
        "the sidebar form's button reads 'Review my case'",
        "Review my case" in built_text and "Request my case review" not in built_text,
        "shortened from the comp's 'Request my case review' at Rhan's request; the page-foot "
        "form keeps contact.ts's longer 'Request my free case review'",
    ),
    (
        "no fake form success panel",
        "We've received your request" not in built_text,
        "the comp's submitted-state panel told every visitor their case was received while "
        "discarding it",
    ),
    (
        "no AggregateRating structured data",
        "AggregateRating" not in built,
        "self-serving review markup on an organization is a Google policy violation",
    ),
]

print("\nDELIBERATE DIFFERENCES")
for label, held, why in EXPECTED:
    if held:
        print(f"  ✓ {label} — {why}")
    else:
        ok = False
        print(f"  ✗ {label} NO LONGER HOLDS — {why}")

print("\nRESULT:", "MATCHES COMP" if ok else "DIFFERENCES ABOVE")
sys.exit(0 if ok else 1)
