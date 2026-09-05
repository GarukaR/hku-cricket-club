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
// **Thin evidence is answered, not withheld.** Under three Appearances the same
// bars are applied and the answer is marked provisional, because a blank column
// is not the cautious choice — it is the one that leaves somebody opening a
// Player page for every name a season later. What makes that safe is that it
// corrects itself: nothing is written without a click, and a stored role the
// figures later disagree with comes back to be looked at again.
//
// Kept away from Payload so the rule can be tested as a rule, the way
// lib/eligibility is. The caller supplies the Appearances; this decides what
// they mean.

import { ballsBowled } from "./overs";
import type { PlayingRole } from "./playingRole";

/** The line between a *provisional* reading and a settled one.
 *
 *  Below it, an average and an overs-per-match are read off too small a sample
 *  to describe a habit — a player with one game has a scorecard. The bars are
 *  applied anyway and the answer is marked `provisional`, because the
 *  alternative to a corrigible guess is not a better answer: it is a blank
 *  column, and somebody opening eleven Player pages a season later.
 *
 *  Above it the same figures are held as a reading of how this player is
 *  normally selected. Nothing about the bars changes at the boundary; only how
 *  loudly the answer is held. */
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
  /**
   * Read off fewer than `MINIMUM_APPEARANCES` — a starting point to be
   * corrected rather than a reading of a habit.
   *
   * The bars do not move: the club's figures are applied to whatever evidence
   * there is, and what changes is how loudly the answer is held. A provisional
   * role is worth offering because the alternative is not a better answer, it
   * is a blank column and somebody opening eleven Player pages later. It
   * corrects itself: once the record has enough to disagree, the row comes
   * back with the new reading beside what was set.
   */
  provisional: boolean;
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
 * Undefined only for a Player with no Appearances, and for one who has neither
 * batted, bowled nor kept in them — a record of pure fielding is a scorer's
 * silence rather than a playing role.
 *
 * Everything else gets an answer, marked `provisional` below the minimum. A
 * first import can then be finished in one press with the column filled in,
 * and the reading corrects itself as the record learns more: a stored role the
 * figures later disagree with is raised again, next to what it now reads.
 */
export function suggestedRole(
  evidence: readonly RoleEvidence[],
): RoleSuggestion | undefined {
  if (evidence.length === 0) return undefined;

  const appearances = `${evidence.length} ${evidence.length === 1 ? "appearance" : "appearances"}`;

  // Keeping is **observed, not inferred**, so the minimum does not apply to it.
  //
  // The minimum exists because a batting average and an overs-per-match are
  // read off a sample, and a player with one game has a scorecard rather than a
  // habit. A catch taken standing up is not a sample of anything: it is direct
  // evidence that this person kept wicket in that match. Holding it back for
  // three appearances applied a sampling rule to something that is not sampled,
  // and left the one player the record could actually identify as the one it
  // said nothing about.
  //
  // It stays a suggestion, so a stand-in who kept once is a sentence next to
  // the field rather than a role written into it — the count is stated so that
  // the difference between one match and twenty is the reader's to weigh.
  const provisional = evidence.length < MINIMUM_APPEARANCES;

  if (kept(evidence)) {
    return {
      role: "wicketkeeper",
      summary: `Kept wicket in ${appearances} — a stumping, or a catch taken standing up`,
      provisional,
    };
  }

  const overs = oversPerMatch(evidence);
  const average = battingAverage(evidence);

  const said = [
    `${rounded(overs)} overs per match`,
    average === undefined
      ? "never batted"
      : `batting average ${rounded(average)}`,
  ].join(", ");

  const from = `from ${appearances}`;

  const bowls = overs >= OVERS_PER_MATCH;
  const bats = average !== undefined && average >= BATTING_AVERAGE;

  if (bowls && bats)
    return { role: "all-rounder", summary: `${said} ${from}`, provisional };
  if (bowls) return { role: "bowler", summary: `${said} ${from}`, provisional };
  if (bats) return { role: "batter", summary: `${said} ${from}`, provisional };

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
    provisional,
  };
}
