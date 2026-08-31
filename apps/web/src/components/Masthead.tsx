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
          reader gains nothing from hearing it announced twice. Traced by hand
          from design/logo.svg (#25) — see design/crest-mark.svg for the
          record of why and design/README.md for the candidates that lost. */}
      <svg
        className={styles.crest}
        viewBox="0 0 100 112"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M8,34 L50,34 L50,104 C22,90 8,74 8,52 L8,34 Z"
          fill="var(--color-accent)"
        />
        <path
          d="M92,34 L50,34 L50,104 C78,90 92,74 92,52 L92,34 Z"
          fill="var(--color-blue)"
        />
        <path d="M8,6 L92,6 L92,34 L8,34 Z" fill="var(--color-red)" />
        <line
          x1="30"
          y1="98"
          x2="72"
          y2="46"
          stroke="var(--color-brass)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <line
          x1="70"
          y1="98"
          x2="28"
          y2="46"
          stroke="var(--color-brass)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="74"
          r="7"
          fill="var(--color-red)"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
        />
        <path
          d="M8,6 L92,6 L92,52 C92,74 78,90 50,104 C22,90 8,74 8,52 Z"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="3"
        />
      </svg>
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
