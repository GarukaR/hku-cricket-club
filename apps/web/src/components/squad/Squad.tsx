// The squad a Team fields for a Season — shared by /teams/[slug] (the current
// Season) and /teams/[slug]/[season] (any other one), so there is exactly one
// place that reads a Team, resolves a Season and renders the list.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { allSeasons, currentSeasonName, seasonSlug } from "@/lib/seasons";
import { playingRoleLabel, squadFor } from "@/lib/squad";
import { teamBySlug } from "@/lib/teams";
import styles from "./Squad.module.css";

export async function squadMetadata(teamSlug: string): Promise<Metadata> {
  const team = await teamBySlug(teamSlug);
  return { title: team ? `${team.name} squad` : "Not found" };
}

/** `seasonName` fixes the page to one Season — `/teams/[slug]/[season]`.
 *  Left undefined for `/teams/[slug]`, which always shows the current one. */
export async function Squad({
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

  // No Season exists in the record at all yet — a genuinely empty CMS, not a
  // bad address. The team's own page still has to render as a page.
  if (!resolved) {
    return (
      <SquadShell teamSlug={teamSlug} team={team.name} seasons={[]} activeSlug={undefined}>
        <p className={styles.empty}>
          No season has been entered yet, so there is nothing to show for the{" "}
          {team.name} side.
        </p>
      </SquadShell>
    );
  }

  const squad = await squadFor(team.id, resolved);
  // `seasonName` came off the URL; a Season that does not resolve is a bad
  // address, not an empty squad. `/teams/[slug]` never hits this branch — it
  // always resolves `resolved` from the record itself.
  if (seasonName && !squad.season) notFound();

  return (
    <SquadShell
      teamSlug={teamSlug}
      team={team.name}
      seasons={seasons}
      activeSlug={seasonSlug(squad.season ?? resolved)}
    >
      {squad.members.length > 0 ? (
        <div className={styles.frame}>
          <div className={styles.scroll} tabIndex={0} role="region" aria-label="Squad">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col">Role</th>
                </tr>
              </thead>
              <tbody>
                {squad.members.map((member) => (
                  <tr key={member.playerId}>
                    <td>
                      <Link href={`/players/${member.playerId}`}>{member.player}</Link>
                    </td>
                    <td className={styles.role}>
                      {playingRoleLabel(member.playingRole)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>
          Nobody is registered to the {team.name} side for {squad.season ?? resolved}.
        </p>
      )}
    </SquadShell>
  );
}

function SquadShell({
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
      <a className="skip-link" href="#squad">
        Skip to the squad
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="squad">
        <Container>
          <div className={styles.layout}>
            <article>
              <SectionHeading id="squad-heading">{team}</SectionHeading>
              <p className={styles.more}>
                <Link href={`/teams/${teamSlug}/leaderboards`}>Leaderboards →</Link>
              </p>
              {children}
            </article>

            {seasons.length > 0 && (
              <Marginalia labelledBy="squad-seasons">
                <SectionHeading id="squad-seasons">Season</SectionHeading>
                <ul className={styles.seasons}>
                  {seasons.map((season) => {
                    const slug = seasonSlug(season.name);
                    const active = slug === activeSlug;
                    return (
                      <li key={season.name}>
                        {active ? (
                          <span className={styles.activeSeason}>{season.name}</span>
                        ) : (
                          <Link href={`/teams/${teamSlug}/${slug}`}>
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
