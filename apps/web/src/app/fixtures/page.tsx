// Every fixture still to come, whichever side plays it — the homepage's
// "Next fixture" marginalia is a single teaser; this is the whole list.

import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { longDate } from "@/lib/dates";
import { facts } from "@/lib/match";
import { upcomingFixtures } from "@/lib/matches";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Fixtures" };

export default async function FixturesPage() {
  const fixtures = await upcomingFixtures();

  return (
    <>
      <a className="skip-link" href="#fixtures">
        Skip to the fixtures
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="fixtures">
        <Container>
          <PageTitle id="fixtures-heading">Fixtures</PageTitle>
          {fixtures.length > 0 ? (
            <ul className={styles.list}>
              {fixtures.map((fixture) => (
                <li key={fixture.id} className={styles.row}>
                  <Link className={styles.rowLink} href={`/matches/${fixture.id}`}>
                    <span className={styles.line}>
                      <span className={styles.date}>{longDate(fixture.date)}</span>
                      <span className={styles.opponent}>{fixture.opponent}</span>
                      {fixture.time && <span className={styles.time}>{fixture.time}</span>}
                    </span>
                    <span className={styles.meta}>
                      {facts(fixture.team, fixture.ground, fixture.venue)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No fixtures are scheduled yet.</p>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
