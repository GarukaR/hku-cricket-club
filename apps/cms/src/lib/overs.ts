// Overs, which are the one figure on a scorecard that is not a number.
//
// `28.3` is twenty-eight overs and three balls — 171 deliveries — and the digit
// after the dot counts to five, because a sixth ball completes the over. Read as
// a decimal it comes to 170 deliveries instead, and every economy rate built on
// it is wrong by a little. A little is the problem: 4.67 against 4.69 is not a
// figure anybody checks, so the error never surfaces and never gets fixed.
//
// The notation is therefore parsed in exactly one place, and everything that
// needs a number out of an over asks here for it.

const OVERS = /^(\d+)(?:\.([0-5]))?$/;

const BALLS_IN_AN_OVER = 6;

/**
 * Deliveries bowled, or undefined for anything no scorer would have written.
 *
 * Undefined rather than zero or NaN: a bowling figure with no overs against it
 * is a scorer who did not record them, and an economy rate of zero would be a
 * claim rather than an absence.
 */
export function ballsBowled(overs: string | undefined): number | undefined {
  const written = overs?.trim() ?? "";
  if (!written) return undefined;

  const match = OVERS.exec(written);
  if (!match) return undefined;

  return Number(match[1]) * BALLS_IN_AN_OVER + Number(match[2] ?? 0);
}

/** Balls back into the notation a scorer writes them in. */
export function oversBowled(balls: number): string {
  const whole = Math.floor(balls / BALLS_IN_AN_OVER);
  const rest = balls % BALLS_IN_AN_OVER;
  return rest === 0 ? String(whole) : `${whole}.${rest}`;
}

/**
 * The same figure said out loud — "28 overs and 3 balls".
 *
 * Printed beside the notation in the import preview, because the whole trap is
 * that `28.3` reads as a decimal to anybody who has not been told otherwise, and
 * a preview whose job is to be checked should not need the reader to have been
 * told.
 */
export function oversSpoken(overs: string | undefined): string | undefined {
  const balls = ballsBowled(overs);
  if (balls === undefined) return undefined;

  const whole = Math.floor(balls / BALLS_IN_AN_OVER);
  const rest = balls % BALLS_IN_AN_OVER;

  const said = [
    `${whole} ${whole === 1 ? "over" : "overs"}`,
    rest > 0 && `${rest} ${rest === 1 ? "ball" : "balls"}`,
  ].filter(Boolean) as string[];

  return said.join(" and ");
}

/**
 * Runs conceded per over — the bowling figure the notation gets wrong.
 *
 * Undefined when there is nothing to divide by: a bowler who has not yet
 * completed a ball has no economy rate, and a spell nobody recorded the overs
 * for cannot have one worked out.
 */
export function economyRate(
  runs: number | undefined,
  overs: string | undefined,
): number | undefined {
  const balls = ballsBowled(overs);
  if (runs == null || balls === undefined || balls === 0) return undefined;

  return (runs * BALLS_IN_AN_OVER) / balls;
}
