// The Club page — the club's own story, in the d2 idiom (docs/PLAN.md, issue
// #17). It carries the running prose the homepage's teaser does not have room
// for, which is why the drop cap lives here and not there: this is the one page
// with genuine running prose to open.
//
// The prose below the drop cap is the club's own, the same vetted facts
// TheClub's homepage teaser carries — founded 1913, Sandy Bay, open membership.
// The club's own account of its history — how it got there, what happened along
// the way — has not been supplied yet, and nothing here invents it. That gap is
// named on the page, not papered over.

import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Fact, Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { standingFacts } from "@/content/club";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "The Club" };

export default function ClubPage() {
  return (
    <>
      <a className="skip-link" href="#club">
        Skip to the club
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="club">
        <Container>
          <div className={styles.layout}>
            <article>
              <PageTitle id="club-heading">The Club</PageTitle>
              <div className={styles.prose}>
                <p>
                  The Club was formed in 1913, two years after the University
                  itself, and has fielded a side in almost every season since.
                  Play is at Sandy Bay, the University&rsquo;s ground on the
                  western shore: league fixtures on Saturdays, and University
                  Cricket League fixtures through the student season.
                </p>
                <p>
                  Membership is open to current students, staff and alumni of
                  the University of Hong Kong. Experience is welcome but not
                  required &mdash; a good number of the present side had never
                  played before joining.
                </p>
              </div>

              <div className={styles.placeholder}>
                <p className={styles.placeholderLabel}>
                  Placeholder &mdash; club history pending
                </p>
                <p>
                  What the Club has not yet supplied in its own words &mdash;
                  its founding, the seasons that mattered, the people who
                  built it across a hundred and thirteen years at Sandy Bay
                  &mdash; belongs here, and only here, once it arrives.
                  Nothing on this page stands in for it as invented fact.
                </p>
              </div>
            </article>

            <Marginalia labelledBy="club-facts">
              <SectionHeading id="club-facts">Standing facts</SectionHeading>
              <dl>
                {standingFacts.map(({ term, detail }) => (
                  <Fact key={term} term={term} detail={detail} />
                ))}
              </dl>
            </Marginalia>
          </div>
        </Container>
      </main>

      <SiteFooter
        note={
          <>
            The Club&rsquo;s history is placeholder text, marked as such above,
            until the club supplies its own account.
          </>
        }
      />
    </>
  );
}
