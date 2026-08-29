// A Team's squad for the current Season — /teams/[slug]/[season] is the same
// page for any other one. See @/components/squad/Squad for the shared body.

import { Squad, squadMetadata } from "@/components/squad/Squad";
import { allTeams } from "@/lib/teams";

export async function generateStaticParams() {
  const teams = await allTeams();
  return teams.map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return squadMetadata((await params).slug);
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Squad teamSlug={slug} />;
}
