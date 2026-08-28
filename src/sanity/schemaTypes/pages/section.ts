/**
 * THE ACCORDION. One object per band, collapsed until an editor opens it.
 *
 * Every page document with more than one section spreads this onto each of its
 * section objects, so a form opens as a list of band NAMES rather than a scroll
 * of every field on the page. It is one constant rather than the option object
 * written out fifteen times for the obvious reason: whether these default to
 * open or closed is one decision, and it should be changeable in one place.
 *
 * SPREAD IT, DO NOT ASSIGN IT — a section that also wants `columns` writes
 * `options: { ...SECTION, columns: 2 }`. Assigning drops the other option
 * silently, which the Studio reports by simply drawing the field differently.
 *
 * NOT ON EVERY PAGE. `resultsPage` is four fields drawing ONE band, and the two
 * templates are label sets that no band owns — an accordion holding a
 * document's only section is a click that buys nothing. Those three stay flat,
 * which is also why Phase 4 gave them no field groups.
 *
 * THIS REPLACED TABS ON TWO PAGES. Practice Areas and Car Accidents had Sanity
 * field `groups` from Phase 4; `/studio-polish` records the call, from the
 * first build, that tabs on top of accordions make an editor tab AND expand.
 * One idiom, everywhere.
 */
export const SECTION = { collapsible: true, collapsed: true } as const;
