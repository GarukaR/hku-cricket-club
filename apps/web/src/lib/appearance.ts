// The shape the site reads an Appearance in, and the figures a match page
// derives from one.
//
// Mirrors ./match: view types in CONTEXT.md's vocabulary, translated from
// Payload's stored shape in ./record. An Appearance is the atomic fact
// (CONTEXT.md) — a Player was in the XI, whatever they did or did not do with
// bat or ball.

/** A completed batting innings, or the absence of one. Present only when
 *  `batted` is true — see ./record. */
export type Batting = {
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  notOut?: boolean;
  /** The scorer's code — b, lbw, ct, ctw, st, ro — free text because the list
   *  is open (CONTEXT.md — Dismissal). */
  howOut?: string;
  fielder?: string;
  bowler?: string;
};

export type Bowling = {
  overs?: string;
  maidens?: number;
  runs?: number;
  wickets?: number;
};

export type Fielding = {
  catches?: number;
  runOuts?: number;
  stumpings?: number;
};

/**
 * One HKU player's Appearance in a Match.
 *
 * `batted` false is **did not bat** — the player was in the XI but the innings
 * ended before they were needed — and it must read differently from **did not
 * play**, which is this player's absence from the list of Appearances
 * altogether. Nothing here represents "did not play"; there is simply no
 * Appearance to hold.
 */
export type Appearance = {
  player: string;
  batted: boolean;
  batting?: Batting;
  bowled: boolean;
  bowling?: Bowling;
  fielding?: Fielding;
};

const BALLS_IN_AN_OVER = 6;

/** Overs in balls notation, as deliveries. `28.3` is 28 overs and 3 balls —
 *  171 deliveries — read as a decimal it is 170.3 and every economy rate is
 *  wrong by a little (see apps/cms/src/lib/overs.ts, the importer's own
 *  version of this rule). Exported for ./career, which sums deliveries across
 *  many spells before converting the total back with `oversBowled`. */
export function ballsBowled(overs: string | undefined): number | undefined {
  const match = /^(\d+)(?:\.([0-5]))?$/.exec(overs?.trim() ?? "");
  if (!match) return undefined;
  return Number(match[1]) * BALLS_IN_AN_OVER + Number(match[2] ?? 0);
}

/** Deliveries back into the notation a scorer writes them in — the reverse of
 *  `ballsBowled`. A whole number of overs is written bare, never with a
 *  trailing `.0`, exactly as a scorecard would. */
export function oversBowled(balls: number): string {
  const whole = Math.floor(balls / BALLS_IN_AN_OVER);
  const rest = balls % BALLS_IN_AN_OVER;
  return rest === 0 ? String(whole) : `${whole}.${rest}`;
}

/** Runs conceded per over, to one decimal place, or `–` when there is nothing
 *  to divide by. */
export function economyRate(bowling: Bowling | undefined): string {
  const balls = ballsBowled(bowling?.overs);
  if (bowling?.runs == null || !balls) return "–";
  return ((bowling.runs * BALLS_IN_AN_OVER) / balls).toFixed(1);
}

/** Runs per hundred balls, to one decimal place, or `–` when there is nothing
 *  to divide by — an innings nobody recorded the balls faced for cannot have
 *  one worked out. */
export function strikeRate(batting: Batting | undefined): string {
  if (batting?.runs == null || !batting.balls) return "–";
  return ((batting.runs / batting.balls) * 100).toFixed(1);
}

/**
 * How a batting innings ended, in the shape a printed scorecard states it —
 * "c Fielder b Bowler", "lbw b Bowler", "run out (Fielder)", "not out",
 * "retired not out".
 *
 * An unrecognised code prints as itself rather than guessing at what it means:
 * the list of codes is open (CONTEXT.md — Dismissal), and a card that invented
 * a fielding credit from two characters it did not recognise would be wrong
 * about cricket to make a blank cell tidier.
 */
export function dismissal(batting: Batting | undefined): string {
  if (!batting) return "";

  const code = batting.howOut?.trim().toLowerCase();

  // A retirement is a not-out innings that a card still names, because "not
  // out" alone would say the batter was there at the end when they had walked
  // off. Read before the not-out line below, which it would otherwise absorb.
  if (code === "rt") return "retired not out";

  if (batting.notOut) return "not out";
  if (!code) return "";

  const { fielder, bowler } = batting;

  if (code === "ro") {
    return fielder ? `run out (${fielder})` : "run out";
  }
  if (code === "b") {
    return bowler ? `b ${bowler}` : "bowled";
  }
  if (code === "lbw") {
    return bowler ? `lbw b ${bowler}` : "lbw";
  }
  if (code === "ct" || code === "ctw" || code === "st") {
    if (!bowler) return batting.howOut ?? "";
    if (code === "st") return fielder ? `st ${fielder} b ${bowler}` : `st b ${bowler}`;
    // Caught and bowled: the fielder named is the bowler himself.
    if (fielder && fielder === bowler) return `c & b ${bowler}`;
    return fielder ? `c ${fielder} b ${bowler}` : `c b ${bowler}`;
  }

  // A code nothing here recognises — the record states it plainly rather than
  // silently dropping it.
  return batting.howOut ?? "";
}
