import Link from "next/link";

import { Container } from "@/components/Container";
import { navItems } from "@/content/club";
import { Crest } from "./Crest";
import { channels } from "./channels";
import { Facebook, Instagram, X } from "./Glyphs";
import styles from "./FooterB.module.css";

const glyphs = { Instagram, Facebook, X } as const;

/** PROTOTYPE B — "The Masthead, Reversed".
 *
 *  cricket.com.au's shape at a club's scale: an index of the site, the club's
 *  imprint, and where to follow it — three columns under one ink rule, which
 *  is the masthead's rule arriving at the other end of the page.
 *
 *  Three columns is the most a club this size can fill honestly. The national
 *  board's footer has three columns of six because it has thirty destinations;
 *  ours repeats the nav, states the address, and lists three channels, and a
 *  fourth column would be padding.
 *
 *  Glyph and word together, because a column of stacked links wants an edge to
 *  align on and the mark gives one. */
export function FooterB({ note }: { note?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.rule} />

        <div className={styles.columns}>
          <section className={styles.club}>
            <h2 className={styles.heading}>The Club</h2>
            <Crest size={26} />
            <p className={styles.name}>
              The Hong Kong University
              <br />
              Cricket Club
            </p>
            <p className={styles.address}>
              Sandy Bay, Pok Fu Lam
              <br />
              Hong Kong
            </p>
          </section>

          <nav className={styles.index} aria-label="Footer">
            <h2 className={styles.heading}>The Record</h2>
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className={styles.follow}>
            <h2 className={styles.heading}>Follow the Club</h2>
            <ul>
              {channels.map((channel) => {
                const Glyph = glyphs[channel.name];
                return (
                  <li key={channel.name}>
                    <a href={channel.href} rel="me noreferrer" target="_blank">
                      <Glyph />
                      {channel.name}
                    </a>
                  </li>
                );
              })}
            </ul>
            <Link className={styles.enquire} href="/enquire">
              Enquire about joining
            </Link>
          </section>
        </div>

        <div className={styles.colophon}>
          <p className={styles.motto}>In Ludo Sapientia — wisdom in play</p>
          <p className={styles.imprint}>Founded MCMXIII · © MMXXVI</p>
        </div>
        {note && <p className={styles.note}>{note}</p>}
      </Container>
    </footer>
  );
}
