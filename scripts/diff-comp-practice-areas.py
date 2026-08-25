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
# THE DIRECTORY IS NO LONGER THE COMP'S LIST. It is the comp's list plus the
# entries the live hub carries and the comp omits — the comp is not an
# inventory. Rather than loosen this into a subset check, which would stop
# catching a dropped entry, the departures are DECLARED below and applied to
# the comp's arrays; the comparison against the built page stays strict. Adding
# an entry to the page without declaring it here still fails, and so does
# reverting a declared one.
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

# ---- declared departures from the comp's directory
#
# Sources: the live hub at https://www.denvertrial.com/practice-areas/ for the
# additions, and an explicit request for the rename. Every destination behind
# an added entry was already built and served — only the link from here was
# missing.

# Whole groups the comp omits, keyed by the comp group title they go BEFORE.
ADDED_GROUPS = {
    "Premises Liability": [
        ("Greeley Personal Injury",
         ["Personal Injury", "Car Accident", "Truck Accident", "Motorcycle Accident",
          "Wrongful Death"]),
        ("Fort Collins Personal Injury",
         ["Personal Injury", "Car Accident", "Truck Accident", "Motorcycle Accident"]),
        # Truck before motorcycle — the hub has this one group the other way
        # round and its two siblings this way. Normalised, by request.
        ("Grand Junction Personal Injury",
         ["Personal Injury", "Car Accident", "Truck Accident", "Motorcycle Accident"]),
    ],
}

# Items the comp omits: group title -> {new item: the comp item it follows}.
ADDED_ITEMS = {
    "Denver Personal Injury": {
        "Amazon Truck Accident": "Personal Injury",
        "Daycare Injury": "Construction Accidents",
        "FedEx Truck Accident": "Drowsy Driving Accidents",
        "Garbage Truck Accident": "Funeral Home Negligence",
        "Tow Truck Accident": "Spinal Cord Injury",
        "UPS Truck Accident": "Uninsured & Underinsured Motorists",
        # The six folded in from the two removed topical groups, at their
        # alphabetical positions in this column. Anchors are COMP items, so
        # three share one and append in the order declared here.
        "Insurance Bad Faith": "Funeral Home Negligence",
        "Legal Malpractice": "Funeral Home Negligence",
        "Life Insurance Bad Faith": "Funeral Home Negligence",
        "Negligent Building Maintenance": "Medical Malpractice",
        "Negligent Security": "Negligent Ice / Snow Removal",
        "Pet Insurance Bad Faith": "Pedestrian Accidents",
    },
}

# Whole groups the comp and the live hub carry that the built page does NOT.
#
# Both are TOPICAL, not geographic, under a heading that reads "by location" —
# the mismatch the data module has flagged since the page was built. Their
# entries fold into the Denver column instead (see ADDED_ITEMS), which is where
# they all point anyway: every one of them is a Denver page.
#
# The five slip-and-fall articles that used to sit in "Premises Liability" need
# no entry here: they moved to the BLOG collection, the group that held them is
# gone, and their slugs still resolve from the other branch of [slug].astro.
#
# Folding drops TWO entries as duplicates of Denver's own — "Premises Liability
# Overview" and "Negligent Ice/Snow Removal" both point at pages Denver already
# lists. The first is also the requested relabel: Denver's entry reads plain
# "Premises Liability", so dropping the Overview one IS the rename.
REMOVED_GROUPS = {"Premises Liability", "Other Legal Services"}

# Renames: the comp's shortened wording replaced by the live hub's own, since
# the hub is the source for these labels and not only for the URLs.
#
# FLAT, not keyed by group. It was keyed, for exactly one entry: the hub calls
# Denver's product-liability page "Product Liability Overview" and every other
# city's plain "Product Liability", so a global rename would have corrupted five
# groups. That entry is gone — the label is plain everywhere now, by request,
# for the same reason "Premises Liability Overview" went. Key it again the day a
# rename is genuinely group-specific; nothing here needs it today.
#
# Three renames also went with the "Premises Liability" group when it folded
# into Denver — "Colorado Slip and Fall Laws", "Hiring a Slip and Fall Lawyer"
# and "10 Things to Do After a Fall" appear in the comp ONLY in that group, so
# they can no longer fire. Kept out rather than left dead: a rename for an entry
# the page does not have reads as a rename the page performs.
RENAMED = {
    "E-Scooter Accidents": "Dockless Bike / E-Scooter Accidents",
    "Drowsy Driving Accidents": "Drowsy Driving Accident",
    "Negligent Ice / Snow Removal": "Negligent Ice/Snow Removal",
    "Side-Impact Accidents": "Side-Impact Accident",
    "Uninsured & Underinsured Motorists":
        "Uninsured and Underinsured Motorcyclist Accidents",
    "Off-Road Vehicle Accidents": "Off-Road Recreational Vehicle Accidents",
    # The one rename that runs the OTHER way — toward the comp, away from the
    # hub. Comp and hub both say "Overview" here, in four groups and not the
    # other two; dropped by request, because the column read as a mistake. It is
    # also why Denver's entry is "Personal Injury" and not the hub's "Personal
    # Injuries".
    "Personal Injury Overview": "Personal Injury",
}

def rename(item):
    return RENAMED.get(item, item)

expected_groups = []
for title, items in comp_groups:
    # Additions anchored to a removed group still fire — they are placed BEFORE
    # it, and the three city groups are anchored to "Premises Liability".
    for added_title, added_items in ADDED_GROUPS.get(title, []):
        expected_groups.append((added_title, added_items))
    if title in REMOVED_GROUPS:
        continue
    out = []
    for item in items:
        out.append(rename(item))
        for new, follows in ADDED_ITEMS.get(title, {}).items():
            if follows == item:
                out.append(new)
    expected_groups.append((title, out))

_still = sorted(REMOVED_GROUPS & {t for t, _ in expected_groups})
if _still:
    ok = False
    print(f"  ✗ REMOVED_GROUPS did not take: {_still}")

# Folding two groups into one makes a duplicate cheap to introduce and invisible
# to read. Nothing else in this file would catch it.
for _t, _items in expected_groups:
    _dupes = sorted({i for i in _items if _items.count(i) > 1})
    if _dupes:
        ok = False
        print(f"  ✗ duplicate entries in {_t!r}: {_dupes}")

print("\nDIRECTORY GROUPS  (comp + declared departures)")
cmp("group titles / order", [t for t, _ in expected_groups], [t for t, _ in built_groups])
for (ct, ci), (bt, bi) in zip(expected_groups, built_groups):
    cmp(f"items — {ct}", ci, bi)

print("\nRESULT:", "MATCHES COMP" if ok else "DIFFERENCES ABOVE")
sys.exit(0 if ok else 1)
