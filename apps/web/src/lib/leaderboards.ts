// Most runs, most wickets, and the averages behind a threshold — for one Team
// and one Season (CONTEXT.md — Qualification; docs/PLAN.md's Leaderboards
// section; issue #15).
//
// Leaderboards belong to a Team, never the club: the league and challenge
// league sides play different standards, and the Registration rule keeps
// their players apart on purpose (docs/PLAN.md) — merging their averages
// would compare things the club itself treats as separate. So this reads
// Appearances scoped to one Team and one Season and groups them *by Player*,
// the opposite axis from ./career's `byTeam`/`bySeason`, which group one
// Player's own Appearances by Team or Season instead.

import { cacheLife, cacheTag } from "next/cache";

import type { Appearance as StoredAppearance } from "@hkucc/domain";

import { ballsBowled, type Appearance } from "./appearance";
import { battingFigures, bowlingFigures, UNDEFINED } from "./career";
import { query } from "./cms";
import { RECORD } from "./matches";
import { named } from "./relations";
import { asAppearance } from "./record";
import { seasonByName } from "./seasons";

const LIFE = "days";

/** CONTEXT.md — Qualification: the minimum a Player must have done before
 *  appearing in an averages table. Below it, a career too short to mean
 *  anything can still produce a defined, finite average — one dismissed
 *  innings of 40 is a genuine, un-undefined 40.00, and nothing about the
 *  arithmetic itself would keep it from sitting at the top of the table
 *  forever. */
export const QUALIFICATION = {
  battingInnings: 5,
  bowlingOvers: 20,
} as const;

type PlayerRow = { playerId: number; player: string };

export type RunsRow = PlayerRow & { innings: number; runs: number };
export type WicketsRow = PlayerRow & { overs: string; wickets: number };
export type BattingAverageRow = PlayerRow & { innings: number; runs: number; average: string };
export type BowlingAverageRow = PlayerRow & { overs: string; wickets: number; average: string };

export type Leaderboards = {
  runs: RunsRow[];
  wickets: WicketsRow[];
  battingAverage: BattingAverageRow[];
  bowlingAverage: BowlingAverageRow[];
};

/** One Player's Appearances within the Team and Season a leaderboard is
 *  scoped to — the grouping key `computeLeaderboards` builds its rows from. */
export type PlayerAppearances = {
  playerId: number;
  player: string;
  appearances: Appearance[];
};

function groupByPlayer(
  records: { playerId: number; player: string; appearance: Appearance }[],
): PlayerAppearances[] {
  const groups = new Map<number, PlayerAppearances>();

  for (const record of records) {
    const group = groups.get(record.playerId) ?? {
      playerId: record.playerId,
      player: record.player,
      appearances: [],
    };
    group.appearances.push(record.appearance);
    groups.set(record.playerId, group);
  }

  return [...groups.values()];
}

/** Ties broken by name, alphabetically — an arbitrary insertion order reads
 *  as a decision the table did not actually make. */
function byName(a: PlayerRow, b: PlayerRow): number {
  return a.player.localeCompare(b.player);
}

/**
 * Every Player who appeared for this Team this Season, sorted into the four
 * tables a leaderboard shows.
 *
 * `runs` and `wickets` carry no threshold at all (issue #15) — anyone who
 * batted or bowled at least once is ranked by their total, however small a
 * sample it is. The two averages tables apply `QUALIFICATION` *and* still
 * drop a qualifying Player whose average is undefined (CONTEXT.md): five
 * not-out innings clears the innings floor without ever producing a number
 * to rank by.
 */
export function computeLeaderboards(byPlayer: PlayerAppearances[]): Leaderboards {
  const runs: RunsRow[] = [];
  const wickets: WicketsRow[] = [];
  const battingAverage: BattingAverageRow[] = [];
  const bowlingAverage: BowlingAverageRow[] = [];

  for (const { playerId, player, appearances } of byPlayer) {
    const batting = battingFigures(appearances);
    const bowling = bowlingFigures(appearances);
    const oversFaced = ballsBowled(bowling.overs) ?? 0;

    if (batting.innings > 0) {
      runs.push({ playerId, player, innings: batting.innings, runs: batting.runs });
    }
    if (oversFaced > 0) {
      wickets.push({ playerId, player, overs: bowling.overs, wickets: bowling.wickets });
    }
    if (batting.innings >= QUALIFICATION.battingInnings && batting.average !== UNDEFINED) {
      battingAverage.push({
        playerId,
        player,
        innings: batting.innings,
        runs: batting.runs,
        average: batting.average,
      });
    }
    if (
      oversFaced >= QUALIFICATION.bowlingOvers * 6 &&
      bowling.average !== UNDEFINED
    ) {
      bowlingAverage.push({
        playerId,
        player,
        overs: bowling.overs,
        wickets: bowling.wickets,
        average: bowling.average,
      });
    }
  }

  runs.sort((a, b) => b.runs - a.runs || byName(a, b));
  wickets.sort((a, b) => b.wickets - a.wickets || byName(a, b));
  // Batting: a higher average is better. Bowling: a lower one is — fewer runs
  // per wicket taken — so the two tables sort in opposite directions over the
  // same-shaped field.
  battingAverage.sort((a, b) => Number(b.average) - Number(a.average) || byName(a, b));
  bowlingAverage.sort((a, b) => Number(a.average) - Number(b.average) || byName(a, b));

  return { runs, wickets, battingAverage, bowlingAverage };
}

function asPlayerAppearance(
  stored: StoredAppearance,
): { playerId: number; player: string; appearance: Appearance } | undefined {
  const relation = stored.player;
  if (typeof relation !== "object" || relation === null) return undefined;

  const player = named(relation);
  if (!player) return undefined;

  return { playerId: relation.id, player, appearance: asAppearance(stored) };
}

/** The Leaderboards for one Team, for one Season by name — the same shape of
 *  call `./squad`'s `squadFor` takes, so a page reads both the same way. A
 *  Season name that does not resolve returns `season: undefined`, which the
 *  page reads as "not found" rather than as an empty leaderboard. */
export async function leaderboardsFor(
  teamId: number,
  seasonName: string,
): Promise<Leaderboards & { season?: string }> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const season = await seasonByName(seasonName);
  if (!season) {
    return { season: undefined, runs: [], wickets: [], battingAverage: [], bowlingAverage: [] };
  }

  const docs = await query<StoredAppearance>("appearances", {
    "where[match.team][equals]": String(teamId),
    "where[match.season][equals]": String(season.id),
    depth: "2",
    limit: "1000",
  });

  const records = docs
    .map(asPlayerAppearance)
    .filter((record): record is NonNullable<typeof record> => record !== undefined);

  return { season: season.name, ...computeLeaderboards(groupByPlayer(records)) };
}
