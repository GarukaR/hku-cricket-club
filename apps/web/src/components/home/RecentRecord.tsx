import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";
import { shortDate } from "@/lib/dates";
import { isPlayed, resultSummary, tone, type Match } from "@/lib/match";
import styles from "./RecentRecord.module.css";

/** The season so far, newest first.
 *
 *  A Match with no Result cannot appear here — a record is of what happened — so
 *  unplayed Matches are filtered rather than rendered as blanks.
 *
 *  Club-wide, and every row names its side. Four sides play under one crest, and
 *  a table that ran them together without saying so would read as one team's
 *  season while being four — the same failure as a career total that silently
 *  omits a season (docs/PLAN.md). */
export function RecentRecord({
  matches,
  season,
}: {
  matches: Match[];
  season?: string;
}) {
  const played = matches.filter(isPlayed);

  if (played.length === 0) return null;

  return (
    <section className={styles.record} aria-labelledby="recent-record">
      <SectionHeading id="recent-record">
        Recent record{season ? ` — ${season}` : ""}
      </SectionHeading>
      <div
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-labelledby="recent-record"
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Side</th>
              <th scope="col">Opponent</th>
              <th scope="col">Ground</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {played.map((match) => (
              <tr key={match.id}>
                <td>
                  <Link className={styles.rowLink} href={`/matches/${match.id}`}>
                    {shortDate(match.date)}
                  </Link>
                </td>
                <td className={styles.side}>{match.team}</td>
                <td className={styles.opponent}>{match.opponent}</td>
                <td>{match.ground}</td>
                <td
                  className={`${styles.outcome} ${styles[tone(match.result.outcome)]}`}
                >
                  {resultSummary(match.result)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
