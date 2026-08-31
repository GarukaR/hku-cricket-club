import Link from "next/link";

import { Fact, Marginalia } from "@/components/Marginalia";
import { SectionHeading } from "@/components/SectionHeading";
import { standingFacts } from "@/content/club";
import styles from "./TheClub.module.css";

/** Who the club is, with its standing facts in the margin — a teaser for the
 *  full story at /club, which is where the running prose and its drop cap live
 *  (docs/PLAN.md, issue #17).
 *
 *  The copy here is the club's own, apart from the 1988 handbook line, which is
 *  invented and marked as such in the footer until real history copy arrives
 *  (docs/PLAN.md, "Still needed from the club"). */
export function TheClub() {
  return (
    <section className={styles.section} aria-labelledby="the-club">
      <SectionHeading id="the-club">The Club</SectionHeading>
      <div className={styles.columns}>
        <div className={styles.prose}>
          <p>
            The Club was formed in 1913, a mere two years after the University
            itself, and has fielded a side in almost every season since. Play is
            at Sandy Bay, the University&rsquo;s ground on the western shore,
            with league fixtures on Saturdays.
          </p>
          <blockquote className={styles.quote}>
            A university club is only ever eleven people wide and a hundred years
            deep.
            <cite>Club handbook, 1988</cite>
          </blockquote>
          <p className={styles.more}>
            <Link href="/club">The Club&rsquo;s full story →</Link>
          </p>
        </div>
        <Marginalia>
          <dl>
            {standingFacts.map(({ term, detail }) => (
              <Fact key={term} term={term} detail={detail} />
            ))}
          </dl>
        </Marginalia>
      </div>
    </section>
  );
}
