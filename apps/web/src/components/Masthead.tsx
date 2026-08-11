import styles from "./Masthead.module.css";

/** The club's letterhead.
 *
 *  `standfirst` folds the club's opening statement up into the letterhead, above
 *  the double rule. It is a prop rather than fixed copy because only the homepage
 *  introduces the club; an inner page carries the same letterhead without one. */
export function Masthead({ standfirst }: { standfirst?: React.ReactNode }) {
  return (
    <div className={styles.masthead}>
      {/* Decorative: the name is spelled out immediately below, and a screen
          reader gains nothing from hearing "HKU" first. */}
      <div className={styles.arms} aria-hidden="true">
        <b>HKU</b>
      </div>
      <h1 className={styles.name}>
        The Hong Kong University
        <br />
        Cricket Club
      </h1>
      <p className={styles.place}>Founded MCMXIII · Sandy Bay · Pok Fu Lam</p>
      {standfirst && <p className={styles.standfirst}>{standfirst}</p>}
      <div className={styles.rule} />
    </div>
  );
}
