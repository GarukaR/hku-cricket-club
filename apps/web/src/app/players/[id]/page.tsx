// A Player's own profile - every figure derived from their Appearances,
// never stored (CONTEXT.md - Career figures, issue #14). "The thing this
// project was originally asked for: a player can look up their own figures."

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { CareerStats } from "@/components/player/CareerStats";
import { MatchLog } from "@/components/player/MatchLog";
import { SeasonSplits } from "@/components/player/SeasonSplits";
import { TeamSplits } from "@/components/player/TeamSplits";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { battingFigures, bowlingFigures, bySeason, byTeam, fieldingFigures } from "@/lib/career";
import {
  allPlayerIds,
  appearancesForPlayer,
  playerById,
  registrationsForPlayer,
} from "@/lib/players";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const ids = await allPlayerIds();
  if (ids.length === 0) {
    // Cache Components refuses to build a route whose generateStaticParams
    // returns nothing at all (Next.js: "empty-generate-static-params") - and
    // an empty record is a real, tested state here (docs/cms.md), not a
    // hypothetical one. No id the CMS ever hands out is non-numeric, so this
    // resolves the same way a bad address does: loadPlayer's own
    // Number.isInteger check fails it, and the page calls notFound().
    return [{ id: "__placeholder__" }];
  }
  return ids.map((id) => ({ id: String(id) }));
}

async function loadPlayer(id: string) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return undefined;
  return playerById(numeric);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const player = await loadPlayer((await params).id);
  return { title: player ? player.name : "Not found" };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const player = await loadPlayer((await params).id);
  if (!player) notFound();

  const [records, registrations] = await Promise.all([
    appearancesForPlayer(player.id),
    registrationsForPlayer(player.id),
  ]);

  // Keyed by Season alone - SeasonSplits attaches each value to the right
  // row (see its own doc comment for why that isn't the row this Season is
  // grouped by team name).
  const callUps = new Map(
    registrations
      .filter((registration) => registration.callUps)
      .map((registration) => [registration.season, registration.callUps as string]),
  );

  const appearances = records.map((record) => record.appearance);

  return (
    <>
      <a className="skip-link" href="#profile">
        Skip to the profile
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="profile">
        <Container>
          <div className={styles.layout}>
            <article>
              <SectionHeading id="player-heading">{player.name}</SectionHeading>

              {records.length === 0 ? (
                <p className={styles.empty}>
                  No scored matches yet. The sunday social side&rsquo;s matches
                  are not scored anywhere (CONTEXT.md &mdash; Unscored Match),
                  so a Player who has only played there has no Appearance here
                  at all &mdash; that is a normal state, not an unfinished
                  profile.
                </p>
              ) : (
                <>
                  <CareerStats
                    headingId="player-career"
                    matches={records.length}
                    batting={battingFigures(appearances)}
                    bowling={bowlingFigures(appearances)}
                    fielding={fieldingFigures(appearances)}
                  />

                  <SectionHeading id="player-by-side">By side</SectionHeading>
                  <TeamSplits splits={byTeam(records)} />

                  <SectionHeading id="player-by-season">By season</SectionHeading>
                  <SeasonSplits splits={bySeason(records)} callUps={callUps} />

                  <SectionHeading id="player-matches">Matches</SectionHeading>
                  <MatchLog records={records} />
                </>
              )}
            </article>

            <Marginalia labelledBy="player-coverage">
              <SectionHeading id="player-coverage">About these figures</SectionHeading>
              <p className={styles.coverage}>
                Derived from Appearances &mdash; matches with a scorecard. The
                sunday social side is not scored anywhere, so any social
                cricket {player.name} has played does not appear here. A
                Scorecard lists only the players a scorer entered, so matches
                played is a floor, not a certainty.
              </p>
            </Marginalia>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
