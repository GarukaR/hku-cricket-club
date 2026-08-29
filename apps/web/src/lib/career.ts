// Career figures - everything a Player's profile shows, computed from their
// Appearances and never stored (CONTEXT.md - Career figures).
//
// Pure functions over a list of Appearances, so the awkward cases - an
// undefined average, a not-out high score, a best bowling figure with a tie
// on wickets - can be tested without a network or a database. The page reads
// a Player's Appearances (./players) and hands the list here; grouping that
// list by Team or by Season is the caller's job, so the same functions serve
// the career total, the per-Team split and the season-by-season one.

import { ballsBowled, oversBowled, type Appearance, type Batting, type Bowling } from "./appearance";
import type { AppearanceRecord } from "./players";

const num = (value: number | undefined): number => value ?? 0;

export type BattingFigures = {
  innings: number;
  notOuts: number;
  runs: number;
  /** Runs per dismissal, to two decimal places, or the en dash when every
   *  innings was not out - the divisor would be zero (CONTEXT.md - Undefined
   *  average). */
  average: string;
  /** Runs per hundred balls, or the en dash when nothing was recorded to
   *  divide by. */
  strikeRate: string;
  /** The highest innings, with a trailing `*` when it was not out. */
  highScore: string;
  fifties: number;
  hundreds: number;
  /** Out for nought. A not-out nought is not a duck (CONTEXT.md - Not out). */
  ducks: number;
  boundaries: number;
};

export type BowlingFigures = {
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  /** Runs per wicket, or the en dash when no wicket has fallen. */
  average: string;
  /** Runs per over, or the en dash when nothing was recorded to divide by.
   *  Defined independently of whether a wicket ever fell. */
  economy: string;
  /** Balls per wicket, or the en dash when no wicket has fallen. */
  strikeRate: string;
  /** The best single-innings figures - most wickets, fewest runs breaking a
   *  tie - or the en dash for a Player who has never bowled. */
  bestFigures: string;
  threeFors: number;
  fiveFors: number;
};

export type FieldingFigures = {
  catches: number;
  stumpings: number;
  runOuts: number;
};

const UNDEFINED = "–"; // en dash

/** The highest innings, marked not out only when the innings that set it was.
 *  A higher, dismissed innings always beats a lower not-out one - the mark
 *  belongs to the score, not to how the batter happened to finish. */
function highScoreOf(innings: Batting[]): string {
  let best: Batting | undefined;

  for (const one of innings) {
    if (!best || num(one.runs) > num(best.runs)) best = one;
  }

  return best ? `${num(best.runs)}${best.notOut ? "*" : ""}` : UNDEFINED;
}

export function battingFigures(appearances: Appearance[]): BattingFigures {
  const innings = appearances
    .filter((a) => a.batted)
    .map((a) => a.batting)
    .filter((b): b is Batting => b !== undefined);

  const notOuts = innings.filter((b) => b.notOut).length;
  const runs = innings.reduce((sum, b) => sum + num(b.runs), 0);
  const balls = innings.reduce((sum, b) => sum + num(b.balls), 0);
  const boundaries = innings.reduce((sum, b) => sum + num(b.fours) + num(b.sixes), 0);

  const dismissals = innings.length - notOuts;

  return {
    innings: innings.length,
    notOuts,
    runs,
    average: dismissals > 0 ? (runs / dismissals).toFixed(2) : UNDEFINED,
    strikeRate: balls > 0 ? ((runs / balls) * 100).toFixed(1) : UNDEFINED,
    highScore: highScoreOf(innings),
    fifties: innings.filter((b) => num(b.runs) >= 50 && num(b.runs) < 100).length,
    hundreds: innings.filter((b) => num(b.runs) >= 100).length,
    ducks: innings.filter((b) => num(b.runs) === 0 && !b.notOut).length,
    boundaries,
  };
}

/** The best single-innings figures - most wickets first, fewest runs
 *  breaking a tie, the same order a scorecard ranks a bowling performance
 *  by. */
function bestFiguresOf(spells: Bowling[]): string {
  let best: Bowling | undefined;

  for (const one of spells) {
    if (
      !best ||
      num(one.wickets) > num(best.wickets) ||
      (num(one.wickets) === num(best.wickets) && num(one.runs) < num(best.runs))
    ) {
      best = one;
    }
  }

  return best ? `${num(best.wickets)}/${num(best.runs)}` : UNDEFINED;
}

export function bowlingFigures(appearances: Appearance[]): BowlingFigures {
  const spells = appearances
    .filter((a) => a.bowled)
    .map((a) => a.bowling)
    .filter((b): b is Bowling => b !== undefined);

  const balls = spells.reduce((sum, b) => sum + (ballsBowled(b.overs) ?? 0), 0);
  const maidens = spells.reduce((sum, b) => sum + num(b.maidens), 0);
  const runs = spells.reduce((sum, b) => sum + num(b.runs), 0);
  const wickets = spells.reduce((sum, b) => sum + num(b.wickets), 0);

  return {
    overs: oversBowled(balls),
    maidens,
    runs,
    wickets,
    average: wickets > 0 ? (runs / wickets).toFixed(2) : UNDEFINED,
    economy: balls > 0 ? ((runs * 6) / balls).toFixed(2) : UNDEFINED,
    strikeRate: wickets > 0 ? (balls / wickets).toFixed(1) : UNDEFINED,
    bestFigures: bestFiguresOf(spells),
    threeFors: spells.filter((b) => num(b.wickets) >= 3 && num(b.wickets) < 5).length,
    fiveFors: spells.filter((b) => num(b.wickets) >= 5).length,
  };
}

export function fieldingFigures(appearances: Appearance[]): FieldingFigures {
  return appearances.reduce(
    (totals, a) => ({
      catches: totals.catches + num(a.fielding?.catches),
      stumpings: totals.stumpings + num(a.fielding?.stumpings),
      runOuts: totals.runOuts + num(a.fielding?.runOuts),
    }),
    { catches: 0, stumpings: 0, runOuts: 0 },
  );
}

/** One grouping's worth of figures - a Team's, or a Team's for one Season. */
type Split = {
  matches: number;
  batting: BattingFigures;
  bowling: BowlingFigures;
  fielding: FieldingFigures;
};

/**
 * Groups Appearances by whatever keyOf returns. Each group keeps one of its
 * own records (`sample`) to read the grouping fields - a Team's or Season's
 * name - back off, rather than parsing them out of a composite key.
 */
function splitBy(
  records: AppearanceRecord[],
  keyOf: (record: AppearanceRecord) => string,
): { sample: AppearanceRecord; split: Split }[] {
  const groups = new Map<string, { sample: AppearanceRecord; appearances: Appearance[] }>();

  for (const record of records) {
    const key = keyOf(record);
    const group = groups.get(key) ?? { sample: record, appearances: [] };
    group.appearances.push(record.appearance);
    groups.set(key, group);
  }

  return [...groups.values()].map(({ sample, appearances }) => ({
    sample,
    split: {
      matches: appearances.length,
      batting: battingFigures(appearances),
      bowling: bowlingFigures(appearances),
      fielding: fieldingFigures(appearances),
    },
  }));
}

export type TeamSplit = Split & { team: string };

/** Every Team a Player has an Appearance for, rolled up across every Season.
 *  Four sides play under one crest, and a total that did not say which was
 *  which would read as one team's career while being several (the homepage
 *  carries the same reasoning for its own record - docs/PLAN.md). */
export function byTeam(records: AppearanceRecord[]): TeamSplit[] {
  return splitBy(records, (record) => record.team).map(({ sample, split }) => ({
    team: sample.team,
    ...split,
  }));
}

export type SeasonSplit = Split & { team: string; teamRole: string; season: string };

/** Every Team a Player has an Appearance for, split further by Season - the
 *  axis a call-up is capped by (CONTEXT.md - Call-up) and the finest grain
 *  the record slices a career by. */
export function bySeason(records: AppearanceRecord[]): SeasonSplit[] {
  return splitBy(records, (record) => seasonSplitKey(record.team, record.season)).map(
    ({ sample, split }) => ({
      team: sample.team,
      teamRole: sample.teamRole,
      season: sample.season,
      ...split,
    }),
  );
}

/** The key a Team+Season pair is addressed by - a challenge-league
 *  Registration's call-ups belong to one, and matching it against a
 *  SeasonSplit needs both call sites to build the same key. Never parsed
 *  back apart, only compared, so a Team's or Season's own name is safe
 *  inside it. */
export function seasonSplitKey(team: string, season: string): string {
  return `${team} - ${season}`;
}
