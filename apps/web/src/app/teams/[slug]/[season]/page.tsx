// A Team's squad for one specific Season. /teams/[slug] is the same page for
// whichever Season is current. See @/components/squad/Squad for the shared
// body.

import { Squad, squadMetadata } from "@/components/squad/Squad";
import { allSeasons, seasonFromSlug, seasonSlug } from "@/lib/seasons";
import { allTeams } from "@/lib/teams";

export async function generateStaticParams() {
  const [teams, seasons] = await Promise.all([allTeams(), allSeasons()]);

  // Every side crossed with every Season it could be asked about, not only the
  // combinations with a registered player — a Team with nobody registered for
  // a Season is a real, empty page, not a missing one (see acceptance
  // criteria on issue #13).
  return teams.flatMap((team) =>
    seasons.map((season) => ({ slug: team.slug, season: seasonSlug(season.name) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; season: string }>;
}) {
  return squadMetadata((await params).slug);
}

export default async function TeamSeasonPage({
  params,
}: {
  params: Promise<{ slug: string; season: string }>;
}) {
  const { slug, season } = await params;
  return <Squad teamSlug={slug} seasonName={seasonFromSlug(season)} />;
}
