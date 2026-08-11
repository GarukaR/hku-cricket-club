import { SectionHeading } from "@/components/SectionHeading";
import { shortDate } from "@/lib/dates";
import { isPlayed, resultSummary, tone, type Match } from "@/lib/match";
import styles from "./RecentRecord.module.css";

/** The season so far, newest first.
 *
 *  A Match with no Result cannot appear here — a record is of what happened — so
 *  unplayed Matches are filtered rather than rendered as blanks. */
export function RecentRecord({
  matches,
  season,
}: {
  matches: Match[];
  season: string;
}) {
  const played = matches.filter(isPlayed);

  if (played.length === 0) return null;

  return (
    <section className={styles.record} aria-labelledby="recent-record">
      <SectionHeading id="recent-record">Recent record — {season}</SectionHeading>
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
              <th scope="col">Opponent</th>
              <th scope="col">Ground</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {played.map((match) => (
              <tr key={`${match.date}-${match.opponent}`}>
                <td>{shortDate(match.date)}</td>
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
