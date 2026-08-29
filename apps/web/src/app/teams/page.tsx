// The four sides the club fields, each linking to its own squad.

import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { allTeams } from "@/lib/teams";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Members" };

export default async function TeamsPage() {
  const teams = await allTeams();

  return (
    <>
      <a className="skip-link" href="#teams">
        Skip to the sides
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="teams">
        <Container>
          <SectionHeading id="teams-heading">The sides</SectionHeading>
          {teams.length > 0 ? (
            <ul className={styles.teams}>
              {teams.map((team) => (
                <li key={team.id}>
                  <Link className={styles.team} href={`/teams/${team.slug}`}>
                    {team.name}
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
