// The /attorneys page's own copy. The roster itself is in `team.ts`.
//
// SANITY SWAP POINT — a `teamPage` singleton.
import { pt, type PortableTextBlock } from "./portableText";

export interface TeamPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  partners: { eyebrow: string; title: string };
  team: { eyebrow: string; title: string };
}

export async function getTeamPage(): Promise<TeamPage> {
  return {
    eyebrow: "Meet our attorneys",
    title: "The people in your corner.",
    lede: pt(
      "A boutique Denver firm on purpose. We take fewer cases so a named partner " +
        "can handle yours personally — the same lawyer, start to finish."
    ),
    partners: {
      eyebrow: "Founding partners",
      title: "The lawyers who will try your case.",
    },
    team: {
      eyebrow: "Meet the team",
      title: "Trial lawyers, and the team behind every case.",
    },
  };
}
