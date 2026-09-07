import { Container } from "@/components/Container";
import { FooterA } from "@/components/footer-proto/FooterA";
import { FooterB } from "@/components/footer-proto/FooterB";
import { FooterC } from "@/components/footer-proto/FooterC";
import styles from "./page.module.css";

/** PROTOTYPE ROUTE — throwaway. Delete this directory and
 *  src/components/footer-proto once a footer is chosen (#TBD).
 *
 *  Three footers on one page, each above a strip of the page it would actually
 *  close, because a footer judged on its own is judged against white space it
 *  will never sit in. */
export const metadata = { title: "Footer prototypes", robots: { index: false } };

const NOTE =
  "The results and figures shown are sample data, entered to exercise the record while the club's own scorecards are imported.";

const options = [
  {
    key: "A",
    name: "The Colophon",
    line: "Centred, words not icons. The masthead's axis closing.",
    Footer: FooterA,
  },
  {
    key: "B",
    name: "The Masthead, Reversed",
    line: "cricket.com.au's three columns at a club's scale. Glyph and word.",
    Footer: FooterB,
  },
  {
    key: "C",
    name: "The Endpaper",
    line: "The bold one: an ink plate, motto leading. Not the crest green — that band is spent on Admission.",
    Footer: FooterC,
  },
];

export default function FooterPrototypes() {
  return (
    <>
      <header className={styles.bar}>
        <Container>
          <p className={styles.barTitle}>Footer prototypes</p>
          <p className={styles.barNote}>
            Throwaway route. Social links are UNCONFIRMED — found by search, not
            supplied by the club.
          </p>
        </Container>
      </header>

      {options.map(({ key, name, line, Footer }) => (
        <section key={key} className={styles.option}>
          <Container>
            <p className={styles.label}>
              <span className={styles.letter}>{key}</span> {name}
            </p>
            <p className={styles.line}>{line}</p>
          </Container>

          {/* A strip of ordinary page above each one, so the footer is read as
              the end of something rather than as a standalone component. */}
          <div className={styles.tail}>
            <Container>
              <p>
                &hellip; and the season continued much as it had begun, with the
                Saturday side two down and the students unbeaten.
              </p>
            </Container>
          </div>

          <Footer note={NOTE} />
        </section>
      ))}
    </>
  );
}
