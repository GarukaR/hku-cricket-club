// PROTOTYPE — throwaway, see /proto/bleed.
import Link from "next/link";

import { Facebook, Instagram, YouTube } from "@/components/ChannelMarks";
import { Container } from "@/components/Container";
import { channels, navItems } from "@/content/club";
import styles from "./VariantH.module.css";

const marks = { Instagram, Facebook, YouTube } as const;

/** H — the plate bleeds, the imprint stays on paper under it. The sheet still
 *  ends on paper, so the ink is a band rather than a base. */
export function FootH() {
  return (
    <footer className={styles.footer}>
      <div className={styles.plate}>
        <Container>
          {/* Decorative: the club is named in full immediately below, on the
              imprint line, and a screen reader gains nothing from a third
              announcement of it. Same mark as the masthead's (#25), outlined
              in paper rather than ink because it sits on ink here. */}
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
              stroke="var(--color-bg)"
              strokeWidth="1.5"
            />
            <path
              d="M8,6 L92,6 L92,52 C92,74 78,90 50,104 C22,90 8,74 8,52 Z"
              fill="none"
              stroke="var(--color-bg)"
              strokeWidth="3"
            />
          </svg>

          <p className={styles.motto} lang="la">
            In Ludo Sapientia
          </p>
          <p className={styles.gloss}>Wisdom in play</p>

          {/* No channels confirmed yet is a plate with no channels row, not a
              row of dead links: content/club.ts owns that list. */}
          {channels.length > 0 && (
            <ul className={styles.channels}>
              {channels.map((channel) => {
                const Mark = marks[channel.name];
                return (
                  <li key={channel.name}>
                    <a
                      href={channel.href}
                      rel="me noopener noreferrer"
                      target="_blank"
                    >
                      <Mark size={15} />
                      {channel.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {/* On the plate rather than under it. The index is the one thing in
              the footer somebody uses rather than reads, so it belongs with
              the channels — and leaving it on paper meant two quiet rows of
              similar weight sharing a band, which is what made that band look
              misaligned however it was justified. */}
          <nav className={styles.index} aria-label="Footer">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      <Container>
        <p className={styles.imprint}>
          The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong
          Kong · Founded MCMXIII
        </p>
      </Container>
    </footer>
  );
}
