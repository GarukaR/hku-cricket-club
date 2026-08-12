// The forms the club writes things down in.
//
// Each of these guards a field an editor types into by hand, and each exists
// because the wrong form is not merely untidy — it is a different fact. A season
// written `2025-26` will not match the one written `2025/26` when the importer
// looks one up; `28.75` overs is not a figure any scorer ever wrote.
//
// They are `…Problem` functions rather than booleans: Payload wants the sentence
// an editor reads, and the sentence is the part worth testing. Undefined means
// there is nothing wrong.

/** How the club writes a Season: two consecutive years, `2025/26`. */
const SEASON = /^(\d{4})\/(\d{2})$/;

/**
 * A Season, written as the club writes it (CONTEXT.md).
 *
 * Required — a season is the axis every figure is sliced by, and a blank one
 * cannot be corrected later by looking at the record.
 */
export function seasonProblem(value: string | undefined): string | undefined {
  const written = value?.trim() ?? "";
  if (!written) return "A season is needed, written as 2025/26.";

  const match = SEASON.exec(written);
  if (!match) {
    return `Write the season as the club writes it — 2025/26, not "${written}".`;
  }

  // A season spans two consecutive years by definition. 1999/00 is the same
  // rule as 2025/26 once the century rolls over, so compare modulo 100.
  const [, start, end] = match;
  const following = (Number(start) + 1) % 100;
  if (Number(end) !== following) {
    return `A season spans two consecutive years, so ${start} pairs with ${String(following).padStart(2, "0")}, not ${end}.`;
  }

  return undefined;
}

/**
 * Overs in balls notation — whole overs, then a dot, then balls 1 to 5.
 *
 * The one figure on a scorecard that is not a number. `28.3` is 28 overs and 3
 * balls, which is 171 deliveries, and treating the `.3` as three tenths puts
 * every economy rate slightly and invisibly wrong. A sixth ball completes the
 * over, so `.6` cannot occur.
 *
 * Optional: a match nobody recorded the overs for is half-known history, which
 * the CMS stores rather than refuses (docs/PLAN.md).
 */
export function oversProblem(value: string | undefined): string | undefined {
  const written = value?.trim() ?? "";
  if (!written) return undefined;

  if (!/^\d+(\.[0-5])?$/.test(written)) {
    return `Overs are balls, not decimals — 28.3 is 28 overs and 3 balls. "${written}" is not a figure a scorer would write.`;
  }

  return undefined;
}

/**
 * A start time on the 24-hour clock, `14:00`.
 *
 * Only a Match not yet played needs one, so it is optional; a result never
 * states when the game began. 24-hour because `2:00` is a fixture nobody turns
 * up to, and Hong Kong club cricket starts in the afternoon.
 */
export function startTimeProblem(
  value: string | undefined,
): string | undefined {
  const written = value?.trim() ?? "";
  if (!written) return undefined;

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(written)) {
    return `Write the start time on the 24-hour clock — 14:00, not "${written}".`;
  }

  return undefined;
}

/**
 * The part of a URL that names a thing — lower case, words joined by single
 * hyphens.
 *
 * Hand-typed rather than generated from the name on purpose: a slug that
 * follows the name is a URL that changes when somebody fixes a capital letter,
 * and every link to it dies quietly.
 */
export function slugProblem(value: string | undefined): string | undefined {
  const written = value?.trim() ?? "";
  if (!written) return "A web address is needed, like challenge-league.";

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(written)) {
    return `Use lower-case words joined by single hyphens — challenge-league, not "${written}".`;
  }

  return undefined;
}

/**
 * A Competition as it is said out loud: the competition, then its division.
 *
 * Not every competition has a division — the University Cricket League is
 * entered undivided — and this is the one place that knows the missing one
 * drops the space rather than trailing it. A division with no competition in
 * front of it names nothing, so it yields nothing rather than a bare "Div 2".
 */
export function competitionLabel(
  name: string | undefined,
  division: string | undefined,
): string {
  const named = name?.trim();
  if (!named) return "";
  return [named, division?.trim()].filter(Boolean).join(" ");
}

/**
 * A Match named in one line, for the admin panel's title and for every list
 * that will later point at one.
 *
 * The date leads because a club's record is a sequence: an editor scrolling a
 * season sees four fixtures against the same university, and the opponent alone
 * distinguishes none of them. It stays in ISO form here — this is a label in an
 * editing tool, where sorting and unambiguity beat a prettily printed date.
 */
export function matchSummary(
  date: string | undefined,
  opponent: string | undefined,
): string {
  const day = date?.trim().slice(0, 10);
  const against = opponent?.trim();
  return [day, against && `v ${against}`].filter(Boolean).join(" ");
}
