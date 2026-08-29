// A Player's career, rolled up per Team - CONTEXT.md's own reasoning for why
// the homepage names its side on every row applies here too (see
// lib/career's byTeam).

import type { TeamSplit } from "@/lib/career";
import styles from "./Splits.module.css";

export function TeamSplits({ splits }: { splits: TeamSplit[] }) {
  if (splits.length === 0) return null;

  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="By side">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Side</th>
            <th scope="col">M</th>
            <th scope="col">Runs</th>
            <th scope="col">Bat avg</th>
            <th scope="col">Wkts</th>
            <th scope="col">Bowl avg</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => (
            <tr key={split.team}>
              <td className={styles.side}>{split.team}</td>
              <td>{split.matches}</td>
              <td>{split.batting.runs}</td>
              <td>{split.batting.average}</td>
              <td>{split.bowling.wickets}</td>
              <td>{split.bowling.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
