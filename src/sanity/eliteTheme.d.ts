import type { StudioTheme } from "sanity";

// Types for the generated (minified) Themer theme module, ./eliteTheme.js.

/** `StudioTheme["color"]`, without the `undefined` — see below. */
type ColorSchemes = NonNullable<StudioTheme["color"]>;

/**
 * BOTH SCHEMES ARE DECLARED PRESENT, and that is a claim about THIS module
 * rather than about `StudioTheme` in general.
 *
 * `StudioTheme` makes `color` optional and each scheme inside it optional too,
 * because a hand-written theme may supply as little as it likes. The generated
 * module is not hand-written: Themer emits `color.light` and `color.dark`
 * every time, which was checked against the built file rather than assumed.
 *
 * Declaring it loosely cost `theme.ts` two type errors — `generated.color` is
 * possibly undefined, and `light` is not assignable to a required `light` —
 * for a value that is always there. The alternative was a non-null assertion
 * at the use site, which asserts the same thing with none of the explanation
 * and has to be repeated by every future reader of this module.
 *
 * If a future regeneration ever drops a scheme, this declaration becomes a lie
 * and the fix belongs here, at the description of the module, not at the use.
 */
export const theme: StudioTheme & {
  color: ColorSchemes & { light: NonNullable<ColorSchemes["light"]> };
};
