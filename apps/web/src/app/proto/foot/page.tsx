import { Container } from "@/components/Container";
import { FootD, FootE, FootF } from "@/components/foot-proto/Variants";
import styles from "./page.module.css";

/** PROTOTYPE ROUTE — throwaway. */
export const metadata = { title: "Footer foot", robots: { index: false } };

const options = [
  { key: "D", name: "Centred, as-is", line: "The minimum change: the same two rows, centred instead of pushed to the edges. Note gone.", Foot: FootD },
  { key: "E", name: "Index on the plate", line: "The index moves up onto the ink, under the channels. Only the imprint is left on paper — one line, so there is nothing left to misalign.", Foot: FootE },
  { key: "F", name: "Imprint first", line: "Centred, imprint leading, index as the last line on the sheet.", Foot: FootF },
];

export default function FootPrototypes() {
  return (
    <>
      <header className={styles.bar}>
        <Container>
          <p className={styles.barTitle}>Footer — centring the foot</p>
          <p className={styles.barNote}>
            Throwaway route. The sample-content note is removed from all three.
          </p>
        </Container>
      </header>

      {options.map(({ key, name, line, Foot }) => (
        <section key={key} className={styles.option}>
          <Container>
            <p className={styles.label}>
              <span className={styles.letter}>{key}</span> {name}
            </p>
            <p className={styles.line}>{line}</p>
          </Container>
          <Foot />
        </section>
      ))}
    </>
  );
}
