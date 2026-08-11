# Diffs the built Car Accidents page against its comp and reports any heading,
# card, list or figure whose text or ORDER disagrees.
#
# THIS ONE IS DIFFERENT FROM THE OTHER FOUR, and the difference is the point.
#
# The comp was redesigned after the page was first built — 31 sections down to
# 17, 23 `sc-for` loops down to 10 — and its `renderVals()` block STILL DEFINES
# FIFTEEN ARRAYS THE MARKUP NO LONGER READS: keyPoints, crashSteps,
# leadAttorneys, otherAttorneys, processSteps, injuries, damageCols,
# faultBranches, denverData, corridors, courts, relatedAreas, relatedArticles,
# firmData, lawCtas. They are the previous design's content, left in place.
#
# Several are close enough to the new copy to look authoritative and are not.
# `denverData` lists four bare figures where the page draws three with a
# consequence attached. `corridors` carries a different sentence per road.
# `firmData`'s third label reads "Share of calls we tell to skip hiring a
# lawyer" where the page says "Of callers we tell they don't need a lawyer".
#
# So this script checks the MARKUP first and only diffs an array where a `{{ }}`
# placeholder actually reads it — and it asserts, below, that the fifteen are
# still unused, so that a future revision which wires one back up fails here
# instead of shipping the wrong copy.
#
# Run after `npm run build`. Exits non-zero on any difference:
#   python3 scripts/diff-comp-car-accidents.py
#
# Not wired into `npm run check`, which must stay runnable without the design
# folder — this needs it. Run it by hand when touching the page or its data.

import re, html, sys

COMP = (
    "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files/"
    "DH - Car Accidents.html"
)
BUILT = (
    "/Users/rhanpemberton/my_apps/Dormer-Harpring/dist/"
    "denver-car-accident-lawyer/index.html"
)

comp = open(COMP, encoding="utf-8", errors="replace").read()
built = open(BUILT, encoding="utf-8", errors="replace").read()


def unesc(s):
    """Strip tags and entities, normalise quotes and whitespace."""
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    s = s.replace("—", "--").replace("–", "-")
    return re.sub(r"\s+", " ", s).strip()


def js(s):
    r"""A single-quoted JS string literal as it reads once unescaped."""
    s = s.replace("\\'", "'").replace('\\"', '"')
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)
    return unesc(s)


ok = True


def cmp(label, a, b):
    global ok
    if a == b:
        print(f"  ✓ {label} ({len(a)})")
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


def grab(cls, tag=r"\w+"):
    """Every occurrence of a built class's text content, in document order."""
    pattern = rf'<{tag}[^>]*class="[^"]*\b{cls}\b[^"]*"[^>]*>(.*?)</'
    return [unesc(m) for m in re.findall(pattern, built, re.S)]


def inner(cls, tag):
    """Text of the first `tag` inside every element carrying `cls`.

    Astro stamps `data-astro-cid-*` on every element it renders, so a bare
    `<b>` never matches the built page — the attribute has to be allowed for.
    """
    pattern = rf'class="[^"]*\b{cls}\b[^"]*"[^>]*>.*?<{tag}[^>]*>(.*?)</{tag}>'
    return [unesc(m) for m in re.findall(pattern, built, re.S)]


def noarrow(items):
    """Drop the trailing → the shared `.arrow` span adds to a link's text."""
    return [re.sub(r"\s*[→>]\s*$", "", t) for t in items]


built_text = unesc(built)
markup = comp[: comp.index('<script type="text/x-dc"')]
script = comp[comp.index('<script type="text/x-dc"') :]


def slice_from(start, end):
    """Comp markup between two landmarks, the second searched FROM the first.

    The comp's <style> block sits above its markup and names most of these
    classes, so `markup.index(end)` on its own can land ABOVE `start` and
    silently return an empty slice — which reads as "the comp lists nothing".
    """
    a = markup.index(start)
    return markup[a : markup.index(end, a)]


def array(name, end):
    """The source of one `renderVals()` array, from its name to the next one."""
    start = script.index(f"const {name} = ")
    return script[start : script.index(end, start)]


def strings(blob, key):
    """Every `key: '...'` value in an array's source, in order.

    BOTH quote styles. The comp switches to double quotes wherever a value
    contains an apostrophe, and a single-quote-only pattern silently SKIPS
    those entries rather than failing — which shows up as an off-by-one and
    reads like a content error.
    """
    pat = rf"{key}: (?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")"
    return [js(a or b) for a, b in re.findall(pat, blob)]


print(f"COMP  {COMP.rsplit('/', 1)[1]}")
print(f"BUILT {BUILT.rsplit('/', 1)[1]}\n")


# ------------------------------------------------------------------ hero + nav
print("HERO")
cmp(
    "h1",
    [unesc(re.search(r'<h1 class="ca-h1">(.*?)</h1>', markup, re.S).group(1))],
    [unesc(re.search(r"<h1[^>]*>(.*?)</h1>", built, re.S).group(1))],
)
present(
    "lede, proof row, CTA, reviewer line",
    [
        "Insurance companies offer more when they know your lawyer will take it to a jury. "
        "We take fewer cases so we can do exactly that.",
        "300+ Google reviews", "$70M+", "Recovered for clients", "Unless we win",
        "Speak with a lawyer", "Or call or text", "Reviewed by", "K.C. Harpring",
        "Founding Partner", "Updated July 2026", "Home", "Practice Areas", "Car Accidents",
    ],
)

print("\nSECTION NAV")
# THE BAR'S ORDER IS THE PAGE'S ORDER, checked structurally rather than by
# label. Each link is resolved to the character offset of the section it points
# at, and those offsets must ascend.
#
# This is the check that matters. The comp's bar lists five links in an order
# unrelated to its own page — "Colorado car accident laws" fourth of five with
# its section first of the five in the document — and nothing caught it until
# the scroll highlight, which walks the page in one direction, started marking
# the wrong link. A label comparison cannot see that at all; this fails the
# moment the page and the bar disagree, whatever either one is called.
# Attribute ORDER is not guaranteed — Astro emits `href` before the marker —
# so match the whole tag and pull the href out of it, rather than writing one
# pattern per possible layout and a fallback for the other.
nav_hrefs = [
    m.group(1)
    for tag in re.findall(r"<a\b[^>]*>", built)
    if "data-section-link" in tag
    for m in [re.search(r'href="#([^"]+)"', tag)]
    if m
]

positions = []
for target in nav_hrefs:
    at = built.find(f'id="{target}"')
    positions.append((target, at))

missing = [t for t, at in positions if at < 0]
if missing:
    ok = False
    print(f"  ✗ nav targets that exist on the page")
    for t in missing:
        print(f"      #{t} is linked but no element carries that id")
elif [at for _, at in positions] == sorted(at for _, at in positions):
    print(f"  ✓ the bar's order is the page's order ({len(positions)} links)")
else:
    ok = False
    print("  ✗ the bar's order is NOT the page's order")
    print(f"      bar : {[t for t, _ in positions]}")
    print(f"      page: {[t for t, _ in sorted(positions, key=lambda e: e[1])]}")

present("labels the comp also uses", ["Our lawyers", "Results", "Next steps"])


# ---------------------------------------------------------------------- triage
print("\nTRIAGE (five rows, all visible)")
comp_triage = slice_from('class="ca-triage"', 'class="ca-tr-src"')
cmp("questions", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_triage, re.S)], grab("trow__q", "h3"))
cmp(
    "bodies",
    [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_triage, re.S)],
    grab("trow__body", "p"),
)
cmp(
    "stat figures",
    [unesc(b) for b in re.findall(r'<span class="ca-tr-row__stat"><b>(.*?)</b>', comp_triage, re.S)],
    inner("trow__stat", "b"),
)
cmp(
    "row CTAs",
    noarrow([unesc(a) for a in re.findall(r'class="ca-tr-row__cta"[^>]*>(.*?)</a>', comp_triage, re.S)]),
    noarrow(grab("trow__cta", "a")),
)
present(
    "triage copy",
    [
        "Recently injured in a Denver car accident?",
        "Here are the things that actually matter this week",
        "What to do after a car accident", "Do this first",
        "Not sure what applies to you? Call and ask.",
        "C.R.S. 10-4-635", "24-10-109",
    ],
)


# ------------------------------------------------------------------- takeaways
print("\nIF YOU READ NOTHING ELSE")
comp_take = slice_from('class="ca-takegrid"', 'data-screen-label="Do I have a case"')
cmp("headings", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_take, re.S)], grab("takeaway__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_take, re.S)], grab("takeaway__body", "p"))
present("opener", ["The short version", "If you read nothing else on this page"])


# -------------------------------------------------------------------- criteria
print("\nDO I HAVE A CASE")
comp_crit = slice_from('class="ca-critlist"', 'data-screen-label="Our lawyers"')
cmp("conditions", [unesc(h) for h in re.findall(r"<h4>(.*?)</h4>", comp_crit, re.S)], grab("crit__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_crit, re.S)], grab("crit__body", "p"))
present(
    "video + honesty note",
    [
        "The three things a case needs",
        "Three things have to be true.",
        "If there isn't a case here, we'll tell you that instead of selling you one.",
    ],
)


# --------------------------------------------------------------------- lawyers
print("\nOUR LAWYERS (four, with credentials)")
blob = array("caLawyers", "const otherAttorneys")
cmp("names", strings(blob, "name"), grab("lw__nm", "a"))
cmp("roles", strings(blob, "role"), grab("lw__role", "span"))
cmp("credential lines", strings(blob, "cred"), grab("lw__cred", "p"))
present(
    "heading, lede, link",
    [
        "Meet our car accident lawyers",
        "The attorneys below handle our Denver car accident cases from investigation "
        "through trial.",
        "See the full team",
    ],
)


# ----------------------------------------------------------------- credentials
print("\nCREDENTIALS")
comp_badges = slice_from('class="ca-badges"', 'class="ca-awards__disc"')
cmp(
    "badge captions",
    [unesc(s) for s in re.findall(r"</img>|<span>(.*?)</span>", comp_badges, re.S) if s],
    grab("badge__cap", "span"),
)
present(
    "eyebrow + disclaimer",
    [
        "Recognized & awarded",
        "Awarding organizations are not certifying authorities. Selection criteria vary "
        "by organization.",
    ],
)


# -------------------------------------------------------------------- why firm
print("\nWHY THIS FIRM")
comp_why = slice_from('class="ca-why"', 'data-screen-label="Results"')
cmp("figures", [unesc(b) for b in re.findall(r"<li><b>(.*?)</b>", comp_why, re.S)], grab("wfstats__big", "dd"))
cmp(
    "figure labels",
    [unesc(s) for s in re.findall(r"<li><b>.*?</b><span>(.*?)</span>", comp_why, re.S)],
    grab("wfstats__label", "dt"),
)
cmp("column headings", [unesc(h) for h in re.findall(r"<h4>(.*?)</h4>", comp_why, re.S)], grab("wfcol__title", "h3"))
cmp("column bodies", [unesc(p) for p in re.findall(r'<div class="ca-wf__c">.*?<p>(.*?)</p>', comp_why, re.S)], grab("wfcol__body", "p"))
present(
    "eyebrow, claim, disclaimer, link",
    [
        "Why Dormer Harpring?",
        "We are built to try cases, not to settle them cheaply.",
        "Based on Dormer Harpring's closed car accident matters, [date range].",
        "See the case results",
    ],
)


# --------------------------------------------------------------------- results
print("\nRESULTS (one video card, two figure cards)")
blob = array("resultStories", "const crashSteps")
# The video card reverses its figures out of the poster (`<s>` struck, `<em>`
# recovered); the two figure cards use the boxed `.res__fig`. Both, in order.
cmp("offered", strings(blob, "offered"), inner("resv__row", "s") + grab("res__off", "span"))
cmp("recovered", strings(blob, "recovered"), inner("resv__row", "em") + grab("res__rec", "span"))
cmp("titles", strings(blob, "title"), [unesc(b) for b in re.findall(r'class="[^"]*\bresv__bot\b[^"]*"[^>]*><b[^>]*>(.*?)</b>', built, re.S)] + grab("res__title", "h3"))
cmp("stories", strings(blob, "story"), grab("res__story", "p"))
cmp("what changed", strings(blob, "changed"), grab("res__chg", "p"))
present(
    "band copy",
    [
        "Car accident results", "What we were offered, and what we recovered.",
        "Offered", "Recovered",
        "Past results do not guarantee future outcomes. Every case is different.",
    ],
)


# -------------------------------------------------------------------- timeline
print("\nWHAT THE NEXT FEW MONTHS LOOK LIKE")
comp_tl = slice_from('class="ca-chev"', 'data-screen-label="Types of car accidents"')
cmp("chevron steps", [unesc(h) for h in re.findall(r'<div class="ca-chev__p[^"]*"><b>.*?</b><h3>(.*?)</h3>', comp_tl, re.S)], grab("chev__title", "h3"))
cmp("phase titles", [unesc(b) for b in re.findall(r'<span class="ca-tline__hd"><b>(.*?)</b>', comp_tl, re.S)], inner("phases__hd", "b"))
cmp("phase durations", [unesc(e) for e in re.findall(r"<em>(.*?)</em>", comp_tl, re.S)], grab("phases__hd", "em") or [unesc(e) for e in re.findall(r'class="[^"]*\bphases__hd\b[^"]*"[^>]*>.*?<em[^>]*>(.*?)</em>', built, re.S)])
cmp(
    "side points",
    [unesc(li) for li in re.findall(r"<li>(.*?)</li>", slice_from('class="ca-tline__pts"', "</ul>"), re.S)],
    [unesc(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", re.search(r'class="[^"]*\btline__pts\b[^"]*"[^>]*>(.*?)</ul>', built, re.S).group(1), re.S)],
)
present("heading + ledes", ["What the next few months look like", "Here is the honest version.", "Most of our clients never set foot in a courtroom"])


# ----------------------------------------------------------------- crash types
print("\nCRASH TYPES")
blob = array("crashTypes", "const injuries")
cmp("names", strings(blob, "name"), grab("tile__name", "h3"))
cmp("bodies", strings(blob, "body"), grab("tile__body", "p"))
cmp("link labels", strings(blob, "link"), noarrow(grab("tile__link", "span")))
present("heading + lede", ["Types of car accidents we handle", "How the crash happened changes what has to be proven, and who ends up paying."])


# ---------------------------------------------------------------- denver data
print("\nCAR ACCIDENTS IN DENVER")
comp_dv = slice_from('class="ca-stat3"', 'data-screen-label="Testimonials"')
cmp("figures", [unesc(b) for b in re.findall(r"<div><b>(.*?)</b>", comp_dv, re.S)], grab("stat3__big", "dd"))
cmp("figure labels", [unesc(s) for s in re.findall(r"<div><b>.*?</b><span>(.*?)</span>", comp_dv, re.S)], grab("stat3__label", "dt"))
cmp("figure notes", [unesc(p) for p in re.findall(r"<div><b>.*?</b><span>.*?</span><p>(.*?)</p>", comp_dv, re.S)], grab("stat3__body", "dd"))
corrlist = re.search(r'class="[^"]*\bcorrlist\b[^"]*"[^>]*>(.*?)</ol>', built, re.S).group(1)
cmp(
    "corridor names",
    [unesc(b) for b in re.findall(r"<li><b>(.*?)</b>", comp_dv, re.S)],
    [unesc(b) for b in re.findall(r"<b[^>]*>(.*?)</b>", corrlist, re.S)],
)
cmp(
    "corridor notes",
    [unesc(p) for p in re.findall(r"<li><b>.*?</b><p>(.*?)</p>", comp_dv, re.S)],
    [unesc(x) for x in re.findall(r"<p[^>]*>(.*?)</p>", corrlist, re.S)],
)
present("source + map caption", ["Source: [CDOT / DRCOG / Denver Open Data], [year].", "Schematic, not to scale."])


# --------------------------------------------------------------------- teasers
print("\nTEASERS")
present(
    "checklist + fault",
    [
        "8 things to do after a car accident",
        "From the scene to the first adjuster call -- the steps that protect your claim.",
        "See all 8 steps",
        "Call the police", "Photograph the scene", "Get witness names", "See a doctor",
        "What if part of it was my fault?",
        "Colorado reduces what you recover by your share of the blame instead of erasing it.",
        "How fault gets decided",
        "None of it your fault", "Over half -- you get nothing", "All your fault",
        "C.R.S. 13-21-111",
    ],
)


# ---------------------------------------------------------------------- "more"
print("\nMORE ON CAR ACCIDENT CLAIMS")
comp_more = slice_from('class="ca-feats"', 'data-screen-label="FAQ"')
cmp(
    "two feature cards",
    [unesc(b) for b in re.findall(r'</span>\s*<b>(.*?)</b>', comp_more, re.S)][:2],
    grab("feat__title", "b"),
)
cmp(
    "six more cards",
    [unesc(b) for b in re.findall(r'<a class="ca-more__c"[^>]*><b>(.*?)</b>', comp_more, re.S)],
    grab("mcard__title", "b"),
)
present("heading", ["More on car accident claims"])


# ------------------------------------------------------------------------ FAQ
print("\nFAQ")
blob = array("lawQuestionsData", "const faqLens")
cmp("questions", strings(blob, "q"), grab("faq__q-text", "span"))
cmp("answers", strings(blob, "a"), grab("faq__a", "p"))
lens = [js(x) for x in re.findall(r"'([^']+)'", array("faqLens", "const lawQuestions"))]
cmp("reading times", lens, [re.sub(r"^.*?Watch\s*·\s*", "", t) for t in grab("faq__watch", "span")])
present(
    "band copy",
    [
        "What you should know", "Other questions people ask us",
        "Expand any question to read the answer and watch a short video",
        "Have a question you don't see?",
    ],
)


# -------------------------------------------------------------------- closing
print("\nCLOSING")
present(
    "heading, lede, office",
    [
        "Talk to a lawyer about your crash",
        "Free, confidential, and no obligation.",
        "Our office", "3457 Ringsby Ct", "Denver, CO 80216",
        "Call us", "Text us", "Email",
    ],
)


# ------------------------------------------------------ the comp's dead arrays
# The second design left fifteen of the first's arrays in `renderVals()` with no
# placeholder reading them. Asserted so that a later revision which wires one
# back up fails HERE — loudly — rather than shipping the older copy.
DEAD = [
    "keyPoints", "crashSteps", "leadAttorneys", "otherAttorneys", "processSteps",
    "injuries", "damageCols", "faultBranches", "denverData", "corridors", "courts",
    "relatedAreas", "relatedArticles", "firmData", "lawCtas",
]
print(f"\nTHE COMP'S DEAD ARRAYS ({len(DEAD)})")
still_dead = [name for name in DEAD if f"{{{{ {name} }}}}" not in markup]
if len(still_dead) == len(DEAD):
    print(f"  ✓ none of the {len(DEAD)} is referenced by a placeholder")
else:
    ok = False
    wired = [n for n in DEAD if n not in still_dead]
    print(f"  ✗ the comp now RENDERS {wired} — build from it, don't skip it")


# ------------------------------------------------------- deliberate differences
EXPECTED = [
    (
        "the testimonials rail sits with the results, not four sections later",
        built.index('id="reviews"') < built.index('id="next"'),
        "results and reviews are one argument told two ways — the figures, then the "
        "people behind them — and the comp puts the case timeline, the crash types and "
        "the Denver data between them. Moving the rail up also breaks the comp's "
        "`cream → cream → cream` run across those three",
    ),
    (
        "the section nav is rebuilt in document order, six links not five",
        len(nav_hrefs) == 6 and "Crash types" in built_text and "Colorado law" in built_text,
        "the comp's five are in an order unrelated to its own page. Rebuilt to follow "
        "the document, with labels shortened to fit the bar and a sixth added for "
        "\"Do I have a case?\", whose section the comp never anchored",
    ),
    (
        "the reviewed-by line is a link, not a disclosure",
        'class="cred"' in built
        and "cred__updated" in built
        and "Licensed in Colorado since 2006" not in built_text,
        "by request. The comp draws a <details> holding five credential lines; every one "
        "of them is already on the bio this now links to, so carrying them here as well "
        "would put the same claims in two places to verify — and gave the page an "
        "interaction whose only job was to hide them",
    ),
    (
        "the result video card links to the real testimonial",
        "youtube.com/watch?v=kFdrOgblr6A" in built and "caResLb" not in built,
        "the comp opens a lightbox that shows the poster IMAGE and the quote again — "
        "there is no player in it. This client's video is one of the six real ones on "
        "the @denvertrial channel, so the card links out as /testimonials already does",
    ),
    (
        "the checklist teaser has no link",
        "teaser__cta--inert" in built and "See all 8 steps" in built_text,
        "the comp points it at `DH - Blog - What to do after a car accident.html`, a "
        "post comp that arrived with this revision and that this build does not serve. "
        "Rhan's call: keep the label, drop the affordance, ship no dead href",
    ),
    (
        "six of the eight crash types link, two do not",
        built.count('class="tile tile--link') == 6
        and built.count('class="tile__link tile__link--inert') == 2,
        "the comp points all eight at `DH - Practice Areas.html`, which is not a "
        "destination. Rear-end and head-on have no page anywhere on the legacy site, so "
        "they keep the label and lose the arrow — `.arrow` belongs only on something "
        "that navigates",
    ),
    (
        "the statute citations are text, not links",
        "law.justia.com" not in built and "C.R.S. 13-21-111" in built_text,
        "the comp links all of them to the Justia index rather than to the section — a "
        "citation that reads as a link and does not reach the statute is worse than one "
        "that does not pretend to",
    ),
    (
        "the badge captions are matched to the artwork, not to the comp's filenames",
        "Multi-Million Dollar Advocates Forum" in built_text and "Avvo 10.0" in built_text,
        "every comp captions badge-1 as Avvo, badge-2 as TopVerdict, badge-3 as Million "
        "Dollar and badge-4 as Multi-Million, and all four files are something else. "
        "getAwards() documents the correction; this page resolves each caption to the "
        "badge that actually says it",
    ),
    (
        "the closing block is this page's arrangement of the shared contact pieces",
        'id="contact"' in built and "closing__formcard" in built,
        "the comp draws its own heading, a 2x2 card grid over the map, and the form "
        "beside them — a different arrangement from `ContactDetails`. The reusable "
        "pieces are ContactForm and InfoCard, which is what it uses",
    ),
    (
        "no fake form success panel",
        "A lawyer will reach out today." not in built_text,
        "the comp's submitted-state panel told every visitor their case had been "
        "received while discarding it. `/api/consult` does not exist yet",
    ),
    (
        "no AggregateRating structured data",
        "AggregateRating" not in built,
        "self-serving review markup on an organization is a Google policy violation, and "
        "one of the things this rebuild exists to fix",
    ),
    (
        "Attorney structured data, without the comp's sameAs",
        '"@type":"Attorney"' in built and "coloradosupremecourt.com" not in built,
        "the comp points every attorney's sameAs at the Colorado Supreme Court's "
        "attorney SEARCH FORM and at linkedin.com — neither identifies the person, and "
        "sameAs is an identity claim",
    ),
    (
        "the FAQ reuses the site's accordion and emits FAQPage schema",
        '"@type":"FAQPage"' in built or '"@type": "FAQPage"' in built,
        "`lawQuestionsData` + `faqLens` is the existing Faq type with its two halves "
        "kept apart, so the twelve rows drop into faqs.ts and FaqBand renders them "
        "unchanged",
    ),
    (
        "the results rail uses the shared rail script",
        'data-rail="ca-results"' in built,
        "the comp ships its own pointer-drag handler for this one rail. `scripts/rail.ts` "
        "already drives four rails by name and native touch scrolling covers the swipe",
    ),
]

print("\nDELIBERATE DIFFERENCES")
for label, holds, why in EXPECTED:
    if holds:
        print(f"  ✓ {label}")
    else:
        ok = False
        print(f"  ✗ {label} — NO LONGER TRUE")
        print(f"      was deliberate because: {why}")

print("\nRESULT:", "MATCHES COMP" if ok else "DIFFERS FROM COMP")
sys.exit(0 if ok else 1)
