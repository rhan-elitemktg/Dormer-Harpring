// One <dialog>, one <iframe>, built on the click that asks for it.
//
// WHY NOT WISTIA'S OWN POPOVER, which this replaces. Its runtime read its
// configuration off class names and, on initialising, REPLACED each trigger
// with a clone inside a `div.wistia_click_to_play` of its own. Everything that
// went wrong with videos on this site traces to that one behaviour:
//
//   · it mounted a player per popover during load — 1,010ms of blocking time,
//     10.7s of the homepage's 11.4s of main-thread work, 2,702 injected DOM
//     elements, for players nobody could play until a click;
//   · deferring the load to first hover fixed the cost and made the rewrite
//     VISIBLE instead — a flash as the nodes were replaced, and cards that
//     changed height under the cursor;
//   · and it is why `.faq__video` and `.vcard` carry `display: block`, why the
//     `<li>` on /testimonials is `display: grid`, and why Layout's `.lazy-fade`
//     handler had to delegate from the document with capture.
//
// NOTHING HERE TOUCHES THE TRIGGER. The card keeps its own markup for the life
// of the page, so there is no flash, no reflow, and no compensation to write.
// That is the whole design, and it is the same one the Cogdell Law site uses.
//
// The href stays the fallback: every trigger is a real <a> to Wistia's hosted
// player, so with JS off, or if this module fails, the video is still reachable.
import { videoEmbedUrl } from "../lib/video";

/** Set by `VideoPopover.astro` on its wrapper. Value is the Wistia media id. */
const TRIGGER = "[data-video-lightbox]";

let dialog: HTMLDialogElement | null = null;
let frame: HTMLDivElement | null = null;
let poster: HTMLDivElement | null = null;

/*
 * Built on first open rather than rendered into the page.
 *
 * A page with nineteen popovers needs exactly one dialog, and Astro has no way
 * to render a component once per page — a module-level flag would leak between
 * pages, since the whole build runs in one process. Putting it in `Layout`
 * instead would ship it, and this script, to all 330 pages for the 28 that have
 * a video. So the markup is created here and its styles live in `global.css`
 * (a JS-created node cannot carry a scoped `data-astro-cid`).
 */
function ensureDialog(): HTMLDialogElement {
  if (dialog) return dialog;

  // Built through a local const so the handlers below close over a non-null
  // element: `dialog` is module-scoped and reassignable, so TypeScript widens
  // it back to `HTMLDialogElement | null` inside every callback.
  const el = document.createElement("dialog");
  el.className = "vlb";
  el.setAttribute("aria-label", "Video player");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "vlb__close";
  close.setAttribute("aria-label", "Close video");
  // Inline SVG rather than an icon component, for the same reason the dialog is
  // built here: this markup has no Astro template to live in.
  close.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
    'stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M18 6 6 18M6 6l12 12" /></svg>';

  const box = document.createElement("div");
  box.className = "vlb__frame";

  /*
   * The poster is its own layer, and it is INSET BY A PIXEL. See `.vlb__poster`
   * in global.css: the frame's rounded `overflow: hidden` antialiases the
   * iframe's edge against whatever is painted behind it, so a light poster
   * bled a one-pixel halo all the way round the player. Insetting it leaves
   * that outermost pixel as the frame's own dark surface, which is what the
   * triggers with no poster were already doing invisibly.
   *
   * A separate element rather than a background on the frame because the
   * iframe is added and removed around it — `replaceChildren` on the frame
   * would take the poster with it.
   */
  poster = document.createElement("div");
  poster.className = "vlb__poster";

  box.append(poster);
  el.append(close, box);
  document.body.appendChild(el);

  close.addEventListener("click", () => el.close());
  // A click that lands on the dialog itself is the backdrop — the frame and the
  // button are children, so they never match.
  el.addEventListener("click", (event) => {
    if (event.target === el) el.close();
  });
  // Covers Escape as well as the button. The iframe is removed rather than the
  // frame emptied — the poster layer is a permanent child and must survive.
  el.addEventListener("close", () => {
    box.querySelector("iframe")?.remove();
    if (poster) poster.style.backgroundImage = "";
  });

  dialog = el;
  frame = box;
  return el;
}

function open(id: string, posterUrl: string | null) {
  const el = ensureDialog();
  if (!frame) return;

  // The trigger's own still, painted behind the player so the reader sees the
  // frame they just clicked rather than a flat surface while it boots.
  if (poster) poster.style.backgroundImage = posterUrl ? `url("${posterUrl}")` : "";

  const iframe = document.createElement("iframe");
  iframe.src = videoEmbedUrl({ provider: "wistia", id }, { autoplay: true });
  iframe.allow = "autoplay; fullscreen";
  iframe.allowFullscreen = true;
  iframe.title = "Video player";
  // Appended, not replacing: the poster layer sits behind it and stays.
  frame.querySelector("iframe")?.remove();
  frame.append(iframe);

  el.showModal();
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const trigger = target.closest<HTMLElement>(TRIGGER);
  const id = trigger?.dataset.videoLightbox;
  if (!trigger || !id) return;

  // Let a modified click do what the reader asked — open the hosted player in a
  // new tab. The href is real, so this costs nothing to honour.
  const mouse = event as MouseEvent;
  if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button > 0) return;

  event.preventDefault();
  // Read the poster off the image the caller already rendered, rather than
  // threading a prop through ten components for something the DOM knows.
  const img = trigger.querySelector("img");
  open(id, img?.currentSrc || img?.src || null);
});
