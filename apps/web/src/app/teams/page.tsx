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
// PROTOTYPE — throwaway, issue #71 follow-up. Delete this block, the two
// prototype files, and the `searchParams` prop once a hierarchy is chosen.
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import prototypeStyles from "./prototype-variants.module.css";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
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
              <LiveList teams={teams} />
            ) : (
              <Suspense fallback={<LiveList teams={teams} />}>
                <VariantSlot searchParams={searchParams} teams={teams} />
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

function LiveList({ teams }: { teams: Team[] }) {
  return (
    <ul className={styles.teams}>
      {teams.map((team) => (
        <li key={team.id}>
          <Link className={styles.team} href={`/teams/${team.slug}`}>
            {team.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// PROTOTYPE — throwaway. See prototype-variants.module.css for what each
// variant looks like.
function VariantA({ teams }: { teams: Team[] }) {
  return (
    <ul className={styles.teams}>
      {teams.map((team) => (
        <li key={team.id}>
          <Link className={prototypeStyles.teamA} href={`/teams/${team.slug}`}>
            {team.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VariantB({ teams }: { teams: Team[] }) {
  return (
    <ul className={styles.teams}>
      {teams.map((team) => (
        <li key={team.id}>
          <Link className={prototypeStyles.teamB} href={`/teams/${team.slug}`}>
            {team.name}
            <span className={prototypeStyles.arrow}>→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VariantC({ teams }: { teams: Team[] }) {
  return (
    <ul className={styles.teams}>
      {teams.map((team, index) => (
        <li key={team.id}>
          <Link className={prototypeStyles.teamC} href={`/teams/${team.slug}`}>
            <span className={prototypeStyles.index}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={prototypeStyles.teamCName}>{team.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function VariantSlot({
  searchParams,
  teams,
}: {
  searchParams: Promise<{ variant?: string }>;
  teams: Team[];
}) {
  // PROTOTYPE — explicit bail into per-request rendering, so `?variant=`
  // reflects in the response rather than being served a page cached from the
  // first request that ever hit this route.
  await connection();
  const variant = (await searchParams).variant;
  if (variant === "A") return <VariantA teams={teams} />;
  if (variant === "B") return <VariantB teams={teams} />;
  if (variant === "C") return <VariantC teams={teams} />;
  return <LiveList teams={teams} />;
}
