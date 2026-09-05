// A Player's career, split by Team and by Season - the finest grain the
// record slices it by, and the one a challenge-league Player's call-ups
// belong to (CONTEXT.md - Call-up).

import { ScrollFade } from "@/components/ScrollFade";
import { seasonSplitKey, type SeasonSplit } from "@/lib/career";
import styles from "./Splits.module.css";

export function SeasonSplits({
  splits,
  callUps,
}: {
  splits: SeasonSplit[];
  /**
   * Keyed by Season name alone. A call-up is a Registration to the
   * *challenge league* side that shows up as Appearances for the *league*
   * side (CONTEXT.md), so the Team a call-up is registered under and the
   * Team its Appearances land under are never the same row - only the
   * Season the two ever agree on. Blank for every Registration but a
   * challenge-league one, since the rule runs one way only.
   */
  callUps: Map<string, string>;
}) {
  if (splits.length === 0) return null;

  // Attached only to the *league*-role row for that Season, never to the
  // Player's own registered-Team row: a call-up happened for the league
  // side, and a Player who also has real Appearances for their own
  // challenge-league Team that Season must not have the same figure printed
  // against both.
  const callUpsFor = (split: SeasonSplit): string | undefined =>
    split.teamRole === "league" ? callUps.get(split.season) : undefined;

  const showCallUps = splits.some((split) => callUpsFor(split) !== undefined);

  return (
    <ScrollFade className={styles.frame}>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label="By side and season">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Side</th>
              <th scope="col">Season</th>
              <th scope="col">M</th>
              <th scope="col">Runs</th>
              <th scope="col">Bat avg</th>
              <th scope="col">Wkts</th>
              <th scope="col">Bowl avg</th>
              {showCallUps && <th scope="col">Call-ups</th>}
            </tr>
          </thead>
          <tbody>
            {splits.map((split) => (
              <tr key={seasonSplitKey(split.team, split.season)}>
                <td className={styles.side}>{split.team}</td>
                <td>{split.season}</td>
                <td>{split.matches}</td>
                <td>{split.batting.runs}</td>
                <td>{split.batting.average}</td>
                <td>{split.bowling.wickets}</td>
                <td>{split.bowling.average}</td>
                {showCallUps && <td className={styles.side}>{callUpsFor(split) ?? ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollFade>
  );
}
