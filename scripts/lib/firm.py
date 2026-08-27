"""The firm's phone numbers, read from the same place the site reads them.

THE TRANSPORT MOVED TO `sanity.py`. This file was the first Python check to read
the dataset instead of regexing a TypeScript literal; Phase 3 needed the same
thing for the practice-area slugs, so the HTTP and the env-reading are shared now
and this is one query on top of them.

WHY THIS EXISTS. Three comp-diff scripts assert that the built page carries the
firm's real number and NOT the two the comps carry, and all three used to read
the literal out of `src/data/site.ts` with a regex. That file no longer holds
one — `getFirmDetails()` fetches the `firmDetails` singleton — so the regex
returned None and `.group(1)` threw. Loudly, which was the right direction: a
declaration that has stopped being true should fail rather than pass quietly.

A `.py` script cannot import a `.ts` module, but it can query the same dataset
the build queries. That keeps ONE source of truth, which is the whole point of
the exercise — the alternative was writing the number down a second time, in a
file whose entire history is about not doing that.

The dataset is public-read, so this needs no token. It does need the network,
which these scripts already did.
"""

import sys

from lib.sanity import groq

_QUERY = '*[_type == "firmDetails"][0]{phone, sms}'

_cache = None


def firm_details():
    """`{phone, sms}` from Sanity. Fetched once per run.

    Only the DISPLAYED numbers. The E.164 forms are derived in TypeScript
    (`src/sanity/lib/phone.ts`) rather than stored, so there is nothing to read
    here — and these checks assert against what the page prints anyway.
    """
    global _cache
    if _cache is not None:
        return _cache

    result = groq(_QUERY, "the firm's phone number")
    if not result or not result.get("phone"):
        sys.exit(
            "Sanity has no published `firmDetails` document, so there is no phone number "
            "to check the built page against.\n"
            "Create and PUBLISH it at /admin → Site Settings → Firm Details."
        )

    _cache = result
    return result
