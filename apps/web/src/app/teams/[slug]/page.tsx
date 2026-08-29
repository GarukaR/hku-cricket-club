// A Team's squad for the current Season — /teams/[slug]/[season] is the same
// page for any other one. See @/components/squad/Squad for the shared body.

import { Squad, squadMetadata } from "@/components/squad/Squad";
import { allTeams } from "@/lib/teams";

export async function generateStaticParams() {
  const teams = await allTeams();
  if (teams.length === 0) {
    // Cache Components refuses to build a route whose generateStaticParams
    // returns nothing at all (Next.js: "empty-generate-static-params") — and
    // an empty record is a real, tested state here (docs/cms.md), not a
    // hypothetical one. No slug the CMS ever hands out collides with this,
    // so it resolves the same way a bad address does: Squad's own
    // teamBySlug finds nothing and calls notFound().
    return [{ slug: "__placeholder__" }];
  }
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
