import { Container } from "@/components/Container";
import { Crest } from "./Crest";
import { channels } from "./channels";
import styles from "./FooterA.module.css";

/** PROTOTYPE A — "The Colophon".
 *
 *  The last page of a printed book: the mark, the imprint, where it was set,
 *  and nothing else. Centred, because the masthead is centred and this is the
 *  same axis closing — the page opens and shuts on the same line.
 *
 *  The channels are set as words, not icons. Three letterspaced names in the
 *  sans belong to this world; three rounded glyphs are borrowed from another
 *  one, and at a club this size the footer has room to say them. */
export function FooterA({ note }: { note?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.mark}>
          <Crest size={30} />
        </div>
        <p className={styles.name}>The Hong Kong University Cricket Club</p>
        <p className={styles.place}>Sandy Bay · Pok Fu Lam · Hong Kong</p>

        <ul className={styles.channels}>
          {channels.map((channel) => (
            <li key={channel.name}>
              <a href={channel.href} rel="me noreferrer" target="_blank">
                {channel.name}
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.motto}>In Ludo Sapientia</p>
        <p className={styles.imprint}>Founded MCMXIII · © MMXXVI</p>
        {note && <p className={styles.note}>{note}</p>}
      </Container>
    </footer>
  );
}
