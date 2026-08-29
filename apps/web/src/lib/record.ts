// The one place the CMS's record becomes the site's.
//
// `lib/match.ts` said this file would exist: the view types were written in
// CONTEXT.md's vocabulary precisely so that reading real Matches would be a
// mapping rather than a rewrite. This is that mapping, and it is deliberately
// the only thing in the app that knows how Payload stores a Match.
//
// Everything here is pure. The fetch lives in ./cms, the caching in ./matches;
// keeping the translation apart from both is what lets the awkward cases — a
// margin of one wicket, a side bowled out, a four-innings game — be tested
// without a network or a database.

import type { Appearance as StoredAppearance, Match as Stored } from "@hkucc/domain";

import type { Appearance, Batting, Bowling, Fielding } from "./appearance";
import type { Innings, Match, Outcome, Result } from "./match";

/** A populated relationship, or just its id.
 *
 *  Payload returns the id alone beyond the requested depth. Every query here
 *  asks for enough depth to populate these, so an id arriving means the query
 *  changed — the name is dropped rather than printed as a number. */
function named(relation: unknown): string | undefined {
  if (typeof relation !== "object" || relation === null) return undefined;
  const name = (relation as { name?: unknown }).name;
  return typeof name === "string" && name !== "" ? name : undefined;
}

/** Payload stores a day-only date as midnight UTC, and the site formats dates
 *  explicitly in UTC for the same reason (see ./dates): a date-only value has no
 *  time zone, and letting one be applied moves a Saturday fixture to Friday. */
function isoDate(stored: string): string {
  return stored.slice(0, 10);
}

/** The margin as a scorer states it — "33 runs", "5 wickets", "1 wicket".
 *
 *  Stored as a number and a unit so that neither can be typed wrong, and joined
 *  here because only the display cares. The singular is not a flourish: a match
 *  won "by 1 wickets" reads as a bug in the record and undoes the care taken
 *  everywhere else on the page. */
function margin(stored: NonNullable<Stored["result"]>["margin"]): string | undefined {
  const value = stored?.value;
  const unit = stored?.unit;
  if (value == null || !unit) return undefined;

  return `${value} ${value === 1 ? unit.slice(0, -1) : unit}`;
}

/** One team innings. `wickets` absent means bowled out, exactly as a scorecard
 *  writes it — 151 all out is `151`, never `151/10`. The CMS enforces that by
 *  capping wickets at nine; here a stored null becomes an absent field. */
function innings(
  stored: NonNullable<NonNullable<Stored["result"]>["innings"]>[number],
  opponent: string,
): Innings {
  return {
    side: stored.side === "hku" ? "HKU" : opponent,
    runs: stored.runs,
    ...(stored.wickets == null ? {} : { wickets: stored.wickets }),
    ...(stored.overs ? { overs: stored.overs } : {}),
    ...(stored.extras == null ? {} : { extras: stored.extras }),
  };
}

/**
 * The Result, if the match has one.
 *
 * The outcome is what marks a Match as played — a fixture is the same record
 * before anybody filled this in. So no outcome means no Result at all, and the
 * page renders a fixture rather than an empty scoreline.
 *
 * Innings are carried only when there are exactly two, because the scoreline is
 * a two-line device. A four-innings game and a result whose scores nobody
 * recorded are both real, and both print their verdict without a scoreline
 * rather than printing a broken one.
 */
function result(stored: Stored["result"], opponent: string): Result | undefined {
  if (!stored?.outcome) return undefined;

  const scores = stored.innings ?? [];
  const stated = margin(stored.margin);

  return {
    outcome: stored.outcome as Outcome,
    ...(stated ? { margin: stated } : {}),
    ...(scores.length === 2
      ? {
          innings: [
            innings(scores[0], opponent),
            innings(scores[1], opponent),
          ] as [Innings, Innings],
        }
      : {}),
  };
}

/**
 * A stored Match as the site reads one.
 *
 * `team` is carried because the homepage's record is club-wide: four sides play
 * under one crest, and a table that did not name the side would read as one
 * team's season while being four (docs/PLAN.md — coverage is uneven, and the
 * site says so).
 */
export function asMatch(stored: Stored): Match {
  const opponent = stored.opponent;
  const competition = named(stored.competition);
  const played = result(stored.result, opponent);

  return {
    id: stored.id,
    date: isoDate(stored.date),
    team: named(stored.team) ?? "",
    opponent,
    venue: stored.venue === "home" ? "Home" : "Away",
    ...(stored.ground ? { ground: stored.ground } : {}),
    ...(stored.format ? { format: stored.format } : {}),
    ...(competition ? { competition } : {}),
    ...(stored.startTime ? { time: stored.startTime } : {}),
    ...(stored.scorecard ? { scorecard: stored.scorecard } : {}),
    ...(played ? { result: played } : {}),
  };
}

/** A number the CMS stored, with a stored `null` read as absent rather than as
 *  the falsy `0` — a bowler's nought maidens is a real figure, not a gap. */
function num(value: number | null | undefined): number | undefined {
  return value == null ? undefined : value;
}

function battingOf(stored: NonNullable<StoredAppearance["batting"]>): Batting {
  return {
    runs: num(stored.runs),
    balls: num(stored.balls),
    fours: num(stored.fours),
    sixes: num(stored.sixes),
    notOut: Boolean(stored.notOut),
    ...(stored.howOut ? { howOut: stored.howOut } : {}),
    ...(stored.fielder ? { fielder: stored.fielder } : {}),
    ...(stored.bowler ? { bowler: stored.bowler } : {}),
  };
}

function bowlingOf(stored: NonNullable<StoredAppearance["bowling"]>): Bowling {
  return {
    ...(stored.overs ? { overs: stored.overs } : {}),
    maidens: num(stored.maidens),
    runs: num(stored.runs),
    wickets: num(stored.wickets),
  };
}

function fieldingOf(stored: NonNullable<StoredAppearance["fielding"]>): Fielding {
  return {
    catches: num(stored.catches),
    runOuts: num(stored.runOuts),
    stumpings: num(stored.stumpings),
  };
}

/**
 * One HKU player's Appearance, as the page reads it.
 *
 * `batted` false is **did not bat** — the record is there, but with no batting
 * detail because the innings ended before the player was needed. That has to
 * read differently from **did not play**, which is this player never having an
 * Appearance at all — a distinction the page, not this mapping, is responsible
 * for keeping (CONTEXT.md).
 */
export function asAppearance(stored: StoredAppearance): Appearance {
  return {
    player: named(stored.player) ?? "",
    batted: Boolean(stored.batted),
    ...(stored.batted && stored.batting ? { batting: battingOf(stored.batting) } : {}),
    bowled: Boolean(stored.bowled),
    ...(stored.bowled && stored.bowling ? { bowling: bowlingOf(stored.bowling) } : {}),
    ...(stored.fielding ? { fielding: fieldingOf(stored.fielding) } : {}),
  };
}
