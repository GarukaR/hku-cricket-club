// Who is registered to a Team for a Season (CONTEXT.md — Registration), as a
// squad page reads it. The exclusivity rule that keeps a Player off both the
// league and challenge league sides in one Season is enforced where the
// Registration is written (apps/cms/src/lib/eligibility.ts) — this only reads
// what already holds.

import { cacheLife, cacheTag } from "next/cache";

import type { Registration as Stored } from "@hkucc/domain";

import { query } from "./cms";
import { RECORD } from "./matches";
import { named } from "./relations";

const LIFE = "days";

/** The four ways a Player is normally selected to contribute (CONTEXT.md —
 *  Playing role). Absent for most of the record, which predates anyone
 *  writing it down. */
const PLAYING_ROLE_LABEL: Record<string, string> = {
  batter: "Batter",
  bowler: "Bowler",
  wicketkeeper: "Wicketkeeper",
  "all-rounder": "All-rounder",
};

/** A Playing role's label, or undefined for a value nothing here names — the
 *  page prints nothing rather than the raw stored code. */
export function playingRoleLabel(value: string | undefined): string | undefined {
  return value ? PLAYING_ROLE_LABEL[value] : undefined;
}

export type SquadMember = {
  playerId: number;
  player: string;
  playingRole?: string;
};

function asMember(stored: Stored): SquadMember | undefined {
  const relation = stored.player;
  if (typeof relation !== "object" || relation === null) return undefined;

  const player = named(relation);
  if (!player) return undefined;

  const playingRole = (relation as { playingRole?: unknown }).playingRole as
    | string
    | null
    | undefined;

  return { playerId: relation.id, player, ...(playingRole ? { playingRole } : {}) };
}

/**
 * The squad a Team fields for a Season — every Player registered to it,
 * alphabetically.
 *
 * `season` in the result is undefined only when the named Season does not
 * exist at all, which the page reads as "not found". A Season that exists but
 * has nobody registered to this Team returns `members: []`, which is the
 * ordinary empty state (CONTEXT.md's coverage is uneven, and the site says
 * so, applies here too — a team can genuinely have nobody registered yet).
 */
export async function squadFor(
  teamId: number,
  seasonName: string,
): Promise<{ season?: string; members: SquadMember[] }> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const seasons = await query<{ id: number; name: string }>("seasons", {
    "where[name][equals]": seasonName,
    limit: "1",
    depth: "0",
  });
  const season = seasons[0];
  if (!season) return { members: [] };

  const docs = await query<Stored>("registrations", {
    "where[team][equals]": String(teamId),
    "where[season][equals]": String(season.id),
    sort: "id",
    limit: "60",
    depth: "1",
  });

  const members = docs
    .map(asMember)
    .filter((member): member is SquadMember => member !== undefined)
    .sort((a, b) => a.player.localeCompare(b.player));

  return { season: season.name, members };
}
