// What a scorer's dismissal code credits, and to whom.
//
// A scorecard states how a batter got out in two or three characters, and the
// consequences run outwards from it: whether the bowler took a wicket, whether
// a fielder took a catch, and whether the wicket that fell belongs to nobody at
// all. Getting this wrong is not a display bug — it is a bowling average that
// is quietly wrong for a season.
//
// **The list is open, and that is the point.** These six are every code in the
// three exports in docs/samples/, and CricClubs is free to write a seventh
// tomorrow. Nothing here guesses at one: an unrecognised code is reported, and
// the importer holds the match rather than filing a wicket against a bowler on
// the strength of two characters nobody has seen before. A hit wicket read as a
// catch would credit a fielder who was standing still.

import type { ParsedMatch } from "./cricclubs";

/** What the fielder named alongside a dismissal is credited with. */
export type FieldingCredit = "catch" | "stumping" | "runOut";

export type Dismissal = {
  /** The scorer's code, lower case. */
  code: string;
  /** How it reads on a scorecard. */
  label: string;
  /**
   * Whether the bowler named took the wicket.
   *
   * False for a run out, and that is the rule that makes wickets fallen exceed
   * the bowlers' wickets in an ordinary scorecard (CONTEXT.md). The bowler on a
   * run-out row is merely who was bowling at the time and may not appear in the
   * bowling figures at all.
   */
  creditsBowler: boolean;
  /** What the fielder named gets, if anything. */
  creditsFielder?: FieldingCredit;
  /**
   * Whether the credit was taken standing up — the fielder named was keeping.
   *
   * Kept apart from the credit itself because it does not change what the
   * fielder is owed (a catch is a catch) but is the only thing in an export
   * that says who kept wicket. Without it a keeper's catches are
   * indistinguishable from an outfielder's, and lib/suggestedRole has nothing
   * to go on.
   */
  behindTheStumps?: true;
};

/** Every code the club's own exports have used. */
export const DISMISSALS: readonly Dismissal[] = [
  { code: "b", label: "bowled", creditsBowler: true },
  { code: "lbw", label: "lbw", creditsBowler: true },
  { code: "ct", label: "caught", creditsBowler: true, creditsFielder: "catch" },
  // Caught by the wicketkeeper — the `w` is the keeper, confirmed by the club.
  // A separate code from `ct` because the scorer distinguishes them, and the
  // same credit because a catch is a catch.
  //
  // One row in docs/samples names the same man as keeper and bowler, which
  // cannot be literally true. Nothing here acts on that, deliberately: the
  // catch goes to the fielder the scorer named, which is the least wrong answer
  // whether they mistyped the code or left the keeper's name out. An earlier
  // version tried to be cleverer, withheld a real catch, and was wrong about
  // cricket while it did so.
  {
    code: "ctw",
    label: "caught by the wicketkeeper",
    creditsBowler: true,
    creditsFielder: "catch",
    behindTheStumps: true,
  },
  {
    code: "st",
    label: "stumped",
    creditsBowler: true,
    creditsFielder: "stumping",
    behindTheStumps: true,
  },
  {
    code: "ro",
    label: "run out",
    creditsBowler: false,
    creditsFielder: "runOut",
  },
];

const BY_CODE = new Map(DISMISSALS.map((one) => [one.code, one]));

/** The dismissal a code names, or undefined if nobody has taught this one. */
export function dismissalOf(code: string | undefined): Dismissal | undefined {
  const written = code?.trim().toLowerCase();
  return written ? BY_CODE.get(written) : undefined;
}

/**
 * Every dismissal code in this export that nothing here recognises, distinct
 * and in the order they appear.
 *
 * Empty is the ordinary answer, and a non-empty one is a reason to hold the
 * match rather than a reason to reject the file. Somebody reads the code, adds
 * it to the list above with what it credits, and the import goes through — which
 * is a two-minute job, and a great deal cheaper than a wrong wicket.
 */
export function unknownDismissals(match: ParsedMatch): string[] {
  const unknown: string[] = [];

  for (const innings of match.innings) {
    for (const batter of innings.batting) {
      const written = batter.howOut?.trim();
      if (!written || dismissalOf(written)) continue;
      if (!unknown.some((seen) => seen.toLowerCase() === written.toLowerCase())) {
        unknown.push(written);
      }
    }
  }

  return unknown;
}
