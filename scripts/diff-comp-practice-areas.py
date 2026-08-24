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
    },
}

# Renames: the comp's shortened wording replaced by the live hub's own, since
# the hub is now the source for these labels and not only for the URLs. Keyed by
# group, because one of them is group-specific — "Product Liability" is
# "Product Liability Overview" in the Denver column and plain everywhere else,
# on the hub as much as here, so a global rename would corrupt five groups.
RENAMED = {
    "*": {
        "E-Scooter Accidents": "Dockless Bike / E-Scooter Accidents",
        "Drowsy Driving Accidents": "Drowsy Driving Accident",
        "Negligent Ice / Snow Removal": "Negligent Ice/Snow Removal",
        "Side-Impact Accidents": "Side-Impact Accident",
        "Uninsured & Underinsured Motorists":
            "Uninsured and Underinsured Motorcyclist Accidents",
        "Off-Road Vehicle Accidents": "Off-Road Recreational Vehicle Accidents",
        "Colorado Slip and Fall Laws": "Slip and Fall Accident Laws in Colorado",
        "Hiring a Slip and Fall Lawyer": "Slip and Fall Injury Cases – Hiring a Lawyer",
        "10 Things to Do After a Fall": "10 Things To Do After a Slip and Fall Accident",
        # The one rename that runs the OTHER way. Comp and hub both say
        # "Overview" here, in four groups and not the other two; dropped by
        # request, because the column read as a mistake. It is also why Denver's
        # entry is "Personal Injury" and not the hub's "Personal Injuries".
        "Personal Injury Overview": "Personal Injury",
    },
    "Denver Personal Injury": {"Product Liability": "Product Liability Overview"},
}

def rename(group, item):
    return RENAMED.get(group, {}).get(item) or RENAMED["*"].get(item, item)

expected_groups = []
for title, items in comp_groups:
    for added_title, added_items in ADDED_GROUPS.get(title, []):
        expected_groups.append((added_title, added_items))
    out = []
    for item in items:
        out.append(rename(title, item))
        for new, follows in ADDED_ITEMS.get(title, {}).items():
            if follows == item:
                out.append(new)
    expected_groups.append((title, out))

print("\nDIRECTORY GROUPS  (comp + declared departures)")
cmp("group titles / order", [t for t, _ in expected_groups], [t for t, _ in built_groups])
for (ct, ci), (bt, bi) in zip(expected_groups, built_groups):
    cmp(f"items — {ct}", ci, bi)

print("\nRESULT:", "MATCHES COMP" if ok else "DIFFERENCES ABOVE")
sys.exit(0 if ok else 1)
