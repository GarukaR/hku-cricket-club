import type { CollectionConfig, RelationshipFieldSingleValidation } from "payload";

import { registrationProblem, type TeamRole } from "@/lib/eligibility";

import { publiclyReadable } from "./access";

/** The role of one Team, by id, or undefined if it cannot be read. */
async function roleOf(
  id: unknown,
  req: Parameters<RelationshipFieldSingleValidation>[1]["req"],
): Promise<TeamRole | undefined> {
  if (id == null) return undefined;

  const team = await req.payload.findByID({
    collection: "teams",
    id: id as number,
    depth: 0,
    req,
    disableErrors: true,
  });

  return (team?.role as TeamRole | undefined) ?? undefined;
}

/**
 * The club's eligibility rule, at the one moment it can still be honoured.
 *
 * A Player registered to the league team cannot also be registered to the
 * challenge league team in the same Season. Checked here rather than reported
 * later because, unlike a call-up count, this one is knowable with certainty at
 * the moment of the save: both registrations are the club's own records, and
 * neither depends on what a scorer happened to write down.
 *
 * The rule itself is in lib/eligibility, tested without Payload anywhere near
 * it. This function only fetches what the rule needs.
 */
const notAlreadyRegisteredElsewhere: RelationshipFieldSingleValidation = async (
  value,
  { id, data, req },
) => {
  const proposed = await roleOf(value, req);
  if (!proposed) return true;

  const season = (data as { season?: unknown })?.season;
  const player = (data as { player?: unknown })?.player;
  if (season == null || player == null) return true;

  const { docs } = await req.payload.find({
    collection: "registrations",
    depth: 0,
    pagination: false,
    req,
    where: {
      player: { equals: player },
      season: { equals: season },
      ...(id ? { id: { not_equals: id } } : {}),
    },
  });

  const existing: TeamRole[] = [];
  for (const doc of docs) {
    const role = await roleOf(doc.team, req);
    if (role) existing.push(role);
  }

  return registrationProblem(proposed, existing) ?? true;
};

/**
 * A Player's binding to one Team for one Season (CONTEXT.md).
 *
 * Its own record rather than a list on the Player, because a registration is a
 * fact about a season and not about a person: a player registered to the league
 * side in 2024/25 and the challenge league side in 2025/26 is two
 * registrations, not a changed field, and the club's history of who played
 * where would otherwise be overwritten every September.
 *
 * It is also what makes a *call-up* meaningful. An Appearance for the league
 * team means one thing for a league-registered player and another for a
 * challenge-league one, and this collection is the only thing that knows which.
 */
export const Registrations = {
  slug: "registrations",
  labels: { singular: "Registration", plural: "Registrations" },
  defaultSort: "-season",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["player", "team", "season"],
    description:
      "Who is registered to which side, for which season. Register a player once per season; the league and challenge league sides are mutually exclusive.",
    group: "Selection",
  },
  access: publiclyReadable,
  fields: [
    {
      name: "player",
      type: "relationship",
      relationTo: "players",
      required: true,
      index: true,
    },
    {
      name: "team",
      type: "relationship",
      relationTo: "teams",
      required: true,
      index: true,
      admin: {
        description:
          "A player registered to the league side cannot also be registered to the challenge league side in the same season. The other way round is the same rule — it is symmetric, unlike the two-per-season call-up cap.",
      },
      validate: notAlreadyRegisteredElsewhere,
    },
    {
      name: "season",
      type: "relationship",
      relationTo: "seasons",
      required: true,
      index: true,
    },
  ],
} satisfies CollectionConfig;
