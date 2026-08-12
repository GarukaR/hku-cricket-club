import { SectionHeading } from "@/components/SectionHeading";
import { longDate } from "@/lib/dates";
import {
  facts,
  inningsSpoken,
  verdict,
  type Innings,
  type PlayedMatch,
} from "@/lib/match";
import styles from "./LatestResult.module.css";

/** The club's last result, at display scale — the page's one hero.
 *
 *  Takes a whole Match rather than loose figures, so it reads a Match out of the
 *  CMS unchanged.
 *
 *  The scoreline is a two-line device, and not every result has one: a scorer
 *  may have recorded the outcome and not the totals, and a two-innings game has
 *  four. Those still lead the page — as the verdict itself, set at the same
 *  scale — because a club's most recent result is the news whether or not the
 *  figures behind it were written down. */
export function LatestResult({ match }: { match: PlayedMatch }) {
  const innings = match.result.innings;

  return (
    <section aria-labelledby="latest-result">
      <SectionHeading id="latest-result">
        Last result{match.competition ? ` — ${match.competition}` : ""}
      </SectionHeading>

      {innings ? (
        <>
          <InningsLine innings={innings[0]} />
          <InningsLine innings={innings[1]} second />
        </>
      ) : (
        <div className={styles.bare}>
          <span className={styles.side}>v {match.opponent}</span>
          <strong className={styles.stated}>{verdict(match.result)}</strong>
        </div>
      )}

      <p className={styles.verdict}>
        {/* With a scoreline above, the verdict is what the figures add up to and
            is stated here. Without one it has already been said at scale, and
            saying it twice would read as a mistake. */}
        {innings ? (
          <strong className={styles.outcome}>{verdict(match.result)}</strong>
        ) : (
          <strong className={styles.outcome}>{match.team}</strong>
        )}
        <span className={styles.where}>
          {facts(longDate(match.date), match.ground, match.format)}
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
