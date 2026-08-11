import { Marginalia } from "@/components/Marginalia";
import { SectionHeading } from "@/components/SectionHeading";
import { standingFacts } from "@/content/club";
import styles from "./TheClub.module.css";

/** Who the club is, with its standing facts in the margin.
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
          <p>
            Membership is open to current students, staff and alumni of the
            University of Hong Kong. Experience is welcome but not required; a
            good number of the present side had never played before joining.
          </p>
          <blockquote className={styles.quote}>
            A university club is only ever eleven people wide and a hundred years
            deep.
            <cite>Club handbook, 1988</cite>
          </blockquote>
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

/* A flat dt/dd sequence, not a wrapped pair: the marginalia's first-of-type rule
   depends on the list being flat, and a <div> between <dl> and <dt> buys nothing. */
function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{detail}</dd>
    </>
  );
}
