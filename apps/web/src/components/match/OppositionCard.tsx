import { SectionHeading } from "@/components/SectionHeading";
import { inningsSpoken, type Innings } from "@/lib/match";
import styles from "./OppositionCard.module.css";

/**
 * The opposition's card — a team total and nothing more.
 *
 * Display-only, on purpose: the club keeps Player records, Aliases and career
 * averages for HKU's own side and none of it for the other side (docs/PLAN.md
 * — opposition players are display-only). This card says so, rather than
 * leaving the absence of a batting table looking like an unfinished page.
 */
export function OppositionCard({
  opponent,
  innings,
}: {
  opponent: string;
  innings: Innings;
}) {
  return (
    <section className={styles.card} aria-labelledby="opposition-card">
      <SectionHeading id="opposition-card">{opponent}</SectionHeading>
      <p className={styles.note}>
        Display only — the club keeps no player-by-player record for the
        opposition, only what they scored as a side.
      </p>
      <dl className={styles.figures}>
        <div>
          <dt>Total</dt>
          <dd>{inningsSpoken(innings)}</dd>
        </div>
        {innings.overs && (
          <div>
            <dt>Overs</dt>
            <dd>{innings.overs}</dd>
          </div>
        )}
        {innings.extras !== undefined && (
          <div>
            <dt>Extras</dt>
            <dd>{innings.extras}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
