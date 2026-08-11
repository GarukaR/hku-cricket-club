import { SectionHeading } from "@/components/SectionHeading";
import { plates } from "@/content/club";
import styles from "./Plates.module.css";

/** PLACEHOLDER SECTION — reserved plates.
 *
 *  The club's photographs are outstanding (docs/PLAN.md defers them to v1.1), so
 *  each plate is an empty engraved frame with its caption. When real images land
 *  these become next/image, and the captions stay. */
export function Plates() {
  return (
    <section className={styles.section} aria-labelledby="plates">
      <SectionHeading id="plates">Plates</SectionHeading>
      <div className={styles.grid}>
        {plates.map((caption) => (
          <figure key={caption} className={styles.figure}>
            <div className={styles.plate} />
            <figcaption className={styles.caption}>{caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
