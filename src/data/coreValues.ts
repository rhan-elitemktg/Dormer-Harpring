// The firm's core values.
//
// SANITY SWAP POINT — mirrors the future `src/sanity/lib/coreValues.ts`. These
// become `coreValue` documents; the band renders on both the homepage and the
// About page, which is why the component sits at src/components/ root.
//
// The comp stores a full SVG string on each record. Here it is an `iconKey`
// resolved by components/icons/ValueIcon.astro — see the note there.

export interface CoreValue {
  _key: string;
  title: string;
  body: string;
  /** Must match an entry in components/icons/ValueIcon.astro. */
  iconKey: string;
}

export interface CoreValuesSection {
  eyebrow: string;
  title: string;
}

export async function getCoreValuesSection(): Promise<CoreValuesSection> {
  return { eyebrow: "What drives us", title: "Our core values" };
}

export async function getCoreValues(): Promise<CoreValue[]> {
  return [
    {
      _key: "commitment",
      title: "Commitment",
      body: "We work hard to get results and stay loyal to our goals.",
      iconKey: "commitment",
    },
    {
      _key: "integrity",
      title: "Integrity",
      body: "We don't need a reason to do the right thing.",
      iconKey: "integrity",
    },
    {
      _key: "compassion",
      title: "Compassion & Kindness",
      body: "We provide client-centered service through compassionate communication.",
      iconKey: "compassion",
    },
    {
      _key: "community",
      title: "Community",
      body: "We strive to be a voice for others, placing purpose above ourselves.",
      iconKey: "community",
    },
    {
      _key: "innovation",
      title: "Innovation",
      body: "We're committed to continuous learning and improvement to serve with excellence.",
      iconKey: "innovation",
    },
    {
      _key: "teamwork",
      title: "Teamwork",
      body: "We support one another and unite around a shared purpose.",
      iconKey: "teamwork",
    },
  ];
}
