// What a Player's Appearances suggest their playing role is.
//
// **A suggestion, and only ever a suggestion.** CONTEXT.md records that Playing
// role is stored on the Player rather than derived, because a season with few
// wickets does not mean a bowler stopped being one. That reasoning is why
// nothing here writes: the panel offers what the record looks like, a human
// decides, and a role somebody set by hand is never overwritten.
//
// The bars below are the club's own, settled with the club rather than picked
// here. They are stated once, in this file, so that changing the club's mind is
// editing three constants rather than hunting through the panel.
//
// Kept away from Payload so the rule can be tested as a rule, the way
// lib/eligibility is. The caller supplies the Appearances; this decides what
// they mean.

import { ballsBowled } from "./overs";
import type { PlayingRole } from "./playingRole";

/** Nothing is suggested for a Player with fewer than this many Appearances. A
 *  player with one game has a scorecard, not a habit. */
export const MINIMUM_APPEARANCES = 3;

/** Overs per Appearance at or above which a Player is bowling properly.
 *
 *  Workload rather than wickets, deliberately: a containing bowler who gets
 *  through his overs for few wickets is still a bowler, and a rule counting
 *  wickets alone would quietly reclassify him after a lean run. */
export const OVERS_PER_MATCH = 3;

/** Batting average at or above which a Player is batting properly. */
export const BATTING_AVERAGE = 15;

const BALLS_IN_AN_OVER = 6;

const num = (value: number | undefined): number => value ?? 0;

/**
 * One Appearance, in the only terms this rule reads.
 *
 * Deliberately not the stored Appearance type: the rule needs six numbers, and
 * naming exactly those makes it testable without building a Payload document
 * around every case.
 */
export type RoleEvidence = {
  /** Overs as a scorer wrote them (`7`, `3.2`), or absent if they did not bowl. */
  overs?: string;
  /** Whether they batted. False is *did not bat*, which is not the same as not
   *  playing (CONTEXT.md). */
  batted?: boolean;
  runs?: number;
  notOut?: boolean;
  stumpings?: number;
  /** Catches taken standing up — `ctw` on a scorecard, kept apart from an
   *  ordinary catch at import precisely so this rule can read it. */
  caughtBehind?: number;
};

export type RoleSuggestion = {
  role: PlayingRole;
  /** How the record reads, in the panel's own words. */
  summary: string;
};

/**
 * Runs per dismissal, or a lower bound on it when the Player has never been
 * out.
 *
 * A not-out innings can only ever understate an average — the runs are real and
 * the divisor is smaller than it will eventually be — so runs per innings is a
 * floor on the true figure, never an overstatement. Comparing that floor
 * against the bar is therefore safe in the one direction that matters: a
 * Player who clears it has certainly cleared the real average too.
 *
 * Undefined only for a Player who has not batted at all, who has no average to
 * be judged on rather than an average of nothing.
 */
function battingAverage(evidence: readonly RoleEvidence[]): number | undefined {
  const innings = evidence.filter((one) => one.batted);
  if (innings.length === 0) return undefined;

  const runs = innings.reduce((total, one) => total + num(one.runs), 0);
  const dismissals = innings.filter((one) => !one.notOut).length;

  return dismissals > 0 ? runs / dismissals : runs / innings.length;
}

/** Overs bowled per Appearance, counting matches they did not bowl in — the
 *  question is how much of the side's bowling this player gets through, and a
 *  match spent in the field bowling nothing is part of that answer. */
function oversPerMatch(evidence: readonly RoleEvidence[]): number {
  const balls = evidence.reduce(
    (total, one) => total + (ballsBowled(one.overs) ?? 0),
    0,
  );

  return balls / BALLS_IN_AN_OVER / evidence.length;
}

/** Whether anything in the record has this Player taking wickets standing up.
 *
 *  Only ever positive evidence. A keeper accrues stumpings and catches behind
 *  when the opposition happens to get out that way, so a run of matches with
 *  neither says nothing at all about who kept — which is why its absence asks a
 *  human rather than concluding anything. */
function kept(evidence: readonly RoleEvidence[]): boolean {
  return evidence.some(
    (one) => num(one.stumpings) > 0 || num(one.caughtBehind) > 0,
  );
}

function rounded(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * What these Appearances suggest, or undefined when they suggest nothing.
 *
 * Undefined for a Player under the minimum, and for one who has neither batted
 * nor bowled in any of them — a record of pure fielding is a scorer's silence
 * rather than a playing role.
 */
export function suggestedRole(
  evidence: readonly RoleEvidence[],
): RoleSuggestion | undefined {
  if (evidence.length < MINIMUM_APPEARANCES) return undefined;

  const overs = oversPerMatch(evidence);
  const average = battingAverage(evidence);

  const said = [
    `${rounded(overs)} overs per match`,
    average === undefined
      ? "never batted"
      : `batting average ${rounded(average)}`,
  ].join(", ");

  const from = `from ${evidence.length} appearances`;

  // Keeping outranks the two bars rather than competing with them: a keeper who
  // also opens the batting is still the side's keeper, and it is the fact the
  // rest of the record cannot show.
  if (kept(evidence)) {
    return {
      role: "wicketkeeper",
      summary: `Took wickets standing up ${from} — stumpings or catches behind`,
    };
  }

  const bowls = overs >= OVERS_PER_MATCH;
  const bats = average !== undefined && average >= BATTING_AVERAGE;

  if (bowls && bats) return { role: "all-rounder", summary: `${said} ${from}` };
  if (bowls) return { role: "bowler", summary: `${said} ${from}` };
  if (bats) return { role: "batter", summary: `${said} ${from}` };

  // Neither bar cleared, so the honest answer is whichever they are nearer to,
  // measured as a share of each bar so that overs and runs can be compared at
  // all. A Player who has done neither has no nearer side and gets no
  // suggestion.
  const towardsBowling = overs / OVERS_PER_MATCH;
  const towardsBatting = (average ?? 0) / BATTING_AVERAGE;

  if (towardsBowling === 0 && towardsBatting === 0) return undefined;

  return {
    role: towardsBowling > towardsBatting ? "bowler" : "batter",
    summary: `${said} ${from} — closer to one than the other, neither clearly`,
  };
}
