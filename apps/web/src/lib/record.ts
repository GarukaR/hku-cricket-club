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

import type { Match as Stored } from "@hkucc/domain";

import type { Innings, Match, Outcome, Result } from "./match";
import { named } from "./relations";

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
    date: isoDate(stored.date),
    team: named(stored.team) ?? "",
    opponent,
    venue: stored.venue === "home" ? "Home" : "Away",
    ...(stored.ground ? { ground: stored.ground } : {}),
    ...(stored.format ? { format: stored.format } : {}),
    ...(competition ? { competition } : {}),
    ...(stored.startTime ? { time: stored.startTime } : {}),
    ...(played ? { result: played } : {}),
  };
}
