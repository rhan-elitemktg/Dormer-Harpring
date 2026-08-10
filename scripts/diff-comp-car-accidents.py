# Diffs the built Car Accidents page against its comp — the static markup AND
# the `renderVals()` arrays in the `data-dc-script` block at the foot of
# `DH - Car Accidents.html` — and reports any heading, card, list or figure
# whose text or ORDER disagrees.
#
# THIS IS THE PAGE THAT MOST NEEDS IT. 1,783 lines, 31 sections, 105 `{{ }}`
# placeholders and 23 `sc-for` loops — more than the homepage. A page built from
# the markup alone gets every layout right, every string wrong, and looks
# finished; AGENTS.md records that exact failure costing this project a full
# rebuild of one page. Neither linter can see it, because the build is green
# whenever the layout is.
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
    r"""A single-quoted JS string literal as it reads once unescaped.

    The comp writes curly quotes as ’ escapes inside its arrays and as raw
    characters in its markup, so both forms have to collapse to the same thing
    before anything is compared.
    """
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


built_text = unesc(built)
markup = comp[: comp.index('<script type="text/x-dc"')]


def slice_from(start, end):
    """Comp markup between two landmarks, the second searched FROM the first.

    The comp's <style> block sits above its markup and names most of these
    classes, so `markup.index(end)` on its own can land ABOVE `start` and
    silently return an empty slice — which reads as "the comp lists nothing".
    """
    a = markup.index(start)
    return markup[a : markup.index(end, a)]
script = comp[comp.index('<script type="text/x-dc"') :]


def array(name, end):
    """The source of one `renderVals()` array, from its name to the next one."""
    start = script.index(f"const {name} = ")
    return script[start : script.index(end, start)]


def strings(blob, key):
    """Every `key: '...'` value in an array's source, in order.

    BOTH quote styles. The comp switches to double quotes wherever a value
    contains an apostrophe — `label: "Average increase over the insurer's first
    offer"` — and a single-quote-only pattern silently SKIPS those entries
    rather than failing, which shows up as an off-by-one in the diff and reads
    like a content error.
    """
    pat = rf"{key}: (?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")"
    return [js(a or b) for a, b in re.findall(pat, blob)]


def noarrow(items):
    """Drop the trailing → the shared `.arrow` span adds to a link's text."""
    return [re.sub(r"\s*[→>]\s*$", "", t) for t in items]


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
        "300+ Google reviews",
        "$70M+",
        "Recovered for clients",
        "Unless we win",
        "Speak with a lawyer",
        "Or call or text",
        "Reviewed by",
        "K.C. Harpring",
        "Founding Partner",
        "Updated July 2026",
        "Home",
        "Practice Areas",
        "Car Accidents",
    ],
)
cmp(
    "reviewer credentials",
    [unesc(li) for li in re.findall(r"<li>(.*?)</li>", markup[markup.index('class="ca-cred__body"') : markup.index("Full attorney bio")], re.S)],
    grab("cred__list", "ul") and [unesc(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", re.search(r'class="[^"]*\bcred__list\b[^"]*"[^>]*>(.*?)</ul>', built, re.S).group(1), re.S)],
)

print("\nSECTION NAV")
cmp(
    "jump links",
    [unesc(a) for a in re.findall(r'<a href="#\w+">(.*?)</a>', slice_from('class="ca-sub__in"', 'ca-sub__tel'), re.S)],
    grab("subnav__link", "a"),
)


# ---------------------------------------------------------------------- triage
print("\nTRIAGE (3 rows + 2 behind the disclosure)")
comp_triage = markup[markup.index('class="ca-triage"') : markup.index('class="ca-tr-src"')]
cmp("questions", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_triage, re.S)], grab("trow__q", "h3"))
cmp(
    "stat figures",
    [unesc(b) for b in re.findall(r'<span class="ca-tr-row__stat"><b>(.*?)</b>', comp_triage, re.S)],
    inner("trow__stat", "b"),
)
present(
    "triage copy",
    [
        "Recently injured in a Denver car accident?",
        "Here are the three things that actually matter this week",
        "What to do after a car accident",
        "Do this first",
        "More things to know",
        "Not sure what applies to you? Call and ask.",
        "C.R.S. 10-4-635",
        "24-10-109",
    ],
)


# --------------------------------------------------------------------- lawyers
print("\nOUR LAWYERS")
present(
    "heading, lede, seven names, link",
    [
        "Meet our car accident lawyers",
        "From investigation to resolution, our auto accident attorneys handle every detail "
        "of your case.",
        "Sean Dormer",
        "K.C. Harpring",
        "Tim Garvey",
        "Laura Browne",
        "Jessica Mauser",
        "Amy Rogers",
        "Greg Bentley",
        "See the full team",
    ],
)


# ------------------------------------------------------------------- takeaways
print("\nKEY TAKEAWAYS")
comp_take = markup[markup.index('class="ca-takegrid"') : markup.index('data-screen-label="Results"')]
cmp("headings", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_take, re.S)], grab("takeaway__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_take, re.S)], grab("takeaway__body", "p"))
present("opener", ["The short version", "If you read nothing else on this page"])


# --------------------------------------------------------------------- results
print("\nRESULT STORIES")
blob = array("resultStories", "const crashSteps")
cmp("offered", strings(blob, "offered"), grab("res__off", "span"))
cmp("recovered", strings(blob, "recovered"), grab("res__rec", "span"))
cmp("titles", strings(blob, "title"), grab("res__title", "h3"))
cmp("stories + what changed", [s for pair in zip(strings(blob, "story"), strings(blob, "changed")) for s in pair], grab("res__story", "p"))
present("band copy", ["Car accident results", "What we were offered, and what we recovered.", "Offered", "Recovered", "What changed", "Past results do not guarantee future outcomes."])


# ------------------------------------------------------------------- checklist
print("\nCHECKLIST")
blob = array("crashSteps", "const leadAttorneys")
cmp("step titles", strings(blob, "title"), grab("tl__title", "h3"))
cmp("step bodies", strings(blob, "body"), grab("tl__body", "p"))
present("heading + CTA", ["What to do after a car accident in Denver", "The first week matters more than most people realize.", "Start your claim"])


# ------------------------------------------------------------------- glove box
print("\nGLOVE BOX CARD")
present(
    "both faces",
    [
        "Free printed card", "Keep this in your glove box", "Download and print",
        "Mail me a free card", "Free · English and Spanish", "At the scene",
        "Call the police", "Photograph everything", "Get witness numbers",
        "Get checked out", "Tell your own insurer", "Write down what you remember",
        "What not to do", "Don't give a recorded statement to their insurer",
        "Don't sign a release or accept a first offer", "Don't wait weeks to see a doctor",
        "3 yrs", "Crash claim deadline", "182 days", "Notice to a public entity",
        "Scan: check my deadline",
    ],
)


# -------------------------------------------------------------------- criteria
print("\nDO I HAVE A CASE")
comp_crit = markup[markup.index('class="ca-critrow"') : markup.index('class="ca-inline"')]
cmp("conditions", [unesc(h) for h in re.findall(r"<h4>(.*?)</h4>", comp_crit, re.S)], grab("crit__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_crit, re.S)], grab("crit__body", "p"))
present("CTA + honesty note", ["Five questions and a straight answer.", "Ask if I have a case", "If there isn't a case here, we'll tell you that instead of selling you one."])


# ----------------------------------------------------------------------- fault
print("\nWHO WAS AT FAULT")
blob = array("faultBranches", "const lawCtas")
cmp("branch numbers", re.findall(r"n: '(\d+)'", blob), inner("branch", "b"))
cmp("branch questions", strings(blob, "q"), grab("branch__q", "h3"))
cmp("branch answers", strings(blob, "a"), grab("branch__a", "p"))
present(
    "big answer, scale, follow-ups",
    [
        "Still yes", "Being partly at fault does not end your case.",
        "How fault actually gets decided", "The questions that decide it",
        "None of it your fault", "Over half your fault", "All your fault",
        "Does a traffic ticket settle it?", "What if the police report is wrong?",
        "What if I can't remember what happened?",
        "Someone already told you it was your fault? Get a second opinion.",
    ],
)


# --------------------------------------------------------- the answer sections
print("\nMEDICAL BILLS / POLICY LIMITS / THE OFFER")
present(
    "headings and sub-headings",
    [
        "Who pays my medical bills while the case is open?",
        "The other driver's insurance will not pay as you go",
        "You may already have $5,000 for medical bills",
        "Health insurance will pay now, but wants it back later",
        "What if you have none of these",
        "What if their insurance isn't enough?",
        "The legal minimum is smaller than most people picture",
        "Where the rest of the money comes from",
        "Making that claim turns your insurer into the other side",
        "What if they had no insurance at all",
        "The insurance company offered me money. Should I take it?",
        "Why the first offer comes so fast",
        "Once you sign, it's over",
        "When taking it is the right call",
        "When to wait",
    ],
)
present(
    "the two declarations figures",
    [
        "Auto Policy -- Declarations", "Coverages & limits",
        "Bodily injury liability", "$100,000 / $300,000",
        "Medical payments (MedPay)", "$5,000", "Collision", "$500 deductible",
        "Colorado minimum auto coverage", "Per C.R.S. 10-4-620",
        "Bodily injury -- one person hurt", "$25,000",
        "Bodily injury -- everyone hurt in one crash", "$50,000",
        "Property damage", "$15,000", "Look here", "Note",
    ],
)


# --------------------------------------------------------------------- damages
print("\nDAMAGES")
comp_pay = markup[markup.index('class="ca-pay"') : markup.index('class="ca-more"', markup.index('class="ca-pay"'))]
cmp("plain-English tiles", [unesc(b) for b in re.findall(r"</span><b>(.*?)</b>", comp_pay, re.S)], grab("pay__title", "b"))
cmp("tile bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_pay, re.S)], grab("pay__body", "p"))

blob = array("damageCols", "const faultBranches")
cmp("column names", strings(blob, "name"), grab("col__name", "h3"))
comp_items = [js(x) for x in re.findall(r"'((?:[^'\\]|\\.)*)'", re.search(r"items: \[(.*?)\]", blob, re.S).group(1))]
cmp(
    "column 1 items",
    comp_items,
    [unesc(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", re.search(r'class="[^"]*\bcol__items\b[^"]*"[^>]*>(.*?)</ul>', built, re.S).group(1), re.S)],
)
cmp("caps", strings(blob, "cap"), inner("col__cap", "b"))
present("no-number panel", ["Why we won't put a number on it here", "A dollar figure on a website is advertising, not an answer.", "Want a realistic range for your situation?"])


# --------------------------------------------------------------------- tactics
print("\nADJUSTER TACTICS")
comp_tac = markup[markup.index('class="ca-tac"') : markup.index('class="ca-tacfoot"')]
cmp("cards", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_tac, re.S)], grab("tac__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_tac, re.S)], grab("tac__body", "p"))
present("opener", ["What we see from carriers", "The adjuster is not on your side"])


# ------------------------------------------------------------- cost and court
print("\nCOST / COURT")
present(
    "big answers and their detail",
    [
        "What does it cost to hire us?", "You pay nothing unless we win.",
        "The details, if you want them", "We get paid out of what we recover",
        "Who pays for records and experts", "If we lose, you owe us nothing",
        "The first call is free either way",
        "Do I have to go to court?", "Almost certainly not.",
        "The part people worry about most: being asked questions",
        "More about how it works", "Filing a lawsuit isn't the same as going to trial",
        "Why being willing to go to trial helps you either way",
        "How long will this take?",
    ],
)


# --------------------------------------------------------------------- process
print("\nPROCESS")
blob = array("processSteps", "const crashTypes")
cmp("titles", strings(blob, "title"), grab("pro__title", "h3"))
cmp("bodies", strings(blob, "body"), grab("pro__body", "p"))
present("heading", ["What happens after you call"])


# ----------------------------------------------------------------------- build
print("\nHOW WE BUILD IT")
comp_build = markup[markup.index('class="ca-buildgrid"') : markup.index('class="ca-evid"')]
cmp("items", [unesc(h) for h in re.findall(r"<h3>(.*?)</h3>", comp_build, re.S)], grab("buildgrid__title", "h3"))
cmp("bodies", [unesc(p) for p in re.findall(r"<p>(.*?)</p>", comp_build, re.S)], grab("buildgrid__body", "p"))
cmp(
    "evidence list",
    [unesc(li) for li in re.findall(r"<li>(.*?)</li>", markup[markup.index('class="ca-evid"') : markup.index('class="ca-evid__note"')], re.S)],
    [unesc(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", re.search(r'class="[^"]*\bevid__list\b[^"]*"[^>]*>(.*?)</ul>', built, re.S).group(1), re.S)],
)


# ------------------------------------------------------------------------ FAQ
print("\nFAQ")
blob = array("lawQuestionsData", "const faqLens")
cmp("questions", strings(blob, "q"), grab("faq__q-text", "span"))
cmp("answers", strings(blob, "a"), grab("faq__a", "p"))
lens = [js(x) for x in re.findall(r"'([^']+)'", array("faqLens", "const lawQuestions"))]
cmp("reading times", lens, [re.sub(r"^.*?Watch\s*·\s*", "", t) for t in grab("faq__watch", "span")])
present("band copy", ["What you should know", "Other questions people ask us", "Nothing here is urgent.", "Have a question you don't see?"])


# ------------------------------------------------------- crash types, injuries
print("\nCRASH TYPES + INJURIES")
blob = array("crashTypes", "const injuries")
comp_types = strings(blob, "name")
comp_inj = strings(array("injuries", "const damageCols"), "name")
cmp("all fourteen tile names, in order", comp_types + comp_inj, grab("tile__name", "h3"))
cmp("crash type link labels", strings(blob, "link"), noarrow(grab("tile__link", "span")))
cmp("all fourteen bodies", strings(blob, "body") + strings(array("injuries", "const damageCols"), "body"), grab("tile__body", "p"))


# ------------------------------------------------------- Denver + firm figures
print("\nDENVER DATA")
blob = array("denverData", "const corridors")
cmp("figures", strings(blob, "big"), grab("data__big", "dd"))
cmp("labels", strings(blob, "label"), grab("data__label", "dt"))

blob = array("corridors", "const courts")
cmp("corridor names", strings(blob, "name"), inner("corr__i", "b"))
cmp("corridor notes", strings(blob, "body"), inner("corr__i", "p"))

print("\nFIRM DATA")
blob = array("firmData", "const denverData")
cmp("figures", strings(blob, "big"), grab("fd__big", "dd"))
cmp("labels", strings(blob, "label"), grab("fd__label", "dt"))
present("methodology", ["[Methodology pending]", "Cases still open are excluded."])


# ----------------------------------------------------------------------- venue
print("\nVENUE")
blob = array("courts", "const relatedAreas")
cmp("courts", strings(blob, "name"), grab("court__name", "h3"))
cmp("notes", strings(blob, "body"), grab("court__body", "p"))


# --------------------------------------------------------------------- related
print("\nRELATED")
areas = [js(x) for x in re.findall(r"'((?:[^'\\]|\\.)*)'", array("relatedAreas", "const relatedArticles"))]
arts = [js(x) for x in re.findall(r"'((?:[^'\\]|\\.)*)'", array("relatedArticles", "const ico"))]
cmp("practice areas", areas, noarrow(grab("rellinks__link", "a")))
cmp("supporting articles", arts, grab("rellinks__text", "span"))


# ---------------------------------------------------------- shared-band checks
print("\nBANDS THIS SITE ALREADY BUILDS")
present(
    "stats, testimonials, awards, contact",
    [
        "$70M+", "20 Years", "No Fee", "Small", "Caseload by design",
        "WE DO IT FOR THESE MOMENTS." if "WE DO IT FOR THESE MOMENTS." in built_text else "We do it for these moments.",
        "300+", "Client Reviews", "5.0 on Google",
        "Recognized & awarded",
    ],
)


# ------------------------------------------------------- deliberate differences
# Each of these IS a difference from the comp, made on purpose. Asserted so the
# diff stays honest — if one is ever reverted, this script says so.
EXPECTED = [
    (
        "the result stories key into the real client videos",
        "youtube.com/watch?v=AhfhEBczLcY" in built and "Jessica is a great lawyer" not in built_text,
        "the comp pairs story two's quote (Joel's) with story two's poster (Ben's) — two "
        "different clients with two different videos. Keying each story into getVideoReviews() "
        "fixes the mismatch, stops a fourth copy of the same three quotes, and makes these the "
        "only video panels on the page that actually play",
    ),
    (
        "the five supporting articles render as text, not links",
        'class="rellinks__text' in built and "Colorado filing deadlines" in built_text,
        "none of the five matches a post among the 167 in the scrape, searched by topic as "
        "well as by title. `href: null` is the same treatment the Blog index gives its eight "
        "card-less cards and the directory gives Legal Malpractice",
    ),
    (
        "six of the eight crash types link to a live legacy URL, two do not",
        built.count('class="tile tile--link') == 6
        and built.count('class="tile__link tile__link--inert') == 2,
        "the comp points all eight at `DH - Practice Areas.html`, which is not a destination. "
        "Rear-end and head-on have no page anywhere on the legacy site and render as plain "
        "tiles rather than dead links. The two keep the comp's LABEL and lose the arrow: "
        "`.arrow` travels on hover and belongs only on something that navigates",
    ),
    (
        "the statute citations are text, not links",
        "law.justia.com" not in built and "C.R.S. 13-21-111" in built_text,
        "the comp links all eight to the Justia index rather than to the section — a citation "
        "that reads as a link and does not reach the statute is worse than one that does not "
        "pretend to",
    ),
    (
        "the closing block is the site's shared contact section",
        'id="contact"' in built and "Send us a message" in built_text or "ct__" in built,
        "the comp draws a bespoke three-column close. HANDOFF.md counts the contact block "
        "among the bands this site already builds, and every other interior page closes on it",
    ),
    (
        "no fake form success panel",
        "A lawyer will reach out today." not in built_text,
        "the comp's submitted-state panel told every visitor their case had been received "
        "while discarding it. `/api/consult` does not exist yet",
    ),
    (
        "no AggregateRating structured data",
        "AggregateRating" not in built,
        "self-serving review markup on an organization is a Google policy violation, and one "
        "of the things this rebuild exists to fix",
    ),
    (
        "the transcript toggle is not built",
        "ca-transcript" not in built and "transcriptOpen" not in built,
        "`transcriptOpen`/`toggleTranscript` are returned from renderVals() and "
        "`.ca-transcript` is styled, but neither class appears in the comp's markup — it "
        "renders no transcript UI. HANDOFF.md called it the page's one new interaction; it "
        "is not one",
    ),
    (
        "the firm-at-a-glance band is a contained card, not full-bleed",
        'class="stats stats--card' in built,
        "it falls between the white awards bar and the forest testimonials rail; full-bleed, "
        "it merges with the rail below and the boundary disappears",
    ),
    (
        "the FAQ reuses the site's accordion and emits FAQPage schema",
        '"@type":"FAQPage"' in built or '"@type": "FAQPage"' in built,
        "`lawQuestionsData` + `faqLens` is the existing Faq type with its two halves kept "
        "apart, so the twelve rows drop into faqs.ts and FaqBand renders them unchanged",
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
