// WordPress `content.rendered` → Portable Text. Shared by the blog importer and
// the practice-area importer.
//
// SIDE-EFFECT FREE, ON PURPOSE. This module was carved out of
// `import-blog-posts.mjs`, which ends in a bare top-level `await main()` — so
// importing `convertBody` from there ran a 167-post import as a side effect and
// handed you its module state as a bonus. Nothing here runs on import; call
// `createConverter()` to get a converter with its own state.
//
// ONE CONVERTER PER RUN, NOT PER DOCUMENT. `mkKey` is a single run-scoped
// counter, deliberately: Portable Text only needs a key unique inside its own
// array, and a counter is stable across runs given the same input, which keeps
// a re-import from producing a diff of nothing but churned keys. Instantiating
// per document (or iterating in a different order) rewrites every key in every
// file.
import { parse } from "node-html-parser";

/** Heading levels the renderer has a component for. h1 never appears in a body
 *  (the page's own title is the h1); h5/h6 are demoted. */
const HEADING_STYLE = { h2: "h2", h3: "h3", h4: "h4" };

/** Tags that carry no content and have no Portable Text equivalent. Shared by
 *  both importers; a caller adds to it rather than replacing it. */
export const DEFAULT_CHROME_TAGS = [
  "script",
  "style",
  "nav",
  "svg",
  "input",
  "label",
  "form",
  "noscript",
];

export const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

/** Absolute links back to the firm's own domain become site-relative, so they
 *  keep working after cutover and stop pointing at the site being replaced.
 *
 *  `tel:` and `sms:` are rewritten to E.164 — a plus, a country code, digits,
 *  nothing else. WordPress body copy spells the same number nine different
 *  ways ("tel:(303) 747-4404", "tel: +1(303) 747-4404", "tel:303 747 4404"),
 *  and the ones with a space straight after the colon do not reliably dial at
 *  all. `firmDetails.smsE164` in src/data/site.ts is named for this format, so
 *  the body copy is being brought to the site's own convention rather than to
 *  an invented one. The DIGITS are preserved — which number a page should dial
 *  is a content decision, not this converter's. */
export function normalizeHref(href) {
  const h = decode(href.trim());

  const dial = h.match(/^(tel|sms):\s*(.+)$/i);
  if (dial) {
    const [, scheme, raw] = dial;
    const digits = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    // A bare 10-digit US number carries no country code; E.164 needs one.
    const e164 = digits.startsWith("+")
      ? digits
      : `+${digits.length === 10 ? "1" : ""}${digits}`;
    return `${scheme.toLowerCase()}:${e164}`;
  }

  return h.replace(/^https?:\/\/(www\.)?denvertrial\.com/i, "") || "/";
}

/** True for an href that resolves under the CURRENT page's path rather than
 *  the site root — no scheme, no leading slash, not a bare fragment.
 *
 *  WordPress bodies carry these because the legacy hub links its children
 *  relatively, and they are broken on the live site too: the one that reached
 *  this build, `practice-areas/traffic-collision-lawyer/truck-accident` on
 *  5-steps-to-take-after-a-truck-accident, resolved under the post's own slug
 *  and 404'd. It was found by a one-off sweep, not by anything committed,
 *  which is what this guard and scripts/check-links.py between them fix. */
export function isDocumentRelative(href) {
  const h = href.trim();
  if (!h) return false;
  if (h.startsWith("#") || h.startsWith("/")) return false;   // "//host" is absolute too
  return !/^[a-z][a-z0-9+.-]*:/i.test(h);
}

/**
 * Builds a converter with its own key counter, warning list and image queue.
 *
 * @param {object}   opts
 * @param {string[]} opts.chromeClassPrefixes  class/id prefixes to skip entirely
 * @param {string[]} [opts.chromeTags]         defaults to DEFAULT_CHROME_TAGS
 * @param {string}   [opts.imageSrcPrefix]     what an emitted image `src` is prefixed with
 * @param {boolean}  [opts.plainHeadings]      strip strong/em marks from headings
 * @param {(href: string, slug: string) => boolean} [opts.dropLink]
 *        return true to render a link's text as plain text instead of a link
 */
export function createConverter({
  chromeClassPrefixes,
  chromeTags = DEFAULT_CHROME_TAGS,
  imageSrcPrefix = "./images/",
  plainHeadings = false,
  dropLink = null,
} = {}) {
  const warnings = [];
  const warn = (slug, msg) => warnings.push(`${slug}: ${msg}`);

  /** localName -> source path on the firm's domain */
  const imagesToCopy = new Map();

  const mkKey = (() => {
    let n = 0;
    return (p = "b") => `${p}${(++n).toString(36)}`;
  })();

  const isChrome = (el) => {
    if (chromeTags.includes(el.rawTagName?.toLowerCase())) return true;
    const cls = el.getAttribute?.("class") || "";
    const id = el.getAttribute?.("id") || "";
    return chromeClassPrefixes.some(
      (p) => cls.split(/\s+/).some((c) => c.startsWith(p)) || id.startsWith(p)
    );
  };

  /* `querySelectorAll` reaches THROUGH a chrome wrapper. The walk checks each
   * element as it descends and never enters one, but lifting media out of a
   * paragraph queries the whole subtree — so a phone icon inside a
   * `coman-btn-block`, or an avatar inside `client-reviews`, comes back as if it
   * were content. Every such query has to re-check ancestors itself. */
  const inChrome = (el) => {
    let n = el;
    while (n) {
      if (n.rawTagName && isChrome(n)) return true;
      n = n.parentNode;
    }
    return false;
  };

  /* ------------------------------------------------------------- inline -----
   * Walks an element's inline descendants into Portable Text spans, carrying
   * marks down. `markDefs` collects link definitions, which Portable Text stores
   * beside the spans rather than on them.
   *
   * `b` and `strong` both become `strong`; `i` and `em` both become `em`. `u` and
   * `sup` are dropped to plain text deliberately — four instances in one post
   * each, and an underline renders as a link that is not one. */
  function inlineSpans(node, marks, markDefs, slug) {
    const out = [];
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const text = decode(child.rawText);
        if (text) out.push({ _type: "span", _key: mkKey("s"), text, marks: [...marks] });
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = child.rawTagName.toLowerCase();
      if (isChrome(child)) continue;

      if (tag === "br") {
        out.push({ _type: "span", _key: mkKey("s"), text: " ", marks: [...marks] });
      } else if (tag === "strong" || tag === "b") {
        out.push(...inlineSpans(child, [...new Set([...marks, "strong"])], markDefs, slug));
      } else if (tag === "em" || tag === "i") {
        out.push(...inlineSpans(child, [...new Set([...marks, "em"])], markDefs, slug));
      } else if (tag === "a") {
        const href = child.getAttribute("href");
        if (!href || href === "#") {
          // Same choice TeamCard.astro records: plain text beats a link to
          // nowhere. A dead href in a body is worse than a missing one.
          out.push(...inlineSpans(child, marks, markDefs, slug));
        } else if (isDocumentRelative(href)) {
          // Same treatment, and for the same reason — this one resolves under
          // whatever page it lands on, so it is a 404 that moves. Warned
          // rather than silently dropped: the converter cannot know where it
          // was meant to point, but a human reading the run can.
          warn(slug, `TODO(launch): relative href dropped to plain text: ${href.slice(0, 80)}`);
          out.push(...inlineSpans(child, marks, markDefs, slug));
        } else if (dropLink && dropLink(normalizeHref(href), slug)) {
          // The caller has decided this destination is not worth a link. Same
          // treatment as `href="#"`: keep the words, drop the anchor.
          out.push(...inlineSpans(child, marks, markDefs, slug));
        } else {
          const key = mkKey("l");
          markDefs.push({ _key: key, _type: "link", href: normalizeHref(href) });
          out.push(...inlineSpans(child, [...marks, key], markDefs, slug));
        }
      } else {
        // u, sup, span, small, code, anything else: keep the words, drop the tag.
        out.push(...inlineSpans(child, marks, markDefs, slug));
      }
    }
    return out;
  }

  /** Collapses runs of whitespace and drops spans that became empty. */
  function tidy(spans) {
    const kept = [];
    for (const s of spans) {
      const text = s.text.replace(/\s+/g, " ");
      if (!text) continue;
      const last = kept[kept.length - 1];
      // Merge adjacent spans carrying identical marks — otherwise every <span>
      // WordPress emits becomes its own Portable Text span for no reason.
      if (last && JSON.stringify(last.marks) === JSON.stringify(s.marks)) last.text += text;
      else kept.push({ ...s, text });
    }
    if (kept.length) {
      kept[0].text = kept[0].text.replace(/^\s+/, "");
      kept[kept.length - 1].text = kept[kept.length - 1].text.replace(/\s+$/, "");
    }
    return kept.filter((s) => s.text);
  }

  const block = (style, spans, markDefs, extra = {}) =>
    spans.length
      ? { _type: "block", _key: mkKey(), style, markDefs, children: spans, ...extra }
      : null;

  function textBlock(el, style, slug) {
    const markDefs = [];
    let spans = tidy(inlineSpans(el, [], markDefs, slug));
    /* A heading that arrives wrapped in <strong> renders bold inside an already
     * bold Anton heading. The practice-area pages do this on roughly a third of
     * their headings; the blog posts never do, which is why this is opt-in. */
    if (plainHeadings && HEADING_STYLE[style]) {
      spans = tidy(spans.map((s) => ({ ...s, marks: s.marks.filter((m) => m !== "strong" && m !== "em") })));
    }
    // Only the link defs actually referenced by a surviving span.
    const used = new Set(spans.flatMap((s) => s.marks));
    return block(style, spans, markDefs.filter((d) => used.has(d._key)));
  }

  function listBlocks(el, listItem, slug) {
    const out = [];
    for (const li of el.querySelectorAll(":scope > li")) {
      const b = textBlock(li, "normal", slug);
      if (b) out.push({ ...b, listItem, level: 1 });
    }
    return out;
  }

  /* The single table, in colorado-auto-insurance-coverage-overview: 3 rows of 3.
   * Portable Text has no table, and building an object type for one post is not
   * worth it, so at Rhan's direction it becomes a list — first cell as the term
   * in bold, the rest as the definition. */
  function tableBlocks(el, slug) {
    const out = [];
    const rows = el.querySelectorAll("tr");
    for (const tr of rows) {
      const cells = tr.querySelectorAll("th, td");
      if (!cells.length) continue;
      const markDefs = [];
      const spans = [];
      cells.forEach((cell, i) => {
        const inner = tidy(inlineSpans(cell, i === 0 ? ["strong"] : [], markDefs, slug));
        if (!inner.length) return;
        if (spans.length) spans.push({ _type: "span", _key: mkKey("s"), text: " — ", marks: [] });
        spans.push(...inner);
      });
      const b = block("normal", tidy(spans), markDefs);
      if (b) out.push({ ...b, listItem: "bullet", level: 1 });
    }
    warn(slug, `table converted to a ${out.length}-item list`);
    return out;
  }

  // --------------------------------------------------------------- images ---
  function imageNode(el, slug) {
    const rawSrc = el.getAttribute("src");
    if (!rawSrc) return null;
    const clean = decode(rawSrc).split("?")[0];
    const path = clean.replace(/^https?:\/\/(www\.)?denvertrial\.com/i, "");
    if (!path.startsWith("/wp-content/")) {
      warn(slug, `image is not on the firm's domain, skipped: ${clean.slice(0, 70)}`);
      return null;
    }
    // Flat filenames, prefixed by the uploads year/month so two "image-1.jpg"
    // from different months cannot collide.
    const parts = path.split("/").filter(Boolean);
    const local = parts.slice(-3).join("-").replace(/[^a-zA-Z0-9._-]/g, "-");
    imagesToCopy.set(local, path);
    const alt = decode(el.getAttribute("alt") || "").trim();
    if (!alt) warn(slug, `image has no alt text: ${local}`);
    return { _type: "image", _key: mkKey("i"), src: `${imageSrcPrefix}${local}`, alt };
  }

  /* Three Google My Maps of crash sites. Dropped at Rhan's direction, with the
   * map id recorded — the map lives in the firm's Google account and outlives the
   * post, so the id is enough to restore it later. */
  function noteDroppedMap(el, slug) {
    const src = decode(el.getAttribute("src") || "");
    const mid = /[?&]mid=([^&"]+)/.exec(src)?.[1];
    warn(slug, `TODO(launch): Google My Map dropped — mid=${mid ?? "unknown"}`);
  }

  /* A block element can carry MEDIA AND TEXT AT ONCE, and the inline walker
   * keeps words while dropping tags — so an <img> sharing a block with a
   * sentence vanishes with no warning unless it is lifted out first.
   *
   * Applies to paragraphs AND headings. The heading case is not hypothetical:
   * `thornton-personal-injury-attorney` has an `<h2><a><img></a></h2>`, where
   * the heading holds no text at all, so BOTH the image and the heading were
   * dropped and the run looked clean. The image audit is what surfaced it. */
  function liftMedia(el, slug, out) {
    for (const media of el.querySelectorAll("img, iframe")) {
      if (inChrome(media)) { media.remove(); continue; }
      if (media.rawTagName.toLowerCase() === "img") {
        const n = imageNode(media, slug);
        if (n) out.push(n);
      } else {
        noteDroppedMap(media, slug);
      }
      media.remove();
    }
  }

  /* --------------------------------------------------------------- walk ---
   * Block-level elements in document order. A `div` is recursed INTO rather than
   * emitted — WordPress wraps real paragraphs in layout divs, so treating one as
   * a block would swallow its children. */
  function walk(node, slug, out) {
    for (const el of node.childNodes) {
      if (el.nodeType === 3) {
        const text = decode(el.rawText).trim();
        if (text) {
          // A bare text node between blocks — rare, but it is real copy.
          const b = block("normal", tidy([{ _type: "span", _key: mkKey("s"), text, marks: [] }]), []);
          if (b) out.push(b);
        }
        continue;
      }
      if (el.nodeType !== 1) continue;
      const tag = el.rawTagName.toLowerCase();
      if (isChrome(el)) continue;

      if (HEADING_STYLE[tag]) {
        // Media first — see liftMedia. An image inside a heading is emitted
        // BEFORE it, which is where it sits on the page.
        liftMedia(el, slug, out);
        const b = textBlock(el, HEADING_STYLE[tag], slug);
        if (b) out.push(b);
      } else if (tag === "h1" || tag === "h5" || tag === "h6") {
        // Not renderable. h1 would duplicate the page title; h5/h6 do not occur.
        warn(slug, `<${tag}> demoted to h4`);
        liftMedia(el, slug, out);
        const b = textBlock(el, "h4", slug);
        if (b) out.push(b);
      } else if (tag === "p") {
        /* Media is lifted out FIRST, then whatever text is left becomes the
           block. An earlier version only handled a <p> that was NOTHING BUT an
           image; that is how the three Google My Maps escaped their flag and ten
           images went missing. */
        liftMedia(el, slug, out);
        const b = textBlock(el, "normal", slug);
        if (b) out.push(b);
      } else if (tag === "ul") {
        out.push(...listBlocks(el, "bullet", slug));
      } else if (tag === "ol") {
        out.push(...listBlocks(el, "number", slug));
      } else if (tag === "blockquote") {
        // A blockquote wraps paragraphs; each becomes its own quote block.
        const inner = [];
        walk(el, slug, inner);
        for (const b of inner)
          out.push(
            b._type === "block"
              ? { ...b, style: "blockquote", listItem: undefined, level: undefined }
              : b
          );
      } else if (tag === "img") {
        const n = imageNode(el, slug);
        if (n) out.push(n);
      } else if (tag === "figure") {
        for (const media of el.querySelectorAll("img, iframe")) {
          if (inChrome(media)) continue;
          if (media.rawTagName.toLowerCase() === "img") {
            const n = imageNode(media, slug);
            if (n) out.push(n);
          } else noteDroppedMap(media, slug);
        }
      } else if (tag === "table") {
        out.push(...tableBlocks(el, slug));
      } else if (tag === "iframe") {
        noteDroppedMap(el, slug);
      } else if (tag === "hr" || tag === "br") {
        // No Portable Text equivalent, and nothing depends on it.
      } else {
        // div, section, article, span-wrapped content: recurse.
        walk(el, slug, out);
      }
    }
  }

  /* THE AUDIT. Every count below is a thing the source had; if the conversion
   * did not account for it, the difference is content that disappeared without
   * anyone being told. Written after an <img> inside a text paragraph did exactly
   * that, ten times, while the run reported one warning and looked clean. */
  function countSourceImages(root) {
    return root.querySelectorAll("img").filter((el) => !inChrome(el)).length;
  }

  /* COUNTED BEFORE THE WALK, NOT AFTER. The walk calls `.remove()` to lift media
   * out of a paragraph, so counting the tree afterwards finds nothing and the
   * audit reports a negative — which is exactly what it did the first time. */
  function audit(imgs, blocks, slug) {
    const emitted = blocks.filter((b) => b._type === "image").length;
    const skipped = warnings.filter((w) => w.startsWith(`${slug}: image is not on`)).length;
    if (imgs !== emitted + skipped) {
      warn(
        slug,
        `AUDIT: ${imgs} images in the source, ${emitted} emitted, ${skipped} skipped — ${imgs - emitted - skipped} unaccounted for`
      );
    }
  }

  function convertBody(htmlString, slug) {
    const root = parse(htmlString, { blockTextElements: { script: false, style: false } });
    const sourceImages = countSourceImages(root);
    const out = [];
    walk(root, slug, out);
    audit(sourceImages, out, slug);
    return out;
  }

  /** Convert an already-parsed element rather than an HTML string. The
   *  practice-area importer needs this for FAQ answers, which arrive as nodes
   *  inside a document it has already parsed. No image audit: the caller owns
   *  the tree and audits it as a whole. */
  function convertElement(el, slug) {
    const out = [];
    walk(el, slug, out);
    return out;
  }

  return {
    convertBody,
    convertElement,
    imagesToCopy,
    warnings,
    warn,
    isChrome,
    inChrome,
    countSourceImages,
    mkKey,
  };
}
