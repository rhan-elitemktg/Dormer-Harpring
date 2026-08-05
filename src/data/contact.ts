// The consultation band — "Take the first step."
//
// SANITY SWAP POINT. This band appears on 12 of the 14 comps, so the copy is a
// singleton (`contactBand`) rather than page-local content.

export interface ContactBand {
  eyebrow: string;
  title: string;
  /** Ticked list beside the photograph. */
  reassurances: string[];
  callPrompt: string;
  callBadge: string;
  form: {
    title: string;
    lede: string;
    submitLabel: string;
    disclaimer: string;
  };
}

export async function getContactBand(): Promise<ContactBand> {
  return {
    eyebrow: "Free case review",
    title: "Talk to an attorney about your case.",
    reassurances: [
      "Free & completely confidential",
      "No fee unless we win",
      "We come to you — home or hospital",
    ],
    callPrompt: "Prefer to talk now?",
    callBadge: "24/7",
    form: {
      title: "Take the first step.",
      lede: "Tell us what happened. It's free, confidential, and there's no obligation.",
      submitLabel: "Request my free case review",
      disclaimer:
        "By submitting, you agree to be contacted about your case. No fee unless we win.",
    },
  };
}
