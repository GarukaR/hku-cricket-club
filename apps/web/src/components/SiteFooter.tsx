import { Container } from "@/components/Container";
import styles from "./SiteFooter.module.css";

/** The club's address line, and — while the record is still sample data — a note
 *  saying so.
 *
 *  `note` is a prop so that deleting the disclosure is a one-line change at the
 *  page, on the day the importer supplies real Matches. */
export function SiteFooter({ note }: { note?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      <Container>
        <p>
          The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong
          Kong
        </p>
        {note && <p className={styles.note}>{note}</p>}
      </Container>
    </footer>
  );
}
