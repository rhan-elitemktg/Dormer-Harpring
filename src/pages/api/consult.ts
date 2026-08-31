/**
 * The one form endpoint. Both `ContactForm` and `CoCounselForm` post here.
 *
 * ONE ENDPOINT, NOT TWO. A hidden `kind` field tells a consultation request
 * from a co-counsel referral, so the HANDLER branches rather than the
 * infrastructure doubling. The two payloads genuinely differ — see SHAPES
 * below — and they are validated separately, but they share the transport, the
 * spam trap, the redirect contract and the error page.
 *
 * THE SITE IS STILL STATIC. `prerender = false` opts this ONE route out; the
 * other 328 pages are built exactly as they were. See the comment on
 * `adapter:` in astro.config.mjs.
 *
 * WHY A REDIRECT AND NOT JSON. These are plain HTML forms with no client-side
 * JavaScript — deliberately, because a person who has just been in a crash may
 * be on a bad connection or an old phone, and a form that needs JS to submit is
 * a form that silently fails for them. So the browser navigates, and the
 * response is a 303 to /thank-you/ on success. That also makes the back button
 * behave: 303 turns the POST into a GET, so returning to the thank-you page
 * never re-submits.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: it does not render the comps' fake
 * success panel. The comps call preventDefault() and flip a flag, telling every
 * visitor their case was received while discarding it. See ContactForm.astro.
 *
 * TESTING THIS WITH curl NEEDS AN `Origin` HEADER, AND THE FAILURE LOOKS LIKE A
 * BUG IN THIS FILE. Astro's `security.checkOrigin` defaults to ON and rejects
 * any POST whose Origin does not match the site, BEFORE this module is reached
 * — so a plain `curl -X POST` gets `403 Cross-site POST form submissions are
 * forbidden` and none of the code below runs. That is the protection working:
 * browsers always send Origin on a form submission, so real traffic is
 * unaffected, and it is free CSRF cover this endpoint would otherwise have to
 * implement. Add `-H "Origin: http://localhost:4321"` to test it.
 */
import type { APIRoute } from "astro";
import { ROUTES } from "../../lib/routePaths";

export const prerender = false;

/* -------------------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------------- */

/**
 * Resend, provisioned through the Vercel Marketplace
 * (`vercel integration add resend/resend-email`), which sets this variable on
 * the project itself. It is read at REQUEST time rather than module scope so a
 * missing key is a 500 on one submission with a named cause, not a build that
 * dies for every page.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Where each kind goes. Two variables because the payloads want different
 * readers — a consultation is intake and wants whoever triages new matters; a
 * co-counsel referral is a business conversation between firms. `CONSULT_TO`
 * is the fallback for both, so the site works with one address configured.
 *
 * TODO(launch): the firm has to name these. They are environment variables
 * rather than content precisely so that naming them is not a deploy.
 */
function inboxFor(kind: Kind): string | undefined {
  const fallback = process.env.CONSULT_TO_EMAIL;
  if (kind === "co-counsel") return process.env.COCOUNSEL_TO_EMAIL ?? fallback;
  return fallback;
}

/**
 * The From address. Must be on a domain verified in Resend or the send is
 * rejected — which is why it is configuration and not a literal.
 *
 * TODO(launch): verify dormerharpring.com in Resend and set this.
 */
const fromAddress = () => process.env.CONSULT_FROM_EMAIL;

/* -------------------------------------------------------------------------
 * Shapes
 * ---------------------------------------------------------------------- */

type Kind = "consultation" | "co-counsel";

/**
 * Every field each form posts, and which of them the browser marks `required`.
 *
 * THE HONEYPOT NAME DIFFERS BETWEEN THE TWO FORMS — `company` on the
 * consultation form, `website` on the co-counsel one. Checking only one of them
 * would accept every bot on the other, and nothing in the markup makes the
 * mismatch visible. Both are checked, for both kinds: a real submission fills
 * neither, so there is no reason to be precise about which one belongs to whom.
 */
const HONEYPOTS = ["company", "website"] as const;

/** Server-side mirror of each form's `required` attributes. */
const REQUIRED: Record<Kind, readonly string[]> = {
  consultation: ["name", "phone", "email"],
  "co-counsel": [
    "first",
    "last",
    "email",
    "phone",
    "firm",
    "area",
    "value",
    "summary",
    "why",
  ],
};

/** Everything each kind is allowed to send, in the order it reads best. */
const FIELDS: Record<Kind, readonly string[]> = {
  consultation: ["name", "phone", "email", "message"],
  "co-counsel": REQUIRED["co-counsel"],
};

/**
 * THE CLIENT CONSTRAINTS ARE A CONVENIENCE, NOT A GUARANTEE — any client can
 * post straight past `pattern` and `required`, and ContactForm.astro's own
 * comment says the endpoint must re-validate. These are the same two rules the
 * markup applies, restated where they are actually enforceable.
 *
 * The phone pattern is the form's exact shape, which the input mask types for
 * you. A bare digit string is NOT accepted, on purpose: the mask means a real
 * visitor cannot produce one, so an unformatted number is a signal, not a
 * near-miss worth being generous about.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\(\d{3}\) \d{3}-\d{4}$/;

/** Caps that match the markup's `maxlength`, plus a ceiling for the free text. */
const MAX_LENGTH: Record<string, number> = {
  name: 80,
  first: 80,
  last: 80,
  email: 254,
  firm: 120,
  area: 80,
  value: 80,
  message: 5000,
  summary: 5000,
  why: 5000,
};

/* -------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */

function isKind(value: unknown): value is Kind {
  return value === "consultation" || value === "co-counsel";
}

/**
 * Read one field as a trimmed string.
 *
 * `FormData.get` returns `File | string | null`, and a `File` here would mean
 * someone hand-built a multipart body with a file under a text field's name.
 * Coercing it would stringify to "[object File]" and store nonsense, so it is
 * read as absent instead.
 */
function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Returns the reasons this submission is invalid; empty means it is fine. */
function validate(kind: Kind, form: FormData): string[] {
  const problems: string[] = [];

  for (const name of REQUIRED[kind]) {
    if (!field(form, name)) problems.push(`${name} is required`);
  }

  const email = field(form, "email");
  if (email && !EMAIL_RE.test(email)) problems.push("email is not an address");

  const phone = field(form, "phone");
  if (phone && !PHONE_RE.test(phone)) problems.push("phone is not (303) 555-0100");

  for (const [name, max] of Object.entries(MAX_LENGTH)) {
    if (field(form, name).length > max) problems.push(`${name} is too long`);
  }

  return problems;
}

/**
 * True when a bot filled a field no human can see.
 *
 * Deliberately indistinguishable from success to the caller — a trapped bot
 * gets the same 303 to /thank-you/ a person gets. Telling it apart is how a
 * spammer learns to leave the field alone.
 */
function trapped(form: FormData): boolean {
  return HONEYPOTS.some((name) => field(form, name) !== "");
}

/* -------------------------------------------------------------------------
 * Delivery
 * ---------------------------------------------------------------------- */

const LABELS: Record<string, string> = {
  name: "Name",
  first: "First name",
  last: "Last name",
  phone: "Phone",
  email: "Email",
  message: "What happened",
  firm: "Firm",
  area: "Practice area",
  value: "Estimated case value",
  summary: "Case summary",
  why: "Why they are referring it",
};

/**
 * The email body, as plain text.
 *
 * PLAIN TEXT ON PURPOSE. This is an internal notification that someone reads
 * and then acts on — usually by replying to the address in it. HTML would add a
 * rendering surface, an escaping obligation and a spam-score risk for no reader
 * benefit. The submitted values are interpolated raw, which is safe precisely
 * because nothing renders them as markup.
 */
function compose(kind: Kind, form: FormData, source: string): string {
  const lines = FIELDS[kind]
    .map((name) => [LABELS[name] ?? name, field(form, name)] as const)
    .filter(([, value]) => value !== "")
    .map(([label, value]) => `${label}: ${value}`);

  return [
    kind === "co-counsel"
      ? "New co-counsel referral from denvertrial.com"
      : "New consultation request from denvertrial.com",
    "",
    ...lines,
    "",
    `Submitted from: ${source || "unknown"}`,
  ].join("\n");
}

/**
 * Hand the message to Resend.
 *
 * ONE FUNCTION, env-driven, so provisioning Resend is configuration rather than
 * a code change. It throws on a non-2xx so the caller can tell a failed send
 * from a successful one — a form that reports success on a dropped message is
 * the exact failure this whole endpoint exists to avoid.
 */
async function send(kind: Kind, form: FormData, source: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = inboxFor(kind);
  const from = fromAddress();

  if (!apiKey || !to || !from) {
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !to && (kind === "co-counsel" ? "COCOUNSEL_TO_EMAIL" : "CONSULT_TO_EMAIL"),
      !from && "CONSULT_FROM_EMAIL",
    ].filter(Boolean);
    throw new Error(
      `Mail is not configured: ${missing.join(", ")} ` +
        `${missing.length === 1 ? "is" : "are"} unset on the deployment.`
    );
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      /* So a reply goes to the person who wrote in rather than to the sending
         domain. The address is validated above, so this cannot carry a header
         injection: EMAIL_RE rejects whitespace, which includes CR and LF. */
      reply_to: field(form, "email"),
      subject:
        kind === "co-counsel"
          ? `Co-counsel referral — ${field(form, "firm") || "unnamed firm"}`
          : `Consultation request — ${field(form, "name") || "no name"}`,
      text: compose(kind, form, source),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend refused the message: ${response.status} ${await response.text()}`
    );
  }
}

/* -------------------------------------------------------------------------
 * The route
 * ---------------------------------------------------------------------- */

/** 303, so the browser follows with a GET and the back button cannot re-post. */
const seeOther = (location: string) =>
  new Response(null, { status: 303, headers: { Location: location } });

/**
 * A failure the visitor has to see.
 *
 * There is no error PAGE yet, so this is a bare 500 with a plain-text body
 * naming the firm's number. It is deliberately blunt rather than pretty:
 * visibly broken beats invisibly broken, which is the same argument that kept
 * the comps' fake success panel out. A designed error state is worth doing, and
 * is a design task rather than a wiring one.
 *
 * TODO(launch): give this a real page, on the light template's shell like the
 * other three utility pages.
 */
function failed(): Response {
  return new Response(
    "We could not send your message.\n\n" +
      "Nothing was lost on your end, but nothing reached us either — please " +
      "call (303) 756-3812 and we will take the details over the phone.\n",
    { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    /* Not a form body at all. Nothing on this site produces that, so it is a
       malformed or hand-made request rather than a visitor. */
    return new Response("Expected a form submission.", { status: 400 });
  }

  const kind = form.get("kind");
  if (!isKind(kind)) {
    return new Response("Unknown form.", { status: 400 });
  }

  /* Where to send them next. Read from the form so the two forms can differ
     later, but validated against ROUTES rather than trusted: an unchecked
     `redirectTo` is an open redirect, and this one is posted by anybody. */
  const requested = field(form, "redirectTo");
  const destination = requested === ROUTES.thankYou ? requested : ROUTES.thankYou;

  /* A trapped bot gets exactly what a person gets, and nothing is sent. */
  if (trapped(form)) return seeOther(destination);

  const problems = validate(kind, form);
  if (problems.length > 0) {
    /* The browser's own validation catches all of these before submit, so
       reaching here means a hand-made post. No designed error state for it. */
    return new Response(`Invalid submission: ${problems.join("; ")}`, {
      status: 400,
    });
  }

  try {
    await send(kind, form, field(form, "source"));
  } catch (error) {
    /* Logged rather than shown: the reason names environment variables and
       Resend's response, neither of which belongs in front of a visitor. */
    console.error("[/api/consult] send failed:", error);
    return failed();
  }

  return seeOther(destination);
};

/**
 * A GET here is someone typing the URL, or a crawler following a stray
 * reference. 405 with an `Allow` header is the honest answer — a redirect to
 * the contact page would be friendlier and would also tell a scanner this path
 * accepts something.
 */
export const GET: APIRoute = () =>
  new Response("This endpoint accepts form submissions only.", {
    status: 405,
    headers: { Allow: "POST" },
  });
