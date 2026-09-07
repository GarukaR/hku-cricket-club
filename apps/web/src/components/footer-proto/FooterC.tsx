import Link from "next/link";

import { Container } from "@/components/Container";
import { navItems } from "@/content/club";
import { Crest } from "./Crest";
import { channels } from "./channels";
import { Facebook, Instagram, X } from "./Glyphs";
import styles from "./FooterC.module.css";

const glyphs = { Instagram, Facebook, X } as const;

/** PROTOTYPE C — "The Endpaper". The bold one.
 *
 *  A book's back board: the sheet runs out and the binding closes it in ink.
 *  D2 is a committed light world and stays one — this is not a dark theme but
 *  a single dark plate at the very end of the document, the way a printed
 *  annual report ends on a coloured endpaper.
 *
 *  Deliberately NOT the crest green. `Admission.module.css` records that the
 *  green band is the one place the accent is used as a ground — the club
 *  asking to be joined — and on the homepage that band sits directly above
 *  this one. Two greens stacked would spend the site's one loud moment twice.
 *
 *  The motto leads, at a size it has never had anywhere on the site. That is
 *  the argument for this option and also the case against it: a footer that
 *  says something rather than merely ending. */
export function FooterC({ note }: { note?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.plate}>
          <Crest size={40} tone="paper" />
          <p className={styles.motto}>In Ludo Sapientia</p>
          <p className={styles.gloss}>Wisdom in play</p>

          <ul className={styles.channels}>
            {channels.map((channel) => {
              const Glyph = glyphs[channel.name];
              return (
                <li key={channel.name}>
                  <a href={channel.href} rel="me noreferrer" target="_blank">
                    <Glyph size={15} />
                    {channel.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.foot}>
          <nav className={styles.index} aria-label="Footer">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <p className={styles.imprint}>
            The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong
            Kong · Founded MCMXIII
          </p>
        </div>
        {note && <p className={styles.note}>{note}</p>}
      </Container>
    </footer>
  );
}
