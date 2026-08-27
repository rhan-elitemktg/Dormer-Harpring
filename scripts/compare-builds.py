#!/usr/bin/env python3
"""Compare two builds of dist/, telling image-URL churn apart from real change.

WHY THIS EXISTS. A content migration should be output-neutral, so hashing every
built page before and after is the strongest check available — and it is the one
this project already leans on. Moving an image breaks it: a local import renders
`/_astro/badge-1.HASH_xyz.webp` and a Sanity asset renders a cdn.sanity.io URL,
so every page carrying that image differs and the signal drowns. 111 pages carry
one award badge alone.

Normalising the URL-bearing attributes keeps the check sharp instead of
abandoning it. A page then falls into exactly one of three buckets:

  IDENTICAL   byte-for-byte. The default expectation.
  IMAGES      only <img>/<source> src and srcset moved. Expected when, and only
              when, that page renders an image you deliberately migrated.
  CHANGED     something else moved. Always worth reading.

Everything else is still compared strictly — alt, width, height, class,
loading, order, and every byte of prose — so a heading that moved or an alt
that vanished lands in CHANGED rather than hiding behind an image swap.

    python3 scripts/compare-builds.py snapshot before.json
    npm run build
    python3 scripts/compare-builds.py compare before.json
"""

import hashlib
import json
import pathlib
import re
import sys

DIST = pathlib.Path("dist")

# The Studio's own shell, not site content. Its bundle hash moves whenever the
# schema or the desk changes, which is every slice of the migration — so leaving
# it in makes the exit code mean "you changed a schema" rather than "you changed
# the site". Excluded by path, not by hashing it differently, so it cannot mask
# anything: nothing else is served from dist/admin/.
EXCLUDED = ("dist/admin/",)

# `src` / `srcset` on an image-bearing element only. Deliberately NOT a blanket
# strip of every src on the page: a <script src> or an <iframe src> changing is
# a real finding, and lumping them in here would hide it.
IMG_TAG = re.compile(r"<(?:img|source)\b[^>]*>", re.I)
URL_ATTR = re.compile(r"\b(src|srcset)\s*=\s*(\"[^\"]*\"|'[^']*')", re.I)


def normalise(html: str) -> str:
    """Blank the URL in every <img>/<source>, leaving the rest of the tag alone."""
    return IMG_TAG.sub(lambda m: URL_ATTR.sub(r'\1=""', m.group(0)), html)


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", "replace")).hexdigest()


def scan() -> dict:
    if not DIST.is_dir():
        sys.exit("dist/ does not exist — run `npm run build` first.")
    pages = {}
    for path in sorted(DIST.rglob("*.html")):
        if str(path).startswith(EXCLUDED):
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        pages[str(path)] = {"raw": digest(html), "norm": digest(normalise(html))}
    if not pages:
        sys.exit("dist/ holds no pages — run `npm run build` first.")
    return pages


def cmd_snapshot(out: str) -> None:
    pages = scan()
    pathlib.Path(out).write_text(json.dumps(pages, indent=0, sort_keys=True))
    print(f"snapshot: {len(pages)} pages → {out}")


def cmd_compare(before_path: str) -> int:
    before = json.loads(pathlib.Path(before_path).read_text())
    after = scan()

    gone = sorted(set(before) - set(after))
    new = sorted(set(after) - set(before))
    images, changed = [], []

    for path in sorted(set(before) & set(after)):
        b, a = before[path], after[path]
        if b["raw"] == a["raw"]:
            continue
        (images if b["norm"] == a["norm"] else changed).append(path)

    total = len(set(before) | set(after))
    identical = len(set(before) & set(after)) - len(images) - len(changed)

    print(f"{identical} identical · {len(images)} image URLs only · {len(changed)} changed "
          f"· {len(new)} added · {len(gone)} removed   (of {total})")

    for label, items in (("CHANGED", changed), ("ADDED", new), ("REMOVED", gone)):
        if items:
            print(f"\n{label} ({len(items)}):")
            for p in items[:40]:
                print(f"  {p}")
            if len(items) > 40:
                print(f"  … and {len(items) - 40} more")

    if images:
        print(f"\nIMAGE URLS ONLY ({len(images)}) — expected where an image was migrated:")
        for p in images[:10]:
            print(f"  {p}")
        if len(images) > 10:
            print(f"  … and {len(images) - 10} more")

    # Only CHANGED / ADDED / REMOVED are failures. Image churn is reported and
    # left to the reader, because whether it is expected depends on what was
    # migrated in this slice — which this script has no way to know.
    return 1 if (changed or new or gone) else 0


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"snapshot", "compare"}:
        sys.exit(__doc__)
    sys.exit(cmd_snapshot(sys.argv[2]) if sys.argv[1] == "snapshot" else cmd_compare(sys.argv[2]))
