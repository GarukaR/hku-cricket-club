// A Player, and the record their own profile reads (CONTEXT.md — Player).
//
// A Player is thin — a name — because everything else a profile shows is
// derived from Appearances (./career) rather than stored. This module is the
// one place that reads Appearances and Registrations *by Player*, the way
// ./matches reads Matches for the homepage and ./squad reads Registrations
// *by Team*.

import { cacheLife, cacheTag } from "next/cache";

import type {
  Appearance as StoredAppearance,
  Player as StoredPlayer,
  Registration as StoredRegistration,
} from "@hkucc/domain";

import type { Appearance } from "./appearance";
import { query } from "./cms";
import { RECORD } from "./matches";
import { named } from "./relations";
import { asAppearance } from "./record";

const LIFE = "days";

export type Player = { id: number; name: string };

function asPlayer(stored: StoredPlayer): Player {
  return { id: stored.id, name: stored.name };
}

/** Every Player's id, so the site can build every Player's page at build
 *  time — the public site is fully static (docs/PLAN.md). */
export async function allPlayerIds(): Promise<number[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<{ id: number }>("players", {
    limit: "1000",
    depth: "0",
  });

  return docs.map((doc) => doc.id);
}

export async function playerById(id: number): Promise<Player | undefined> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<StoredPlayer>("players", {
    "where[id][equals]": String(id),
    limit: "1",
    depth: "0",
  });

  return docs[0] && asPlayer(docs[0]);
}

/** One Appearance, with just enough of its Match to place it on the profile
 *  and link to the Match's own page. Not `lib/match`'s `Match` — that type
 *  carries a Result and everything the scoreline needs, none of which a
 *  profile's match log prints; this carries the one thing that view does
 *  not, the Season, because a career is sliced by it and a scoreline never
 *  is. */
export type AppearanceRecord = {
  matchId: number;
  date: string;
  opponent: string;
  team: string;
  /** The Team's role — league, challenge-league, social, student — not its
   *  name. A call-up's Appearances land under the *league* Team by name,
   *  which is not always literally "league" the way this club writes it, so
   *  matching a call-up to the right split needs the role, not the name
   *  (see components/player/SeasonSplits). */
  teamRole: string;
  season: string;
  appearance: Appearance;
};

function asAppearanceRecord(stored: StoredAppearance): AppearanceRecord | undefined {
  const match = stored.match;
  if (typeof match !== "object" || match === null) return undefined;

  const team = named(match.team);
  const season = named(match.season);
  if (!team || !season) return undefined;

  const teamRole =
    typeof match.team === "object" && match.team !== null
      ? ((match.team as { role?: unknown }).role as string | undefined)
      : undefined;
  if (!teamRole) return undefined;

  return {
    matchId: match.id,
    date: match.date.slice(0, 10),
    opponent: match.opponent,
    team,
    teamRole,
    season,
    appearance: asAppearance(stored),
  };
}

/**
 * Every Appearance this Player has, newest first.
 *
 * A floor, not a certainty: a Scorecard lists only the players a scorer
 * entered, so a Player who fielded all day without batting or bowling can be
 * missing from a match's Appearances entirely (CONTEXT.md). What this
 * returns is exactly and only what was recorded.
 */
export async function appearancesForPlayer(playerId: number): Promise<AppearanceRecord[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<StoredAppearance>("appearances", {
    "where[player][equals]": String(playerId),
    depth: "2",
    limit: "500",
  });

  return docs
    .map(asAppearanceRecord)
    .filter((record): record is AppearanceRecord => record !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** One Season's Registration to one Team — what a profile needs to show a
 *  challenge-league Player's call-ups (CONTEXT.md — Call-up), and nothing
 *  more. `callUps` is blank for every side but the challenge league one; the
 *  rule runs one way only. */
export type SeasonRegistration = {
  team: string;
  season: string;
  callUps?: string;
};

function asSeasonRegistration(stored: StoredRegistration): SeasonRegistration | undefined {
  const team = named(stored.team);
  const season = named(stored.season);
  if (!team || !season) return undefined;

  return {
    team,
    season,
    ...(stored.callUps ? { callUps: stored.callUps } : {}),
  };
}

/** Every Season this Player has been registered for, whatever the side. */
export async function registrationsForPlayer(
  playerId: number,
): Promise<SeasonRegistration[]> {
  "use cache";
  cacheTag(RECORD);
  cacheLife(LIFE);

  const docs = await query<StoredRegistration>("registrations", {
    "where[player][equals]": String(playerId),
    depth: "1",
    limit: "100",
  });

  return docs
    .map(asSeasonRegistration)
    .filter((registration): registration is SeasonRegistration => registration !== undefined);
}
