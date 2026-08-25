import type {
  CollectionConfig,
  FieldHook,
  RelationshipFieldSingleValidation,
} from "payload";

import {
  callUpsStanding,
  registrationProblem,
  type TeamRole,
} from "@/lib/eligibility";

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
 * How many call-ups this registration has used, of the two allowed.
 *
 * Only ever a number for a *challenge league* registration: a call-up is that
 * player appearing for the league team, and the rule runs one way only, so the
 * question is meaningless for every other side and the field says nothing.
 *
 * Computed on read for the same reason Matches.standing is. The count changes
 * when an Appearance is entered — a different record entirely — so there is no
 * save on this one at which a stored number could be kept right, and a stale
 * "1 of 2" on an eligibility rule is worse than no number at all.
 *
 * It counts Appearances, so it inherits their honesty problem: a scorecard
 * lists only the players a scorer entered, and a squad member who neither
 * batted nor bowled can be missing from it entirely. This is a floor, not a
 * certainty, which is the other half of why it never refuses a save.
 */
const deriveCallUps: FieldHook = async ({ data, req }) => {
  const doc = data as { team?: unknown; player?: unknown; season?: unknown };
  if (doc?.team == null || doc?.player == null || doc?.season == null) return "";

  const team = await req.payload.findByID({
    collection: "teams",
    id: doc.team as number,
    depth: 0,
    req,
    disableErrors: true,
  });

  if ((team?.role as TeamRole | undefined) !== "challenge-league") return "";

  // Which sides count as "the league team". A list rather than one id because
  // nothing stops the club fielding two, and a rule that silently picked the
  // first would undercount.
  const league = await req.payload.find({
    collection: "teams",
    depth: 0,
    pagination: false,
    req,
    where: { role: { equals: "league" } },
  });
  if (league.docs.length === 0) return callUpsStanding(0).summary;

  const appearances = await req.payload.count({
    collection: "appearances",
    req,
    where: {
      player: { equals: doc.player },
      "match.team": { in: league.docs.map((t) => t.id) },
      "match.season": { equals: doc.season },
    },
  });

  return callUpsStanding(appearances.totalDocs).summary;
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
    defaultColumns: ["player", "team", "season", "callUps"],
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
    {
      name: "callUps",
      label: "Call-ups",
      type: "text",
      // Counted on read, held in no column. See deriveCallUps.
      virtual: true,
      admin: {
        readOnly: true,
        position: "sidebar",
        description:
          "Appearances this player has made for the league team this season. A challenge league player may make two; after that they are not eligible for the league team again this season. Blank for every other side, because the rule runs one way only. It counts what scorers wrote down, so treat it as a floor rather than a certainty.",
      },
      hooks: { afterRead: [deriveCallUps] },
    },
  ],
} satisfies CollectionConfig;
