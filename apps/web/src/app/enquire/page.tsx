// The recruitment funnel's front door (docs/PLAN.md, issue #16).
//
// The club's own Instagram bio already puts this plainly — if you are a
// student, alumni, or member of staff and want to play, get in touch — so this
// is a page, not a mailto: link. What arrives is an Enquiry (CONTEXT.md), not
// a Player: most enquiries never become one, and the form promises nothing
// beyond "the committee will read this."

import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Fact, Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { standingFacts } from "@/content/club";
import { EnquiryForm } from "./EnquiryForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Enquire" };

const BEFORE_YOU_WRITE = new Set(["Ground", "Training", "Season"]);

export default function EnquirePage() {
  return (
    <>
      <a className="skip-link" href="#enquire">
        Skip to the form
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="enquire">
        <Container>
          <div className={styles.layout}>
            <article>
              <PageTitle id="enquire-heading">Enquire</PageTitle>
              <p className={styles.blurb}>
                New members are received throughout the season, whether or not
                you have played before. Write a line about yourself and the
                committee will reply.
              </p>
              <EnquiryForm />
            </article>

            <Marginalia labelledBy="enquire-facts">
              <SectionHeading id="enquire-facts">Before you write</SectionHeading>
              <dl>
                {standingFacts
                  .filter(({ term }) => BEFORE_YOU_WRITE.has(term))
                  .map(({ term, detail }) => (
                    <Fact key={term} term={term} detail={detail} />
                  ))}
              </dl>
            </Marginalia>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
