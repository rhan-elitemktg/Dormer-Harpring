# Redirects — a guide for the SEO team

When a page changes address or is retired, the old address has to send people to
the new one. Otherwise everyone who follows an old link — from Google, from
another site, from their own bookmarks — gets a "page not found", and the
ranking that page had built up is lost.

You can add these yourself. You do not need a developer.

**Where:** Sanity Studio → **Site Settings** → **Global SEO Settings** →
**Redirects**.

---

## Adding one

Click **Create new**, then fill in three fields.

### Old URL

The address that no longer works, written as a path starting with `/`.

- ✅ `/old-page-name/`
- ❌ `https://www.denvertrial.com/old-page-name/` — leave off the domain
- ❌ `old-page-name` — it needs the leading `/`

### Redirect to

Where to send people instead.

- ✅ `/new-page-name/` — a page on this site
- ✅ `https://example.com/somewhere` — a page on another site

Send people to **the closest equivalent page**, not to the homepage. Someone who
clicked a link about dog bite claims should land on the dog bite page. Sending
everything to the homepage is technically a working redirect and practically a
dead end — Google may treat it as a soft 404 and pass none of the old page's
value along.

### Permanent

Leave this **ON** unless you have a specific reason not to.

- **ON** (a 301) means "this has moved for good" — search engines transfer the
  old page's ranking to the new address.
- **OFF** (a 302) means "this is temporary, keep the old address indexed". Use
  it only for a diversion you intend to undo.

Then click **Publish**. **Nothing takes effect until you publish** — that is
literally true here, not just a convention: the site reads only published
documents, so a draft cannot reach visitors.

---

## When it goes live

A redirect starts working **the next time the site is built and deployed**, not
the moment you publish. If it needs to be live immediately, tell a developer to
redeploy.

---

## Messages you might see

The Studio checks each redirect as you type. Here is what each message means.

> **"… is a page this site still has."**

You have entered the address of a page that is still on the site. This is the
one mistake that does real damage: a redirect **beats** the page, so the page
would disappear from the site entirely and everyone would be sent elsewhere.

If you are retiring that page, delete or unpublish it first, then add the
redirect. If you are not, you probably meant a different address.

> **"There is still a page at … If you are about to delete or unpublish it,
> this is fine."**

Same situation, but for a page that comes from the CMS (a practice area, a blog
post). It is a warning rather than a block, because you may be deleting that
page in the same session. **The redirect will be skipped until that page is
gone** — so if you meant it, finish removing the page.

> **"… is already redirected by the site's built-in list of old addresses."**

The site carries a fixed list of redirects set up when it moved over from the
old website — roughly 200 of them, covering every address the old site used.
Yours is already handled. If it is going somewhere wrong, ask a developer: that
list is in code.

> **"There is already a redirect for …"**

Someone has already added this one. Find and edit that one instead. Two rules
for the same address would compete and the result would be unpredictable.

> **"… is itself redirected somewhere else, so visitors would be bounced twice."**

You are pointing at an address that is *also* redirected. It works, but every
extra hop is slower for the visitor and loses a little of the ranking value.
Point straight at the final address.

> **"This sends the page to itself, which would loop forever."**

The Old URL and the Redirect to are the same. One of them is wrong.

---

## What still needs a developer

- **Patterns and wildcards** — "send everything under `/news/2019/` to the blog"
  as a single rule. Each address needs its own entry here.
- **Redirects based on country, language, device or cookies.**
- **Changing the built-in cutover list** described above.
- **Making a redirect live without waiting for a deploy.**

---

## One habit worth having

Before you retire a page, check what links to it — Search Console's "Links"
report, or a quick site search. A page with a lot of inbound links is worth
redirecting carefully to the closest match. A page with none can usually go.
