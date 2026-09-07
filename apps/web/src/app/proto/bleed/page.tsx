import { Admission } from "@/components/home/Admission";
import { Container } from "@/components/Container";
import { SiteFooter } from "@/components/SiteFooter";
import { FootG } from "@/components/bleed-proto/VariantG";
import { FootH } from "@/components/bleed-proto/VariantH";
import styles from "./page.module.css";

/** PROTOTYPE ROUTE — throwaway.
 *
 *  Each variant is shown twice: once after ordinary prose, which is every page
 *  but one, and once directly under the Admission band, which is the homepage
 *  and the only composition where bleeding could go wrong. */
export const metadata = { title: "Footer bleed", robots: { index: false } };

const options = [
  { key: "Now", name: "Inset (shipped)", line: "The plate stops at the page measure. Paper under it and beside it.", Foot: SiteFooter },
  { key: "G", name: "Bled, imprint on ink", line: "Everything runs to the edges. The sheet ends in ink.", Foot: FootG },
  { key: "H", name: "Bled, imprint on paper", line: "The plate bleeds; the imprint stays on paper beneath it, so the sheet still ends on paper.", Foot: FootH },
];

export default function BleedPrototypes() {
  return (
    <>
      <header className={styles.bar}>
        <Container>
          <p className={styles.barTitle}>Footer — bled or inset</p>
          <p className={styles.barNote}>Throwaway route.</p>
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

          <div className={styles.tail}>
            <Container>
              <p>
                &hellip; and the season continued much as it had begun, with the
                Saturday side two down and the students unbeaten.
              </p>
            </Container>
          </div>
          <Foot />

          <div className={styles.tail}>
            <Container>
              <p className={styles.sub}>
                &darr; the same one, under the Admission band &mdash; the
                homepage, and the only place bleeding could go wrong
              </p>
            </Container>
          </div>
          <Admission />
          <Foot />
        </section>
      ))}
    </>
  );
}
