// How a Match ended, and the rules that keep the two halves of that from
// disagreeing.
//
// The outcome and its margin are both recorded rather than computed. Working a
// margin out means handling ties, abandonments, concessions and rain-adjusted
// targets, and whoever entered the match already knew the answer (docs/PLAN.md).
// What recording it costs is the chance of a stated margin contradicting the
// stated outcome, and that is what this module is.

/** The six ways a Match ends, in the order an editor meets them. */
export const OUTCOMES = [
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "drawn", label: "Drawn" },
  { value: "tied", label: "Tied" },
  { value: "abandoned", label: "Abandoned" },
  { value: "conceded", label: "Conceded" },
] as const;

export type Outcome = (typeof OUTCOMES)[number]["value"];

/**
 * Only a win and a loss have a margin. A tie is level by definition, a draw and
 * an abandonment never reached one, and a concession was not played.
 */
const HAS_MARGIN: readonly Outcome[] = ["won", "lost"];

/** A side is all out at ten, so no chase can be won by more. */
const WICKETS_IN_A_SIDE = 10;

/**
 * A Result as the CMS holds it, with every part optional — this is handed the
 * half-filled form an editor is looking at, not a finished record.
 */
export type ResultDraft = {
  outcome?: Outcome | null;
  margin?: { value?: number | null; unit?: "runs" | "wickets" | null } | null;
  innings?: unknown[] | null;
};

const LABEL = new Map<Outcome, string>(
  OUTCOMES.map(({ value, label }) => [value, label]),
);

/**
 * What is wrong with a Result, if anything, as a sentence for the editor.
 *
 * Undefined for a Match that has not been played: a scheduled fixture and a
 * completed game are one record at two points in its life (CONTEXT.md), so an
 * empty Result is the ordinary state of half the record rather than a gap in it.
 */
export function resultProblem(
  result: ResultDraft | undefined | null,
): string | undefined {
  const outcome = result?.outcome ?? undefined;
  const value = result?.margin?.value ?? undefined;
  const unit = result?.margin?.unit ?? undefined;
  const played = Boolean(outcome);

  if (!played) {
    if (value !== undefined || unit !== undefined) {
      return "A match with no outcome has not been played yet, so it cannot have a margin.";
    }
    if (result?.innings?.length) {
      return "A match with no outcome has not been played yet, so it cannot have innings.";
    }
    return undefined;
  }

  if (!HAS_MARGIN.includes(outcome as Outcome)) {
    if (value !== undefined || unit !== undefined) {
      return `A ${LABEL.get(outcome as Outcome)?.toLowerCase()} match has no margin — clear it.`;
    }
    return undefined;
  }

  // Both halves or neither. Half a margin prints as "Won by 33" or "Won by
  // wickets", and the missing half is not recoverable from anywhere else.
  if (value === undefined && unit === undefined) return undefined;
  if (unit === undefined) return "Say whether the margin is runs or wickets.";
  if (value === undefined) return "Say how many.";

  if (!Number.isInteger(value) || value < 1) {
    return "A margin is at least one run or one wicket. A match won by nothing is a tie.";
  }
  if (unit === "wickets" && value > WICKETS_IN_A_SIDE) {
    return `A side has ten wickets, so no match is won by ${value}.`;
  }

  return undefined;
}
