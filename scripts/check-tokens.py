#!/usr/bin/env python3
"""Lint: var() references to custom properties that are never defined.

    python3 scripts/check-tokens.py

An undefined `var(--foo)` with no fallback does not degrade — it makes the whole
declaration invalid at computed-value time, so the property silently falls back
to its initial value. `padding: var(--space-11) var(--space-13)` with no
--space-13 does not render "most of" the padding; it renders none of it. The
build succeeds and check-scoped-styles.py passes, because the selector matches
fine. Caught exactly that on the practice-area panel, where --space-13 does not
exist (the scale runs 12 -> 14).

Scans source rather than dist, so Sanity Studio's own bundle stays out of it.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

# Supplied at runtime rather than by a CSS rule, so they'd read as undefined:
# the Fonts API injects these into <head> from astro.config.mjs.
RUNTIME_DEFINED = {
    "--font-anton",
    "--font-hanken",
    "--font-geist",
    "--font-newsreader",
    "--font-caveat",
}

defined: set[str] = set(RUNTIME_DEFINED)
used: dict[str, list[str]] = {}

files = [*SRC.rglob("*.astro"), *SRC.rglob("*.css")]

for path in files:
    text = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT))

    # Definitions: `--foo:` in a rule, or in an inline style="--foo:…".
    defined.update(re.findall(r"(--[a-zA-Z0-9-]+)\s*:", text))

    # Uses. A var() carrying its own fallback is fine by definition.
    for match in re.finditer(r"var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])", text):
        if match.group(2) == ",":
            continue
        used.setdefault(match.group(1), []).append(rel)

missing = {name: sorted(set(where)) for name, where in used.items() if name not in defined}

if missing:
    for name in sorted(missing):
        print(f"  ✗ UNDEFINED  {name}")
        for where in missing[name]:
            print(f"              {where}")
    print(f"\n{len(missing)} undefined custom propert{'y' if len(missing) == 1 else 'ies'}.")
    sys.exit(1)

print(f"  ✓ OK — every var() resolves ({len(used)} distinct properties across {len(files)} files)")
