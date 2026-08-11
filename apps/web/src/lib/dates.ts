// Match dates are stored once, in ISO form, and formatted where they are read.
//
// The page shows the same date at two widths — "Sat 25 April" over the scoreline,
// "25 Apr" in the record table — and holding both as strings is how the two
// silently disagree. Everything here is explicitly UTC: a date-only value has no
// time zone, and letting the server's zone decide moves a Saturday fixture to
// Friday for half the world.

const UTC = "UTC";

function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "Sat 25 April" — the fixture as a notice would print it. */
export function longDate(iso: string): string {
  return utc(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: UTC,
  });
}

const SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: UTC,
});

/** "25 Apr" — the archive table's date column, where the year is in the heading.
 *
 *  The month is cut to three letters rather than taken as the locale gives it:
 *  en-GB abbreviates September to "Sept" and every other month to three, and the
 *  record's date column is set nowrap in tabular figures precisely so it holds one
 *  width. The club's season opens in September, so this is not hypothetical. */
export function shortDate(iso: string): string {
  const parts = SHORT.formatToParts(utc(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")} ${value("month").slice(0, 3)}`;
}
