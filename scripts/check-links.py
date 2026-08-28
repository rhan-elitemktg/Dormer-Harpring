#!/usr/bin/env python3
"""Lint: every <a> in the built site — dead targets, placeholders, bad tel:.

    npm run build && python3 scripts/check-links.py

The build cannot see any of this. Astro renders whatever string a component
hands it, so an href to a page that was never built is a green build and a 404
in production. Nothing else in `npm run check` looks at links at all.

That gap is not hypothetical. Three hrefs in the footer — /privacy-policy/,
/editorial-guidelines/ and /sitemap.xml — were on every page of the site, which
was 984 dead links, and they went unnoticed through five comp-diff scripts and
two linters because the only sweep that ever found them was written ad hoc,
read once, and thrown away.

All three are closed now, and KNOWN_DEAD is empty. Each was closed by a change
that made this check FAIL on the stale declaration rather than pass quietly —
which is the second half of the contract below, and the reason the table shrank
instead of growing. An earlier sweep reported "2,013 body links, none
unserved" and was also not kept; it counted body links only, which is exactly
how the footer's stayed invisible. A number that cannot be re-checked cannot
fail. This one can.

## What counts as resolving

A target resolves if `dist/` serves it — a directory holding index.html, or a
static file — or if vercel.json redirects it. Redirect destinations are checked
too: a redirect pointing at a page that does not exist is the same bug, one hop
later.

## The four failure classes

DEAD         an internal target nothing serves and nothing redirects
PLACEHOLDER  href="#", a control that looks like a link and goes nowhere.
             TeamCard.astro already records the reasoning: render a <span>.
RELATIVE     an internal href with no leading slash. It resolves under the
             CURRENT page's path, which is almost never what the author meant
             and silently differs per page. WordPress bodies arrive full of
             them; the importer's link walk does not reject them.
TEL          a tel:/sms: href that is not E.164. The chrome gets this right
             1,508 times via firmDetails; imported body copy did not, in nine
             different spellings, some with a space straight after the colon.

## Declaring what stays broken

Known-broken links are DECLARED, with a reason, in the three tables below —
the same contract PRACTICE_AREA_PAGES gives the importer and REMOVED_ITEMS
gives diff-comp-practice-areas.py. Two directions, both of which fail:

  * a broken link in none of the tables       -> new breakage, fails
  * a declared entry that is no longer broken -> fix landed, entry is stale,
                                                 fails until it is deleted

The second half is the one that keeps this file honest. Without it a table of
exemptions only ever grows, and closing an item leaves no trace.

Runs as part of `npm run check`, which means a build has to come first — same
constraint check-scoped-styles.py already carries.
"""
import html
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parent.parent
# THE ADAPTER MOVED THIS. `@astrojs/vercel` splits `outDir` into `client/` and
# `server/`, so every built page is at `dist/client/<path>/index.html` — one
# level deeper than before. The pages themselves did not change; only where they
# land did. Pointing at plain `dist/` here finds the HTML anyway (the walk
# recurses) but derives every served path with a `/client` prefix, which reads
# as 329 moved pages rather than a directory rename.
DIST = ROOT / "dist" / "client"

# The site's own hostnames. An absolute href at one of these is an internal
# link wearing a costume, and must resolve like any other. Both forms, because
# `site:` in astro.config.mjs is an open www-vs-apex decision and this check
# should not have an opinion about which way it lands.
SITE_HOSTS = {"www.denvertrial.com", "denvertrial.com"}

# Schemes that address something other than a page on this site.
OFF_SITE_SCHEMES = {"http", "https", "mailto", "javascript", "data"}

# E.164: a plus, a non-zero country digit, then up to fourteen more. No spaces,
# no parens, no dashes. `smsE164` on the firmDetails singleton is named for
# this format, so it is the site's own convention and not an invention here.
E164 = re.compile(r"^\+[1-9]\d{1,14}$")

ANCHOR = re.compile(r"<a\b[^>]*?\bhref\s*=\s*([\"'])(.*?)\1", re.I | re.S)


# --------------------------------------------------------------------------
# Declared breakage. Delete an entry when the underlying thing is fixed — the
# check fails on a stale entry, so this cannot silently rot.
# --------------------------------------------------------------------------

# target path (comparison form) -> why it is still dead
#
# EMPTY, and it took four rounds to get here. It held the footer's three —
# /privacy-policy/, /editorial-guidelines/ and /sitemap.xml, 984 dead links
# across every page of the site. Editorial Guidelines came out of the footer;
# the privacy policy and a human /sitemap/ were built and the footer repointed
# at the latter. Each time, this check failed on the STALE DECLARATION rather
# than passing quietly, which is the half of the contract that made the table
# shrink instead of grow.
#
# /sitemap.xml is not "still dead" — nothing links it any more. It is also not
# built: it belongs to /new-seo-setup, because every URL in it is absolute off
# `site:` in astro.config.mjs, which is an open www-vs-apex TODO(launch).
KNOWN_DEAD: dict[str, str] = {}

# page path -> how many href="#" that page is still allowed to carry
KNOWN_PLACEHOLDER: dict[str, int] = {
    # 4 press mentions + 4 insight teasers on homePage, read through data/news.ts.
    # Both carry a TODO(content) marker in the schema — the press articles are
    # real and findable, the teasers point at articles nobody has written. The
    # marker is named WITHOUT its colon here on purpose: the pre-launch grep
    # matches the colon form, and a comment that only mentions a marker would be
    # counted as one.
    "/": 8,
    "/denver-car-accident-lawyer": 1,  # carAccidents.ts ctaHref: the unbuilt checklist article
}

# (page path, href) -> why this relative href is still here
KNOWN_RELATIVE: dict[tuple[str, str], str] = {}

# (page path, href) -> why this tel:/sms: href is still not E.164
KNOWN_TEL: dict[tuple[str, str], str] = {}


# --------------------------------------------------------------------------
# What the deploy actually serves
# --------------------------------------------------------------------------

def comparison_form(path: str) -> str:
    """Leading slash, no trailing slash — routePaths.ts's normalizePath, in Python.

    Deliberately slash-free for the same reason that one is: the site links in
    trailing-slash form and legacy URLs arrive both ways, and a comparison that
    cares which is a comparison that fails on nothing real.
    """
    path = path.split("#")[0].split("?")[0]
    return path.rstrip("/") or "/"


served: set[str] = set()   # directories with an index.html
static: set[str] = set()   # every file, by its served path

for file in DIST.rglob("*"):
    if not file.is_file():
        continue
    rel = "/" + str(file.relative_to(DIST)).replace("\\", "/")
    static.add(rel)
    if file.name == "index.html":
        served.add(comparison_form(rel[: -len("index.html")]))

if not served:
    sys.exit(f"  ✗ {DIST}/ holds no pages — run `npm run build` first.")

redirects: dict[str, str] = {}
redirect_rules = 0
try:
    config = json.loads((ROOT / "vercel.json").read_text())
    for rule in config.get("redirects", []):
        # vercel.json carries each rule twice, with and without the trailing
        # slash, and both collapse to one comparison form. Count the rules for
        # the report and key the lookup by form.
        redirect_rules += 1
        redirects[comparison_form(rule["source"])] = rule["destination"]
except FileNotFoundError:
    print("  ! vercel.json not found — redirect targets will read as dead.")


def resolves(path: str) -> bool:
    return path in served or path in static or path in redirects


# --------------------------------------------------------------------------
# The sweep
# --------------------------------------------------------------------------

dead: dict[str, set[str]] = defaultdict(set)          # target  -> pages linking it
placeholder: dict[str, int] = defaultdict(int)        # page    -> count of href="#"
relative: dict[tuple[str, str], int] = defaultdict(int)
bad_tel: dict[tuple[str, str], int] = defaultdict(int)

pages = sorted(
    p for p in DIST.rglob("index.html")
    # The Studio is a React SPA bundle; its routing is not this site's.
    if "admin" not in p.relative_to(DIST).parts
)

total = internal = 0

for page in pages:
    page_path = comparison_form("/" + str(page.relative_to(DIST).parent).replace("\\", "/"))
    if page_path == "/.":
        page_path = "/"
    markup = page.read_text(encoding="utf-8", errors="replace")

    for _, raw in ANCHOR.findall(markup):
        total += 1
        href = html.unescape(raw.strip())
        if not href:
            continue

        if href == "#":
            placeholder[page_path] += 1
            continue
        if href.startswith("#"):
            continue  # an on-page fragment, not a route

        split = urlsplit(href)
        scheme = split.scheme.lower()

        if scheme in ("tel", "sms"):
            # urlsplit puts an opaque scheme's payload in .path, and a leading
            # space survives it — which is one of the nine spellings found.
            number = href.split(":", 1)[1]
            if not E164.match(number):
                bad_tel[(page_path, href)] += 1
            continue

        if scheme in OFF_SITE_SCHEMES:
            if scheme in ("http", "https") and split.netloc.lower() in SITE_HOSTS:
                target = split.path or "/"
            else:
                continue  # genuinely off-site
        elif scheme:
            continue      # some other scheme; not ours to judge
        elif href.startswith("/"):
            target = split.path
        else:
            # No scheme and no leading slash: resolves under this page's path.
            relative[(page_path, href)] += 1
            target = urljoin(page_path.rstrip("/") + "/", split.path)

        internal += 1
        if not resolves(comparison_form(target)):
            dead[comparison_form(target)].add(page_path)

# A redirect that lands on nothing is the same bug, one hop later.
for source, destination in sorted(redirects.items()):
    if not resolves(comparison_form(destination)):
        dead[comparison_form(destination)].add(f"vercel.json redirect {source}")


# --------------------------------------------------------------------------
# Report — undeclared breakage, then declarations that no longer hold
# --------------------------------------------------------------------------

failures: list[str] = []

for target in sorted(dead, key=lambda t: (-len(dead[t]), t)):
    if target in KNOWN_DEAD:
        continue
    where = sorted(dead[target])
    failures.append(
        f"  ✗ DEAD         {target}\n"
        f"                 linked from {len(where)} page(s), e.g. {where[0]}"
    )

for page in sorted(placeholder):
    allowed = KNOWN_PLACEHOLDER.get(page, 0)
    if placeholder[page] > allowed:
        failures.append(
            f'  ✗ PLACEHOLDER  {page}\n'
            f'                 {placeholder[page]} href="#", {allowed} declared'
        )

for (page, href) in sorted(relative):
    if (page, href) in KNOWN_RELATIVE:
        continue
    times = f" ×{relative[(page, href)]}" if relative[(page, href)] > 1 else ""
    failures.append(
        f"  ✗ RELATIVE     {href}{times}\n"
        f"                 on {page} — resolves under that page's own path"
    )

for (page, href) in sorted(bad_tel):
    if (page, href) in KNOWN_TEL:
        continue
    times = f" ×{bad_tel[(page, href)]}" if bad_tel[(page, href)] > 1 else ""
    failures.append(
        f"  ✗ TEL          {href}{times}\n"
        f"                 on {page} — not E.164 (want +1XXXXXXXXXX)"
    )

# The other direction: a declaration that has quietly stopped being true.
for target, reason in sorted(KNOWN_DEAD.items()):
    if target not in dead:
        failures.append(
            f"  ✗ STALE        KNOWN_DEAD['{target}'] — nothing links it, or it "
            f"now resolves.\n                 Delete the entry."
        )

for page, allowed in sorted(KNOWN_PLACEHOLDER.items()):
    found = placeholder.get(page, 0)
    if found < allowed:
        failures.append(
            f"  ✗ STALE        KNOWN_PLACEHOLDER['{page}'] declares {allowed}, "
            f"found {found}.\n                 Lower it or delete the entry."
        )

for key in sorted(KNOWN_RELATIVE):
    if key not in relative:
        failures.append(f"  ✗ STALE        KNOWN_RELATIVE{key} no longer present. Delete it.")

for key in sorted(KNOWN_TEL):
    if key not in bad_tel:
        failures.append(f"  ✗ STALE        KNOWN_TEL{key} no longer present. Delete it.")

declared_dead = sum(len(dead[t]) for t in KNOWN_DEAD if t in dead)
declared_hash = sum(KNOWN_PLACEHOLDER.values())

if failures:
    print("\n".join(failures))
    print(f"\n{len(failures)} link problem(s) across {len(pages)} pages.")
    sys.exit(1)

print(
    f"  ✓ OK — {internal} internal links across {len(pages)} pages, "
    f"{len(served)} served paths, {redirect_rules} redirect rules"
)
if declared_dead or declared_hash:
    print(
        f"        ({declared_dead} declared-dead links and {declared_hash} "
        f'declared href="#" — see KNOWN_DEAD / KNOWN_PLACEHOLDER)'
    )
