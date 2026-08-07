// Progressive disclosure for long lists — the written reviews and the case
// results.
//
// NOT the blog index, which was expected to land here and did not: its feed
// also has a category filter, and a filter and a pager both writing `hidden` on
// the same cards race with each other. That page owns its visibility in one
// place instead — see scripts/blogFeed.ts, which keeps this module's wiring
// convention and its focus handling.
//
// Everything is SERVER-RENDERED. This hides the tail rather than fetching one,
// so a crawler and a visitor with no JS get the whole list, and the button only
// appears once the script has confirmed there is something behind it.
//
// Wired by name, like rail.ts:
//   <ul data-load-more="results" data-initial="12"> … </ul>
//   <button data-load-more-button="results" hidden>
// so the button can sit anywhere on the page relative to the list.

function initLoadMore(list: HTMLElement) {
  const name = list.dataset.loadMore;
  if (!name) return;

  const button = document.querySelector<HTMLButtonElement>(
    `[data-load-more-button="${name}"]`
  );
  if (!button) return;

  // Direct children, so a card's own markup can never be mistaken for an item.
  const items = [...list.children] as HTMLElement[];
  const initial = Number(list.dataset.initial) || items.length;
  if (items.length <= initial) return;

  for (const item of items.slice(initial)) item.hidden = true;
  button.hidden = false;

  const step = Number(list.dataset.step) || initial;

  button.addEventListener("click", () => {
    const revealed = items.filter((item) => item.hidden).slice(0, step);
    for (const item of revealed) item.hidden = false;
    if (!items.some((item) => item.hidden)) button.hidden = true;

    // Send the caret to the first item that just appeared. Without this, a
    // click that hides the button removes the focused element from the page
    // and focus falls back to <body> — a keyboard user is dumped at the top.
    const first = revealed[0];
    if (!first) return;
    first.tabIndex = -1;
    first.focus({ preventScroll: true });
  });
}

for (const list of document.querySelectorAll<HTMLElement>("[data-load-more]")) {
  initLoadMore(list);
}
