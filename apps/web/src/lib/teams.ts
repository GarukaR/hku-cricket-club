// The four sides the club fields (CONTEXT.md — Team), as the squad pages read
// them. Thin on purpose: a Team is only ever a name and an address here, since
// everything else about one — its matches, its squad — hangs off Registrations
// and Matches, not off this record.

import { cacheLife, cacheTag } from "next/cache";

import type { Team as Stored } from "@hkucc/domain";

import { query } from "./cms";
import { RECORD } from "./matches";

const LIFE = "days";

export type Team = {
  id: number;
  name: string;
  slug: string;
};

function asTeam(stored: Stored): Team {
  return { id: stored.id, name: stored.name, slug: stored.slug };
}

/** Every side the club fields, for the teams index. */
export async function allTeams(): Promise<Team[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("teams", {
    sort: "name",
    limit: "20",
    depth: "0",
  });

  return docs.map(asTeam);
}

/** One Team by its address — `/teams/[slug]` reads no other way in. */
export async function teamBySlug(slug: string): Promise<Team | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("teams", {
    "where[slug][equals]": slug,
    limit: "1",
    depth: "0",
  });

  return docs[0] && asTeam(docs[0]);
}
