import type {
  CollectionConfig,
  FieldHook,
  TextFieldManyValidation,
} from "payload";

import { aliasProblem } from "@/lib/names";
import { PLAYING_ROLES } from "@/lib/playingRole";
import { announceOnChange, announceOnDelete } from "@/lib/publish";
import { suggestedRole, type RoleEvidence } from "@/lib/suggestedRole";

import { publiclyReadable } from "./access";

/** The label the panel prints for a stored or suggested role code. */
function roleLabel(value: string): string {
  return PLAYING_ROLES.find((role) => role.value === value)?.label ?? value;
}

/**
 * What this Player's Appearances suggest their role is, worked out on read.
 *
 * **Only ever a sentence.** It never writes the role, and it is not the role —
 * CONTEXT.md keeps Playing role a recorded fact because a season with few
 * wickets does not mean a bowler stopped being one. What the record can honestly
 * offer is what it looks like, next to the field where somebody decides.
 *
 * Computed on read for the same reason Matches.standing is: the answer changes
 * when an Appearance is entered, a different record entirely, so there is no
 * save on this one at which a stored suggestion could be kept right. A stale
 * suggestion is worse than none, because it looks like a second opinion.
 *
 * The rule lives in lib/suggestedRole, tested without Payload anywhere near it.
 * This only fetches what the rule needs.
 */
const deriveSuggestedRole: FieldHook = async ({ data, req }) => {
  const id = (data as { id?: unknown })?.id;
  if (id == null) return "";

  const { docs } = await req.payload.find({
    collection: "appearances",
    depth: 0,
    pagination: false,
    req,
    where: { player: { equals: id } },
  });

  const evidence: RoleEvidence[] = docs.map((doc) => ({
    overs: doc.bowling?.overs ?? undefined,
    batted: doc.batted ?? false,
    runs: doc.batting?.runs ?? undefined,
    notOut: doc.batting?.notOut ?? undefined,
    stumpings: doc.fielding?.stumpings ?? undefined,
    caughtBehind: doc.fielding?.caughtBehind ?? undefined,
  }));

  const suggestion = suggestedRole(evidence);
  if (!suggestion) return "";

  const stored = (data as { playingRole?: unknown })?.playingRole;

  // Says so plainly when the record agrees with what is already recorded, so
  // that the only sentence worth reading twice is the one proposing a change.
  if (stored === suggestion.role) {
    return `${roleLabel(suggestion.role)} — ${suggestion.summary}. Matches what is set.`;
  }

  return stored
    ? `${roleLabel(suggestion.role)} — ${suggestion.summary}. Set to ${roleLabel(String(stored))}; change it only if you agree.`
    : `${roleLabel(suggestion.role)} — ${suggestion.summary}.`;
};

/**
 * One spelling, one Player.
 *
 * The importer resolves a scorer's name by looking it up here, so two Players
 * claiming `Gohar A` would make every future import of that name unanswerable —
 * and, worse, answerable differently on different days. That surfaces a season
 * later as a batting average nobody can account for, which is the kind of bug
 * this record cannot afford: nothing about it looks wrong.
 *
 * Checked at the one moment somebody still knows which of them they meant.
 */
const unclaimedElsewhere: TextFieldManyValidation = async (
  value,
  { data, id, req },
) => {
  const { docs } = await req.payload.find({
    collection: "players",
    depth: 0,
    pagination: false,
    req,
    where: id ? { id: { not_equals: id } } : {},
  });

  // `data` is the document as it is being saved, typed loosely by Payload
  // because a validator does not know its own collection. The name is wanted
  // only to say "that is already this player's own name", so an unreadable one
  // costs a sentence rather than the rule.
  const name = (data as { name?: unknown } | undefined)?.name;

  return (
    aliasProblem(
      value,
      { id: id ?? "", name: typeof name === "string" ? name : "" },
      docs,
    ) ?? true
  );
};

/**
 * A person who has been registered to at least one Team in at least one Season
 * (CONTEXT.md).
 *
 * Distinct from a prospective member who has only made an Enquiry: an enquiry
 * is somebody asking, a Player is somebody the club has played. Nothing here is
 * created by the join form.
 *
 * Deliberately thin. Everything a page says about a player — matches, runs,
 * wickets, averages — is derived from their Appearances and never stored
 * (CONTEXT.md, *Derived figures*), so this collection holds only what cannot be
 * worked out: who they are, and what scorers have called them.
 */
export const Players = {
  slug: "players",
  labels: { singular: "Player", plural: "Players" },
  defaultSort: "name",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "aliases"],
    description:
      "Everyone who has played for the club. Their figures are worked out from the matches they appear in, so there is nothing to keep up to date here.",
    group: "The record",
  },
  access: publiclyReadable,
  // A Player's name is what a squad or scorecard prints — see lib/publish.
  hooks: { afterChange: [announceOnChange], afterDelete: [announceOnDelete] },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      index: true,
      admin: {
        description:
          "The club's own spelling of the name — the one that should appear in an averages table. Scorers' spellings go in Aliases below, not here.",
      },
    },
    {
      name: "aliases",
      label: "Aliases",
      type: "text",
      hasMany: true,
      admin: {
        description:
          "How scorers have spelled this person's name — G. Ranasinghe, Garuka R, Ranasinghe G are three aliases of one player. Scorers type names freely, and recording them here is what stops one person becoming three entries in the averages. Most of these are written by the import screen as questions get answered, and this is where a wrong answer is corrected: remove the spelling here and the next import will ask about it again.",
      },
      validate: unclaimedElsewhere,
    },
    {
      name: "playingRole",
      label: "Playing role",
      type: "select",
      options: [...PLAYING_ROLES],
      admin: {
        description:
          "How this player is normally selected to contribute. Not a Team's role (that says what a side is for) — this says what the person does on it. Left empty for most of the record, which predates anyone writing it down. The sidebar says what their appearances suggest; it never fills this in.",
      },
    },
    {
      name: "suggestedRole",
      label: "What the record suggests",
      type: "text",
      // Worked out on read, held in no column. See deriveSuggestedRole.
      virtual: true,
      admin: {
        readOnly: true,
        position: "sidebar",
        description:
          "Read from this player's appearances, and never written to the role beside it: a quiet season with the ball does not stop somebody being a bowler, so the decision stays a person's. Blank until they have three appearances, and blank for a player whose scorecards show neither batting nor bowling.",
      },
      hooks: { afterRead: [deriveSuggestedRole] },
    },
  ],
} satisfies CollectionConfig;
