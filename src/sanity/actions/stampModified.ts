// "Last updated" stamps itself, and only when the article actually changed.
//
// WHY THIS EXISTS. `modifiedAt` prints under the title on all 104 practice-area
// pages as "Updated <date>", and on a law firm site that date is a claim about
// how current the legal information is. It was a field somebody had to remember
// to set, which means it was a field that would silently go stale — and a stale
// "Updated" date is worse than none, because it is asserted rather than absent.
//
// WHY NOT `_updatedAt`, WHICH SANITY MAINTAINS FOR FREE. Because it records
// every mutation, including the ones no editor made. Right now the 186 blog
// posts share TWO distinct `_updatedAt` values and the 104 practice areas share
// FOUR — those are the migration batches that imported them. Pointing anything
// at `_updatedAt` today would announce that the whole site changed at four
// instants, and the real WordPress history (162 of 186 posts carry a modified
// date that differs from their publish date) would be thrown away.
//
// So: `modifiedAt` keeps the imported history as its starting point, and from
// here it maintains itself.
//
// WHAT DOES *NOT* TRIGGER IT, which is the reason a Studio action beats a
// server-side Function here: this runs on a human pressing Publish. Migration
// and import scripts write through the API and never go near it, so a future
// bulk edit cannot re-date all 290 documents to the day it ran. That is exactly
// the failure `_updatedAt` already has.
//
// AND WHY THE BODY CHECK. Stamping on every publish would re-date a page for a
// typo in a label or an SEO title — "Updated today" on an article nobody
// revised. The date is meant to say REVIEWED, not TOUCHED, so only a change to
// the fields a reader actually reads counts.
import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { useDocumentOperation } from "sanity";

/**
 * The fields whose contents ARE the article, per type.
 *
 * WRITTEN OUT RATHER THAN INFERRED. "Everything except the metadata" would be
 * the shorter rule and the wrong one: it silently opts new fields in, so adding
 * one innocuous field would start re-dating every page that has it. A list that
 * has to be edited is a list somebody reads.
 *
 * `faqs` counts on a practice area because those questions render on the page
 * as part of the article. `title` and `excerpt` deliberately do NOT count: a
 * sharper headline is not a revision of the legal content beneath it.
 */
const SUBSTANCE: Record<string, readonly string[]> = {
  practiceArea: ["body", "faqs"],
  blogPost: ["body"],
};

/**
 * Deep equality that does not care about key order.
 *
 * `JSON.stringify` alone would compare two identical Portable Text arrays as
 * different the moment a patch round-tripped their keys in another order, which
 * would stamp the date on a publish that changed nothing. Arrays keep their
 * order, because in Portable Text the order IS the content.
 */
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, stable((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

const same = (a: unknown, b: unknown) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

/** True when a field a reader actually reads differs from what is live. */
function substanceChanged(props: DocumentActionProps): boolean {
  const fields = SUBSTANCE[props.type];
  if (!fields) return false;

  const draft = props.draft as Record<string, unknown> | null;
  const published = props.published as Record<string, unknown> | null;

  /* No draft means nothing is being changed — Publish is not offered. A first
     publish (no published document yet) counts as a change, since the article
     is arriving. */
  if (!draft) return false;
  if (!published) return true;

  return fields.some((field) => !same(draft[field], published[field]));
}

/**
 * Wraps Sanity's own Publish action rather than replacing it.
 *
 * Everything about publishing — the disabled states while a document is
 * invalid or already live, the label, the shortcut — comes from the original
 * action and is untouched. This only adds a patch in front of it, and only
 * sometimes.
 */
export function withModifiedStamp(original: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props) => {
    /* `useDocumentOperation` rather than a direct client patch: it is the
       documented path, and it queues the patch against the same document
       operation the publish below uses. A raw `client.patch(...).commit()`
       races the publish — the draft can be consumed before the patch lands,
       and the stamp silently misses. */
    const { patch, publish } = useDocumentOperation(props.id, props.type);
    const action = original(props);
    if (!action) return action;

    return {
      ...action,
      onHandle: () => {
        if (substanceChanged(props)) {
          patch.execute([{ set: { modifiedAt: new Date().toISOString() } }]);
        }
        publish.execute();
        props.onComplete();
      },
    };
  };

  /* Carried over so Sanity can still identify the action — it keys off this to
     find the publish action among the rest. Without it the wrapper is an
     anonymous action and the Publish button loses its shortcut. */
  Wrapped.action = original.action;
  Wrapped.displayName = "PublishWithModifiedStamp";
  return Wrapped;
}
