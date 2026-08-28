// The /meet-our-attorneys page's own copy. The roster itself is in `team.ts`.
//
// SANITY: reads the `teamPage` singleton.
import { sanityClient } from "sanity:client";
import { TEAM_PAGE_QUERY } from "../sanity/lib/queries";
import { once, required } from "../sanity/lib/fetch";
import type { PortableTextBlock } from "./portableText";

export interface TeamPage {
  eyebrow: string;
  title: string;
  lede: PortableTextBlock[];
  partners: { eyebrow: string; title: string };
  team: { eyebrow: string; title: string };
}

export async function getTeamPage(): Promise<TeamPage> {
  const copy = await once("teamPage", async () =>
    required(await sanityClient.fetch(TEAM_PAGE_QUERY), "Meet Our Attorneys", "Pages")
  );
  return { ...copy, lede: copy.lede as PortableTextBlock[] };
}
