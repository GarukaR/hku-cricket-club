// The four Teams the club fields, each linking to its own squad.

import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { allTeams } from "@/lib/teams";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const teams = await allTeams();

  return (
    <>
      <a className="skip-link" href="#teams">
        Skip to the teams
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="teams">
        <Container>
          <PageTitle id="teams-heading">Teams</PageTitle>
          {teams.length > 0 ? (
            <ul className={styles.teams}>
              {teams.map((team) => (
                <li key={team.id}>
                  <Link className={styles.team} href={`/teams/${team.slug}`}>
                    {team.name}
                    <span className={styles.arrow}>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No side has been entered yet.</p>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
