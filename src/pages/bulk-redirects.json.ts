// The editor-managed redirects, as Vercel's bulk-redirects file.
//
// WHY A BUILD-GENERATED FILE AND NOT `vercel.json`. Vercel reads `vercel.json`
// BEFORE the build runs, so nothing a build produces can land in it — which is
// why `data/redirects.ts` generates that file in a pre-build step and commits
// it. Bulk redirects are the documented exception: `bulkRedirectsPath` points at
// a file the build writes. That is the only mechanism by which a static site
// can gain a redirect without a developer, and it is why this file exists.
//
// NOT UNDERSCORE-PREFIXED. Astro skips `src/pages/_*`, and the failure is that
// the file silently never builds — no error, no output, redirects that simply
// never fire.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE GUARD IS THE POINT OF THIS FILE.
//
// Vercel evaluates bulk redirects BEFORE the filesystem. A rule whose source is
// a page that still exists does not lose to that page — it BEATS it, and the
// page comes off the site. A live, ranking URL becomes a 301 to somewhere else,
// with a green build and nothing reporting it. The `redirect` schema warns an
// editor at authoring time, but a warning can be published past and a page can
// be created after the rule.
//
// So every rule is checked against `getLivePaths()` HERE, at generation, and a
// colliding one is dropped and logged. This is the check that cannot be
// published past.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIRoute } from "astro";
import { getEditorRedirects } from "../data/seo";
import { getLivePaths } from "../sanity/lib/routes";
import { normalizePath } from "../lib/routePaths";

interface BulkRedirect {
  source: string;
  destination: string;
  statusCode: 301 | 308 | 302 | 307;
  preserveQueryParams: boolean;
}

/**
 * Both slash forms of a path.
 *
 * BULK REDIRECTS MATCH THE PATH EXACTLY, and they are processed BEFORE the
 * `trailingSlash` normalization that would otherwise make the two equivalent.
 * Legacy WordPress URLs are overwhelmingly trailing-slash, so emitting only the
 * slash-less form misses most of the inbound traffic the rule exists to catch —
 * which looks like the redirect not working at all.
 */
function slashForms(path: string): string[] {
  const bare = path.replace(/\/+$/, "") || "/";
  return bare === "/" ? ["/"] : [bare, `${bare}/`];
}

export const GET: APIRoute = async () => {
  const [rules, livePaths] = await Promise.all([getEditorRedirects(), getLivePaths()]);

  const out: BulkRedirect[] = [];
  const claimed = new Set<string>();
  const dropped: string[] = [];

  for (const rule of rules) {
    const source = (rule.source ?? "").trim();
    const destination = (rule.destination ?? "").trim();
    if (!source || !destination) continue;

    const path = normalizePath(source);

    /* Would take a live page off the site. */
    if (livePaths.has(path)) {
      dropped.push(`${source} → ${destination}  (a page still exists at ${source})`);
      continue;
    }

    /* Points at itself. The schema blocks this, but a rule can be published and
       the destination edited later. An infinite loop is worse than no rule. */
    if (!/^https?:\/\//i.test(destination) && normalizePath(destination) === path) {
      dropped.push(`${source} → ${destination}  (points at itself)`);
      continue;
    }

    /* Two rules for one source. The schema blocks duplicates, so reaching here
       means two rules that differ as text and agree once normalized —
       `/Old-Page` and `/old-page/`. First wins, which matches `source asc`
       ordering and so is at least deterministic. */
    if (claimed.has(path)) {
      dropped.push(`${source} → ${destination}  (another rule already covers this address)`);
      continue;
    }
    claimed.add(path);

    for (const form of slashForms(source)) {
      out.push({
        source: form,
        destination,
        statusCode: rule.permanent === false ? 302 : 301,
        /* A redirect that drops `?utm_source=…` loses the attribution for the
           click that followed it. */
        preserveQueryParams: true,
      });
    }
  }

  /* NEVER SILENTLY. A dropped rule is an editor's work that did not take
     effect, and the build log is the only place anyone would find out. */
  if (dropped.length > 0) {
    console.warn(
      `\n[bulk-redirects] ${dropped.length} redirect(s) SKIPPED — each is in the Studio ` +
        `but will not fire:\n` +
        dropped.map((line) => `  · ${line}`).join("\n") +
        `\n`
    );
  }
  console.log(
    `[bulk-redirects] ${out.length} rule(s) from ${rules.length} redirect document(s)` +
      ` (each emitted in both slash forms).`
  );

  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
