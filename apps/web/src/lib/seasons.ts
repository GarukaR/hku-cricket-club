// The club's playing years (CONTEXT.md — Season), and the one thing about them
// that is not simply reading the record: a Season is written `2025/26`, and a
// `/` cannot sit inside a single URL segment.

import { cacheLife, cacheTag } from "next/cache";

import { query } from "./cms";
import { RECORD } from "./matches";

const LIFE = "days";

export type Season = { id: number; name: string };

/** Every Season the club has created, newest first. */
export async function allSeasons(): Promise<Season[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  return query<Season>("seasons", { sort: "-name", limit: "100", depth: "0" });
}

/** The season the site currently reports on — the newest one the club has
 *  created. Undefined only for a record with no Season in it at all. */
export async function currentSeasonName(): Promise<string | undefined> {
  const [current] = await allSeasons();
  return current?.name;
}

/** One Season by its own name — what a page reached by `/[season]` resolves
 *  before it can query anything scoped to it (Squad, Leaderboards). Undefined
 *  for a name that does not exist; the caller reads that as "not found", not
 *  as an empty season. */
export async function seasonByName(name: string): Promise<Season | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Season>("seasons", {
    "where[name][equals]": name,
    limit: "1",
    depth: "0",
  });

  return docs[0];
}

/** `2025/26` on a squad page's address — `2025-26`, since a Season's own
 *  written form cannot sit inside one URL segment. */
export function seasonSlug(name: string): string {
  return name.replace("/", "-");
}

/** The reverse of `seasonSlug`. Not validated against `seasonProblem` (the
 *  CMS's own rule): an address that does not name a real Season simply fails
 *  to resolve one, which the page reads as "not found" rather than as a
 *  malformed year. */
export function seasonFromSlug(slug: string): string {
  const [start, end] = slug.split("-");
  return start && end ? `${start}/${end}` : slug;
}
