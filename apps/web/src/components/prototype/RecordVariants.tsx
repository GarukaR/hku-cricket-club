// PROTOTYPE — throwaway. Three structurally different mobile layouts for the
// record tables (Recent Record, Fixtures, Squad, scorecards, Leaderboards,
// Splits all share the same `overflow-x: auto` table pattern, which turned
// out to break touch scrolling on iOS Safari — see issue #68). This answers
// "what should it look like instead", not "how do we fix the scroll".
//
// Switchable via `?variant=A|B|C` on the homepage — see PrototypeSwitcher.
// Only Recent Record is prototyped; whichever wins gets applied to the other
// five tables afterwards, since they share one visual language already.

import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";
import { shortDate } from "@/lib/dates";
import { isPlayed, tone, type Match, type Result } from "@/lib/match";
import styles from "./RecordVariants.module.css";

/** Cricket's own shorthand for a margin — "+42", "-6w" — rather than the full
 *  sentence a wider table can afford. Falls back to the outcome word alone
 *  when the margin doesn't parse (drawn, tied, abandoned, or free text the
 *  parser doesn't recognise), because a badge that guesses wrong reads as a
 *  bug rather than as compact. */
function agate(result: Result): { label: string; sign: "+" | "-" | "" } {
  const WORD: Record<Result["outcome"], string> = {
    won: "W",
    lost: "L",
    tied: "Tied",
    drawn: "Drawn",
    abandoned: "Abandoned",
    conceded: "Conceded",
  };

  if (result.outcome !== "won" && result.outcome !== "lost") {
    return { label: WORD[result.outcome], sign: "" };
  }

  const runs = result.margin?.match(/^(\d+)\s*run/i);
  const wickets = result.margin?.match(/^(\d+)\s*wicket/i);
  const figure = runs ? runs[1] : wickets ? `${wickets[1]}w` : undefined;
  const sign = result.outcome === "won" ? "+" : "-";

  return figure ? { label: `${WORD[result.outcome]} ${sign}${figure}`, sign } : { label: WORD[result.outcome], sign: "" };
}

function heading(title: string) {
  return <SectionHeading id="recent-record">{title}</SectionHeading>;
}

/** A — Agate line. No table at all: each match is one dense typographic line,
 *  the way a printed box score or classifieds column sets one. Side and
 *  ground demote to a smaller line underneath rather than their own column,
 *  so nothing needs a column to begin with — there is nothing to cut off. */
export function VariantA({ matches }: { matches: Match[] }) {
  const played = matches.filter(isPlayed);
  return (
    <section className={styles.agateSection} aria-labelledby="recent-record">
      {heading("Recent record — A: Agate line")}
      <ul className={styles.agateList}>
        {played.map((match) => {
          const { label } = agate(match.result);
          return (
            <li key={match.id} className={styles.agateRow}>
              <Link className={styles.agateLink} href={`/matches/${match.id}`}>
                <span className={styles.agateTop}>
                  <span className={styles.agateDate}>{shortDate(match.date)}</span>
                  <span className={styles.agateOpponent}>{match.opponent}</span>
                  <span className={`${styles.agateBadge} ${styles[tone(match.result.outcome)]}`}>
                    {label}
                  </span>
                </span>
                <span className={styles.agateMeta}>
                  {match.team} · {match.ground}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** B — Priority columns. Still a literal table — same markup, same scan
 *  pattern as the desktop version — just Side and Ground dropped, since both
 *  are one tap away on the match's own page. Smallest structural change of
 *  the three. */
export function VariantB({ matches }: { matches: Match[] }) {
  const played = matches.filter(isPlayed);
  return (
    <section className={styles.record} aria-labelledby="recent-record">
      {heading("Recent record — B: Priority columns")}
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Opponent</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {played.map((match) => (
            <tr key={match.id}>
              <td>
                <Link className={styles.rowLink} href={`/matches/${match.id}`}>
                  {shortDate(match.date)}
                </Link>
              </td>
              <td className={styles.opponent}>{match.opponent}</td>
              <td className={`${styles.outcome} ${styles[tone(match.result.outcome)]}`}>
                {agate(match.result).label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** C — Card stack. One bordered card per match; every column becomes its own
 *  line inside it. The standard "responsive table" pattern — included for
 *  comparison even though it reads more like a form than a ledger. */
export function VariantC({ matches }: { matches: Match[] }) {
  const played = matches.filter(isPlayed);
  return (
    <section className={styles.cardSection} aria-labelledby="recent-record">
      {heading("Recent record — C: Card stack")}
      <ul className={styles.cardList}>
        {played.map((match) => (
          <li key={match.id} className={styles.card}>
            <Link className={styles.cardLink} href={`/matches/${match.id}`}>
              <div className={styles.cardHead}>
                <span className={styles.cardOpponent}>{match.opponent}</span>
                <span className={`${styles.cardBadge} ${styles[tone(match.result.outcome)]}`}>
                  {agate(match.result).label}
                </span>
              </div>
              <dl className={styles.cardMeta}>
                <div>
                  <dt>Side</dt>
                  <dd>{match.team}</dd>
                </div>
                <div>
                  <dt>Ground</dt>
                  <dd>{match.ground}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{shortDate(match.date)}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
