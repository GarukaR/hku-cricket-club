// The leaderboards a Team's Season shows — shared by /teams/[slug]/leaderboards
// (the current Season) and /teams/[slug]/[season]/leaderboards (any other
// one), the same split Squad.tsx makes for the same two routes.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { QUALIFICATION, leaderboardsFor, type Leaderboards as Tables } from "@/lib/leaderboards";
import { allSeasons, currentSeasonName, seasonSlug } from "@/lib/seasons";
import { teamBySlug } from "@/lib/teams";
import styles from "./Leaderboards.module.css";

export async function leaderboardsMetadata(teamSlug: string): Promise<Metadata> {
  const team = await teamBySlug(teamSlug);
  return { title: team ? `${team.name} leaderboards` : "Not found" };
}

/** `seasonName` fixes the page to one Season — `/teams/[slug]/[season]/leaderboards`.
 *  Left undefined for `/teams/[slug]/leaderboards`, which always shows the
 *  current one. */
export async function Leaderboards({
  teamSlug,
  seasonName,
}: {
  teamSlug: string;
  seasonName?: string;
}) {
  const team = await teamBySlug(teamSlug);
  if (!team) notFound();

  const [resolved, seasons] = await Promise.all([
    seasonName ?? currentSeasonName(),
    allSeasons(),
  ]);

  if (!resolved) {
    return (
      <LeaderboardsShell teamSlug={teamSlug} team={team.name} seasons={[]} activeSlug={undefined}>
        <p className={styles.empty}>
          No season has been entered yet, so there is nothing to show for the{" "}
          {team.name} side.
        </p>
      </LeaderboardsShell>
    );
  }

  const tables = await leaderboardsFor(team.id, resolved);
  if (seasonName && !tables.season) notFound();

  const hasAnyone =
    tables.runs.length > 0 ||
    tables.wickets.length > 0 ||
    tables.battingAverage.length > 0 ||
    tables.bowlingAverage.length > 0;

  return (
    <LeaderboardsShell
      teamSlug={teamSlug}
      team={team.name}
      seasons={seasons}
      activeSlug={seasonSlug(tables.season ?? resolved)}
    >
      {hasAnyone ? (
        <>
          <RunsTable rows={tables.runs} />
          <WicketsTable rows={tables.wickets} />
          {(tables.battingAverage.length > 0 || tables.bowlingAverage.length > 0) && (
            <AveragesNote />
          )}
          <BattingAverageTable rows={tables.battingAverage} />
          <BowlingAverageTable rows={tables.bowlingAverage} />
        </>
      ) : (
        <p className={styles.empty}>
          Nobody has an Appearance for the {team.name} side in{" "}
          {tables.season ?? resolved} yet.
        </p>
      )}
    </LeaderboardsShell>
  );
}

function RunsTable({ rows }: { rows: Tables["runs"] }) {
  if (rows.length === 0) return null;
  return (
    <TableSection id="runs" heading="Most runs">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Inns</th>
            <th scope="col">Runs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <Link href={`/players/${row.playerId}`}>{row.player}</Link>
              </td>
              <td>{row.innings}</td>
              <td>{row.runs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableSection>
  );
}

function WicketsTable({ rows }: { rows: Tables["wickets"] }) {
  if (rows.length === 0) return null;
  return (
    <TableSection id="wickets" heading="Most wickets">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Overs</th>
            <th scope="col">Wkts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <Link href={`/players/${row.playerId}`}>{row.player}</Link>
              </td>
              <td>{row.overs}</td>
              <td>{row.wickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableSection>
  );
}

/** Printed once, beside both averages tables — an unexplained omission reads
 *  as a bug (issue #15's own words), and the two tables share one rule. */
function AveragesNote() {
  return (
    <p className={styles.note}>
      Averages count only a Player with at least {QUALIFICATION.battingInnings}{" "}
      completed innings or {QUALIFICATION.bowlingOvers} overs bowled. Below
      that, a short run of games can produce a number that looks better than it
      is.
    </p>
  );
}

function BattingAverageTable({ rows }: { rows: Tables["battingAverage"] }) {
  if (rows.length === 0) return null;
  return (
    <TableSection id="batting-average" heading="Batting average">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Inns</th>
            <th scope="col">Runs</th>
            <th scope="col">Bat avg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <Link href={`/players/${row.playerId}`}>{row.player}</Link>
              </td>
              <td>{row.innings}</td>
              <td>{row.runs}</td>
              <td>{row.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableSection>
  );
}

function BowlingAverageTable({ rows }: { rows: Tables["bowlingAverage"] }) {
  if (rows.length === 0) return null;
  return (
    <TableSection id="bowling-average" heading="Bowling average">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Overs</th>
            <th scope="col">Wkts</th>
            <th scope="col">Bowl avg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <Link href={`/players/${row.playerId}`}>{row.player}</Link>
              </td>
              <td>{row.overs}</td>
              <td>{row.wickets}</td>
              <td>{row.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableSection>
  );
}

function TableSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={styles.section}>
      <h3 id={`${id}-heading`} className={styles.subheading}>
        {heading}
      </h3>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label={heading}>
        {children}
      </div>
    </section>
  );
}

function LeaderboardsShell({
  teamSlug,
  team,
  seasons,
  activeSlug,
  children,
}: {
  teamSlug: string;
  team: string;
  seasons: { name: string }[];
  activeSlug: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#leaderboards">
        Skip to the leaderboards
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="leaderboards">
        <Container>
          <div className={styles.layout}>
            <article>
              <SectionHeading id="leaderboards-heading">{team}</SectionHeading>
              <p className={styles.more}>
                <Link href={`/teams/${teamSlug}`}>Squad →</Link>
              </p>
              {children}
            </article>

            {seasons.length > 0 && (
              <Marginalia labelledBy="leaderboards-seasons">
                <SectionHeading id="leaderboards-seasons">Season</SectionHeading>
                <ul className={styles.seasons}>
                  {seasons.map((season) => {
                    const slug = seasonSlug(season.name);
                    const active = slug === activeSlug;
                    return (
                      <li key={season.name}>
                        {active ? (
                          <span className={styles.activeSeason}>{season.name}</span>
                        ) : (
                          <Link href={`/teams/${teamSlug}/${slug}/leaderboards`}>
                            {season.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Marginalia>
            )}
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
