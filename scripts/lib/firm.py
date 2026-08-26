"""The firm's phone numbers, read from the same place the site reads them.

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

import json
import os
import re
import sys
import urllib.parse
import urllib.request

_API_VERSION = "2026-08-01"
_QUERY = '*[_type == "firmDetails"][0]{phone, sms, phoneE164, smsE164}'

_cache = None


def _env():
    """PUBLIC_SANITY_* from the environment, falling back to .env at the root.

    The same two variables the site, the Studio and the CLI all read. Not
    committed, so a checkout without one gets a message naming it rather than a
    KeyError.
    """
    values = {}
    for name in ("PUBLIC_SANITY_PROJECT_ID", "PUBLIC_SANITY_DATASET"):
        if os.environ.get(name):
            values[name] = os.environ[name]

    if len(values) < 2 and os.path.exists(".env"):
        text = open(".env", encoding="utf-8").read()
        for name in ("PUBLIC_SANITY_PROJECT_ID", "PUBLIC_SANITY_DATASET"):
            if name in values:
                continue
            match = re.search(rf'^{name}\s*=\s*"?([^"\n]+)"?', text, re.M)
            if match:
                values[name] = match.group(1).strip()

    missing = [n for n in ("PUBLIC_SANITY_PROJECT_ID", "PUBLIC_SANITY_DATASET") if n not in values]
    if missing:
        sys.exit(
            f"{', '.join(missing)} not set, so the firm's phone number cannot be read.\n"
            "Add it to .env at the repository root — the same file the site and the Studio use."
        )
    return values


def firm_details():
    """`{phone, sms, phoneE164, smsE164}` from Sanity. Fetched once per run."""
    global _cache
    if _cache is not None:
        return _cache

    env = _env()
    url = (
        f"https://{env['PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io"
        f"/v{_API_VERSION}/data/query/{env['PUBLIC_SANITY_DATASET']}"
        f"?query={urllib.parse.quote(_QUERY)}"
    )

    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            payload = json.load(response)
    except Exception as error:  # noqa: BLE001 — the message is the whole point
        sys.exit(
            f"Could not reach Sanity to read the firm's phone number: {error}\n"
            "These checks read it from the dataset rather than keeping a second copy — "
            "see the note at the top of scripts/lib/firm.py."
        )

    result = payload.get("result")
    if not result or not result.get("phone"):
        sys.exit(
            "Sanity has no published `firmDetails` document, so there is no phone number "
            "to check the built page against.\n"
            "Create and PUBLISH it at /admin → Site Settings → Firm Details."
        )

    _cache = result
    return result
