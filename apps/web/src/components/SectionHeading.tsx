import styles from "./SectionHeading.module.css";

/** The standing head for a section of the record. `id` exists so the section it
 *  heads can be labelled by it rather than repeating the words. */
export function SectionHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className={styles.heading}>
      {children}
    </h2>
  );
}
