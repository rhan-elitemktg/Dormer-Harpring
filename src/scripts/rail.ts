// Horizontal card rails — the testimonials rail and the attorneys rail.
//
// Self-executing and imported by any component that renders one. Vite bundles a
// module once no matter how many components import it, so the listeners bind a
// single time; the alternative, one component's inline script quietly driving
// another component's markup, is a coupling nobody would find later.
//
// Wiring is by NAME rather than by DOM proximity:
//   <div data-rail="attorneys">…</div>
//   <button data-rail-prev="attorneys">
// so the controls can live anywhere on the page relative to the rail.

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
  if (!prev && !next) return;

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

  // Disable an arrow once the rail can go no further, so the control reflects
  // what it will actually do. 1px of slack absorbs sub-pixel scroll positions.
  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    if (prev) prev.disabled = rail.scrollLeft <= 1;
    // A rail whose content fits needs no controls at all.
    if (next) next.disabled = max <= 1 || rail.scrollLeft >= max - 1;
  };

  prev?.addEventListener("click", () => rail.scrollBy({ left: -step() }));
  next?.addEventListener("click", () => rail.scrollBy({ left: step() }));
  rail.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });

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
    new ResizeObserver(sync).observe(track);
  }

  sync();
}

for (const rail of document.querySelectorAll<HTMLElement>("[data-rail]")) {
  initRail(rail);
}
