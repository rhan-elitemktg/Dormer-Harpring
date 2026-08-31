// Horizontal card rails — testimonials, the homepage attorneys band, and the
// two awards carousels (AwardsBar and the attorney bio's).
//
// Self-executing and imported by any component that renders one. Vite bundles a
// module once no matter how many components import it, so the listeners bind a
// single time; the alternative, one component's inline script quietly driving
// another component's markup, is a coupling nobody would find later.
//
// Wiring is by NAME rather than by DOM proximity:
//   <div data-rail="awards">…</div>
//   <button data-rail-prev="attorneys">
//   <div data-rail-dots="awards"></div>
//   <div data-rail-nav="attorneys">…the two arrows…</div>
// so the controls can live anywhere on the page relative to the rail.
//
// A rail declares whichever control it wants and this drives what it finds —
// the two CARD rails render arrows only, and the two AWARDS carousels dots
// only. Nothing renders both. The dots are built HERE rather than in markup
// because how many there are is a measurement, not a fact about the content:
// it depends on how many badges fit the viewport, which changes with the width.
// See `.rail-dots` in global.css for why the split falls that way.

interface Controls {
  prev: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
}

function initRail(rail: HTMLElement) {
  const name = rail.dataset.rail;
  if (!name) return;

  const { prev, next }: Controls = {
    prev: document.querySelector(`[data-rail-prev="${name}"]`),
    next: document.querySelector(`[data-rail-next="${name}"]`),
  };
  const dots = document.querySelector<HTMLElement>(`[data-rail-dots="${name}"]`);

  // Optional, and opt-in: the wrapper around the arrows, hidden outright on a
  // rail whose content fits. Two arrows that can never fire are the same dead
  // control the dots already avoid — but a rail that has always overflowed has
  // no reason to carry the attribute, so nothing here changes for one that
  // does not declare it. See `sync()`.
  const nav = document.querySelector<HTMLElement>(`[data-rail-nav="${name}"]`);
  if (!prev && !next && !dots) return;

  const track = rail.firstElementChild;

  // How many cards one press moves. Defaults to 1 — the card rails advance a
  // card at a time. A rail whose snap points sit on every Nth card (the awards
  // carousel pages two badges at a time) sets `data-rail-step="2"`, so the
  // arrow lands exactly on a snap point instead of halfway between two.
  const cards = Number(rail.dataset.railStep) || 1;

  // Measured, not hardcoded: the card width changes at the mobile breakpoint,
  // and a fixed step would scroll to the wrong place there.
  const step = () => {
    const card = track?.firstElementChild as HTMLElement | null;
    if (!card || !track) return rail.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return (card.offsetWidth + gap) * cards;
  };

  // One dot per viewport-width page. Deliberately NOT one per card: on the
  // awards rails a page is two badges, and a dot per badge would claim there
  // are six positions when a swipe only ever lands on three.
  const pageCount = () =>
    rail.clientWidth > 0 ? Math.ceil(rail.scrollWidth / rail.clientWidth) : 0;

  // Rebuilt only when the count actually changes — this runs on every scroll
  // event, and replacing the buttons under the user's finger would drop the
  // press. Zero pages (a rail measured while hidden) leaves the last set alone.
  const buildDots = (pages: number) => {
    if (!dots || pages < 1 || dots.childElementCount === pages) return;
    dots.replaceChildren(
      ...Array.from({ length: pages }, (_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "rail-dots__dot";
        dot.setAttribute("aria-label", `Go to slide ${i + 1} of ${pages}`);
        dot.addEventListener("click", () =>
          rail.scrollTo({ left: i * rail.clientWidth, behavior: "smooth" })
        );
        return dot;
      })
    );
  };

  // Disable an arrow once the rail can go no further, so the control reflects
  // what it will actually do. 1px of slack absorbs sub-pixel scroll positions.
  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    if (prev) prev.disabled = rail.scrollLeft <= 1;
    // A rail whose content fits needs no controls at all.
    if (next) next.disabled = max <= 1 || rail.scrollLeft >= max - 1;

    // …and where the markup gives them a wrapper, it goes rather than sitting
    // there greyed out. Measured every sync, not decided once: whether the
    // content fits is a function of the viewport, so a rail can cross this line
    // on resize in either direction.
    if (nav) nav.hidden = max <= 1;

    if (!dots) return;
    const pages = pageCount();
    buildDots(pages);
    // A single page is not a carousel — hide the control rather than show one
    // lone dot that does nothing.
    dots.hidden = pages < 2;
    const active = Math.round(rail.scrollLeft / rail.clientWidth);
    for (const [i, dot] of [...dots.children].entries()) {
      // Presence, not "false": aria-current="false" still reads as a current
      // item to some screen readers.
      if (i === active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    }
  };

  /*
   * ONE SYNC PER FRAME, however many things ask for one.
   *
   * `sync()` reads `scrollWidth`/`clientWidth`/`scrollLeft` and then WRITES —
   * `disabled`, `hidden`, the dots — so each call is a forced reflow. It is
   * asked for on scroll, on resize, from the ResizeObserver, and once per image
   * below; on the homepage that is four rails' worth of images all landing
   * around the same moment, and Lighthouse attributed the page's largest
   * remaining forced-reflow block to this file.
   *
   * Coalescing changes nothing about the RESULT — the last call in a frame wins
   * either way — only how many times the browser is made to lay out to get
   * there. The initial call below stays synchronous, so the arrows are correct
   * on the first paint rather than a frame later.
   */
  let frame = 0;
  const scheduleSync = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      sync();
    });
  };

  prev?.addEventListener("click", () => rail.scrollBy({ left: -step() }));
  next?.addEventListener("click", () => rail.scrollBy({ left: step() }));
  rail.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync, { passive: true });

  // Re-sync when the track's own box changes, not just the window's.
  //
  // Load order is the reason: on a rail whose slides are sized in percentages
  // and whose height comes from lazy images, the items are laid out at zero
  // height before those images arrive, and a zero-height row contributes no
  // scrollable overflow — so at the moment this module first runs, scrollWidth
  // equals clientWidth and `next` disables itself. Neither `scroll` nor
  // `resize` fires when the images finally land, so without this the arrow
  // would stay dead on a rail that can perfectly well scroll.
  if (track && "ResizeObserver" in window) {
    new ResizeObserver(scheduleSync).observe(track);
  }

  // …and once more per image, because the observer above is not enough on its
  // own. The awards carousels size their slides with `flex: 0 0 50%` and cap
  // the badges with `max-height`, so once the slots are laid out the track's
  // box does NOT change when the artwork lands — the ResizeObserver never
  // fires, and whatever `scrollWidth` said before the images decoded is what
  // sticks. Measured: without this the dots came back as one page, hiding
  // themselves, on a rail that pages into three.
  for (const img of rail.querySelectorAll("img")) {
    if (!img.complete) img.addEventListener("load", scheduleSync, { once: true });
  }
  // The backstop for anything the two above miss — fonts, a late stylesheet.
  window.addEventListener("load", scheduleSync, { once: true });

  sync();
}

for (const rail of document.querySelectorAll<HTMLElement>("[data-rail]")) {
  initRail(rail);
}
