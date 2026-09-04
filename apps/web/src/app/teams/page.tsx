// The four Teams the club fields, each linking to its own squad.

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { allTeams, type Team } from "@/lib/teams";
import styles from "./page.module.css";
// PROTOTYPE — throwaway, issue #71 follow-up. Delete this block, the
// PrototypeSwitcher file, the `.spacing*` classes in page.module.css and the
// `searchParams` prop once a gap is chosen.
import { PrototypeSwitcher } from "./PrototypeSwitcher";

export const metadata: Metadata = { title: "Teams" };

const SPACING: Record<string, string | undefined> = {
  A: styles.spacingA,
  B: styles.spacingB,
  C: styles.spacingC,
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ spacing?: string }>;
}) {
  const teams = await allTeams();
  const isProduction = process.env.VERCEL_ENV === "production";

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
            isProduction ? (
              <List teams={teams} />
            ) : (
              <Suspense fallback={<List teams={teams} />}>
                <SpacingSlot searchParams={searchParams} teams={teams} />
              </Suspense>
            )
          ) : (
            <p className={styles.empty}>No side has been entered yet.</p>
          )}
        </Container>
      </main>

      {!isProduction && (
        <Suspense fallback={null}>
          <PrototypeSwitcher />
        </Suspense>
      )}

      <SiteFooter />
    </>
  );
}

function List({ teams, extraClass }: { teams: Team[]; extraClass?: string }) {
  return (
    <ul className={`${styles.teams} ${extraClass ?? ""}`}>
      {teams.map((team) => (
        <li key={team.id}>
          <Link className={styles.team} href={`/teams/${team.slug}`}>
            {team.name}
            <span className={styles.arrow}>→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function SpacingSlot({
  searchParams,
  teams,
}: {
  searchParams: Promise<{ spacing?: string }>;
  teams: Team[];
}) {
  await connection();
  const spacing = (await searchParams).spacing;
  return <List teams={teams} extraClass={spacing ? SPACING[spacing] : undefined} />;
}
