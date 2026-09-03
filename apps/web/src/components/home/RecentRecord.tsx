import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";
import { shortDate } from "@/lib/dates";
import { isPlayed, resultBadge, tone, type Match } from "@/lib/match";
import styles from "./RecentRecord.module.css";

/** The season so far, newest first.
 *
 *  A Match with no Result cannot appear here — a record is of what happened — so
 *  unplayed Matches are filtered rather than rendered as blanks.
 *
 *  Club-wide, and every row names its side. Four sides play under one crest, and
 *  a table that ran them together without saying so would read as one team's
 *  season while being four — the same failure as a career total that silently
 *  omits a season (docs/PLAN.md).
 *
 *  Set as one dense typographic line per match — date, opponent, result badge —
 *  rather than a table, after a `?variant=` prototype compared against a table
 *  with dropped columns and a card stack (issue #68). A table here always needs
 *  a column a phone doesn't have room for; a line never does, because there is
 *  no column to run out of — side and ground demote to a smaller line
 *  underneath instead. The choice also sidesteps what sent the table looking
 *  for a replacement in the first place: the scrollable table it replaces relied
 *  on horizontal touch scroll, which turned out to be unreliable on iOS Safari
 *  for this markup. */
export function RecentRecord({
  matches,
  season,
  id = "recent-record",
  title,
}: {
  matches: Match[];
  season?: string;
  /** Unique when more than one of these lands on the same page — the Archive
   *  page renders one per season, and duplicate ids break the labelling this
   *  otherwise relies on. Defaults to the homepage's original id, so its own
   *  call site needs no change. */
  id?: string;
  /** Overrides the computed "Recent record — {season}" heading. The Archive
   *  page passes the season name alone: under its own "Archive" heading,
   *  "Recent record — 2025/26" for a season two years gone reads as a
   *  contradiction, whereas "2025/26" on its own reads as an index entry. */
  title?: string;
}) {
  const played = matches.filter(isPlayed);

  if (played.length === 0) return null;

  return (
    <section className={styles.record} aria-labelledby={id}>
      <SectionHeading id={id}>
        {title ?? `Recent record${season ? ` — ${season}` : ""}`}
      </SectionHeading>
      <ul className={styles.list}>
        {played.map((match) => (
          <li key={match.id} className={styles.row}>
            <Link className={styles.rowLink} href={`/matches/${match.id}`}>
              <span className={styles.line}>
                <span className={styles.date}>{shortDate(match.date)}</span>
                <span className={styles.opponent}>{match.opponent}</span>
                <span
                  className={`${styles.badge} ${styles[tone(match.result.outcome)]}`}
                >
                  {resultBadge(match.result)}
                </span>
              </span>
              <span className={styles.meta}>
                {match.team} · {match.ground}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
