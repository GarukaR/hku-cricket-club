import { Container } from "@/components/Container";
import styles from "./Admission.module.css";

/** The club's invitation, and the page's only call to action.
 *
 *  PLACEHOLDER DESTINATION. The enquiry route is its own v1 ticket and the club
 *  has not given a contact address yet, so the button holds "#" rather than an
 *  invented mailbox or a route that would 404. It is the last placeholder left on
 *  this page and the only one a visitor can walk into. */
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
        <a className={styles.enquire} href="#">
          Enquire
        </a>
      </Container>
    </section>
  );
}
