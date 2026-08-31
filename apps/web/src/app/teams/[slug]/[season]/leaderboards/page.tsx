// A Team's leaderboards for one specific Season. /teams/[slug]/leaderboards is
// the same page for whichever Season is current. See
// @/components/leaderboards/Leaderboards for the shared body.

import { Leaderboards, leaderboardsMetadata } from "@/components/leaderboards/Leaderboards";
import { allSeasons, seasonFromSlug, seasonSlug } from "@/lib/seasons";
import { allTeams } from "@/lib/teams";

export async function generateStaticParams() {
  const [teams, seasons] = await Promise.all([allTeams(), allSeasons()]);

  // Every side crossed with every Season it could be asked about — see the
  // identical note on /teams/[slug]/[season].
  const combos = teams.flatMap((team) =>
    seasons.map((season) => ({ slug: team.slug, season: seasonSlug(season.name) })),
  );

  if (combos.length === 0) {
    return [{ slug: "__placeholder__", season: "__placeholder__" }];
  }

  return combos;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; season: string }>;
}) {
  return leaderboardsMetadata((await params).slug);
}

export default async function TeamSeasonLeaderboardsPage({
  params,
}: {
  params: Promise<{ slug: string; season: string }>;
}) {
  const { slug, season } = await params;
  return <Leaderboards teamSlug={slug} seasonName={seasonFromSlug(season)} />;
}
