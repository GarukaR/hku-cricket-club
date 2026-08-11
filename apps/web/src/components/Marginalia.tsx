import styles from "./Marginalia.module.css";

/** A note beside the record — the club's standing facts, and the next Match.
 *
 *  Deliberately shared rather than duplicated: the two are meant to read in one
 *  voice, and the moment they are styled separately the fixture starts growing
 *  back into a headline. */
export function Marginalia({
  children,
  labelledBy,
}: {
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <aside className={styles.marginalia} aria-labelledby={labelledBy}>
      {children}
    </aside>
  );
}
