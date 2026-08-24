# Diffs the built /practice-areas page against the Practice Areas comp's own
# data — the `renderVals()` arrays in its `data-dc-script` block — and reports
# any card, group or list item whose text or ORDER disagrees.
#
# Why this exists: the page was first built from the comp's markup alone, whose
# `sc-for` loops look like unpopulated placeholders. They are not; the values
# sit at the foot of the same file. Every card title, every blurb and every one
# of the 90 directory entries was wrong, in a page that otherwise looked
# finished and passed both linters. A build is green when the layout is right;
# only this catches the content being wrong.
#
# Run after `npm run build`. Exits non-zero on any difference:
#   python3 scripts/diff-comp-practice-areas.py
#
# Not wired into `npm run check`, which must stay runnable without the design
# folder — this needs it. Run it by hand when touching the page or its data.

import re, html, json, sys

COMP = "/Users/rhanpemberton/Downloads/Dormer Harpring/Dormer Harpring Claude Files/DH - Practice Areas.html"
BUILT = "/Users/rhanpemberton/my_apps/Dormer-Harpring/dist/practice-areas/index.html"

comp = open(COMP, encoding="utf-8", errors="replace").read()
built = open(BUILT, encoding="utf-8", errors="replace").read()

def unesc(s): return html.unescape(re.sub(r"<[^>]+>", "", s)).replace("’","’").strip()

# ---- comp: featured names + descs
blk = comp[comp.index("const featured = ["):comp.index("const groupsData")]
comp_names = re.findall(r"\{ name: '([^']+)'", blk)
comp_descs = [d.replace("\\'", "'") for d in re.findall(r"desc: '((?:[^'\\]|\\.)*)'", blk)]

# ---- comp: groups
gblk = comp[comp.index("const groupsData = ["):comp.index("const groups = groupsData")]
comp_groups = []
for t, items in re.findall(r"\{ title: '([^']+)', items: \[([^\]]*)\]", gblk):
    comp_groups.append((t, [i.strip().strip("'").replace("\\'", "'") for i in items.split("', '")] if items else []))
comp_groups = [(t, [x.strip().strip("'") for x in items]) for t, items in comp_groups]

# ---- built: cards
cards = re.findall(r'<h3 class="feat__title[^"]*"[^>]*>(.*?)</h3>.*?<p class="feat__desc[^"]*"[^>]*>(.*?)</p>', built, re.S)
built_names = [unesc(a) for a, b in cards]
built_descs = [unesc(b) for a, b in cards]

# ---- built: groups
built_groups = []
for gm in re.finditer(r'<h3 class="dir__group-title[^"]*"[^>]*>(.*?)</h3>(.*?)</ul>', built, re.S):
    title = unesc(gm.group(1))
    # `arealist__link`, not `dir__link`: the link rows moved into the shared
    # AreaLinkList component when the practice-area page's city band became the
    # third caller. The group heading is still this page's own.
    items = [unesc(x) for x in re.findall(r'class="arealist__link[^"]*"[^>]*>(.*?)</(?:a|span)>', gm.group(2), re.S)]
    built_groups.append((title, items))

ok = True
def cmp(label, a, b):
    global ok
    if a == b:
        print(f"  ✓ {label}")
    else:
        ok = False
        print(f"  ✗ {label}")
        for i in range(max(len(a), len(b))):
            x = a[i] if i < len(a) else "<missing>"
            y = b[i] if i < len(b) else "<missing>"
            if x != y:
                print(f"      [{i}] comp : {x!r}")
                print(f"          built: {y!r}")

print("FEATURED CARDS")
cmp("names / order", comp_names, built_names)
cmp("descriptions", comp_descs, built_descs)

print("\nDIRECTORY GROUPS")
cmp("group titles / order", [t for t, _ in comp_groups], [t for t, _ in built_groups])
for (ct, ci), (bt, bi) in zip(comp_groups, built_groups):
    cmp(f"items — {ct}", ci, bi)

print("\nRESULT:", "MATCHES COMP" if ok else "DIFFERENCES ABOVE")
sys.exit(0 if ok else 1)
