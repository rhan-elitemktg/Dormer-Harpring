// Homepage FAQ.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/faqs.ts`. These become
// `faq` documents; 65 of the legacy site's 98 practice-area pages carry their
// own accordion, so this is a collection rather than page-local copy.
//
// The answers stay plain strings rather than Portable Text on purpose: they
// also feed FAQPage structured data, which takes a string, and an answer with
// headings or lists inside it would not be valid there. If they ever need rich
// text, `lib/portableText.ts` gets a toPlainText() for the JSON-LD side.
import type { ImageMetadata } from "astro";
import seanDormer from "../assets/attorneys/attorney-2.jpg";
import { ROUTES } from "../lib/routePaths";

export interface Faq {
  _key: string;
  question: string;
  answer: string;
  /** Runtime of the attorney video that answers it. */
  videoLength: string;
}

export interface FaqSection {
  eyebrow: string;
  title: string;
  lede: string;
  answerCtaLabel: string;
  ask: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    portrait: ImageMetadata;
    portraitAlt: string;
  };
}

export async function getFaqSection(): Promise<FaqSection> {
  return {
    eyebrow: "What you should know",
    title: "Answers, straight from your attorney.",
    lede:
      "The questions we hear most — expand any one to read the answer and watch a " +
      "short video from the attorney who would handle your case.",
    answerCtaLabel: "Speak with a lawyer",
    ask: {
      title: "Have a question you don't see?",
      body: "We're happy to help. Reach out and Sean will point you in the right direction.",
      ctaLabel: "Get in touch",
      ctaHref: ROUTES.contact,
      portrait: seanDormer,
      portraitAlt: "Sean Dormer, Founding Partner",
    },
  };
}

/**
 * The Car Accidents page's accordion.
 *
 * THE SAME TYPE, not a second one. `lawQuestionsData` in that comp is twelve
 * `{q, a}` pairs with a parallel `faqLens` array of reading times beside it —
 * which is this `Faq` shape with the two halves kept apart, and the reason the
 * homepage's is one object per row. So the comp's twelve rows drop straight in,
 * `FaqBand` and `FaqItem` render them unchanged, and `faqSchema` marks them up
 * for free. That answers the question HANDOFF.md left open.
 *
 * A collection rather than page copy for the reason the note at the top of this
 * file gives: 65 of the legacy site's 98 practice-area pages carry their own
 * accordion, so a `faq` document belongs to a practice area, and the next
 * detail page adds a `getXFaqs()` here rather than a field on its own document.
 */
export async function getCarAccidentFaqs(): Promise<Faq[]> {
  return [
    {
      _key: "how-long",
      question: "How long do I have to file?",
      videoLength: "2 min",
      answer:
        "Three years from the date of a motor vehicle crash, two years for most other " +
        "injury claims (C.R.S. 13-80-101). The three-year rule is the exception, not the " +
        "default, and cases involving both a driver and a property owner can carry both " +
        "deadlines at once. If a public entity is involved, the practical deadline is far " +
        "shorter than either.",
    },
    {
      _key: "public-entity",
      question: "What if a bus, RTD vehicle, or city property was involved?",
      videoLength: "90 sec",
      answer:
        "Colorado's Governmental Immunity Act requires written notice to the correct " +
        "public entity within 182 days of the injury (C.R.S. 24-10-109) — RTD, city and " +
        "county vehicles, road defects, school districts, public hospitals. The notice " +
        "must contain specific information and reach a specific office; sending it to the " +
        "wrong department can be treated as never sending it at all.",
    },
    {
      _key: "recorded-statement",
      question: "The adjuster wants a recorded statement.",
      videoLength: "2 min",
      answer:
        "You have no obligation to give one to the other driver's insurer. The call comes " +
        "early on purpose — before a specialist, before imaging, while you are still " +
        "saying you feel okay. Those words get quoted back months later when the symptoms " +
        "turn out to be permanent. Your own insurer is different: the policy usually " +
        "requires cooperation, but that conversation should still happen with a lawyer on " +
        "the line.",
    },
    {
      _key: "uninsured",
      question: "What if the other driver was uninsured or underinsured?",
      videoLength: "2 min",
      answer:
        "Your own policy is what pays. That is what uninsured and underinsured motorist " +
        "coverage is for. Making the claim turns your insurer into the opposing party — " +
        "same adjusters, same tactics, now pointed at you. Stacking and set-off rules " +
        "determine how much coverage is actually available, and insurers rarely volunteer " +
        "that answer.",
    },
    {
      _key: "low-limits",
      question: "What if the other driver's policy limits are too low?",
      videoLength: "90 sec",
      answer:
        "Then we look for coverage elsewhere. Colorado's minimum liability limits are low " +
        "enough that a serious injury can exhaust them in the first month of treatment. " +
        "When that happens the search moves to other sources: your own underinsured " +
        "coverage, other policies in the household, an employer's policy if the driver was " +
        "working, or a third party who contributed to the crash.",
    },
    {
      _key: "own-insurance",
      question: "Do I have to use my own insurance?",
      videoLength: "2 min",
      answer:
        "Often yes, and using it is not an admission of anything. MedPay, uninsured " +
        "motorist, and collision coverage exist precisely for this, and using them does " +
        "not waive your claim against the at-fault driver. Premium consequences after a " +
        "not-at-fault crash are narrower than most people assume.",
    },
    {
      _key: "order",
      question: "In what order should the policies pay?",
      videoLength: "2 min",
      answer:
        "MedPay pays first and fastest, health insurance covers what MedPay does not, and " +
        "underinsured motorist coverage comes into play only after the at-fault driver's " +
        "limits are exhausted. Getting that sequence wrong creates reimbursement claims " +
        "that come out of your recovery later, which is why it is worth sorting in the " +
        "first week.",
    },
    {
      _key: "passenger",
      question: "What if I was a passenger?",
      videoLength: "90 sec",
      answer:
        "Passengers are almost never at fault, which usually makes liability " +
        "straightforward and coverage the harder question. There may be claims against " +
        "more than one driver, and a passenger can often reach coverage on the vehicle " +
        "they were riding in as well as the other driver's policy. Being related to or " +
        "friends with the driver does not prevent a claim — it is the insurer that pays, " +
        "not the person.",
    },
    {
      _key: "working",
      question: "What if the crash happened while I was working?",
      videoLength: "2 min",
      answer:
        "You likely have two claims, not one. Workers' compensation covers medical " +
        "treatment and part of your lost wages regardless of fault, and it starts " +
        "immediately — but it pays nothing for pain, suffering, or impairment. The claim " +
        "against the at-fault driver covers those. Report the crash to your employer " +
        "promptly; late reporting is the most common reason comp benefits get denied.",
    },
    {
      _key: "rental",
      question: "What if the crash happened in a rental or borrowed car?",
      videoLength: "90 sec",
      answer:
        "You are generally still covered, often by more than one policy. In Colorado " +
        "coverage tends to follow the vehicle first and the driver second, so the owner's " +
        "policy, your own policy, the rental company's coverage, and a credit card benefit " +
        "can all be in play. Which one pays what is worth untangling before you accept " +
        "anyone's first answer.",
    },
    {
      _key: "denied",
      question: "What if the other driver's insurance company denies the claim?",
      videoLength: "2 min",
      answer:
        "A denial is a position, not a verdict. Insurers deny on disputed liability, " +
        "alleged pre-existing conditions, gaps in treatment, or simply because nobody " +
        "pushed back. The response is evidence — the scene, the vehicles, the records, the " +
        "witnesses — and, when that is not enough, a lawsuit. Denials are reversed " +
        "regularly once a file stops looking cheap to fight.",
    },
    {
      _key: "commercial",
      question: "What if a commercial or employer vehicle was involved?",
      videoLength: "2 min",
      answer:
        "Then there are likely two tracks running at once: a workers' compensation claim " +
        "and a separate claim against the at-fault driver, and they interact — the comp " +
        "carrier will assert a lien on the injury recovery. If a commercial vehicle or " +
        "employer is involved on the other side, there may be additional coverage and " +
        "additional defendants.",
    },
  ];
}

/**
 * The band's own copy on the Car Accidents page. Different eyebrow, heading and
 * lede from the homepage's — the accordion sits after ten sections that have
 * already answered the big questions, and its heading says so ("OTHER questions
 * people ask us").
 *
 * The ask card is the homepage's word for word, so it reads from
 * `getFaqSection()` rather than being retyped. Only `ctaHref` differs: this
 * page carries its own contact section, so the button scrolls rather than
 * navigating away mid-page.
 */
export async function getCarAccidentFaqSection(anchor: string): Promise<FaqSection> {
  const home = await getFaqSection();
  return {
    ...home,
    eyebrow: "What you should know",
    title: "Other questions people ask us",
    lede:
      "Nothing here is urgent. Open only the ones you're wondering about — each one has " +
      "a short video from the attorney who would handle your case.",
    ask: { ...home.ask, ctaHref: anchor },
  };
}

export async function getHomeFaqs(): Promise<Faq[]> {
  return [
    {
      _key: "how-help",
      question: "How can a personal injury lawyer help me?",
      videoLength: "2 min",
      answer:
        "We take the entire fight off your plate — dealing with the insurer, gathering " +
        "evidence, valuing your claim, and negotiating (or trying) for its full worth. " +
        "Represented clients consistently recover more, even after fees, because " +
        "insurers know an unrepresented person rarely knows what a claim is truly worth.",
    },
    {
      _key: "what-recover",
      question: "What can I recover?",
      videoLength: "2 min",
      answer:
        "Colorado law lets you recover economic damages — medical bills, future care, " +
        "lost wages, and lost earning capacity — along with non-economic damages for " +
        "pain, suffering, and loss of enjoyment of life. Where conduct is especially " +
        "egregious, punitive damages may also apply. We document every category so " +
        "nothing is left on the table.",
    },
    {
      _key: "process",
      question: "What is the process?",
      videoLength: "3 min",
      answer:
        "It begins with a free consultation, then investigation and medical treatment, " +
        "a demand to the insurer, negotiation, and — if they will not pay fairly — " +
        "filing suit and preparing for trial. Most cases resolve before a courtroom, " +
        "but we build every one as if it is going to a jury.",
    },
    {
      _key: "court",
      question: "Do I have to go to court?",
      videoLength: "2 min",
      answer:
        "Usually not. The large majority of injury cases settle out of court. But our " +
        "willingness to try a case is exactly what pushes insurers to offer full " +
        "value — and if a fair settlement never comes, we are ready to take it to a jury.",
    },
    {
      _key: "cost",
      question: "What does it cost?",
      videoLength: "1 min",
      answer:
        "Nothing upfront. We work on contingency, meaning our fee is a percentage of " +
        "what we recover — and if we do not win, you owe no attorney's fee. We also " +
        "front the case costs, so you are never out of pocket while your case is pending.",
    },
    {
      _key: "how-long",
      question: "How long will my case take?",
      videoLength: "2 min",
      answer:
        "It depends on the severity of your injuries and whether the insurer negotiates " +
        "in good faith. Simpler claims can resolve in months; serious-injury or disputed " +
        "cases may take a year or more. We never rush a settlement before you have " +
        "reached maximum medical improvement — that is when your claim's true value is clear.",
    },
    {
      _key: "worth-pursuing",
      question: "Is my case worth pursuing?",
      videoLength: "1 min",
      answer:
        "If someone else's negligence caused you real harm, it is worth a conversation. " +
        "A free consultation tells you honestly whether you have a claim, what it may be " +
        "worth, and whether pursuing it makes sense — with no pressure either way.",
    },
    {
      _key: "insurer-called",
      question: "The insurer already called me — what now?",
      videoLength: "2 min",
      answer:
        "Do not give a recorded statement or accept a quick offer. Early calls are " +
        "designed to lock you into a low number before you know the extent of your " +
        "injuries. Let us take over the conversation — from here, you never have to " +
        "talk to the adjuster again.",
    },
  ];
}
