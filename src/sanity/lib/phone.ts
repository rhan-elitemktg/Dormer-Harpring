// One phone number, two forms — derived, not stored twice.
//
// WHY THIS EXISTS. The schema briefly carried `phone` AND `phoneE164` as
// separate required fields, with a cross-field validator making sure they
// described the same number. Rhan asked the obvious question: can't code do
// that? It can, and the validator was the tell — a rule whose entire job is to
// stop two fields disagreeing is a rule that would not be needed if there were
// one field. Two numbers in the data layer is two numbers that can ship, which
// is the failure this codebase has already had once.
//
// So the Studio holds ONE number, written the way a visitor reads it, and this
// derives what a tap dials. The same function runs in both places — the
// Studio's validator and the site's getter — so "the Studio will not let you
// save a number the site cannot dial" is true by construction rather than by
// two implementations agreeing.
//
// NO VANITY NUMBERS. "1-800-CALL-SAM" cannot be derived without a keypad
// mapping, and a firm that displays one wants the letters shown and the digits
// dialled — two genuinely different values. This firm has no such number, and
// the right answer if one ever arrives is an OPTIONAL override field that is
// empty by default, not two required fields that must be kept in step. Until
// then this returns null and both callers refuse it, which is the loud failure
// rather than a `tel:` that dials the wrong place.

/** `+` followed by 1–15 digits, first digit non-zero. What `tel:` needs. */
export const E164 = /^\+[1-9]\d{1,14}$/;

/**
 * "(303) 756-3812" → "+13037563812". Null when it cannot be derived.
 *
 * Handles the three shapes a US number is written in and one international
 * escape hatch:
 *
 *   (303) 756-3812     10 digits          → assume +1
 *   1-303-756-3812     11 starting with 1 → already has the country code
 *   +44 20 7946 0958   leading +          → trust it, digits as written
 *
 * Anything else — letters, an extension, too few digits — is null rather than a
 * guess. `check-links.py` fails the build on a `tel:` that is not E.164, and 68
 * imported hrefs were malformed in nine spellings, so guessing here would
 * quietly reintroduce exactly what that check was written to catch.
 */
export function toE164(display: string | null | undefined): string | null {
  if (typeof display !== "string") return null;

  const trimmed = display.trim();
  if (trimmed === "") return null;

  // Letters mean a vanity number, and a vanity number is not derivable.
  if (/[a-z]/i.test(trimmed)) return null;

  const international = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (international) {
    const candidate = `+${digits}`;
    return E164.test(candidate) ? candidate : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * The Studio-side rule. Shares `toE164` with the getter, so the two cannot
 * disagree about what is dialable.
 */
export function validatePhone(value: unknown): true | string {
  if (typeof value !== "string" || value.trim() === "") return "Add a phone number.";
  return (
    toE164(value) !== null ||
    "This cannot be turned into a dialable number. Use a plain US number like " +
      "(303) 756-3812, or a full international one like +44 20 7946 0958. " +
      "Letters (1-800-CALL-SAM) and extensions are not supported."
  );
}
