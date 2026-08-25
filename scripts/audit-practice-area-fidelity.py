#!/usr/bin/env python3
"""Built practice-area pages vs. the live WordPress source they came from.

THE COMP-DIFF STAND-IN. The other five scripts in here diff a built page against
a designer's comp; this template HAS no comp — it was specified in conversation
as "like the blog post, with a different sidebar and a different bottom band".
So the check is against the SOURCE instead: everything the live page says must
survive into the built one.

WHY THIS IS COMMITTED AND THE BLOG'S EQUIVALENT IS NOT. HANDOFF.md records the
blog import at "167 of 167 at >=99% similarity, 144 at exactly 100%" — a real
measurement, taken once, by a script nobody kept. `grep -rn SequenceMatcher`
finds nothing. That number cannot be re-checked, so it cannot fail. This one
can.

    python3 scripts/audit-practice-area-fidelity.py
    python3 scripts/audit-practice-area-fidelity.py --only motorcycle-accident-lawyer-denver
    python3 scripts/audit-practice-area-fidelity.py --verbose

NOT WIRED INTO `npm run check`, like the other diff scripts — it needs the
network. Run it by hand after re-importing or after touching the template.
Requires a `dist/` built from the current content: run `npm run build` first.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path

API = "https://www.denvertrial.com/wp-json/wp/v2"
SITE = "https://www.denvertrial.com"
DIST = Path("dist")
CONTENT = Path("src/content/practice-areas")

# The importer's list, and it must stay the importer's list — a page whose
# chrome this script does not know about reads as missing content.
# See scripts/import-practice-areas.mjs.
CHROME_CLASS_PREFIXES = (
    "ez-toc", "eztoc-", "contact-shortcode", "user-shortcode", "client-reviews",
    "test-intro", "test-copy", "rating-img", "google-map-link", "coman-btn",
)
CHROME_TAGS = ("script", "style", "nav", "svg", "input", "label", "form", "noscript")
VOID = {"img", "br", "hr", "input", "meta", "link", "source", "area", "col", "embed", "param", "track", "wbr"}

# The bar the blog import cleared. A page below it has lost something.
THRESHOLD = 0.99

# TWO BODY SECTIONS THE TEMPLATE DELIBERATELY DROPS — the office-address block
# ("<City> <Area> Lawyer Near Me", which the footer already carries) and the
# firm's own article list ("<City> <Area> Resources", which the sidebar already
# carries). Removed by request.
#
# MUST STAY IDENTICAL TO `DROPPED_SECTIONS` in src/data/practiceAreaPages.ts,
# which is where the removal actually happens; this is the source side of the
# same fact. They are two lists rather than one because a .py script cannot
# import a .ts module, and the getter is where the rule belongs. Drift shows up
# here immediately: a section dropped there and not here reads as lost content,
# and a section listed here and not dropped there reads as surplus.
#
# `thornton-bicycle-accident-lawyer`'s "Bicycle Accident Resources in Thornton,
# Colorado" is deliberately absent from both — it is Bike Thornton and Bicycle
# Colorado with their addresses, not the firm's own chrome.
#
# A section runs from its h2 to the next h2, or to the end of the body.
# Dropped on EVERY page that carries it, matched in full rather than by pattern.
# "Awards and Accolades" is the firm's six award badges — an h2 and six <img>s,
# byte-identical on the 30 pages that have it — and `AwardsBar` now renders the
# same six under the article, so the body copy was showing them twice.
#
# MUST STAY IDENTICAL TO `DROPPED_EVERYWHERE` in src/data/practiceAreaPages.ts.
DROPPED_EVERYWHERE = ["Awards and Accolades"]

DROPPED_SECTIONS = {
    "denver-bicycle-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
    "denver-brain-injury-lawyer": ["Brain Injury Resources", "Denver Medical Malpractice Lawyer Near Me"],
    "denver-burn-injury-attorney": ["Denver Medical Malpractice Lawyer Near Me"],
    "denver-drunk-driving-accident-lawyer": ["Denver Car Accident Lawyer Near Me"],
    "denver-medical-malpractice-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
    "denver-pedestrian-accident-lawyer": ["Denver Personal Injury Lawyer Near Me"],
    "denver-spinal-cord-injury-lawyer": ["Denver Medical Malpractice Lawyer Near Me"],
    "denver-truck-accident-lawyer": ["Denver Truck Accident Lawyer Near Me", "Denver Truck Accident Resources"],
    "thornton-car-accident-attorney": ["Thornton Car Accident Resources"],
    "thornton-personal-injury-attorney": ["Thornton Personal Injury Resources"],
    "thornton-wrongful-death-lawyer": ["Thornton Wrongful Death Resources"],
}


def norm(text):
    """Whitespace-collapsed, lowercase, punctuation-normalised.

    Curly quotes and dashes are folded to their straight forms: the importer
    decodes entities and the renderer re-encodes some of them, so a page can be
    byte-different and word-identical. That difference is not what this is
    looking for.
    """
    text = (text.replace("’", "'").replace("‘", "'")
                .replace("“", '"').replace("”", '"')
                .replace("–", "-").replace("—", "-")
                .replace(" ", " ").replace("…", "..."))
    return re.sub(r"\s+", " ", text).strip().lower()


def strip_editor_artifacts(html):
    """Remove a TinyMCE selection bookmark that got SAVED into the content.

    `denver-medical-malpractice-lawyer` holds an ESCAPED `<span
    data-mce-type="bookmark">` — the editor's own cursor marker, entity-encoded
    and stored as body text, carrying a zero-width no-break space. It is not
    content: WordPress renders it as visible markup on the live page, and the
    importer is right to drop it.

    Stripped here rather than recorded as a tolerated difference, because it is
    the SOURCE that is wrong. The built page is the corrected one.
    """
    html = re.sub(r"&lt;span[^&]*?data-mce-type=&quot;bookmark&quot;.*?&lt;/span&gt;", " ", html, flags=re.S)
    html = re.sub(r"<span[^>]*?data-mce-type=\"bookmark\".*?</span>", " ", html, flags=re.S)
    return html.replace("\ufeff", "")


def unesc(html):
    """Tags out, entities decoded. The same helper the other diff scripts use.

    NOTE, as HANDOFF records: this cannot see attribute values. Any assertion
    about href/alt/target must read the raw markup, not this.
    """
    html = re.sub(r"<[^>]+>", " ", html)
    for a, b in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'),
                 ("&#39;", "'"), ("&apos;", "'"), ("&nbsp;", " "), ("&hellip;", "…"),
                 ("&#8217;", "’"), ("&#8216;", "‘"), ("&#8220;", "“"),
                 ("&#8221;", "”"), ("&#8211;", "–"), ("&#8212;", "—")):
        html = html.replace(a, b)
    html = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), html)
    return html


class SourceReader(HTMLParser):
    """Text and tag counts from WordPress markup, chrome excluded.

    A DEPTH COUNTER, NOT A REGEX. Chrome wrappers nest — a `contact-shortcode`
    holds `row`, `col-md-*` and a `coman-btn-block` — so matching an opening tag
    to its close needs real bookkeeping. This is the same reason the importer
    walks a parsed tree rather than pattern-matching the string, and getting it
    wrong here would make the audit disagree with the importer about what the
    source even says.
    """

    def __init__(self, dropped=()):
        super().__init__(convert_charrefs=True)
        self.chunks = []
        self.depth = 0          # >0 while inside chrome
        self.stack = []         # open non-void tags, for close matching
        self.counts = {"h2": 0, "h3": 0, "h4": 0, "img": 0, "li": 0, "a": 0}
        self.table_rows = 0     # a <tr> becomes one list item — see below
        self._heading = None    # the open heading tag, and whether it has text
        # The declared drops for THIS page, and the state that skips them. A
        # heading's text is only known once it closes, so the chunk list is
        # rewound to `_mark` and everything up to the next h2 suppressed.
        self._dropped = tuple(dropped) + tuple(DROPPED_EVERYWHERE)
        self._seen_dropped = set()
        self._skipping = False
        self._mark = 0

    def _is_chrome(self, tag, attrs):
        if tag in CHROME_TAGS:
            return True
        d = dict(attrs)
        classes = (d.get("class") or "").split()
        ident = d.get("id") or ""
        return any(c.startswith(p) for c in classes for p in CHROME_CLASS_PREFIXES) or \
            any(ident.startswith(p) for p in CHROME_CLASS_PREFIXES)

    def handle_starttag(self, tag, attrs):
        chrome = self._is_chrome(tag, attrs)
        if tag not in VOID:
            self.stack.append((tag, chrome))
        if chrome:
            self.depth += 1
            return
        # A dropped section ends where the next h2 begins, whatever it says.
        if self.depth == 0 and tag == "h2":
            self._skipping = False
        if self._skipping:
            return
        if self.depth == 0 and tag == "tr":
            self.table_rows += 1
        if self.depth == 0 and tag in ("h2", "h3", "h4"):
            # NOT COUNTED YET. Three of these pages carry an empty <h2></h2>,
            # which the importer correctly emits nothing for — counting the tag
            # would report a heading lost on every one of them. Counted on close,
            # and only if text arrived.
            self._heading = [tag, False]
            self._mark = len(self.chunks)
            return
        if self.depth == 0 and tag in self.counts:
            self.counts[tag] += 1

    def handle_startendtag(self, tag, attrs):
        if self._skipping:
            return
        if self.depth == 0 and not self._is_chrome(tag, attrs) and tag in self.counts:
            self.counts[tag] += 1

    def handle_endtag(self, tag):
        if self._heading and self._heading[0] == tag:
            text = norm(" ".join(self.chunks[self._mark:]))
            match = next((d for d in self._dropped if norm(d) == text), None)
            if match is not None:
                # Rewind past the heading and suppress the rest of the section.
                del self.chunks[self._mark:]
                self._seen_dropped.add(match)
                self._skipping = True
            elif self._heading[1]:
                self.counts[tag] += 1
            self._heading = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                if self.stack[i][1]:
                    self.depth = max(0, self.depth - 1)
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.depth == 0 and not self._skipping:
            self.chunks.append(data)
            if self._heading and data.strip():
                self._heading[1] = True

    @property
    def text(self):
        return norm(" ".join(self.chunks))

    @property
    def unmatched(self):
        """Per-page declared drops this page's source did not contain.

        DROPPED_EVERYWHERE is excluded: it is offered to all 109 and matches on
        30, which is normal rather than stale. Only a per-slug entry naming a
        heading the source no longer has means the list has rotted.
        """
        return [
            d
            for d in self._dropped
            if d not in self._seen_dropped and d not in DROPPED_EVERYWHERE
        ]


class RegionReader(HTMLParser):
    """The text and item count inside `div.faq-block`, and nothing else.

    SCOPED, because `accordion-item` appears 53 times on one of these pages —
    the theme's sidebar practice-area band is the same Bootstrap markup. The
    importer has the same comment for the same reason.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chunks, self.items, self.li = [], 0, 0
        self.depth, self.stack = 0, []

    def handle_starttag(self, tag, attrs):
        classes = (dict(attrs).get("class") or "").split()
        opening = "faq-block" in classes
        if tag not in VOID:
            self.stack.append((tag, opening))
        if opening:
            self.depth += 1
        if self.depth > 0 and "accordion-item" in classes:
            self.items += 1
        # The answers carry their own lists, and the built page renders them in
        # the same article region as the body's — so they have to be counted on
        # this side too or every FAQ list reads as an unexplained surplus.
        if self.depth > 0 and tag == "li":
            self.li += 1

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                if self.stack[i][1]:
                    self.depth = max(0, self.depth - 1)
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.depth > 0:
            self.chunks.append(data)

    @property
    def text(self):
        return norm(" ".join(self.chunks))


def fetch(url, attempts=4):
    """One GET, retried on a transport error.

    RETRIES BECAUSE THE RUN IS 218 REQUESTS. Every page is fetched twice — JSON
    for the body, HTML for the FAQ block — and denvertrial.com drops or stalls
    one often enough that a single-shot fetch loses whole runs to a
    `TimeoutError` two thirds of the way through. That failure says nothing
    about fidelity, and a check that cannot finish is a check nobody runs.

    Backs off 2s, 4s, 8s. Only transport errors are retried; an HTTP error is
    the server answering, and a 404 here is a real finding.
    """
    last = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError:
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            last = err
            if attempt < attempts - 1:
                time.sleep(2 ** (attempt + 1))
    raise SystemExit(f"giving up on {url} after {attempts} attempts: {last}")


def fetch_json(url):
    return json.loads(fetch(url))


def fetch_text(url):
    return fetch(url).decode("utf-8", "replace")


def built_article(slug):
    """The article column of the built page, minus the things that repeat it.

    The contents box lists every H2 again, and the FAQPage JSON-LD carries every
    answer again. Both are correct on the page and both would inflate the built
    side of the comparison, hiding a real loss behind duplicated text.

    THE H1 IS BACK IN THIS COLUMN. It moved to a `PageHeader` for two rounds and
    came home when the header was dropped, so it needs no splicing — the source
    side leads with `title` and this region carries it. The EYEBROW above it does
    get stripped: "Practice Area" is chrome this template adds on all 109, and
    WordPress has no such field.

    The meta line is stripped for the same reason — "Written by
    Dormer Harpring · Updated … · 12 min read" is nine words the built page adds
    and the source has nowhere. It is the byline convention, not content.

    So is the fact-check band, which sits between `</article>` and the sidebar
    and therefore inside this slice. Same 35 words on all 109, derived from the
    reviewer; WordPress has no field for it.
    """
    path = DIST / slug / "index.html"
    if not path.exists():
        return None
    html = path.read_text(encoding="utf-8", errors="replace")
    start = html.find('<article class="parea__main"')
    if start == -1:
        return None
    end = html.find('<aside class="pside"', start)
    region = html[start:end if end != -1 else len(html)]
    region = re.sub(r'<nav class="toc".*?</nav>', " ", region, flags=re.S)
    region = re.sub(r"<script[^>]*>.*?</script>", " ", region, flags=re.S)
    region = re.sub(r'<p class="parea__cat".*?</p>', " ", region, flags=re.S)
    region = re.sub(r'<p class="parea__meta".*?</p>', " ", region, flags=re.S)
    region = re.sub(r'<div class="parea__fact".*$', " ", region, flags=re.S)
    return region


def main():
    args = sys.argv[1:]
    only = args[args.index("--only") + 1] if "--only" in args else None
    verbose = "--verbose" in args

    if not DIST.exists():
        sys.exit("dist/ not found — run `npm run build` first.")

    slugs = sorted(p.stem for p in CONTENT.glob("*.json"))
    if only:
        if only not in slugs:
            sys.exit(f'no imported practice area with slug "{only}"')
        slugs = [only]

    print(f"auditing {len(slugs)} page(s) against the live source\n")

    failures, low, checked = [], [], 0
    for slug in slugs:
        records = fetch_json(f"{API}/pages?slug={slug}&_fields=content,title")
        if not records:
            failures.append(f"{slug}: no live page with this slug")
            continue

        src = SourceReader(DROPPED_SECTIONS.get(slug, ()))
        src.feed(strip_editor_artifacts(records[0]["content"]["rendered"]))

        # A declared drop the source no longer has means WordPress changed and
        # this list did not. The getter throws on the same condition; this is
        # the source side of it, and it must not pass quietly.
        if src.unmatched:
            failures.append(
                f"{slug}: DROPPED_SECTIONS names "
                + ", ".join(repr(u) for u in src.unmatched)
                + ", which the live source no longer contains"
            )
            continue

        faq = RegionReader()
        faq.feed(fetch_text(f"{SITE}/{slug}/"))

        # THE TITLE LEADS. `content.rendered` has no H1 — WordPress keeps it
        # in `title` — but the built page renders one, so leaving it out makes
        # every page look like it gained four words it should have.
        title = norm(unesc(records[0]["title"]["rendered"]))
        source_text = norm(f"{title} {src.text} {faq.text}")

        region = built_article(slug)
        if region is None:
            failures.append(f"{slug}: no built page at dist/{slug}/index.html")
            continue
        built_text = norm(unesc(region))

        # WORDS, NOT CHARACTERS, AND autojunk OFF. Both matter. Character-level
        # comparison of a 3,000-word page is dominated by letter frequency, and
        # SequenceMatcher's autojunk heuristic then discards any element
        # appearing in more than 1% of a sequence longer than 200 — which on a
        # character sequence is most of the alphabet. Together they scored a
        # page with three words missing at 88%. Word sequences with autojunk
        # disabled score the same page at 99.9%, and still fall off a cliff when
        # content actually goes missing.
        ratio = SequenceMatcher(None, source_text.split(), built_text.split(),
                                autojunk=False).ratio()
        checked += 1

        # THE COUNTS A RATIO HIDES. Two texts can sit at 0.995 with an image
        # gone, because an <img> contributes no words at all — which is exactly
        # the bug the importer's own audit was written for.
        built_counts = {
            "h2": len(re.findall(r'<h2 class="prose__h2', region)),
            "h3": len(re.findall(r'<h3 class="prose__h3', region)),
            "img": len(re.findall(r"<figure class=\"prose__figure", region)),
            # ProseListItem emits a BARE <li> — no class to match on. The
            # contents box and the JSON-LD are already stripped from `region`,
            # so every <li> left in it is a body or FAQ list item.
            "li": len(re.findall(r"<li[ >]", region)),
        }
        faq_built = len(re.findall(r'<details class="afaq__item"', region))

        problems = []
        if built_counts["h2"] != src.counts["h2"]:
            problems.append(f"h2 {src.counts['h2']}→{built_counts['h2']}")
        if built_counts["h3"] != src.counts["h3"]:
            problems.append(f"h3 {src.counts['h3']}→{built_counts['h3']}")
        if built_counts["img"] != src.counts["img"]:
            problems.append(f"images {src.counts['img']}→{built_counts['img']}")
        # `tableBlocks` turns each <tr> into one bullet — Portable Text has no
        # table, and building an object type for the two that exist site-wide is
        # not worth it. The importer warns every time it happens.
        source_li = src.counts["li"] + faq.li + src.table_rows
        if built_counts["li"] != source_li:
            problems.append(f"list items {source_li}→{built_counts['li']}")
        if faq_built != faq.items:
            problems.append(f"FAQ items {faq.items}→{faq_built}")

        flag = " "
        if problems:
            failures.append(f"{slug}: {', '.join(problems)}")
            flag = "✗"
        elif ratio < THRESHOLD:
            low.append((slug, ratio, len(source_text.split()), len(built_text.split())))
            flag = "!"

        if verbose or flag != " ":
            print(f"  {flag} {slug:<58} {ratio:6.1%}  "
                  f"{len(source_text.split()):>5}→{len(built_text.split()):<5} words")

    print(f"\n{'-' * 72}")
    print(f"checked {checked} page(s); threshold {THRESHOLD:.0%}")

    if low:
        print(f"\nBELOW THRESHOLD ({len(low)}):")
        for slug, ratio, a, b in sorted(low, key=lambda x: x[1]):
            print(f"  {ratio:6.1%}  {slug}  ({a} source words, {b} built)")

    if failures:
        print(f"\nCOUNT MISMATCHES ({len(failures)}) — content the ratio could not see:")
        for f in failures:
            print(f"  {f}")

    ok = not failures and not low
    print("\nRESULT:", "MATCHES SOURCE" if ok else "DIFFERENCES ABOVE")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
