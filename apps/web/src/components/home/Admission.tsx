import Link from "next/link";

import { Container } from "@/components/Container";
import styles from "./Admission.module.css";

/** The club's invitation, and the page's only call to action — through to the
 *  Enquiry form at /enquire (docs/PLAN.md, issue #16). */
export function Admission() {
  return (
    <section
      id="admission"
      className={styles.admission}
      aria-labelledby="admission-heading"
    >
      <Container>
        <h2 id="admission-heading" className={styles.heading}>
          Admission to the Club
        </h2>
        <p className={styles.blurb}>
          New members are received throughout the season. Come to a Wednesday
          net, or write to the Secretary.
        </p>
        <Link className={styles.enquire} href="/enquire">
          Enquire
        </Link>
      </Container>
    </section>
  );
}
