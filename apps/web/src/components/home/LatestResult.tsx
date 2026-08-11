import { SectionHeading } from "@/components/SectionHeading";
import { longDate } from "@/lib/dates";
import { inningsSpoken, verdict, type Innings, type ScoredMatch } from "@/lib/match";
import styles from "./LatestResult.module.css";

/** The club's last result, at display scale — the page's one hero.
 *
 *  Takes a whole Match rather than loose figures, so it will read a Match out of
 *  the CMS unchanged. */
export function LatestResult({ match }: { match: ScoredMatch }) {
  const [first, second] = match.result.innings;

  return (
    <section aria-labelledby="latest-result">
      <SectionHeading id="latest-result">
        Last result{match.competition ? ` — ${match.competition}` : ""}
      </SectionHeading>

      <InningsLine innings={first} />
      <InningsLine innings={second} second />

      <p className={styles.verdict}>
        <strong className={styles.outcome}>{verdict(match.result)}</strong>
        <span className={styles.where}>
          {longDate(match.date)} · {match.ground} · {match.format}
        </span>
      </p>
    </section>
  );
}

function InningsLine({
  innings,
  second = false,
}: {
  innings: Innings;
  second?: boolean;
}) {
  return (
    <div className={second ? `${styles.innings} ${styles.second}` : styles.innings}>
      <span className={styles.side}>{innings.side}</span>
      {/* The figure is printed for the eye and spoken separately, because the
          hanging suffix would otherwise be read as "184 slash 6". */}
      <span className={styles.runs}>
        <span aria-hidden="true">
          {innings.runs}
          {innings.wickets !== undefined && (
            <sup className={styles.wickets}>/{innings.wickets}</sup>
          )}
        </span>
        <span className="visually-hidden">{inningsSpoken(innings)}</span>
      </span>
    </div>
  );
}
