import type { CollectionConfig, TextFieldManyValidation } from "payload";

import { aliasProblem } from "@/lib/names";
import { PLAYING_ROLES } from "@/lib/playingRole";

import { publiclyReadable } from "./access";

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
          "How this player is normally selected to contribute. Not a Team's role (that says what a side is for) — this says what the person does on it. Left empty for most of the record, which predates anyone writing it down.",
      },
    },
  ],
} satisfies CollectionConfig;
