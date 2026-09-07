import { Container } from "@/components/Container";
import { Scoreline } from "@/components/Scoreline";
import type { Result } from "@/lib/match";
import styles from "./page.module.css";

/** PROTOTYPE ROUTE — throwaway. The scoreline against the cases that break it,
 *  built from literals so it needs no CMS. */
export const metadata = { title: "Scoreline", robots: { index: false } };

const cases: { name: string; result: Result }[] = [
  {
    name: "The reported one — suffix on the second innings, under the rule",
    result: {
      outcome: "won",
      margin: "6 wickets",
      innings: [
        { side: "DLSW Thunder", runs: 120 },
        { side: "HKU", runs: 121, wickets: 4 },
      ],
    },
  },
  {
    name: "Suffix on the FIRST innings — no rule above it, so it should be safe",
    result: {
      outcome: "won",
      margin: "33 runs",
      innings: [
        { side: "HKU", runs: 184, wickets: 6 },
        { side: "Kowloon CC", runs: 151 },
      ],
    },
  },
  {
    name: "Both innings carry one",
    result: {
      outcome: "lost",
      margin: "5 wickets",
      innings: [
        { side: "HKU", runs: 98, wickets: 9 },
        { side: "PolyU", runs: 99, wickets: 5 },
      ],
    },
  },
  {
    name: "Digit widths — 3 against 2, and a two-digit suffix is impossible but 10 is not",
    result: {
      outcome: "won",
      margin: "71 runs",
      innings: [
        { side: "HKU Belchers", runs: 8, wickets: 0 },
        { side: "A Very Long Opposition Name Indeed CC", runs: 245, wickets: 10 },
      ],
    },
  },
];

export default function ScorelinePrototypes() {
  return (
    <>
      <header className={styles.bar}>
        <Container>
          <p className={styles.barTitle}>Scoreline — the wickets suffix</p>
        </Container>
      </header>
      <Container>
        {cases.map(({ name, result }) => (
          <section key={name} className={styles.case}>
            <p className={styles.label}>{name}</p>
            <Scoreline
              result={result}
              team="League XI"
              opponent="Someone"
              facts="Saturday, 21 March · Mission Road · 40 overs"
            />
          </section>
        ))}
      </Container>
    </>
  );
}
