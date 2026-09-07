import Link from "next/link";

import { Facebook, Instagram, YouTube } from "@/components/ChannelMarks";
import { Container } from "@/components/Container";
import { channels, navItems } from "@/content/club";
import styles from "./SiteFooter.module.css";

const marks = { Instagram, Facebook, YouTube } as const;

/** The end of the sheet — "The Endpaper".
 *
 *  A printed record closes on its back board, so the page does too: an ink
 *  plate carrying the crest, the motto at a size it has nowhere else on the
 *  site, and the club's own channels. Underneath it, back on paper, the index
 *  and the imprint in one quiet band.
 *
 *  **Deliberately not the crest green.** `home/Admission.module.css` records
 *  that band as the one place the accent is used as a ground — the club asking
 *  to be joined — and on the homepage it sits directly above this. Two green
 *  bands stacked would spend the site's one loud moment twice.
 *
 *  `note` still works and no page passes one (#100). The foot of every page was
 *  the wrong place to keep repeating that the handbook quotation and the plate
 *  captions are invented, but the disclosure will be wanted again — so the prop
 *  and the setting for it stay, and bringing it back is one line at the page
 *  rather than a component to rebuild. It sits below everything: it is an
 *  editorial note about the page, not part of the club's own imprint. */
export function SiteFooter({ note }: { note?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.plate}>
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
        </div>

        {/* One line, centred: with the index gone there is nothing left down
            here to align it against. */}
        <p className={styles.imprint}>
          The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong
          Kong · Founded MCMXIII
        </p>

        {note && <p className={styles.note}>{note}</p>}
      </Container>
    </footer>
  );
}
