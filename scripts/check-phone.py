#!/usr/bin/env python3
"""Every phone number the built site publishes is the firm's current one.

    python3 scripts/check-phone.py        # reads dist/, so build first

WHY THIS EXISTS, AND WHY NOW. `check:links` already validates a `tel:` href's
FORMAT — it rejects anything that is not E.164, which is what caught 68
malformed hrefs in nine spellings. It has never validated the VALUE: it would
pass `tel:+13037474404`, the retired number, perfectly happily.

That gap was tolerable while every phone number on the site came from one
TypeScript literal a human reviewed in a diff. It stopped being tolerable in
Phase 4. The firm's number now appears 261 times as text and 69 times as a
`tel:` href across bodies an EDITOR can change, plus one more place Phase 4 put
it: the Thank You page's lede stores the number as content, because the sentence
needs a real link mid-flow and Portable Text is how a link gets into a sentence.
A deploy-hook rebuild runs `npm run build`, not `npm run check`, so an edited
number reaches production unexamined.

WHAT IT CHECKS — two things, and the second is the one with teeth:

  1. Every `tel:` and `sms:` href in dist/ dials the firm's own number. The
     numbers are read from the same `firmDetails` document the site renders from,
     so there is one source of truth rather than a literal repeated here.
  2. NO RETIRED NUMBER APPEARS ANYWHERE — as an href, as displayed text, in an
     attribute. This is a CLOSED LIST of numbers already confirmed to be the
     firm's own and already rewritten: the six the WordPress import carried, and
     the two the comps carry. A regex over phone-shaped strings would be the
     trap here — it also matches sixty-odd Shutterstock asset ids in image
     filenames, two X/Twitter status ids and a PACER document id — so this looks
     for named numbers, not for a shape.

THREE NUMBERS IN THE BODY COPY ARE NOT THE FIRM'S and are deliberately absent
from that list: the Denver Police non-emergency line, and Bike Thornton's and
Bicycle Colorado's, all of which are correct editorial content.

IT FAILS IN BOTH DIRECTIONS, like `check-links.py`. A `tel:` exemption in
`KNOWN_TEL` that has stopped being needed fails until it is deleted, because an
exemption table that only ever grows is a table nobody trusts.

NOT IN `npm run check`: it needs the network to read the dataset, like the five
comp-diff scripts and the fidelity audit. Run it before a deploy, and after any
change to the firm's number.
"""

import html
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from lib.firm import firm_details  # noqa: E402

DIST = pathlib.Path("dist")

# Numbers RETIRED from this site, every one of them confirmed as the firm's own
# and already rewritten. Anything here appearing in dist/ is a regression.
#
# Written down rather than matched by pattern — see the module docstring. Each
# entry is (number, where it came from); the number is matched in every
# punctuation the site has ever spelled it in.
RETIRED = [
    ("303-747-4404", "the main number the WordPress bodies carried, in five spellings"),
    ("303-747-4407", "last digit differs, same sentence shape — two occurrences"),
    ("303-474-4404", "747 transposed, on thornton-spinal-cord-injury-lawyer"),
    ("720-571-8186", '"call Dormer Harpring at …", four blog posts'),
    ("303-647-9990", '"Dormer Harpring … Call us at …", one post'),
    ("866-683-6894", "the comps' call number, recorded in site.ts as the firm's choice — it was not"),
    ("720-734-6230", "the comps' text number"),
]

# A `tel:`/`sms:` href that is deliberately NOT the firm's number. Empty, and it
# should stay that way: every dialable link on this site should reach the firm.
# An entry here that is no longer in dist/ FAILS, so closing one leaves a trace.
KNOWN_TEL: dict[str, str] = {}

# `(303) 555-0100` is NOT a firm number and must not be read as one. It is the
# `placeholder` and `title` hint on the two forms' phone inputs — an example of
# the format the VISITOR should type, on 326 pages — and 555-01xx is the
# reserved fictional range. site.ts used to claim it "is not used anywhere",
# which was wrong in a way that invited someone to grep for it and delete it.
FORM_HINT = "3035550100"

TEL_HREF = re.compile(r'href="(tel:|sms:)([^"]*)"', re.I)


def digits(value):
    """Just the digits, so one number matches in every punctuation."""
    return re.sub(r"\D", "", value)


def to_e164(display):
    """The Python half of `src/sanity/lib/phone.ts`'s `toE164`.

    DUPLICATED, KNOWINGLY, and it is the same trade `audit-practice-area-
    fidelity.py` makes with its dropped-sections lists: a `.py` script cannot
    import a `.ts` module. The two are kept honest by this check itself — if
    they ever disagree about the firm's own number, every `tel:` on the site
    fails here.
    """
    trimmed = (display or "").strip()
    if not trimmed or re.search(r"[a-z]", trimmed, re.I):
        return None
    only = digits(trimmed)
    if trimmed.startswith("+"):
        return f"+{only}"
    if len(only) == 10:
        return f"+1{only}"
    if len(only) == 11 and only.startswith("1"):
        return f"+{only}"
    return None


def pages():
    """Every built page except the Studio's own shell."""
    found = sorted(p for p in DIST.rglob("*.html") if "admin" not in p.parts)
    if not found:
        sys.exit(
            "No pages in dist/, so this check would pass having looked at nothing.\n"
            "Run `npm run build` first — and note a FAILED build leaves a partial dist/ behind."
        )
    return found


def main():
    if not DIST.is_dir():
        sys.exit("dist/ does not exist. Run `npm run build` first.")

    firm = firm_details()
    allowed = {to_e164(firm.get("phone")), to_e164(firm.get("sms"))} - {None}
    if not allowed:
        sys.exit(
            "The firm's number in Sanity cannot be turned into a dialable one, so there is "
            "nothing to check the built pages against.\n"
            "Fix it at /admin → Site Settings → Firm Details."
        )
    allowed_digits = {digits(n) for n in allowed}

    wrong_tel = {}      # href → sorted pages
    retired_hits = {}   # (number, reason) → sorted pages
    seen_known = set()
    tel_count = 0

    for page in pages():
        raw = page.read_text(encoding="utf-8", errors="replace")
        # Attributes are entity-encoded; unescape once so a &amp; inside an
        # href does not read as a different number.
        text = html.unescape(raw)
        where = str(page)

        for scheme, value in TEL_HREF.findall(text):
            tel_count += 1
            href = f"{scheme.lower()}{value}"
            if digits(value) in allowed_digits:
                continue
            if href in KNOWN_TEL:
                seen_known.add(href)
                continue
            wrong_tel.setdefault(href, set()).add(where)

        # A number is matched on its DIGITS, so "(303) 747-4404",
        # "303.747.4404" and "tel:+13037474404" are all the same finding.
        stripped = digits(text)
        for number, reason in RETIRED:
            if digits(number) in stripped:
                retired_hits.setdefault((number, reason), set()).add(where)

    stale = sorted(set(KNOWN_TEL) - seen_known)

    problems = []
    if wrong_tel:
        problems.append(
            f"{len(wrong_tel)} dialable link(s) do not reach the firm "
            f"(it is {', '.join(sorted(allowed))}):"
        )
        for href, where in sorted(wrong_tel.items()):
            pages_list = sorted(where)
            shown = ", ".join(pages_list[:3])
            more = f" +{len(pages_list) - 3} more" if len(pages_list) > 3 else ""
            problems.append(f"    {href}  on {len(pages_list)} page(s): {shown}{more}")

    if retired_hits:
        problems.append(f"{len(retired_hits)} RETIRED number(s) are back in the built site:")
        for (number, reason), where in sorted(retired_hits.items()):
            pages_list = sorted(where)
            shown = ", ".join(pages_list[:3])
            more = f" +{len(pages_list) - 3} more" if len(pages_list) > 3 else ""
            problems.append(f"    {number}  ({reason})")
            problems.append(f"        on {len(pages_list)} page(s): {shown}{more}")

    if stale:
        problems.append(
            f"{len(stale)} KNOWN_TEL exemption(s) are no longer in dist/. Delete them — an "
            "exemption table that only ever grows is one nobody trusts:"
        )
        problems.extend(f"    {href}" for href in stale)

    if problems:
        print("\n".join(f"  ✗ {line}" if i == 0 else f"  {line}" for i, line in enumerate(problems)))
        sys.exit(1)

    print(
        f"  ✓ OK — {tel_count} dialable link(s) across {len(pages())} pages all reach "
        f"{' / '.join(sorted(allowed))}, and none of the {len(RETIRED)} retired numbers appears "
        f"anywhere (the {FORM_HINT[:3]}-555-01xx form hint is not one of them)"
    )


if __name__ == "__main__":
    main()
