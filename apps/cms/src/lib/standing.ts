// Where a Match stands, for the editor listing them.
//
// Two rules on the public site each hide a Match with no Result, and each is
// right on its own: `nextFixture()` will not announce something whose date has
// passed, and the season table will not print a row for a match nobody has
// scored. Between them sits every match from the final ball until somebody
// enters the score — invisible on the site, and until now indistinguishable in
// the panel from a finished one (#32).
//
// The site keeps both rules. The record is of what happened, and a public table
// listing matches whose outcome the club has not established yet weakens the
// thing the table is for. The problem was never that the public could not see
// it; it is that the committee could not see that they owed it. So the flag
// belongs here, where editors work.
//
// **Computed on read, never stored.** A Match becomes outstanding because a day
// passes, not because anybody writes to it — so there is no save on which a
// stored flag could be set. A column maintained by a write hook would be
// correct only for matches somebody happened to edit after their date, which is
// precisely the set that does not need flagging.

import { OUTCOMES, type Outcome } from "./result";

/** The club plays in one time zone, and "has it happened yet" is a question
 *  about that one. In UTC the boundary moves eight hours and a Saturday morning
 *  match reads as still to come while it is being played. The site's
 *  `nextFixture()` draws the line in the same place, deliberately. */
const CLUB_TIME_ZONE = "Asia/Hong_Kong";

/** What a Match with no Result is called, depending on whether it has been
 *  played. Only the second is a flag; the first is a normal state. */
export const FIXTURE = "Fixture";
export const OUTSTANDING = "Result outstanding";

const LABELS = new Map<string, string>(
  OUTCOMES.map((o) => [o.value, o.label]),
);

/** An ISO date in the club's time zone, so two of them compare as strings. */
function asClubDate(when: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIME_ZONE,
  }).format(when);
}

/**
 * How this Match should be listed in the panel.
 *
 * A recorded outcome is shown as itself — the list has no result column
 * otherwise, so the flag costs nothing and the row gains something. An empty
 * outcome is a fixture while its date is still to come and an outstanding
 * result once it has passed.
 *
 * Today counts as still to come, which is where `nextFixture()` draws the same
 * line: an evening fixture is not an overdue result at breakfast.
 *
 * `now` is a parameter because the whole point is a boundary in time, and a
 * test that cannot move the boundary can only assert today.
 */
export function standingOf(
  match: { date?: string | Date | null; outcome?: string | null },
  now: Date = new Date(),
): string {
  const recorded = match.outcome
    ? LABELS.get(match.outcome as Outcome)
    : undefined;
  if (recorded) return recorded;

  // No date is a half-filled form, not a state worth naming. Say nothing rather
  // than call an incomplete record outstanding.
  if (!match.date) return "";

  const played = new Date(match.date);
  if (Number.isNaN(played.getTime())) return "";

  return asClubDate(played) >= asClubDate(now) ? FIXTURE : OUTSTANDING;
}
