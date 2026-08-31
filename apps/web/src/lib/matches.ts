// The record, as the site asks for it: cached, tagged, and club-wide.
//
// Three questions the homepage puts to the record — what did we last do, what
// do we do next, and how has the season gone. Each is a `use cache` function
// tagged RECORD, so publishing a Match in the CMS drops exactly these and
// nothing else: the club's history, the 404 and every page not derived from a
// Match keep their cached copies (see app/api/revalidate).
//
// The cache is the whole reason the CMS can be asleep. A visitor is served a
// rendered page; nothing in their request reaches Render. And if the CMS is
// down, no webhook fires, so nothing invalidates and the site simply carries on
// showing the record as it last stood.

import { cacheLife, cacheTag } from "next/cache";

import type { Appearance as StoredAppearance, Match as Stored } from "@hkucc/domain";

import type { Appearance } from "./appearance";
import { query } from "./cms";
import { isPlayed, type Match } from "./match";
import { asAppearance, asMatch } from "./record";

/** Everything derived from the Matches collection, under one name.
 *
 *  One tag rather than several because there is, today, one page reading the
 *  record. Per-team and per-season tags become worth their complexity when the
 *  team pages exist and a publish should leave the other sides' pages alone. */
export const RECORD = "record";

/** A safety net, not the mechanism.
 *
 *  Freshness comes from the publish webhook, which is immediate. This only
 *  bounds how long the site could stay wrong if a webhook were ever missed —
 *  and it is deliberately long, because every expiry is a request that wakes a
 *  sleeping container. */
const LIFE = "days";

/** Populated one level down, so `team`, `season` and `competition` arrive as
 *  records with names rather than as ids. ./record drops an id it is handed. */
const DEPTH = "1";

/** Today in Hong Kong, as an ISO date.
 *
 *  A fixture list has to know what "next" means, and the club plays in one time
 *  zone. Doing this in UTC would move the boundary eight hours and show a
 *  Saturday morning match as still to come while it was being played. */
function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
  }).format(new Date());
}

/**
 * The club's most recent result, whichever side played it.
 *
 * An outcome is what marks a Match as played, so its presence is the filter —
 * not the date, which would call an unplayed fixture from last week a result.
 */
export async function latestResult(): Promise<Match | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("matches", {
    "where[result.outcome][exists]": "true",
    sort: "-date",
    limit: "1",
    depth: DEPTH,
  });

  const match = docs[0] && asMatch(docs[0]);
  // Belt and braces: `exists` is the CMS's answer, `isPlayed` is the site's.
  return match && isPlayed(match) ? match : undefined;
}

/**
 * The next fixture, whichever side plays it.
 *
 * A Match with no outcome and a date still to come. Both halves matter: a
 * played match whose result nobody has entered yet must not be announced as
 * upcoming once its date has passed.
 */
export async function nextFixture(): Promise<Match | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("matches", {
    "where[result.outcome][exists]": "false",
    "where[date][greater_than_equal]": today(),
    sort: "date",
    limit: "1",
    depth: DEPTH,
  });

  return docs[0] && asMatch(docs[0]);
}

/**
 * Every fixture still to come, whichever side plays it, soonest first.
 *
 * The same question `nextFixture()` asks, without the `limit: "1"` — this is
 * the Fixtures page's whole list rather than the homepage's single teaser.
 */
export async function upcomingFixtures(): Promise<Match[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("matches", {
    "where[result.outcome][exists]": "false",
    "where[date][greater_than_equal]": today(),
    sort: "date",
    limit: "50",
    depth: DEPTH,
  });

  return docs.map(asMatch);
}

/** The season the site is currently reporting on — the newest one the club has
 *  created. Seasons are named `2025/26`, so newest-first by name is newest-first
 *  by year, which is the same order the CMS lists them in. */
async function currentSeason(): Promise<{ id: number; name: string } | undefined> {
  const docs = await query<{ id: number; name: string }>("seasons", {
    sort: "-name",
    limit: "1",
    depth: "0",
  });

  return docs[0];
}

/**
 * The season so far — every Match the club has played this season, newest
 * first, across all four sides.
 *
 * Club-wide on purpose, and each row names its side. Four teams play under one
 * crest, and a table that did not say which was which would read as one team's
 * season while being four (docs/PLAN.md — coverage is uneven, and the site says
 * so).
 */
export async function seasonRecord(): Promise<{
  season?: string;
  matches: Match[];
}> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const season = await currentSeason();
  if (!season) return { matches: [] };

  const docs = await query<Stored>("matches", {
    "where[season][equals]": String(season.id),
    sort: "-date",
    limit: "100",
    depth: DEPTH,
  });

  return { season: season.name, matches: docs.map(asMatch) };
}

/**
 * Every season with a played Match in it, newest first — the Archive page's
 * whole record, rather than `seasonRecord()`'s current one.
 *
 * A season with no result yet (freshly created for an upcoming fixture) is
 * dropped rather than shown as an empty archive entry: an Archive is of what
 * happened, the same reasoning `RecentRecord` already applies within a season.
 */
export async function archiveRecord(): Promise<
  { season: string; matches: Match[] }[]
> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const seasons = await query<{ id: number; name: string }>("seasons", {
    sort: "-name",
    limit: "100",
    depth: "0",
  });

  const bySeason = await Promise.all(
    seasons.map(async (season) => {
      const docs = await query<Stored>("matches", {
        "where[season][equals]": String(season.id),
        sort: "-date",
        limit: "100",
        depth: DEPTH,
      });

      return { season: season.name, matches: docs.map(asMatch) };
    }),
  );

  return bySeason.filter(({ matches }) => matches.some(isPlayed));
}

/**
 * One Match by id — what its own page reads.
 *
 * `undefined` covers both a bad address and a Match still held as a draft:
 * `publiclyReadableWhenPublished` (apps/cms/src/collections/access.ts) is what
 * keeps a held Match from ever reaching this query, and either way the page's
 * job is the same — say the address does not resolve, not why.
 */
export async function matchById(id: number): Promise<Match | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<Stored>("matches", {
    "where[id][equals]": String(id),
    limit: "1",
    depth: DEPTH,
  });

  return docs[0] && asMatch(docs[0]);
}

/**
 * Every Appearance recorded for one Match — HKU's players only, never the
 * opposition's (docs/PLAN.md — opposition players are display-only, with no
 * Appearance of their own).
 *
 * Ordered by id, which is the order the importer wrote them in: for whoever
 * batted, that is the batting order a scorecard's table is read in (see
 * apps/cms/src/lib/importing.ts). Nothing on the Appearance itself records a
 * batting position, so this is the nearest the record comes to one.
 */
export async function appearancesFor(matchId: number): Promise<Appearance[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<StoredAppearance>("appearances", {
    "where[match][equals]": String(matchId),
    sort: "id",
    limit: "50",
    depth: "1",
  });

  return docs.map(asAppearance);
}

/**
 * Every Match's id, so the site can build every Match's page at build time —
 * the public site is fully static (docs/PLAN.md).
 */
export async function allMatchIds(): Promise<number[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<{ id: number }>("matches", {
    limit: "1000",
    depth: "0",
  });

  return docs.map((doc) => doc.id);
}
