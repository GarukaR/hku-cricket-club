// One set of Career figures — batting, bowling and fielding, all derived
// (CONTEXT.md — Career figures). Used for the club-wide career total; the
// per-side and per-season splits show the same figures at a glance, in
// TeamSplits and SeasonSplits instead.

import { SectionHeading } from "@/components/SectionHeading";
import type { BattingFigures, BowlingFigures, FieldingFigures } from "@/lib/career";
import styles from "./CareerStats.module.css";

export function CareerStats({
  headingId,
  matches,
  batting,
  bowling,
  fielding,
}: {
  headingId: string;
  matches: number;
  batting: BattingFigures;
  bowling: BowlingFigures;
  fielding: FieldingFigures;
}) {
  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId}>Career</SectionHeading>
      <p className={styles.matches}>
        {matches} {matches === 1 ? "match" : "matches"}
      </p>

      <h3 className={styles.subheading}>Batting</h3>
      <dl className={styles.figures}>
        <Stat label="Innings" value={batting.innings} />
        <Stat label="Not outs" value={batting.notOuts} />
        <Stat label="Runs" value={batting.runs} />
        <Stat label="Average" value={batting.average} />
        <Stat label="Strike rate" value={batting.strikeRate} />
        <Stat label="High score" value={batting.highScore} />
        <Stat label="50s" value={batting.fifties} />
        <Stat label="100s" value={batting.hundreds} />
        <Stat label="Ducks" value={batting.ducks} />
        <Stat label="Boundaries" value={batting.boundaries} />
      </dl>

      <h3 className={styles.subheading}>Bowling</h3>
      <dl className={styles.figures}>
        <Stat label="Overs" value={bowling.overs} />
        <Stat label="Maidens" value={bowling.maidens} />
        <Stat label="Runs" value={bowling.runs} />
        <Stat label="Wickets" value={bowling.wickets} />
        <Stat label="Average" value={bowling.average} />
        <Stat label="Economy" value={bowling.economy} />
        <Stat label="Strike rate" value={bowling.strikeRate} />
        <Stat label="Best figures" value={bowling.bestFigures} />
        <Stat label="3-fors" value={bowling.threeFors} />
        <Stat label="5-fors" value={bowling.fiveFors} />
      </dl>

      <h3 className={styles.subheading}>Fielding</h3>
      <dl className={styles.figures}>
        <Stat label="Catches" value={fielding.catches} />
        <Stat label="Stumpings" value={fielding.stumpings} />
        <Stat label="Run outs" value={fielding.runOuts} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
