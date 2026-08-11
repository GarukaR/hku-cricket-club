import { Marginalia } from "@/components/Marginalia";
import { SectionHeading } from "@/components/SectionHeading";
import { longDate } from "@/lib/dates";
import type { Match } from "@/lib/match";
import styles from "./NextMatch.module.css";

/** The next Match, in the margin.
 *
 *  A Match with no Result yet — the same record the scoreline above will show
 *  once it has been played. It is deliberately set as marginalia: the club's
 *  result is the news, and a countdown clock belongs to a broadcast, not to a
 *  printed record. */
export function NextMatch({ match }: { match: Match }) {
  return (
    <Marginalia labelledBy="next-match">
      <SectionHeading id="next-match">Next fixture</SectionHeading>
      <span className={styles.opponent}>{match.opponent}</span>
      <dl>
        <dt>When</dt>
        <dd>
          {longDate(match.date)}
          {match.time ? `, ${match.time}` : ""}
        </dd>
        <dt>Ground</dt>
        <dd>
          {match.ground} · {match.venue}
        </dd>
        <dt>Format</dt>
        <dd>{match.format}</dd>
      </dl>
    </Marginalia>
  );
}
