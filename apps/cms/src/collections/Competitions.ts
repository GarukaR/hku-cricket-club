import type { CollectionConfig, FieldHook } from "payload";

import { competitionLabel } from "@/lib/notation";
import { announceOnChange, announceOnDelete } from "@/lib/publish";

import { publiclyReadable } from "./access";

/** The name and its division, joined once, so nothing downstream joins them
 *  differently. Stored rather than assembled on read: it is what the admin
 *  panel titles the record with, and what a relationship menu shows.
 *
 *  Read through the record as it will be *after* the write, not as the write
 *  states it. An update that changes only the division carries no name, and
 *  rebuilding from that alone would blank the label — into a unique column, so
 *  the second such edit would fail on a database constraint rather than say
 *  anything an editor could act on. */
const deriveLabel: FieldHook = ({ originalDoc, siblingData }) => {
  const before = (originalDoc ?? {}) as { name?: string; division?: string };
  const after = (siblingData ?? {}) as { name?: string; division?: string };

  return competitionLabel(
    after.name ?? before.name,
    "division" in after ? after.division : before.division,
  );
};

/**
 * An external league or cup a Team is entered into, run by Cricket Hong Kong
 * and carrying its own division (CONTEXT.md) — the Saturday Championship Div 2,
 * the Challenge League Div 3, the University Cricket League.
 *
 * **A friendly has no Competition at all**, and that absence is meaningful
 * rather than a "Friendly" row somebody would otherwise create here.
 *
 * The Season is deliberately *not* recorded on a Competition. A Match already
 * states its Season, and a second Season here could disagree with it. A side
 * promoted out of Div 2 is a new Competition rather than an edited one, which
 * keeps every Match pointing at the division it was actually played in.
 */
export const Competitions = {
  slug: "competitions",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "name", "division"],
    description:
      "The leagues and cups the club's sides are entered into. A friendly is not one of these — leave a friendly's Competition empty.",
    group: "The record",
  },
  access: publiclyReadable,
  // The competition is printed above the scoreline, so renaming one changes it.
  hooks: { afterChange: [announceOnChange], afterDelete: [announceOnDelete] },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description:
          "The competition as Cricket Hong Kong names it, without the division — Saturday Championship, Challenge League, University Cricket League.",
      },
    },
    {
      name: "division",
      type: "text",
      admin: {
        description:
          "The division, if the competition has one — Div 2. The University Cricket League is entered undivided, so leave it empty there.",
      },
    },
    {
      name: "label",
      type: "text",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description:
          "How the competition is printed. Made from the two fields above.",
      },
      hooks: { beforeChange: [deriveLabel] },
    },
  ],
} satisfies CollectionConfig;
