// Whether a scorecard agrees with itself — and what to say when it does not.
//
// **Nothing here refuses anything.** Every function returns findings; none
// throws, and none is wired to a validator. That is the whole point of the
// module: a real export in docs/samples/ disagrees with itself by one run and
// the *stated* total is the correct one, so a check that blocked the save would
// have kept a true record out. Half-known history must be savable too — the
// club has seasons where only the totals survive.
//
// So these are arithmetic observations offered to a person, in the words they
// would use, with the numbers named. The person decides.

/** Runs conceded to the batting side that belong to no batter (CONTEXT.md).
 *  Byes and leg byes are the two that matter for a bowler's figures, because
 *  they are the two a bowler is not charged with. */
export type Extras = {
  byes?: number | null;
  legByes?: number | null;
  wides?: number | null;
  noBalls?: number | null;
  penalty?: number | null;
};

export type Finding = {
  /** Which arithmetic disagreed, for a caller that wants to place the warning
   *  next to the right field rather than in a list at the top. */
  about: "total" | "wickets" | "bowlerRuns" | "bowlerWickets";
  /** How far out, always positive — the direction is in the sentence. */
  by: number;
  /** The club's own words, with both numbers named. */
  message: string;
};

function sum(values: readonly (number | null | undefined)[]): number {
  return values.reduce<number>((run, n) => run + (n ?? 0), 0);
}

/** "1 batter", "2 batters". These sentences are read by a person checking a
 *  scorecard against a screen, and "1 batters are recorded as out" reads like a
 *  bug in the thing telling them about a bug. */
function plural(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

export function extrasTotal(extras: Extras): number {
  return sum([
    extras.byes,
    extras.legByes,
    extras.wides,
    extras.noBalls,
    extras.penalty,
  ]);
}

export type InningsToCheck = {
  /** Every batter's runs, in the order the scorer listed them. */
  batterRuns: readonly (number | null | undefined)[];
  extras: Extras;
  /** What the scorecard says the side made. Stored rather than summed — see
   *  the module comment, and docs/samples/README.md. */
  statedTotal?: number | null;
  /** What the scorecard says fell. */
  statedWickets?: number | null;
  /** How many batting innings ended in a dismissal — a batter who was not out,
   *  and a batter who did not bat, are both excluded by the caller. */
  dismissals?: number | null;
  /** Each bowler's runs conceded and wickets taken. */
  bowlerRuns?: readonly (number | null | undefined)[];
  bowlerWickets?: readonly (number | null | undefined)[];
};

/**
 * Every disagreement in one innings, or an empty list.
 *
 * Each check is skipped rather than assumed when the number it needs is
 * missing: a scorecard with no stated total is incomplete, not wrong, and
 * inventing a comparison against zero would report a discrepancy the size of
 * the innings.
 */
export function reconcileInnings(innings: InningsToCheck): Finding[] {
  const findings: Finding[] = [];

  const batted = sum(innings.batterRuns);
  const extras = extrasTotal(innings.extras);
  const stated = innings.statedTotal;

  // 1. Batters plus extras against the stated total.
  if (stated != null) {
    const counted = batted + extras;
    if (counted !== stated) {
      findings.push({
        about: "total",
        by: Math.abs(counted - stated),
        message:
          `The batters make ${batted} and the extras ${extras}, which is ` +
          `${counted} — the scorecard says ${stated}. The stated total is the ` +
          `one to trust unless you have reason not to; a real export in ` +
          `docs/samples is out by one and the stated figure is the correct one.`,
      });
    }
  }

  // 2. Dismissals against wickets fallen. These *should* agree: both count the
  //    same event from opposite sides of it.
  if (innings.statedWickets != null && innings.dismissals != null) {
    if (innings.dismissals !== innings.statedWickets) {
      findings.push({
        about: "wickets",
        by: Math.abs(innings.dismissals - innings.statedWickets),
        message:
          `${plural(innings.dismissals, "batter is", "batters are")} recorded ` +
          `as out, but the scorecard says ` +
          `${plural(innings.statedWickets, "wicket", "wickets")} fell.`,
      });
    }
  }

  // 3. The bowlers' runs against the total less byes and leg byes — never
  //    against the total itself. A bowler is not charged with a bye.
  const bowlerRuns = innings.bowlerRuns;
  if (bowlerRuns && bowlerRuns.length > 0 && stated != null) {
    const conceded = sum(bowlerRuns);
    const chargeable =
      stated - (innings.extras.byes ?? 0) - (innings.extras.legByes ?? 0);

    if (conceded !== chargeable) {
      findings.push({
        about: "bowlerRuns",
        by: Math.abs(conceded - chargeable),
        message:
          `The bowlers concede ${conceded}. The total less byes and leg byes ` +
          `is ${chargeable}, which is what they should add up to.`,
      });
    }
  }

  // 4. The bowlers' wickets against wickets fallen — an inequality, not an
  //    equality.
  //
  //    A run out is credited to no bowler, so wickets fallen is routinely
  //    greater than the bowlers' wickets and that is a normal scorecard, not a
  //    discrepancy. Only the other direction is impossible: the bowlers cannot
  //    have taken more wickets than fell. Asserting these are equal is the
  //    mistake CONTEXT.md names, and it would reject
  //    docs/samples/saturday-2026-01-03-v-scc-lancers.csv, which is a perfectly
  //    valid match with two run-outs in it.
  const bowlerWickets = innings.bowlerWickets;
  if (bowlerWickets && bowlerWickets.length > 0 && innings.statedWickets != null) {
    const taken = sum(bowlerWickets);
    if (taken > innings.statedWickets) {
      findings.push({
        about: "bowlerWickets",
        by: taken - innings.statedWickets,
        message:
          `The bowlers are credited with ` +
          `${plural(taken, "wicket", "wickets")} but only ` +
          `${innings.statedWickets} fell. A bowler cannot take a wicket that ` +
          `did not fall, so one of the two is wrong.`,
      });
    }
  }

  return findings;
}

/** How many wickets fell to something other than a bowler — run outs, mostly.
 *
 *  Offered as a figure rather than checked against anything, because there is
 *  no number on a scorecard to check it against. It is the difference the run
 *  outs explain, and seeing it is how an editor notices it is implausible. */
export function wicketsToNoBowler(innings: {
  statedWickets?: number | null;
  bowlerWickets?: readonly (number | null | undefined)[];
}): number | undefined {
  if (innings.statedWickets == null || !innings.bowlerWickets) return undefined;
  return Math.max(0, innings.statedWickets - sum(innings.bowlerWickets));
}
