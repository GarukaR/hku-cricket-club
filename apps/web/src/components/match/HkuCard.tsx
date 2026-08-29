import { SectionHeading } from "@/components/SectionHeading";
import {
  dismissal,
  economyRate,
  strikeRate,
  type Appearance,
} from "@/lib/appearance";
import styles from "./HkuCard.module.css";

/**
 * HKU's full card for a Match — batting, bowling and fielding in full, one row
 * per Appearance (CONTEXT.md).
 *
 * **Did not bat** is printed as its own list rather than as blank cells in the
 * batting table: an Appearance with `batted` false was in the XI, and a row of
 * dashes would read as a batter who scored nothing rather than one who was
 * never needed. **Did not play** has no representation here at all — it is
 * simply not among these Appearances, which is the whole distinction
 * (CONTEXT.md).
 */
export function HkuCard({
  team,
  appearances,
}: {
  team: string;
  appearances: Appearance[];
}) {
  const batted = appearances.filter((a) => a.batted);
  const didNotBat = appearances.filter((a) => !a.batted);
  const bowled = appearances.filter((a) => a.bowled);
  const fielded = appearances.filter(
    (a) =>
      (a.fielding?.catches ?? 0) > 0 ||
      (a.fielding?.runOuts ?? 0) > 0 ||
      (a.fielding?.stumpings ?? 0) > 0,
  );

  return (
    <section className={styles.card} aria-labelledby="hku-card">
      <SectionHeading id="hku-card">{team}</SectionHeading>

      {batted.length > 0 && (
        <div className={styles.scroll} tabIndex={0} role="region" aria-label="Batting">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Batter</th>
                <th scope="col">R</th>
                <th scope="col">B</th>
                <th scope="col">4s</th>
                <th scope="col">6s</th>
                <th scope="col">SR</th>
                <th scope="col">How out</th>
              </tr>
            </thead>
            <tbody>
              {batted.map((a) => (
                <tr key={a.player}>
                  <td>{a.player}</td>
                  <td>{a.batting?.runs ?? "–"}</td>
                  <td>{a.batting?.balls ?? "–"}</td>
                  <td>{a.batting?.fours ?? "–"}</td>
                  <td>{a.batting?.sixes ?? "–"}</td>
                  <td>{strikeRate(a.batting)}</td>
                  <td className={styles.howOut}>{dismissal(a.batting)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {didNotBat.length > 0 && (
        <p className={styles.didNotBat}>
          <span>Did not bat</span> {didNotBat.map((a) => a.player).join(", ")}
        </p>
      )}

      {bowled.length > 0 && (
        <div className={styles.scroll} tabIndex={0} role="region" aria-label="Bowling">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Bowler</th>
                <th scope="col">O</th>
                <th scope="col">M</th>
                <th scope="col">R</th>
                <th scope="col">W</th>
                <th scope="col">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowled.map((a) => (
                <tr key={a.player}>
                  <td>{a.player}</td>
                  <td>{a.bowling?.overs ?? "–"}</td>
                  <td>{a.bowling?.maidens ?? "–"}</td>
                  <td>{a.bowling?.runs ?? "–"}</td>
                  <td>{a.bowling?.wickets ?? "–"}</td>
                  <td>{economyRate(a.bowling)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fielded.length > 0 && (
        <p className={styles.fielding}>
          <span>Fielding</span>{" "}
          {fielded
            .map((a) => {
              const parts = [
                a.fielding?.catches && `${a.fielding.catches}c`,
                a.fielding?.stumpings && `${a.fielding.stumpings}st`,
                a.fielding?.runOuts && `${a.fielding.runOuts}ro`,
              ].filter(Boolean);
              return `${a.player} (${parts.join(", ")})`;
            })
            .join(", ")}
        </p>
      )}
    </section>
  );
}
