import styles from "./Container.module.css";

/** The page measure. Everything sits inside one, including the content of the
 *  full-bleed bands — those bleed their background, never their text. */
export function Container({ children }: { children: React.ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
