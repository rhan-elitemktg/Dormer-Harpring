// The blog index's category filter and its "Load more".
//
// WHY THIS IS NOT loadMore.ts. That module hides a list's tail by writing
// `hidden` on each item, and this page needs a category filter that decides
// visibility for the same items. Two scripts writing `hidden` on one element is
// a race with no winner: the filter reveals a card the pager meant to keep
// back, the pager reveals one the filter meant to exclude, and which you get
// depends on click order. So one owner here, and `loadMore.ts` keeps the
// reviews and the case results, which have no filter.
//
// THE FEATURED PANEL IS NOT FILTERED. It stays visible whichever category is
// selected — it is the page's editorial lead rather than a member of the feed,
// and hiding it left the top of the page collapsing and re-expanding on every
// tab press. So a category that matches no card shows the featured post above
// the empty-state line, which is the honest reading: there is a post here, just
// not one in the grid.
//
// Wired by name, like rail.ts and loadMore.ts, so the pieces can sit in
// different sections — and they do, because the tabs, the grid, the empty line
// and the button are in two:
//   <div data-blog-tabs="posts">      <button data-filter="all|<slug>">
//   <ul data-blog-grid="posts" data-initial="6" data-step="6">
//                                     <li data-category="<slug>">
//   <p data-blog-empty="posts" hidden>
//   <button data-blog-more="posts" hidden>
//
// Everything is SERVER-RENDERED. With no JS every post is visible, the button
// never appears, and the tabs do nothing — a whole feed rather than a broken
// one.

function initBlogFeed(grid: HTMLElement) {
  const name = grid.dataset.blogGrid;
  if (!name) return;

  const pick = <T extends HTMLElement>(attr: string) =>
    document.querySelector<T>(`[${attr}="${name}"]`);

  const tabs = pick<HTMLElement>("data-blog-tabs");
  const empty = pick<HTMLElement>("data-blog-empty");
  const more = pick<HTMLButtonElement>("data-blog-more");

  const items = [...grid.children] as HTMLElement[];
  const initial = Number(grid.dataset.initial) || items.length;
  const step = Number(grid.dataset.step) || initial;

  let filter = "all";
  // How many of the CURRENT filter's matches are shown. Reset on every filter
  // change: paging three-deep through "All posts" and then switching category
  // should not carry that depth into a category with four posts in it.
  let shown = initial;

  const matches = (element: HTMLElement) =>
    filter === "all" || element.dataset.category === filter;

  const render = () => {
    const matched = items.filter(matches);

    // THE PAGER GOVERNS EVERY VIEW, filtered or not. It used to reveal a
    // filtered category in full on the assumption that a category held "at most
    // a handful" — true of the twelve placeholder cards, wrong of the imported
    // archive, where Auto Accident alone has 57. The button then stayed on
    // screen with nothing left to reveal. `shown` resets to `initial` on every
    // filter change, so each category starts at six of its own.
    const limit = shown;
    let seen = 0;
    for (const item of items) {
      item.hidden = !matches(item) || seen++ >= limit;
    }

    if (empty) empty.hidden = matched.length > 0;
    if (more) more.hidden = matched.length <= limit;
  };

  // Re-runs the cards' entrance. Restarting a CSS animation means clearing the
  // attribute, forcing a reflow, and setting it again — once for the whole set
  // rather than per card, which is why the read sits between the two loops.
  const animateIn = () => {
    const visible = items.filter((item) => !item.hidden);
    // Cleared across EVERY item, not just the visible ones: a card the new
    // filter hid would otherwise keep the attribute it was given under the old
    // one, and the marker stops meaning "entering right now".
    for (const item of items) item.removeAttribute("data-enter");
    void grid.offsetWidth;
    visible.forEach((item, i) => {
      // Capped: the stagger is a flourish across the first row or two, and an
      // uncapped index would leave the last card of a long feed waiting.
      item.style.setProperty("--enter-i", String(Math.min(i, 8)));
      item.setAttribute("data-enter", "");
    });
  };

  /** Everything a filter change does EXCEPT the entrance — see `select`. */
  const applyFilter = (next: string) => {
    filter = next;
    shown = initial;
    for (const tab of tabs?.querySelectorAll<HTMLButtonElement>("[data-filter]") ?? []) {
      tab.setAttribute("aria-pressed", String(tab.dataset.filter === next));
    }
    render();
  };

  const select = (next: string) => {
    applyFilter(next);
    animateIn();
  };

  tabs?.addEventListener("click", (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-filter]");
    if (tab?.dataset.filter) select(tab.dataset.filter);
  });

  more?.addEventListener("click", () => {
    const before = items.filter((item) => !item.hidden).length;
    shown += step;
    render();

    // Send the caret to the first card that just appeared. Without this, a
    // click that hides the button removes the focused element from the page and
    // focus falls back to <body> — a keyboard user is dumped at the top. Same
    // reasoning, and the same fix, as loadMore.ts.
    const first = items.filter((item) => !item.hidden)[before];
    if (!first) return;
    first.tabIndex = -1;
    first.focus({ preventScroll: true });
  });

  // A blog post's sidebar links its categories here as `/news?category=<slug>`
  // — see `blogFilterUrl` in lib/routePaths.ts. Real links rather than buttons,
  // because they cross a page boundary, so the selection has to survive the
  // navigation.
  //
  // `applyFilter`, NOT `select`: the entrance animation is deliberately not run
  // on load, for the reason PostCard.astro records — the cards' images are
  // still fading in under `.lazy-fade` and two entrances on top of each other
  // read as a glitch. The page should simply arrive filtered.
  //
  // A slug matching no tab is ignored rather than applied, so a stale or
  // hand-edited link lands on the whole feed instead of an empty one.
  const requested = new URLSearchParams(window.location.search).get("category");
  const known = requested
    ? tabs?.querySelector(`[data-filter="${CSS.escape(requested)}"]`)
    : null;

  if (requested && known) {
    applyFilter(requested);
    arriveAt(requested);
  } else {
    render();
  }
}

/**
 * Bring a filtered arrival to the feed.
 *
 * A reader following a category link from a post — or a legacy
 * `/category/<slug>/` URL, which redirects here — lands at the top of the blog
 * index looking at the hero and the featured panel, with the filtered grid
 * below the fold. Nothing on screen shows that a filter was applied, so the
 * page reads as "the category link is broken".
 *
 * SCROLLS TO THE TAB ROW, NOT THE GRID ITSELF. The grid alone would put the
 * tabs off-screen, leaving no way to see which category is active or switch to
 * another without scrolling back. The row sits directly above the grid, so this
 * still lands on the posts — with the control that produced them in view.
 *
 * NOT ON A PLAIN /news/ VISIT: only when a category was actually requested and
 * matched a tab.
 */
function arriveAt(slug: string) {
  const tabs = document.querySelector<HTMLElement>("[data-blog-tabs]");
  const target = tabs?.closest("section") ?? tabs;
  if (!target) return;

  // A back-navigation restores the reader's old position, and scrolling then
  // would yank them away from where they were. Only act on an arrival that is
  // still at the top of the page.
  if (window.scrollY > 8) return;

  // An involuntary animated scroll is a genuine problem for people who get
  // motion sickness from it. They still need to arrive at the feed, so the
  // journey is dropped rather than the destination.
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = still ? "auto" : "smooth";

  // NOT `scrollIntoView`. It scrolls EVERY scrollable ancestor, and the second
  // call below — centring the pressed tab inside the row — would therefore move
  // the document too, computing its target from a position the first
  // animation had not reached yet. Two smooth scrolls racing each other landed
  // the page at its maximum offset, with the tab row sitting at the BOTTOM of
  // the viewport instead of the top.
  //
  // An explicit offset cannot race: it is the section's top in document
  // coordinates, resolved once.
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior });

  // With 23 categories the row scrolls, so the pressed tab is often out of
  // sight — an active tab nobody can see is the same failure this function
  // exists to fix, one axis over. Driving the ROW's own scrollLeft keeps this
  // strictly horizontal; the document cannot move as a side effect.
  const active = tabs?.querySelector<HTMLElement>(`[data-filter="${CSS.escape(slug)}"]`);
  if (active && tabs) {
    const centred = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
    tabs.scrollTo({ left: Math.max(0, centred), behavior });
  }
}

for (const grid of document.querySelectorAll<HTMLElement>("[data-blog-grid]")) {
  initBlogFeed(grid);
}
