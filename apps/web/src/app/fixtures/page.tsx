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
            <div className={styles.frame}>
              <div className={styles.scroll} tabIndex={0} role="region" aria-labelledby="fixtures-heading">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Side</th>
                      <th scope="col">Opponent</th>
                      <th scope="col">Ground</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtures.map((fixture) => (
                      <tr key={fixture.id}>
                        <td>
                          <Link className={styles.rowLink} href={`/matches/${fixture.id}`}>
                            {longDate(fixture.date)}
                            {fixture.time ? `, ${fixture.time}` : ""}
                          </Link>
                        </td>
                        <td className={styles.side}>{fixture.team}</td>
                        <td className={styles.opponent}>{fixture.opponent}</td>
                        <td>{facts(fixture.ground, fixture.venue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>No fixtures are scheduled yet.</p>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
