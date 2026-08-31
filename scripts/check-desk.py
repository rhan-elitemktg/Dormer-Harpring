#!/usr/bin/env python3
"""Lint: document types the Studio desk draws twice, or not at all.

    python3 scripts/check-desk.py

THE DESK'S OWN GUARD CANNOT CATCH THIS, which is why there is a linter. The
structure ends with a catch-all: anything not in `PLACED` renders under a
divider at the foot, so a type added to `schemaTypes` and forgotten is never
invisible. But that guard only knows "in the set" or "not in the set" — to it a
type placed TWICE looks exactly like a type placed NOWHERE, and it responds to
both by drawing another row.

Which is what happened. Splitting Practice Areas and Blog out of Collections
moved four types off the array `PLACED` was built from while leaving them on
screen, so the Studio drew `practiceArea`, `blogPost`, `blogCategory` and
`carAccidentsPage` twice each — once in the group and once under the divider.
`sitePage` had been doing it since the utility pages were built. Five duplicate
rows, found by eye in the Studio, past every check this repo had.

Reads SOURCE, not `dist/` — the desk is a Studio concern and never reaches the
built site, so this needs no build and runs beside `check:types`.

THREE FAILURE CLASSES:

  UNPLACED   a document type in no group — it renders under the catch-all
             divider, which is the desk telling you it was forgotten
  DOUBLE     a type in two groups at once — drawn twice, edits to either copy
             landing on the same document, which reads as a Studio bug
  UNCOVERED  a group array the `PLACED` expression does not reference. This is
             the one that bit: every type in it is on screen AND unplaced, so
             the whole group duplicates itself under the divider

Plus GHOST — a name in the desk that is not a document type at all, which is a
typo the Studio renders as an empty list rather than an error.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STRUCTURE = ROOT / "src/sanity/structure/index.ts"
SCHEMA = ROOT / "src/sanity/schema.json"

source = STRUCTURE.read_text(encoding="utf-8")
ok = True


def fail(message):
    global ok
    ok = False
    print(message)


def balanced(text, start, opener="[", closer="]"):
    """The span of a bracketed literal beginning at `start`, comments skipped."""
    i = text.index(opener, start)
    depth, j = 1, i + 1
    while depth:
        if j >= len(text):
            return None
        two = text[j : j + 2]
        if two == "//":
            j = text.index("\n", j)
        elif two == "/*":
            j = text.index("*/", j) + 1
        elif text[j] in "[{(":
            depth += 1
        elif text[j] in "]})":
            depth -= 1
            if depth == 0:
                return text[i : j + 1]
        elif text[j] in "\"'`":
            quote = text[j]
            j += 1
            while text[j] != quote:
                j += 2 if text[j] == "\\" else 1
        j += 1
    return None


def declaration(name):
    """The literal a top-level `const NAME … = [ … ]` is assigned.

    RETURNS NONE RATHER THAN AN EMPTY LIST when the declaration is not found,
    and every caller treats that as a hard failure. A parser that silently reads
    nothing would report a perfectly ordered desk as perfectly ordered — the
    exact silent-success shape `audit-practice-area-fidelity.py` once had.
    """
    match = re.search(rf"^(?:export )?const {name}\b[^=]*=", source, re.M)
    if not match:
        return None
    # FROM THE `=`, NOT FROM THE NAME. `const PAGES: [string, string,
    # ComponentType?][] = [ … ]` opens a bracket in its TYPE ANNOTATION first,
    # and reading that one parses the annotation instead of the value — which
    # yields no type names and reads as a broken file rather than a parse bug.
    return balanced(source, match.end() - 1)


# ── what the desk declares ───────────────────────────────────────────────────
# Every top-level `const` holding `["type", "Title", Icon]` tuples is a desk
# group. FOUND BY SHAPE, NOT BY TYPE ANNOTATION, and not by a list written here:
# either would mean a group could be reformatted or added and silently stop
# being checked, which is the same drift this linter exists to catch. An earlier
# draft keyed off `: [string, string, ComponentType?][]` and reported six
# phantom UNPLACED types when that annotation was removed.
#
# The four top-level consts that are NOT groups are named, and their existence
# is asserted — a rename must not silently promote one to a group:
#
#   UTILITY_PAGES     `[id, title]` pairs. Its ids are DOCUMENT IDS, not types
#   SINGLETON_TYPES   bare strings, read separately below
#   HAND_PLACED       bare strings, read separately below — types placed by hand
#                     that are NOT singletons, so they cannot ride in the list
#                     above without also losing their "New" button
#   PLACED            the set this checks the groups against
#   GROUPED           per-type sub-list config; its tuples are FIELD VALUES
NOT_A_GROUP = ("UTILITY_PAGES", "SINGLETON_TYPES", "HAND_PLACED", "PLACED", "GROUPED")
for name in NOT_A_GROUP:
    if not re.search(rf"^(?:export )?const {name}\b", source, re.M):
        fail(f"  ✗ PARSE — `{name}` is named here as not-a-group but no longer exists.")

groups = {}
for name in re.findall(r"^(?:export )?const ([A-Z_][A-Z0-9_]+)\b[^=]*=", source, re.M):
    if name in NOT_A_GROUP:
        continue
    literal = declaration(name)
    if literal is None:
        fail(f"  ✗ PARSE — `const {name}` declared but could not be read.")
        continue
    names = re.findall(r'\[\s*"(\w+)"', literal)
    if not names:
        continue  # not tuple-shaped, so not a desk group
    groups[name] = names

if not groups:
    fail("  ✗ PARSE — no desk groups found in structure/index.ts. Has its shape changed?")
    sys.exit(1)

singletons = declaration("SINGLETON_TYPES")
if singletons is None:
    fail("  ✗ PARSE — SINGLETON_TYPES could not be read.")
    sys.exit(1)
# Only its bare string literals: the spreads name other arrays, already counted.
hand_placed = re.findall(r'^\s*"(\w+)",', singletons, re.M)

# The non-singleton hand-placed types. Read the same way and folded into the
# same map, so a type placed only there is not reported as UNPLACED — it IS on
# screen, just not through a group array or SINGLETON_TYPES.
non_singleton = declaration("HAND_PLACED")
if non_singleton is None:
    fail("  ✗ PARSE — HAND_PLACED could not be read.")
    sys.exit(1)
hand_placed += re.findall(r'"(\w+)"', non_singleton)

if not ok:
    sys.exit(1)


# ── does PLACED cover every group? ───────────────────────────────────────────
placed_expr = declaration("PLACED")
if placed_expr is None:
    fail("  ✗ PARSE — the PLACED set could not be read.")
    sys.exit(1)

referenced = set(re.findall(r"\b([A-Z_]{2,})\b", placed_expr))
uncovered = [g for g in groups if g not in referenced and g != "PAGES" and g != "SETTINGS"]
# PAGES and SETTINGS reach PLACED through SINGLETON_TYPES, which is built from
# them; anything else has to be named directly.
if "SINGLETON_TYPES" not in referenced:
    uncovered += ["PAGES", "SETTINGS"]

# HAND_PLACED HAS TO BE NAMED IN `PLACED` TOO, and this check exists because
# removing it is invisible to everything above. The desk's runtime catch-all
# filters on PLACED, so a type reachable only through HAND_PLACED would render
# in its folder AND under the divider — the DOUBLE case — while `where` above
# still counts it as placed exactly once and reports OK. Tested by deleting the
# spread: without this the check stayed green.
if "HAND_PLACED" not in referenced:
    fail(
        "  ✗ UNCOVERED  `HAND_PLACED` is not referenced by the PLACED set.\n"
        "                Every type in it renders in its own place AND under the\n"
        "                catch-all divider at the foot — drawn twice."
    )

for name in uncovered:
    fail(
        f"  ✗ UNCOVERED  `{name}` is a desk group the PLACED set does not reference.\n"
        f"                Every type in it renders in its group AND under the catch-all\n"
        f"                divider at the foot — the whole group, drawn twice."
    )


# ── every initial-value template the desk names must be registered ───────────
# A LIST THAT NAMES A TEMPLATE NOBODY REGISTERED BREAKS THE WHOLE PANE, not just
# that list's create button: the Studio refuses to read the structure at all,
# with "template id (`templateId`) is required for initial value template item
# nodes". Shipped exactly that by adding a second type to the city lists and
# registering a template for only one of them — and `check:desk` was green while
# Practice Areas would not open, because placement was right and the pane was
# still broken.
#
# SCOPED TO THE ONE LOOP THAT BUILDS THEM PER TYPE, deliberately. `cityItems()`
# names `${type}-by-city` for every type in the city lists, which is the case
# that bit and the case that recurs when a third kind of page is added. A
# cleverer version that tried to infer every template from every group produced
# 22 false failures on its first run; this one answers a question it can
# actually see.
CONFIG = ROOT / "sanity.config.ts"
registered = set(re.findall(r'^\s*id: "([\w-]+)",', CONFIG.read_text(encoding="utf-8"), re.M))

if "`${type}-by-city`" in source:
    for type_name in groups.get("PRACTICE_AREA_TYPES", []):
        if f"{type_name}-by-city" not in registered:
            fail(
                f"  ✗ TEMPLATE   the city lists name `{type_name}-by-city` but sanity.config.ts\n"
                f"                registers no such template id. The Studio then refuses to read\n"
                f"                the whole structure, not just this one list."
            )


# ── every document type placed exactly once ──────────────────────────────────
schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
# `sanity.*` are built-ins the structure builder already excludes from
# documentTypeListItems(), so they can never reach the catch-all.
documents = sorted(
    t["name"] for t in schema if t.get("type") == "document" and not t["name"].startswith("sanity.")
)
if not documents:
    fail("  ✗ PARSE — no document types in schema.json. Run `npm run typegen`.")
    sys.exit(1)

where = {}
for group, names in groups.items():
    for name in names:
        where.setdefault(name, []).append(group)
for name in hand_placed:
    where.setdefault(name, []).append("SINGLETON_TYPES (by hand)")

for name in sorted(where):
    if len(where[name]) > 1:
        fail(f"  ✗ DOUBLE     `{name}` is placed in {' and '.join(where[name])} — drawn twice.")

for name in documents:
    if name not in where:
        fail(
            f"  ✗ UNPLACED   `{name}` is a document type in no desk group.\n"
            f"                It renders under the catch-all divider at the foot."
        )

for name in sorted(where):
    if name not in documents:
        fail(
            f"  ✗ GHOST      `{name}` is placed in the desk but is not a document type.\n"
            f"                The Studio draws it as a list that can never hold anything."
        )

if not ok:
    print("\nSee the header of src/sanity/structure/index.ts.")
    sys.exit(1)

print(
    f"  ✓ OK — {len(documents)} document types, each placed exactly once "
    f"across {len(groups)} desk group(s) + {len(hand_placed)} by hand"
)
