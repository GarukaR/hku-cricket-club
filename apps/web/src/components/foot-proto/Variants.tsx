import Link from "next/link";

import { Facebook, Instagram, YouTube } from "@/components/ChannelMarks";
import { Container } from "@/components/Container";
import { channels, navItems } from "@/content/club";
import styles from "./Variants.module.css";

/** PROTOTYPE — throwaway, see /proto/foot. Three ways to centre the band under
 *  the plate, with the sample-content note gone from all of them. */

const marks = { Instagram, Facebook, YouTube } as const;

function Plate({ withIndex = false }: { withIndex?: boolean }) {
  return (
    <div className={styles.plate}>
      <svg className={styles.crest} viewBox="0 0 100 112" aria-hidden="true" focusable="false">
        <path d="M8,34 L50,34 L50,104 C22,90 8,74 8,52 L8,34 Z" fill="var(--color-accent)" />
        <path d="M92,34 L50,34 L50,104 C78,90 92,74 92,52 L92,34 Z" fill="var(--color-blue)" />
        <path d="M8,6 L92,6 L92,34 L8,34 Z" fill="var(--color-red)" />
        <line x1="30" y1="98" x2="72" y2="46" stroke="var(--color-brass)" strokeWidth="9" strokeLinecap="round" />
        <line x1="70" y1="98" x2="28" y2="46" stroke="var(--color-brass)" strokeWidth="9" strokeLinecap="round" />
        <circle cx="50" cy="74" r="7" fill="var(--color-red)" stroke="var(--color-bg)" strokeWidth="1.5" />
        <path d="M8,6 L92,6 L92,52 C92,74 78,90 50,104 C22,90 8,74 8,52 Z" fill="none" stroke="var(--color-bg)" strokeWidth="3" />
      </svg>
      <p className={styles.motto} lang="la">In Ludo Sapientia</p>
      <p className={styles.gloss}>Wisdom in play</p>
      <ul className={styles.channels}>
        {channels.map((channel) => {
          const Mark = marks[channel.name];
          return (
            <li key={channel.name}>
              <a href={channel.href} rel="me noopener noreferrer" target="_blank">
                <Mark size={15} />
                {channel.name}
              </a>
            </li>
          );
        })}
      </ul>
      {withIndex && (
        <nav className={styles.plateIndex} aria-label="Footer">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}

const IMPRINT =
  "The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong Kong · Founded MCMXIII";

/** D — the minimum change. Same two rows, centred instead of pushed apart. */
export function FootD() {
  return (
    <footer className={styles.footer}>
      <Container>
        <Plate />
        <div className={`${styles.foot} ${styles.centred}`}>
          <nav className={styles.index} aria-label="Footer">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
          <p className={styles.imprint}>{IMPRINT}</p>
        </div>
      </Container>
    </footer>
  );
}

/** E — the index moves onto the plate, under the channels. One thing left on
 *  paper, so there is no band to align: the imprint is a single centred line. */
export function FootE() {
  return (
    <footer className={styles.footer}>
      <Container>
        <Plate withIndex />
        <div className={`${styles.foot} ${styles.centred}`}>
          <p className={styles.imprint}>{IMPRINT}</p>
        </div>
      </Container>
    </footer>
  );
}

/** F — centred, with the imprint leading and the index beneath it as the last
 *  line on the sheet, the way a title page puts the publisher under the
 *  address. */
export function FootF() {
  return (
    <footer className={styles.footer}>
      <Container>
        <Plate />
        <div className={`${styles.foot} ${styles.centred} ${styles.swapped}`}>
          <p className={styles.imprint}>{IMPRINT}</p>
          <nav className={styles.index} aria-label="Footer">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
