// Whether an import may publish itself, or must be held for a decision.
//
// This is the moment the site becomes maintainable by a committee that will not
// administer a website. A clean import publishes and appears on the live site
// with nobody pressing anything; an import with a question in it stops, as a
// draft, and says exactly what the question is.
//
// **Three conditions, and only three** (docs/PLAN.md):
//
//   1. Every name resolves to a Player.
//   2. The arithmetic reconciles.
//   3. No dismissal code appears that nothing recognises.
//
// Each is a case where publishing would put something *wrong* on the site
// rather than something incomplete — a stranger in the averages, a total that
// contradicts itself, a wicket credited on a guess. Everything else about a
// scorecard is allowed to be half known, because most of the club's history is,
// and a record that refuses to hold what it half knows stops being used.
//
// What is deliberately *not* a condition: anything about who caught the ball. A
// dismissal naming the bowler as the fielder is **caught and bowled**, which is
// an ordinary way to get out and not a contradiction — an earlier version of
// this file claimed otherwise and quietly withheld real catches.

import { inningsToCheck, type ParsedMatch } from "./cricclubs";
import { unknownDismissals } from "./dismissal";
import type { Resolution } from "./names";
import { reconcileInnings } from "./reconciliation";

/** One reason this match is not being published, in the club's own words. */
export type Hold = {
  /** Which of the three conditions failed. */
  about: "names" | "arithmetic" | "dismissals";
  message: string;
};

/** Something worth saying that is not a reason to hold. */
export type Note = { message: string };

export type Confidence = {
  /** Whether this may go straight to the live site. */
  confident: boolean;
  /** Empty when confident. Each one is a decision somebody has to make. */
  holds: Hold[];
  /** Stated either way, and never a reason to stop. */
  notes: Note[];
};

const list = (written: string[]): string =>
  written.length === 1
    ? written[0]
    : `${written.slice(0, -1).join(", ")} and ${written[written.length - 1]}`;

/**
 * Whether this import is confident, and what it is waiting on if not.
 *
 * `resolutions` comes from lib/names and is the club's own players only — the
 * opposition are display-only and resolve to nobody by design, so an unresolved
 * opposition name is not a thing this can see, which is exactly right.
 */
export function confidenceIn(
  match: ParsedMatch,
  resolutions: Resolution[],
): Confidence {
  const holds: Hold[] = [];
  const notes: Note[] = [];

  // 1. Names.
  const unresolved = resolutions
    .filter((one) => !one.player)
    .map((one) => one.name.spelling);

  if (unresolved.length > 0) {
    holds.push({
      about: "names",
      message:
        unresolved.length === 1
          ? `${unresolved[0]} has not been matched to a player. Answering it above is what this is waiting on — and the answer is kept, so it will not be asked again.`
          : `${unresolved.length} spellings have not been matched to a player: ${list(unresolved)}. Answering them above is what this is waiting on, and each answer is kept.`,
    });
  }

  // 2. Arithmetic. Both innings, because a total that contradicts itself is
  //    worth stopping for whichever side made it.
  const findings = match.innings.flatMap((innings) =>
    reconcileInnings(inningsToCheck(innings)).map((found) => ({
      innings,
      found,
    })),
  );

  for (const { innings, found } of findings) {
    holds.push({
      about: "arithmetic",
      message: `${innings.battingTeam}: ${found.message}`,
    });
  }

  // 3. Dismissal codes.
  const unknown = unknownDismissals(match);
  if (unknown.length > 0) {
    holds.push({
      about: "dismissals",
      message:
        `${list(unknown.map((code) => `“${code}”`))} ${unknown.length === 1 ? "is a dismissal code" : "are dismissal codes"} nothing here recognises. ` +
        "Rather than guess what it credits — a hit wicket read as a catch would credit a fielder who was standing still — the match is held. " +
        "Adding it to lib/dismissal with what it credits is a two-minute job, and the import then goes through.",
    });
  }

  return { confident: holds.length === 0, holds, notes };
}
