// Every Match a Player has an Appearance for, newest first, each linking to
// the Match's own page (issue #14's own acceptance criteria).

import Link from "next/link";

import type { Appearance } from "@/lib/appearance";
import { shortDate } from "@/lib/dates";
import type { AppearanceRecord } from "@/lib/players";
import styles from "./Splits.module.css";

/** "45", "12*", or, for an Appearance with no batting detail, "did not bat" -
 *  never blank, since that would read as a Player who batted for nought
 *  (CONTEXT.md - Did not bat). */
function battingLine(appearance: Appearance): string {
  if (!appearance.batted) return "did not bat";
  const runs = appearance.batting?.runs ?? 0;
  return `${runs}${appearance.batting?.notOut ? "*" : ""}`;
}

/** "3/28", or an en dash for an Appearance with no bowling at all. */
function bowlingLine(appearance: Appearance): string {
  if (!appearance.bowled) return "–";
  return `${appearance.bowling?.wickets ?? 0}/${appearance.bowling?.runs ?? 0}`;
}

export function MatchLog({ records }: { records: AppearanceRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="Matches">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Opponent</th>
            <th scope="col">Side</th>
            <th scope="col">Batting</th>
            <th scope="col">Bowling</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.matchId}>
              <td>
                <Link href={`/matches/${record.matchId}`}>{shortDate(record.date)}</Link>
              </td>
              <td>{record.opponent}</td>
              <td className={styles.side}>{record.team}</td>
              <td>{battingLine(record.appearance)}</td>
              <td>{bowlingLine(record.appearance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
