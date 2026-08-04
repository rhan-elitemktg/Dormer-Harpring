#!/usr/bin/env python3
"""Lint: scoped Astro styles that can never match their target.

    npm run build && python3 scripts/check-scoped-styles.py dist/**/index.html

Astro scopes a component's <style> by adding data-astro-cid-XXXX to the elements
in *that component's own template*. Move markup into a child component (e.g. a
Portable Text renderer) and the child's elements get no cid, so the parent's
scoped rules silently stop applying — the markup still looks correct, only the
styling is gone. Fix with `.parent :global(.child)`.

Caught exactly that on About.astro's pull quote; see docs/sanity-integration.md F14.
"""
import re, glob, sys, collections

# Astro inlines small stylesheets into the HTML and emits larger ones as separate
# files — so read BOTH. Reading only dist/_astro/*.css silently skips every
# inlined component, which makes the check pass when it shouldn't.
css = "".join(open(f).read() for f in glob.glob('dist/_astro/*.css'))
for page in sys.argv[1:]:
    css += "".join(re.findall(r'<style[^>]*>(.*?)</style>', open(page).read(), re.S))

required = collections.defaultdict(set)   # class -> cids demanded on the element
globally_styled = set()                   # class -> has a cid-free rule somewhere

for selector_blob in re.findall(r'([^{}]+)\{[^{}]*\}', css):
    for selector in selector_blob.split(','):
        right = re.split(r'\s+|>|\+|~', selector.strip())[-1]
        classes = re.findall(r'\.([A-Za-z0-9_-]+)', right)
        if not classes: continue
        cid = re.search(r'\[data-astro-cid-([a-z0-9]+)\]', right)
        for cls in classes:
            if cid: required[cls].add(cid.group(1))
            else:   globally_styled.add(cls)

bad = []
for page in sys.argv[1:]:
    html = open(page).read()
    for tag in re.finditer(r'<[a-zA-Z][^>]*\bclass="([^"]*)"[^>]*>', html):
        have = set(re.findall(r'data-astro-cid-([a-z0-9]+)', tag.group(0)))
        for cls in tag.group(1).split():
            if cls in globally_styled: continue
            if cls in required and not (required[cls] & have):
                bad.append((page, cls, tuple(sorted(required[cls])), tuple(sorted(have)) or ('none',)))

if not bad:
    print("  ✓ OK — every scoped rule can match the element it targets")
for page, cls, want, have in dict.fromkeys(bad):
    print(f"  ✗ UNSTYLED  {page}\n              .{cls} needs cid {want}, element has {have}")
