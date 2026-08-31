// Wistia loads on INTENT, not on page load.
//
// WHY THIS EXISTS. `VideoPopover.astro` used to emit Wistia's config classes
// and a `<script async>` pair per embed, so the runtime mounted one player per
// popover during the load window — 19 on the homepage, 20 on Car Accidents.
// Measured against the built output on a production-shaped host: that cost
// 1,010ms of Total Blocking Time, 10.7s of the page's 11.4s of main-thread
// work, and 2,702 injected DOM elements, all before anyone clicked anything.
// Mobile Lighthouse went 51 → 95 with it deferred and nothing else changed.
//
// WHAT DID NOT CHANGE, deliberately. Once a host is armed the DOM is exactly
// what it was before: same `.vpop` span, same Wistia classes on it, same
// re-parenting of the caller's `<a>` into `div.wistia_click_to_play`. Every
// workaround that shape forced — `display: block` on `.faq__video` and
// `.vcard`, the `<li>` grid on /testimonials, Layout's delegated `.lazy-fade`
// capture handler — still applies unchanged, because the end state is
// unchanged. Only the MOMENT moved.
//
// PER HOST, NOT PER PAGE. Arming is scoped to the one popover the reader
// approached, so hovering a single FAQ video mounts one player rather than
// nineteen. E-v1.js discovers embeds by POLLING, so a `.wistia_embed` that
// gains its classes after the runtime has loaded is still picked up — that
// polling is what makes lazy arming work at all.
//
// DRIVING IT FROM `Wistia.api(id).popover.show()` STILL DOES NOT WORK and this
// does not attempt it. See `VideoPopover.astro`'s header: that path needs an
// embed initialised WITH popover options and IN LAYOUT, which is exactly what
// the class-based contract gives us and an API call does not.
import { WISTIA_RUNTIME, wistiaMediaScript, wistiaPopoverClass } from "../lib/video";

const HOST_SELECTOR = "[data-wistia-popover]";

/** Hosts already given their Wistia classes. */
const armed = new WeakSet<Element>();
/** Media ids whose per-media config has been requested. */
const fetched = new Set<string>();
let runtimeRequested = false;

/**
 * A click that landed before the runtime was ready, and the deadline after
 * which we stop waiting and just follow the link.
 *
 * IT HOLDS THE HOST AND THE href, NEVER THE ANCHOR, and that is load-bearing.
 * WISTIA REPLACES THE TRIGGER WITH A CLONE — measured, not assumed: after
 * takeover the original <a> is no longer in the document
 * (`document.contains(a) === false`) and `host.querySelector("a")` is a
 * different node. A held anchor reference is therefore detached the moment the
 * runtime arrives, `closest()` on it returns null, and anything waiting on it
 * waits forever. The `.vpop` host is ours and survives, so the anchor is
 * re-queried from it at replay time and the href is kept as a string.
 *
 * This is the same hazard, at its root, that made Layout's `.lazy-fade`
 * handler delegate from the document with capture.
 *
 * A popover that never opens and never navigates is the invisible failure this
 * codebase argues against everywhere else, so there is always an exit.
 */
let pending: { host: Element; href: string; timer: number } | null = null;
const READY_TIMEOUT_MS = 6000;

function injectScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Wistia signals it has taken a host over by re-parenting into this div. */
function isLive(host: Element): boolean {
  return host.querySelector(".wistia_click_to_play") !== null;
}

function arm(host: Element) {
  if (armed.has(host)) return;
  const id = host.getAttribute("data-wistia-popover");
  if (!id) return;
  armed.add(host);

  // The class string is Wistia's own configuration contract and stays in
  // lib/video.ts with every other Wistia URL and token.
  host.classList.add(...wistiaPopoverClass(id).split(" ").filter(Boolean));

  if (!fetched.has(id)) {
    fetched.add(id);
    injectScript(wistiaMediaScript(id));
  }
  if (!runtimeRequested) {
    runtimeRequested = true;
    injectScript(WISTIA_RUNTIME);
  }
}

function hostFrom(target: EventTarget | null): Element | null {
  return target instanceof Element ? target.closest(HOST_SELECTOR) : null;
}

/* Intent, in the order a reader produces it. `pointerover` rather than
   `pointerenter` because only the former bubbles to the document; `focusin`
   covers the keyboard; `touchstart` fires before `click` on touch, which buys
   the download a head start it would otherwise not get. All passive — none of
   them cancels anything. */
for (const type of ["pointerover", "focusin", "touchstart"] as const) {
  document.addEventListener(
    type,
    (event) => {
      const host = hostFrom(event.target);
      if (host) arm(host);
    },
    { passive: true }
  );
}

/*
 * A click that arrives before Wistia is bound.
 *
 * The old markup had this same window — the scripts were `async`, so a click
 * during load followed the href to Wistia's hosted player instead of opening
 * the lightbox. Deferring the load widens that window, so it is closed here
 * rather than left wider than we found it: hold the click, arm, and replay it
 * once the runtime has taken the host over.
 *
 * CAPTURE, so this runs before Wistia's own handler on the inner div. Once
 * `isLive()` is true the popover is Wistia's and we do not touch the event —
 * which is also what stops the replayed click from re-entering this handler.
 */
document.addEventListener(
  "click",
  (event) => {
    const host = hostFrom(event.target);
    if (!host || isLive(host)) return;

    const trigger =
      event.target instanceof Element ? event.target.closest("a") : null;
    if (!trigger) return;

    event.preventDefault();
    arm(host);

    if (pending) window.clearTimeout(pending.timer);
    pending = {
      host,
      href: trigger.href,
      timer: window.setTimeout(() => {
        // The runtime never arrived — a blocked CDN, an offline reader. Follow
        // the link, which is the same fallback a no-JS visitor already gets.
        const stranded = pending?.href;
        pending = null;
        if (stranded) window.location.href = stranded;
      }, READY_TIMEOUT_MS),
    };
  },
  true
);

/*
 * Replay a held click the moment Wistia takes its host over.
 *
 * A MutationObserver rather than a poll: the takeover is a childList change, so
 * there is an exact signal to wait for and no interval left running on a page
 * whose videos nobody touched.
 *
 * The anchor is re-queried from the host rather than remembered — see the note
 * on `pending`. Clicking Wistia's clone is what opens the lightbox; verified
 * against the live runtime, where a synthetic click and a trusted one both put
 * `wistia_popover_mode` on <body>, so nothing here depends on `isTrusted`.
 */
const observer = new MutationObserver(() => {
  if (!pending || !isLive(pending.host)) return;

  const { host, timer } = pending;
  window.clearTimeout(timer);
  pending = null;

  const trigger = host.querySelector("a");
  if (trigger) trigger.click();
});

observer.observe(document.body, { childList: true, subtree: true });
