// Verdicts and settlements.
//
// SANITY SWAP POINT — the future `caseResult` collection, and the largest
// content set on the site: 89 records lifted verbatim from the comp.
//
// TODO(sanity): three of these also appear on the homepage in DIFFERENT words.
// The King Soopers slip-and-fall is "Slip and Fall on Melted Snow / Denied /
// $2.1M" here and "Slip & Fall / $250K offered / $2.1M" there. They are the
// same cases and belong in one document each; which wording is right is the
// firm's call, so nothing is reconciled yet.
import type { PortableTextBlock } from "./portableText";
import { sanityClient } from "sanity:client";
import {
  CASE_RESULTS_QUERY,
  RESULTS_PAGE_QUERY,
} from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";

export interface CaseResult {
  _key: string;
  /** The kind of case, e.g. "Rear-End Car Accident". */
  tag: string;
  /**
   * The pill's text. Six values are in use — Trial Win, Settlement, Judgment,
   * Trial Counsel, Co-Counsel, Local Counsel — so this is a string rather than
   * the homepage comp's lone boolean, which could only ever say one of two
   * things.
   */
  badge: string;
  /**
   * Filled pill rather than outlined: won in a courtroom rather than
   * negotiated. Separate from `badge` because the two do not track — a
   * "Trial Counsel" result may be either.
   */
  wonInCourt: boolean;
  /** The insurer's offer before the firm took over. "Denied" and "—" both occur. */
  offered: string;
  /** A figure, or the literal "Confidential". */
  recovered: string;
  story: string;
}

/** Ordered by recovery, largest first. */
export async function getCaseResults(): Promise<CaseResult[]> {
  return once("caseResults:archive", async () =>
    required(await sanityClient.fetch(CASE_RESULTS_QUERY), "Case Results")
  );
}

// ---------------------------------------------------------------------------
// The /results page's own copy.

export interface CaseResultsPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  moreLabel: string;
}

export async function getCaseResultsPage(): Promise<CaseResultsPage> {
  const copy = await once("resultsPage", async () =>
    required(await sanityClient.fetch(RESULTS_PAGE_QUERY), "Results", "Pages")
  );
  return { ...copy, lede: copy.lede as PortableTextBlock[] };
}
