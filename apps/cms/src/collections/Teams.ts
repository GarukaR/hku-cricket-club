import type {
  CollectionConfig,
  TextFieldManyValidation,
  TextFieldSingleValidation,
} from "payload";

import { entityNameProblem } from "@/lib/mapping";
import { slugProblem } from "@/lib/notation";

import { publiclyReadable } from "./access";

const validSlug: TextFieldSingleValidation = (value) =>
  slugProblem(value ?? undefined) ?? true;

/**
 * No two sides may claim the same CricClubs entity.
 *
 * Nothing in an export says which of our sides an entry belongs to, so the
 * mapping recorded here is the only thing that knows. Two sides claiming one
 * entity would not fail the import — it would file a season of matches against
 * whichever side the importer read first, silently and plausibly. Checked at
 * the one moment somebody can still say which is which.
 */
const unclaimedElsewhere: TextFieldManyValidation = async (
  value,
  { id, req },
) => {
  const names = value ?? [];
  if (names.length === 0) return true;

  const { docs } = await req.payload.find({
    collection: "teams",
    depth: 0,
    pagination: false,
    req,
    where: id ? { id: { not_equals: id } } : {},
  });

  return (
    entityNameProblem(
      names,
      docs.map((team) => ({
        team: team.name,
        names: team.cricclubsNames ?? [],
      })),
    ) ?? true
  );
};

/**
 * The four sides the club fields — sunday social, league, challenge league and
 * student (CONTEXT.md).
 *
 * A collection rather than four values in a select, because a Team is what
 * Matches, registrations and every leaderboard hang off, and because the sides
 * the club fields have changed before and will again.
 *
 * Not to be confused with a Competition. *Challenge league* is a side; the
 * *Challenge League Div 3* is the competition it plays in. They share a word
 * because the club talks that way, and they are never the same thing.
 */
export const Teams = {
  slug: "teams",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "cricclubsNames"],
    description:
      "The sides the club fields. Each one's matches, squad and averages hang off its entry here.",
    group: "The record",
  },
  access: publiclyReadable,
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "The club's own word for the side — league, challenge league, sunday social, student. Not Squad, side or XI.",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "The side's address on the site, as in /teams/challenge-league. Changing it breaks every link anybody has saved, so set it once.",
      },
      validate: validSlug,
    },
    {
      name: "cricclubsNames",
      label: "CricClubs entity names",
      type: "text",
      hasMany: true,
      admin: {
        description:
          "Exactly how this side is named on CricClubs — HKU CC, HKU Belchers CC, HKU Students (UCL). Nothing in a scorecard export says which of our sides it belongs to, so the importer knows only what is recorded here. Leave it empty for a side scored nowhere: the sunday social side's matches are not scored at all, and saying so is the record being honest rather than a field somebody forgot.",
      },
      validate: unclaimedElsewhere,
    },
  ],
} satisfies CollectionConfig;
