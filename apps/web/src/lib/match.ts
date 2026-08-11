// The shape the site reads a Match in, and the three ways it says one out loud.
//
// These are view types, not the record itself: Payload generates the real Match
// and Appearance types into @hkucc/domain (see packages/domain/src/index.ts), and
// this file collapses into a mapping onto them once the CMS exists. The terms
// are CONTEXT.md's — Match, Result, Innings, Competition, Outcome — so that the
// swap is a change of import rather than a change of vocabulary.

/** How a Match ended. Not a boolean: a tie, an abandonment and a concession are
 *  all ordinary outcomes, and the club's record contains them. */
export type Outcome =
  | "won"
  | "lost"
  | "tied"
  | "drawn"
  | "abandoned"
  | "conceded";

/** A team innings — one side's turn to bat.
 *
 *  `wickets` absent means the side was bowled out, exactly as a scorecard reads
 *  it: 151 all out is written `151`, never `151/10`. */
export type Innings = {
  side: string;
  runs: number;
  wickets?: number;
};

/** The outcome of a played Match, and by how much.
 *
 *  `margin` is the margin as a scorer states it — "33 runs", "5 wickets" — and
 *  is absent for outcomes that have none. It is recorded rather than computed:
 *  ties, abandonments, concessions and rain-adjusted targets each work
 *  differently, and whoever entered the match already knew the answer. */
export type Result = {
  outcome: Outcome;
  margin?: string;
  innings?: [Innings, Innings];
};

/** One fixture of one Team, played or still to come.
 *
 *  A Match that has not been played simply has no Result yet — a scheduled
 *  fixture and a completed game are the same Match at two points in its life,
 *  never two records. `competition` is absent for a friendly, and that absence
 *  is meaningful rather than a special value. */
export type Match = {
  /** ISO date, `YYYY-MM-DD`. Formatted for display in ./dates. */
  date: string;
  opponent: string;
  ground: string;
  venue: "Home" | "Away";
  format: string;
  competition?: string;
  /** 24-hour local start time, for a Match not yet played. */
  time?: string;
  result?: Result;
};

/** A Match that has been played. */
export type PlayedMatch = Match & { result: Result };

/** A Match whose Result carries both team innings — what the scoreline needs. */
export type ScoredMatch = Match & {
  result: Result & { innings: [Innings, Innings] };
};

/** Narrows a list of Matches to the ones the record can print. */
export function isPlayed(match: Match): match is PlayedMatch {
  return match.result !== undefined;
}

const OUTCOME: Record<Outcome, string> = {
  won: "Won",
  lost: "Lost",
  tied: "Tied",
  drawn: "Drawn",
  abandoned: "Abandoned",
  conceded: "Conceded",
};

/** The verdict as the club would announce it: "Won by 33 runs", "Abandoned". */
export function verdict(result: Result): string {
  const label = OUTCOME[result.outcome];
  return result.margin ? `${label} by ${result.margin}` : label;
}

/** The same fact at table width, where the column header already says Result. */
export function resultSummary(result: Result): string {
  const label = OUTCOME[result.outcome];
  return result.margin ? `${label} · ${result.margin}` : label;
}

/** Whether the record reads this Outcome as a win, a loss, or neither. Drawn,
 *  tied and abandoned matches are deliberately neutral — the page must not
 *  colour a tie as a defeat. */
export function tone(outcome: Outcome): "win" | "loss" | "neutral" {
  if (outcome === "won") return "win";
  if (outcome === "lost" || outcome === "conceded") return "loss";
  return "neutral";
}

/** The innings figure spoken rather than printed. The scoreline sets the wickets
 *  as a hanging suffix, which a screen reader would otherwise read as "184
 *  slash 6", so the printed figure is hidden from it and this is read instead. */
export function inningsSpoken(innings: Innings): string {
  return innings.wickets === undefined
    ? `${innings.runs} all out`
    : `${innings.runs} for ${innings.wickets}`;
}
