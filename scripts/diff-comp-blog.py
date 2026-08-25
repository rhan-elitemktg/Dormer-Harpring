# Diffs the built /news page against the Blog comp — both its static markup and
# the `renderVals()` arrays in its `data-dc-script` block — and reports any
# heading, tab, card or paragraph whose text or ORDER disagrees.
#
# Same reason as diff-comp-about.py and diff-comp-practice-areas.py: a build is
# green whenever the LAYOUT is right, so neither linter can see a page whose
# every string is wrong. The Blog comp puts its six category tabs, twelve post
# cards and six core values in the script block at its foot; the page header and
# the whole featured panel are static markup above it.
#
# Run after `npm run build`. Exits non-zero on any difference:
#   python3 scripts/diff-comp-blog.py
#
# Not wired into `npm run check`, which must stay runnable without the design
# folder — this needs it. Run it by hand when touching the page or its data.
#
# Nine DELIBERATE differences are asserted rather than flagged; see EXPECTED
# below. Each is a decision recorded in the code it belongs to.

import re, html, sys

COMP = "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files/DH - Blog.html"
BUILT = "/Users/rhanpemberton/my_apps/Dormer-Harpring/dist/news/index.html"

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

# site.ts is the single source for the firm's phone number, and a .py script
# cannot import a .ts module — so it is read out by regex rather than repeated.
SITE_PHONE = re.search(
    r'phone:\s*"([^"]+)"',
    open("src/data/site.ts", encoding="utf-8").read(),
).group(1)

SITE_SMS = re.search(
    r'sms:\s*"([^"]+)"',
    open("src/data/site.ts", encoding="utf-8").read(),
).group(1)

# BOTH numbers the comps carry, and the comps are wrong about both. Excluded
# from the info-card value comparison and asserted as a declared departure
# instead — see EXPECTED.
COMP_NUMBERS = ("(866) 683-6894", "(720) 734-6230")

markup = comp[: comp.index('<script type="text/x-dc"')]
markup_nofor = re.sub(r"<sc-for.*?</sc-for>", "", markup, flags=re.S)


# ---------------------------------------------------------------- page header
comp_h1 = unesc(re.search(r"<h1[^>]*>(.*?)</h1>", markup, re.S).group(1))
built_h1 = unesc(re.search(r"<h1[^>]*>(.*?)</h1>", built, re.S).group(1))

print("PAGE HEADER")
cmp("h1", [comp_h1], [built_h1])
present(
    "eyebrow + lede",
    [
        "News &amp; insights",
        "Plain-English answers on insurance, injuries, and what actually happens "
        "after a crash in Colorado — written by the lawyers who try these cases.",
        "Select category",
    ],
)


# ---------------------------------------------------------------- category tabs
blk = comp[comp.index("const tabs = [") : comp.index("const posts = [")]
# The array literal only — the `.map()` that follows it builds the class names
# from single-quoted strings too, and those are not labels.
blk = blk[blk.index("[") : blk.index("]") + 1]
comp_tabs = [js(t) for t in re.findall(r"'((?:[^'\\]|\\.)*)'", blk)]
built_tabs = [
    unesc(x)
    for x in re.findall(r'<button[^>]*class="cats__tab[^"]*"[^>]*>(.*?)</button>', built, re.S)
]

print("\nCATEGORY TABS")
print(f"  · comp draws {len(comp_tabs)}, built ships {len(built_tabs)} — see DELIBERATE DIFFERENCES")
# NOT a 1:1 comparison any more: the row carries every category the blog has.
# What still has to hold is that none of the comp's SIX went missing — a
# category the designer drew disappearing is a real regression, and it would be
# invisible in a bare count.
missing_tabs = [t for t in comp_tabs if t not in built_tabs]
cmp("the comp's tabs all still present", [], missing_tabs)


# ---------------------------------------------------------------- featured post
# Static markup, not the script block — the comp hardcodes the one featured post.
feat = markup[markup.index("Featured post") : markup.index("===== POSTS =====")]

print("\nFEATURED POST")
present(
    "category, date, title, excerpt, CTA",
    [
        "Featured post",
        "Premises Liability",
        "June 23, 2026",
        unesc(re.search(r"<h2[^>]*>(.*?)</h2>", feat, re.S).group(1)),
        unesc(re.search(r'max-width:52ch">(.*?)</p>', feat, re.S).group(1)),
        "Read more",
    ],
)


# ---------------------------------------------------------------- post cards
blk = comp[comp.index("const posts = [") : comp.index("const coreValuesData = [")]
comp_cats = re.findall(r"\{ cat: '([^']+)'", blk)
comp_dates = re.findall(r"date: '([^']+)'", blk)
comp_titles = [js(t) for t in re.findall(r"title: '((?:[^'\\]|\\.)*)'", blk)]
comp_excerpts = [js(e) for e in re.findall(r"excerpt: '((?:[^'\\]|\\.)*)'", blk)]

card_re = re.compile(r'<li class="pcard"(.*?)</li>', re.S)
cards = card_re.findall(built[built.index('class="posts__grid"') :])
built_cats = [unesc(re.search(r'class="pcard__cat"[^>]*>(.*?)</span>', c, re.S).group(1)) for c in cards]
built_dates = [unesc(re.search(r"<time[^>]*>(.*?)</time>", c, re.S).group(1)) for c in cards]
built_titles = [unesc(re.search(r'class="pcard__title"[^>]*>(.*?)</h3>', c, re.S).group(1)) for c in cards]
built_excerpts = [
    unesc(re.search(r'class="pcard__excerpt"[^>]*>(.*?)</p>', c, re.S).group(1)) for c in cards
]

print(f"\nPOST CARDS ({len(cards)} built, {len(comp_titles)} in comp)")
# The comp's twelve were placeholder copy — four real posts and eight titles the
# designer invented. The grid is the imported archive now, so comparing the two
# lists card-for-card compares a real feed against a mock-up. What replaces it is
# the check that actually protects the card COMPONENT: every card, all 166 of
# them, renders every field. A card losing its excerpt or its date would have
# shown up in the old comparison too, and still shows up here.
for name, values in (
    ("category", built_cats),
    ("date", built_dates),
    ("title", built_titles),
    ("excerpt", built_excerpts),
):
    blank = [i for i, v in enumerate(values) if not v.strip()]
    cmp(f"every card has a {name}", [], blank)
    if len(values) != len(cards):
        cmp(f"a {name} per card", [len(cards)], [len(values)])


# ---------------------------------------------------------------- core values
blk = comp[comp.index("const coreValuesData = [") : comp.index("const coreValues =")]
comp_value_titles = [js(t) for t in re.findall(r"\{ title: '([^']+)'", blk)]
comp_value_bodies = [js(b) for b in re.findall(r"body: '((?:[^'\\]|\\.)*)'", blk)]
built_value_titles = [unesc(x) for x in re.findall(r'<h3 class="values__name[^"]*"[^>]*>(.*?)</h3>', built, re.S)]
built_value_bodies = [unesc(x) for x in re.findall(r'<p class="values__body[^"]*"[^>]*>(.*?)</p>', built, re.S)]

# Same normalisation, and the same reason, as diff-comp-about.py: `coreValues.ts`
# is ONE singleton serving three pages and was built from the homepage, which is
# the approved comp. The Blog comp expands two of the six contractions.
CONTRACTIONS = [("do not", "don't"), ("We are", "We're"), ("cannot", "can't"), ("is not", "isn't")]


def decontract(s):
    for long, short in CONTRACTIONS:
        s = s.replace(long, short)
    return s


print("\nCORE VALUES")
cmp("titles / order", comp_value_titles, built_value_titles)
cmp(
    "bodies / order (contractions normalised — see note)",
    [decontract(b) for b in comp_value_bodies],
    [decontract(b) for b in built_value_bodies],
)


# ---------------------------------------------------------------- info cards
blk = comp[comp.index("const infoCardsData = [") : comp.index("const infoCards =")]

print("\nCONTACT INFO CARDS")
present("labels", re.findall(r"label: '([^']+)'", blk))
present("values", [v for v in re.findall(r"value: '([^']+)'", blk) if not any(n in v for n in COMP_NUMBERS)])


# ---------------------------------------------------------------- deliberate diffs
# Each of these IS a difference from the comp, made on purpose. Asserted so the
# diff stays honest — if one is ever reverted, this script says so.
grid_html = built[built.index('class="posts__grid"') :]

EXPECTED = [
    (
        # The comps' own infoCardsData values are excluded from present("values")
        # above; both numbers are asserted here instead, against site.ts.
        "both phone numbers are the firm's, not the comps'",
        SITE_PHONE in built_text
        and SITE_SMS in built_text
        and not any(n in built_text for n in COMP_NUMBERS),
        "the comps are wrong about BOTH numbers and this project had taken both from them. Call: "
        "the comps say (866) 683-6894 and this codebase recorded it as the firm's choice; the firm "
        "confirmed (303) 756-3812, the number its live site publishes in JSON-LD and on its "
        "contact page. Text: the comps say (720) 734-6230 across 29 files; the firm confirmed "
        "(720) 730-7997, which the live site publishes 864 times and which the comps carry only "
        "inside commented-out markup. Both retired, neither kept as a fallback. site.ts is the "
        "only place a phone number may live, so this reads from there",
    ),
    (
        "the category row sits below the featured panel, not above it",
        built.index('class="cats"') > built.index('class="feat"')
        and built.index('class="cats"') < built.index('class="posts"'),
        "the comp separates the tabs from the cards they filter with a 560px-tall panel",
    ),
    (
        "the featured panel is not filtered",
        "data-blog-featured" not in built,
        "it is the page's editorial lead, and hiding it collapsed the top of the page on every tab press",
    ),
    (
        "the four real posts link to their legacy slugs",
        # WITH the trailing slash: the site links every internal path that way
        # (ROUTES / `trailingSlash: "always"` / vercel.json's `trailingSlash`),
        # matching the form all ~300 legacy URLs are indexed under. Asserted
        # literally rather than slash-agnostically so that reverting the
        # convention fails here instead of passing quietly.
        all(
            f'href="/{slug}/"' in grid_html
            for slug in (
                "common-daycare-injuries",
                "are-helmets-safe-to-use-after-theyve-been-dropped",
                "dangers-of-pressure-cookers",
                "what-are-common-types-of-product-defects",
            )
        )
        and 'href="/can-you-sue-a-trampoline-park-if-you-signed-a-waiver/"' in built,
        "the comp points all thirteen at '#'; five are real live posts and the scrape has their URLs",
    ),
    (
        # WAS "the eight invented posts carry no link", when the grid was the
        # comp's twelve and only four were real. They are not unlinked now —
        # they are GONE, replaced by the imported archive, so the invariant
        # flipped from "exactly four link" to "every card links".
        "every card links; nothing renders unlinked",
        grid_html.count('class="pcard__link"') == len(cards) and len(cards) > 12,
        "the comp's eight invented titles exist nowhere in the 167 legacy posts; rather than "
        "ship them unlinked the grid now carries the real archive, so every card leads somewhere",
    ),
    (
        "reviewer is the roster's 'K.C. Harpring'",
        "K.C. Harpring" in built_text and "KC Harpring" not in built_text,
        "the byline is a reference to the team singleton; the comp writes 'KC Harpring' and the live site 'KC Harping'",
    ),
    (
        "card art is decorative, with an empty alt",
        re.search(r'<img[^>]*\balt(?:=""|\s|>)', grid_html) is not None
        and "Common daycare injuries" not in re.sub(r">[^<]*<", "><", grid_html),
        "the comp sets the post title as the alt, which a screen reader then reads twice",
    ),
    (
        # Two anchors per card are the byline's ("Dormer Harpring", the
        # reviewer); a card with a post adds exactly one more, the title. The
        # comp would give the four linked cards five apiece.
        "one link per card, not four",
        # Every card is linked now, so every card is the same shape: two byline
        # anchors plus the title. The old expectation — [2]*8 + [3]*4 — was
        # describing the placeholder feed's eight unlinked cards, not a rule.
        sorted(c.count("<a ") for c in cards) == [3] * len(cards),
        "the comp wires thumbnail, title and Read more as three anchors to one destination",
    ),
    (
        "no fake form success panel",
        "We've received your request" not in built_text,
        "the comp's submitted-state panel told every visitor their case was received while discarding it",
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
