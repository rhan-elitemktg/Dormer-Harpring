// Marks the in-page nav link for whichever section the reader has scrolled to.
//
// Wired by attribute, like rail.ts and loadMore.ts:
//   <nav data-section-nav> <a data-section-link href="#results"> … </a> </nav>
// The targets are whatever those hrefs point at, so the nav is the only place
// the section list is written down — nothing here needs to know the page.
//
// PARTICIPATION IS OPT-IN, not every in-page link in the bar. The Car Accidents
// nav also carries a "Speak with a lawyer" button pointing at `#contact`, and
// taking every `a[href^="#"]` would light that button up as a nav item as soon
// as the reader reached the form.
//
// NOT an IntersectionObserver. The obvious version is a thin band under the
// sticky bar and "whichever section intersects it wins", and it has a hole: no
// section intersects the band while the gap between two of them crosses it, so
// the highlight drops out and comes back on every boundary. Reading the tops
// instead answers "which section have I most recently passed", which is the
// question, and it cannot fall through — so this walks five rects on a
// rAF-throttled scroll. Five is not a measurable cost; a flickering highlight
// is a visible one.
//
// `aria-current="location"`, not `"page"`: the reader is somewhere WITHIN this
// page, and `page` is what the header nav uses for the page itself.

function initSectionNav(nav: HTMLElement) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[data-section-link]")];

  const targets = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      return el ? { link, el } : null;
    })
    .filter((entry): entry is { link: HTMLAnchorElement; el: HTMLElement } => entry !== null);

  if (targets.length === 0) return;

  // SORTED BY DOCUMENT ORDER, WHICH IS NOT THE NAV'S ORDER. "Which section have
  // I most recently passed" is `the last one whose top is above the line`, and
  // that only holds if the walk runs down the page. The Car Accidents bar lists
  // "Colorado car accident laws" fourth of five and that section is the FIRST
  // of the five in the document — so scanning in nav order lights it up the
  // moment the reader reaches any later section.
  targets.sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );

  let current: HTMLAnchorElement | null = null;

  const apply = (link: HTMLAnchorElement | null) => {
    if (link === current) return;
    current?.removeAttribute("aria-current");
    link?.setAttribute("aria-current", "location");
    current = link;
  };

  const update = () => {
    // The line sits just under the sticky bar, because that is where the
    // reader's eye is — a section whose heading is still behind the bar has not
    // been reached yet. Measured rather than hardcoded: the bar is 66px today
    // and the number belongs to the stylesheet.
    const line = nav.getBoundingClientRect().height + 8;

    let active: HTMLAnchorElement | null = null;
    for (const { link, el } of targets) {
      if (el.getBoundingClientRect().top <= line) active = link;
    }

    // At the very bottom the last section may be too short to reach the line —
    // a page can run out of scroll before its final heading gets there. Whoever
    // is at the end of the page is looking at the last section.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) active = targets[targets.length - 1].link;

    apply(active);
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  update();
}

for (const nav of document.querySelectorAll<HTMLElement>("[data-section-nav]")) {
  initSectionNav(nav);
}
