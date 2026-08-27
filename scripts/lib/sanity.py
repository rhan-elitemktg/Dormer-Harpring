"""One GROQ reader for every Python check in this repo.

WHY THIS EXISTS. A `.py` script cannot import a `.ts` module, so every check
that needs a fact the site renders used to read it out of `src/data/*.ts` with a
regex. Those literals are leaving one phase at a time, and each departure breaks
the regex — which is the RIGHT direction: a declaration that has stopped being
true should fail rather than pass quietly. The fix is never to write the value
down a second time; it is to read the same dataset the build reads, so there is
still exactly one source of truth.

`scripts/lib/firm.py` did that first, for the firm's phone numbers. Phase 3
needed the same thing for the practice-area slugs and will need it again, so the
transport moved here and `firm.py` became one query on top of it.

The dataset is public-read, so this needs no token. It does need the network,
which is why none of these checks is wired into `npm run check`.
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request

API_VERSION = "2026-08-01"

_VARS = ("PUBLIC_SANITY_PROJECT_ID", "PUBLIC_SANITY_DATASET")


def env():
    """PUBLIC_SANITY_* from the environment, falling back to .env at the root.

    The same two variables the site, the Studio and the CLI all read. Not
    committed, so a checkout without one gets a message naming it rather than a
    KeyError three frames down.
    """
    values = {name: os.environ[name] for name in _VARS if os.environ.get(name)}

    if len(values) < len(_VARS) and os.path.exists(".env"):
        text = open(".env", encoding="utf-8").read()
        for name in _VARS:
            if name in values:
                continue
            match = re.search(rf'^{name}\s*=\s*"?([^"\n]+)"?', text, re.M)
            if match:
                values[name] = match.group(1).strip()

    missing = [name for name in _VARS if name not in values]
    if missing:
        sys.exit(
            f"{', '.join(missing)} not set, so this check cannot read the dataset.\n"
            "Add it to .env at the repository root — the same file the site and the Studio use."
        )
    return values


def groq(query, what):
    """Run a GROQ query and return its result, or exit with a readable message.

    `what` names the thing being fetched, so a network failure or an empty
    dataset says which check is blocked rather than printing a URL.
    """
    values = env()
    url = (
        f"https://{values['PUBLIC_SANITY_PROJECT_ID']}.api.sanity.io"
        f"/v{API_VERSION}/data/query/{values['PUBLIC_SANITY_DATASET']}"
        f"?query={urllib.parse.quote(query)}"
    )

    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            payload = json.load(response)
    except Exception as error:  # noqa: BLE001 — the message is the whole point
        sys.exit(
            f"Could not reach Sanity to read {what}: {error}\n"
            "These checks read the dataset rather than keeping a second copy of the content — "
            "see the note at the top of scripts/lib/sanity.py."
        )

    return payload.get("result")
