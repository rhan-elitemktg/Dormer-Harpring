# Diffs the built /about page against the About comp — both its static markup
# and the `renderVals()` arrays in its `data-dc-script` block — and reports any
# heading, paragraph, card or list item whose text or ORDER disagrees.
#
# Same reason as diff-comp-practice-areas.py: a build is green whenever the
# LAYOUT is right, so neither linter can see a page whose every string is wrong.
# The About comp puts its four stats, four attorney cards, three promises, four
# milestones, six core values and three reviews in the script block at its foot;
# the eleven sections' prose is in the markup above.
#
# Run after `npm run build`. Exits non-zero on any difference:
#   python3 scripts/diff-comp-about.py
#
# Not wired into `npm run check`, which must stay runnable without the design
# folder — this needs it. Run it by hand when touching the page or its data.
#
# Four DELIBERATE differences are asserted rather than flagged; see EXPECTED
# below. Each is a decision recorded in the code it belongs to.

import re, html, sys

COMP = "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files/DH - About.html"
BUILT = "/Users/rhanpemberton/my_apps/Dormer-Harpring/dist/about/index.html"

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


# ---------------------------------------------------------------- section prose
# Every <h1>/<h2>/<h3> and every body <p> the comp's markup carries, in order.
# `sc-for` bodies are skipped here — their text is in the script block below.
markup = comp[: comp.index("<script type=\"text/x-dc\"")]
markup = re.sub(r"<sc-for.*?</sc-for>", "", markup, flags=re.S)
comp_headings = [unesc(m) for m in re.findall(r"<h([12])[^>]*>(.*?)</h\1>", markup, re.S) for m in [m[1]]]

print("SECTION HEADINGS")
present("comp headings appear in the built page", comp_headings)


# ---------------------------------------------------------------- stats
blk = comp[comp.index("const statsData = ["): comp.index("const stats =")]
comp_stat_big = re.findall(r"big: '([^']+)'", blk)
comp_stat_label = re.findall(r"label: '([^']+)'", blk)
built_stat_big = [unesc(x) for x in re.findall(r'<dd class="stats__big[^"]*"[^>]*>(.*?)</dd>', built, re.S)]
built_stat_label = [unesc(x) for x in re.findall(r'<dt class="stats__label[^"]*"[^>]*>(.*?)</dt>', built, re.S)]

print("\nBY THE NUMBERS")
cmp("figures / order", comp_stat_big, built_stat_big)
cmp("labels / order", comp_stat_label, built_stat_label)


# ---------------------------------------------------------------- team cards
blk = comp[comp.index("const team = ["): comp.index("const eIcon")]
comp_team = re.findall(r"name: '([^']+)', roleLine: '([^']+)'", blk)
built_team_names = [unesc(x) for x in re.findall(r'<span class="acard__name[^"]*"[^>]*>(.*?)</span>', built, re.S)]
built_team_roles = [unesc(x) for x in re.findall(r'<span class="acard__role[^"]*"[^>]*>(.*?)</span>', built, re.S)]

print("\nMEET THE TEAM")
cmp("names / order", [n for n, _ in comp_team], built_team_names)
cmp("role lines / order", [r.replace("·", "·") for _, r in comp_team], built_team_roles)


# ---------------------------------------------------------------- expect cards
blk = comp[comp.index("const expect = ["): comp.index("const milesData")]
comp_expect_titles = [js(t) for t in re.findall(r"\{ title: '([^']+)'", blk)]
comp_expect_bodies = [js(b) for b in re.findall(r"body: '((?:[^'\\]|\\.)*)'", blk)]
built_expect_titles = [unesc(x) for x in re.findall(r'<h3 class="expect__card-title[^"]*"[^>]*>(.*?)</h3>', built, re.S)]
built_expect_bodies = [unesc(x) for x in re.findall(r'<p class="expect__card-body[^"]*"[^>]*>(.*?)</p>', built, re.S)]

print("\nWHAT YOU CAN EXPECT")
cmp("card titles / order", comp_expect_titles, built_expect_titles)
cmp("card bodies / order", comp_expect_bodies, built_expect_bodies)


# ---------------------------------------------------------------- milestones
blk = comp[comp.index("const milesData = ["): comp.index("const miles =")]
comp_miles = re.findall(r"tag: '([^']+)', title: '([^']+)', body: '((?:[^'\\]|\\.)*)'", blk)
built_mile_tags = [unesc(x) for x in re.findall(r'<span class="expect__tag[^"]*"[^>]*>(.*?)</span>', built, re.S)]
built_mile_titles = [unesc(x) for x in re.findall(r'<h3 class="expect__mile-title[^"]*"[^>]*>(.*?)</h3>', built, re.S)]
built_mile_bodies = [unesc(x) for x in re.findall(r'<p class="expect__mile-body[^"]*"[^>]*>(.*?)</p>', built, re.S)]

cmp("milestone tags / order", [t for t, _, _ in comp_miles], built_mile_tags)
cmp("milestone titles / order", [t for _, t, _ in comp_miles], built_mile_titles)
cmp("milestone bodies / order", [js(b) for _, _, b in comp_miles], built_mile_bodies)


# ---------------------------------------------------------------- core values
blk = comp[comp.index("const coreValuesData = ["): comp.index("const coreValues =")]
comp_value_titles = [js(t) for t in re.findall(r"\{ title: '([^']+)'", blk)]
comp_value_bodies = [js(b) for b in re.findall(r"body: '((?:[^'\\]|\\.)*)'", blk)]
built_value_titles = [unesc(x) for x in re.findall(r'<h3 class="values__name[^"]*"[^>]*>(.*?)</h3>', built, re.S)]
built_value_bodies = [unesc(x) for x in re.findall(r'<p class="values__body[^"]*"[^>]*>(.*?)</p>', built, re.S)]

# The two comps carry the same six values with two strings contracted
# differently — the homepage says "We don't" and "We're", About expands both.
# `coreValues.ts` is ONE singleton serving both pages and was built from the
# homepage, which is the approved comp, so the contraction is expected here.
# Normalised rather than ignored: any other divergence still fails.
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
blk = comp[comp.index("const infoCardsData = ["): comp.index("const infoCards =")]
comp_card_labels = re.findall(r"label: '([^']+)'", blk)
comp_card_values = re.findall(r"value: '([^']+)'", blk)

print("\nCONTACT INFO CARDS")
present("labels", comp_card_labels)
present("values", [v for v in comp_card_values if not any(n in v for n in COMP_NUMBERS)])


# ---------------------------------------------------------------- reviews
blk = comp[comp.index("reviews: ["): comp.index("submitted: this.state.submitted")]
comp_review_names = re.findall(r"name: '([^']+)'", blk)
built_review_names = [unesc(x) for x in re.findall(r'<span class="itw__name[^"]*"[^>]*>(.*?)</span>', built, re.S)]

print("\nIN THEIR WORDS")
cmp("reviewer names / order", comp_review_names, built_review_names)


# ---------------------------------------------------------------- deliberate diffs
# Each of these IS a difference from the comp, made on purpose. Asserted so the
# diff stays honest — if one is ever reverted, this script says so.
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
        # Searched in the RAW html, not `built_text` — alt lives in an attribute,
        # and stripping tags takes the attribute with them.
        "founders' alt text corrected",
        "Michael Dormer" not in built
        and 'alt="Founding partners K.C. Harpring and Sean Dormer"' in built,
        "the comp's alt text invents two names; the founders are Sean Dormer and K.C. Harpring",
    ),
    (
        "core values keep the homepage comp's contractions",
        "We don't need a reason to do the right thing." in built_text,
        "one singleton serves both pages; the About comp expands two of the six",
    ),
    (
        "no fake form success panel",
        "We've received your request" not in built_text,
        "the comp's submitted-state panel told every visitor their case was received while discarding it",
    ),
    (
        "review headlines are the homepage's, not the comp's trimmed pair",
        "They took the time to explain every step of the process." in built_text,
        "same three Google reviews; the About comp trims two headlines by a clause",
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
