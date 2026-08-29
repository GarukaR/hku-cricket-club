import { inningsSpoken, verdict, type Innings, type Result } from "@/lib/match";
import styles from "./Scoreline.module.css";

/**
 * A Result at display scale — the letterpress scoreline, D1's structure set
 * entirely in D2's materials (docs/PLAN.md).
 *
 * Shared between the homepage's last result and a Match's own page, because
 * both are the same fact told at the same scale: the club's most recent
 * result is not a different kind of thing from any other result in the
 * record, only a more recent one.
 *
 * The scoreline is a two-line device, and not every Result has one: a scorer
 * may have recorded the outcome and not the totals, and a two-innings game has
 * four. Those still lead at the same scale, as the verdict itself, because a
 * result is the news whether or not the figures behind it were written down.
 */
export function Scoreline({
  result,
  team,
  opponent,
  facts,
}: {
  result: Result;
  /** The club's own side, printed in place of the verdict when there is no
   *  scoreline to carry it — the homepage's record is club-wide, so a bare
   *  result still has to say whose it was. */
  team: string;
  opponent: string;
  /** The standing facts set beside the verdict — date, ground, format. */
  facts?: string;
}) {
  const innings = result.innings;

  return (
    <>
      {innings ? (
        <>
          <InningsLine innings={innings[0]} />
          <InningsLine innings={innings[1]} second />
        </>
      ) : (
        <div className={styles.bare}>
          <span className={styles.side}>v {opponent}</span>
          <strong className={styles.stated}>{verdict(result)}</strong>
        </div>
      )}

      <p className={styles.verdict}>
        {/* With a scoreline above, the verdict is what the figures add up to
            and is stated here. Without one it has already been said at scale,
            and saying it twice would read as a mistake — the team's own side
            is printed instead. */}
        {innings ? (
          <strong className={styles.outcome}>{verdict(result)}</strong>
        ) : (
          <strong className={styles.outcome}>{team}</strong>
        )}
        {facts && <span className={styles.where}>{facts}</span>}
      </p>
    </>
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
