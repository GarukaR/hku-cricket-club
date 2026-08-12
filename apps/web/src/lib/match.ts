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
 *  is meaningful rather than a special value.
 *
 *  `ground` and `format` are optional because the CMS lets an editor leave them
 *  empty, and most of this club's history is half known. Every component that
 *  prints them therefore has to survive their absence rather than printing the
 *  word "undefined" into the record. */
export type Match = {
  /** ISO date, `YYYY-MM-DD`. Formatted for display in ./dates. */
  date: string;
  /** Which of the club's sides played it — league, student, and so on. The
   *  homepage's record is club-wide, so a row that did not name the side would
   *  read as one team's season while being four. */
  team: string;
  opponent: string;
  ground?: string;
  venue: "Home" | "Away";
  format?: string;
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

/** The outcome and its margin, joined — one fact, and the only place that knows
 *  an outcome without a margin drops the joiner rather than trailing it. */
function stated(result: Result, joiner: string): string {
  const label = OUTCOME[result.outcome];
  return result.margin ? `${label}${joiner}${result.margin}` : label;
}

/** The verdict as the club would announce it: "Won by 33 runs", "Abandoned". */
export function verdict(result: Result): string {
  return stated(result, " by ");
}

/** The same fact at table width, where the column header already says Result. */
export function resultSummary(result: Result): string {
  return stated(result, " · ");
}

/** Joins the standing facts printed beside a Match — its date, its ground, the
 *  distance it was played over — leaving out the ones nobody recorded.
 *
 *  A line reading "Sat 25 April ·  · 40 overs" looks broken; one that prints
 *  only what the record holds looks edited. Half-known history is the normal
 *  case here, not the exception. */
export function facts(...parts: (string | undefined)[]): string {
  return parts.filter((part) => part !== undefined && part !== "").join(" · ");
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
