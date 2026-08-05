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
