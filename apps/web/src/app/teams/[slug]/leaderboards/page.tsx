// A Team's leaderboards for the current Season —
// /teams/[slug]/[season]/leaderboards is the same page for any other one. See
// @/components/leaderboards/Leaderboards for the shared body.

import { Leaderboards, leaderboardsMetadata } from "@/components/leaderboards/Leaderboards";
import { allTeams } from "@/lib/teams";

export async function generateStaticParams() {
  const teams = await allTeams();
  if (teams.length === 0) {
    // Cache Components refuses to build a route whose generateStaticParams
    // returns nothing at all (Next.js: "empty-generate-static-params") — see
    // the identical note on /teams/[slug].
    return [{ slug: "__placeholder__" }];
  }
  return teams.map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return leaderboardsMetadata((await params).slug);
}

export default async function TeamLeaderboardsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Leaderboards teamSlug={slug} />;
}
