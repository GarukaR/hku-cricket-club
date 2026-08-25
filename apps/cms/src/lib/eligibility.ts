// The club's eligibility rule, as plain functions.
//
// Two rules, and they are not the same rule seen twice (CONTEXT.md):
//
//   1. **Registration is mutually exclusive.** A Player registered to the
//      league team cannot also be registered to the challenge league team in
//      the same Season. This one is symmetric — neither direction is allowed.
//
//   2. **A call-up is capped, and the cap is one-directional.** A
//      challenge-league Player may appear for the league team at most twice per
//      Season, after which they are not eligible for it again that Season.
//      There is no corresponding route from the league team down: a league
//      player turning out for the challenge league side is not a call-up and is
//      not counted, because the rule does not exist in that direction.
//
// Kept away from Payload so the rule can be tested as a rule. The collections
// supply the counts; this decides what they mean.

/**
 * What a side is *for*, as distinct from what it is called.
 *
 * The eligibility rule is about the league and challenge league sides
 * specifically, and it needs to say which is which. Doing that by name or slug
 * would rest a league rule on a public URL: renaming `/teams/challenge-league`
 * for a tidier address would silently switch the cap off, with nothing to fail
 * and nobody to tell. The committee turns over every year, so the person most
 * likely to rename it is the one least likely to know.
 */
export const TEAM_ROLES = [
  { value: "league", label: "League" },
  { value: "challenge-league", label: "Challenge league" },
  { value: "social", label: "Sunday social" },
  { value: "student", label: "Student" },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["value"];

/** Registration to either of these excludes the other, for one Season. */
const EXCLUSIVE: readonly TeamRole[] = ["league", "challenge-league"];

/** Appearances a challenge-league Player may make for the league team in one
 *  Season before they stop being eligible for it. */
export const CALL_UP_CAP = 2;

function labelFor(role: TeamRole): string {
  return TEAM_ROLES.find((r) => r.value === role)?.label ?? role;
}

/**
 * Whether a proposed Registration can stand alongside the ones already made
 * for that Player in that Season.
 *
 * `existing` is this Player's other registrations *in the same Season* — the
 * caller does the season filtering, because it is the caller that can query.
 * Returns the problem in the club's own words, or `undefined` when there is
 * none.
 */
export function registrationProblem(
  proposed: TeamRole,
  existing: readonly TeamRole[],
): string | undefined {
  if (!EXCLUSIVE.includes(proposed)) return undefined;

  const clash = existing.find(
    (role) => EXCLUSIVE.includes(role) && role !== proposed,
  );
  if (!clash) return undefined;

  return (
    `Already registered to the ${labelFor(clash).toLowerCase()} team this season. ` +
    `A player registered to one of the ${labelFor(EXCLUSIVE[0]).toLowerCase()} ` +
    `and ${labelFor(EXCLUSIVE[1]).toLowerCase()} teams cannot be registered to ` +
    `the other in the same season — register them to one, or end the other ` +
    `registration first.`
  );
}

/**
 * Whether an Appearance is a call-up at all.
 *
 * Only one direction counts: a Player registered to the challenge league side,
 * appearing for the league side. Everything else — a league player turning out
 * for the socials, an unregistered guest, a challenge-league player appearing
 * for their own side — is an ordinary Appearance and is not counted against
 * anything.
 */
export function isCallUp(
  registeredTo: TeamRole | undefined,
  appearingFor: TeamRole | undefined,
): boolean {
  return registeredTo === "challenge-league" && appearingFor === "league";
}

/**
 * How the cap stands, in the form the panel shows it: used of two.
 *
 * `remaining` floors at zero rather than going negative. A player who has
 * somehow made three is over the cap, not owed minus one, and the honest
 * reading of that is "none left" plus a problem to state.
 */
export function callUpsStanding(used: number): {
  used: number;
  cap: number;
  remaining: number;
  exhausted: boolean;
  summary: string;
} {
  const capped = Math.max(0, used);
  return {
    used: capped,
    cap: CALL_UP_CAP,
    remaining: Math.max(0, CALL_UP_CAP - capped),
    exhausted: capped >= CALL_UP_CAP,
    summary: `${capped} of ${CALL_UP_CAP} call-ups used this season`,
  };
}

/**
 * What to say when a further call-up would exceed the cap.
 *
 * A statement, not a refusal. The record has to be able to hold what actually
 * happened — including a side that played someone it should not have — because
 * a record that can only describe a well-run season is not a record. The count
 * is also a floor rather than a certainty: a scorecard lists only the players
 * a scorer entered, so a squad member who neither batted nor bowled can be
 * missing from it entirely (CONTEXT.md). Refusing a save on a number known to
 * undercount would be refusing on evidence that does not support it.
 */
export function callUpProblem(used: number): string | undefined {
  const standing = callUpsStanding(used);
  if (!standing.exhausted) return undefined;

  return (
    `${standing.summary}. A challenge league player is not eligible for the ` +
    `league team again this season. Saved anyway — check this against the ` +
    `league's own record before it is relied on.`
  );
}
