// Writing an import into the record.
//
// Through Payload's own REST API with the editor's session, one document at a
// time, rather than an endpoint of ours that would do it in a single
// transaction. That is a deliberate trade and worth naming: an endpoint would
// be faster and atomic, and it would also be a second way into this record —
// one whose rules would have to be kept in step with the collections' own by
// somebody remembering to. Every write below goes through the validation an
// editor typing the same thing by hand would meet.
//
// The cost is that a failure halfway leaves a partial match. That is survivable
// here in a way it would not be elsewhere, because **importing the same file
// twice is safe by design** (`sameFixture`, and one Appearance per player per
// match): the fix for a half-written import is to press the button again.
// Re-importing is a normal thing to want anyway — scorers correct scorecards
// after the fact.

import type { Hold } from "./confidence";
import type { ParsedMatch } from "./cricclubs";
import type { TeamRole } from "./eligibility";
import {
  documentsFor,
  sameFixture,
  type ImportedAppearance,
} from "./importing";
import { isOurSide, type Resolution } from "./names";
import type { PlayingRole } from "./playingRole";
import { proposeRegistrations, type Appeared, type Proposal } from "./registering";
import { suggestedRole } from "./suggestedRole";

/** The club's side that played this match, as the screen identified it. */
export type OurSide = {
  id: number | string;
  cricclubsNames: string[];
  /** What the side is *for*, which is what the eligibility rule turns on. */
  role?: TeamRole;
};

export type SaveOutcome = {
  /** The Match that was written. */
  matchId: number | string;
  /** The Season it was filed under, found or made. Carried out so the screen
   *  can ask who is registered to this side for it without working it out a
   *  second time. */
  seasonId: number | string;
  /** Whether it went live or is being held. */
  published: boolean;
  /** Whether it was already in the record before this. */
  updated: boolean;
  appearances: number;
};

type Json = Record<string, unknown>;

/** Payload answers `{ doc }` on a write and `{ errors: [{ message }] }` when a
 *  collection refuses. A refusal is worth showing verbatim: it is the record's
 *  own words about its own rules. */
async function send(
  url: string,
  init: { method: string; body?: Json },
): Promise<Json> {
  const response = await fetch(url, {
    method: init.method,
    credentials: "include",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const body = (await response.json()) as {
    doc?: Json;
    docs?: Json[];
    errors?: { message?: string }[];
  };

  if (!response.ok) {
    throw new Error(
      body?.errors?.[0]?.message ??
        `The record refused this (${response.status}).`,
    );
  }

  return (body.doc ?? body) as Json;
}

async function findAll(url: string): Promise<Json[]> {
  const body = await send(url, { method: "GET" });
  return (body.docs as Json[]) ?? [];
}

/**
 * The Season this match belongs to, made if the record has never seen it.
 *
 * Worked out from the date rather than read from the header, upstream in
 * lib/cricclubs — one of these files carries no season at all. Creating it is
 * safe in a way that guessing a Player is not: a Season is a name and a year,
 * with nothing to get subtly wrong and nobody's figures hanging off which one
 * it is.
 */
async function seasonFor(api: string, name: string): Promise<number | string> {
  const [existing] = await findAll(
    `${api}/seasons?depth=0&limit=1&where[name][equals]=${encodeURIComponent(name)}`,
  );
  if (existing) return existing.id as number | string;

  const made = await send(`${api}/seasons`, {
    method: "POST",
    body: { name },
  });
  return made.id as number | string;
}

/**
 * The Competition, if the header named one.
 *
 * A friendly has none, and the emptiness is the record saying so — there is
 * deliberately no "Friendly" row to create (docs/cms.md). A Competition carries
 * no Season, so a side promoted out of Div 2 gets a new Competition rather than
 * an edited one, and matching on name *and* division is what keeps those apart.
 */
async function competitionFor(
  api: string,
  name: string | undefined,
  division: string | undefined,
): Promise<number | string | undefined> {
  if (!name) return undefined;

  const query = [
    `where[name][equals]=${encodeURIComponent(name)}`,
    division
      ? `where[division][equals]=${encodeURIComponent(division)}`
      : "where[division][exists]=false",
  ].join("&");

  const [existing] = await findAll(`${api}/competitions?depth=0&limit=1&${query}`);
  if (existing) return existing.id as number | string;

  const made = await send(`${api}/competitions`, {
    method: "POST",
    body: { name, division },
  });
  return made.id as number | string;
}

/** The Match this file describes, if the record already holds it. */
async function existingMatch(
  api: string,
  team: number | string,
  date: string,
  opponent: string,
): Promise<Json | undefined> {
  // Every match this side has played, and the day is matched here rather than
  // in the query: Payload's date filters compare instants and the record stores
  // a day, so a `where` on it would turn on the browser's time zone.
  //
  // Held matches are in this list too, because the editor doing the importing
  // is signed in and `read` only narrows to published for everybody else. A
  // draft that could not be found again would be re-imported as a duplicate,
  // which is the exact failure this function exists to prevent.
  const candidates = await findAll(
    `${api}/matches?depth=0&limit=200&where[team][equals]=${encodeURIComponent(String(team))}`,
  );

  return candidates.find((candidate) =>
    sameFixture(
      { date: candidate.date as string, opponent: candidate.opponent as string },
      { date, opponent },
    ),
  );
}

/** One Appearance per player per match, created or brought up to date. */
async function writeAppearance(
  api: string,
  matchId: number | string,
  appearance: ImportedAppearance,
  existing: Json[],
): Promise<void> {
  const already = existing.find((one) => {
    const player = one.player as { id?: unknown } | number | string;
    const id = typeof player === "object" && player ? player.id : player;
    return String(id) === String(appearance.player);
  });

  const body: Json = { ...appearance, match: matchId };

  if (already) {
    await send(`${api}/appearances/${already.id}`, { method: "PATCH", body });
  } else {
    await send(`${api}/appearances`, { method: "POST", body });
  }
}

/**
 * Write this import, published or held.
 *
 * `confident` decides only the status. Everything else is written either way,
 * because a held match is a real record of a real game that somebody has a
 * question about — not a queue of unparsed files. An editor opening the draft
 * finds the scorecard already there and the question already stated — `holds`
 * is written onto the Match itself (`heldReasons`) so that is still true after
 * the import screen has been closed and the parsed file is gone (#45).
 */
export async function saveImport({
  api,
  match,
  side,
  resolutions,
  venue,
  confident,
  holds = [],
}: {
  api: string;
  match: ParsedMatch;
  side: OurSide;
  resolutions: Resolution[];
  venue: "home" | "away";
  confident: boolean;
  holds?: Hold[];
}): Promise<SaveOutcome> {
  const bySpelling = new Map(
    resolutions
      .filter((one) => one.player)
      .map((one) => [one.name.spelling, one.player!.id]),
  );

  const { match: document, appearances } = documentsFor({
    match,
    ours: isOurSide(side.cricclubsNames),
    playerFor: (spelling) => bySpelling.get(spelling),
    venue,
  });

  const [season, competition] = await Promise.all([
    seasonFor(api, match.season),
    competitionFor(api, match.competition, match.division),
  ]);

  const already = await existingMatch(
    api,
    side.id,
    document.date,
    document.opponent,
  );

  const body: Json = {
    ...document,
    team: side.id,
    season,
    competition,
    _status: confident ? "published" : "draft",
    // Cleared on a confident import — re-running one that used to have a
    // question against a scorecard that has since been fixed should not leave
    // a stale answer sitting in the sidebar of a now-published match.
    heldReasons: holds.map((hold) => hold.message),
  };

  const written = already
    ? await send(`${api}/matches/${already.id}`, { method: "PATCH", body })
    : await send(`${api}/matches`, { method: "POST", body });

  const matchId = written.id as number | string;

  const existing = already
    ? await findAll(
        `${api}/appearances?depth=0&limit=200&where[match][equals]=${encodeURIComponent(String(matchId))}`,
      )
    : [];

  // One at a time rather than in parallel: twenty simultaneous writes against a
  // container that sleeps is a way to find its connection limit, and this is a
  // screen somebody is watching rather than a batch job.
  for (const appearance of appearances) {
    await writeAppearance(api, matchId, appearance, existing);
  }

  return {
    matchId,
    seasonId: season,
    published: confident,
    updated: Boolean(already),
    appearances: appearances.length,
  };
}

// --- Registering the players who appeared ------------------------------------
//
// A Registration is what makes the eligibility rule enforceable before somebody
// takes the field, and what keeps a squad member who neither batted nor bowled
// in the list at all — so it stays a record of its own, entered on purpose.
// What follows only removes the typing: it reads back who played, works out
// what may be offered (lib/registering), and writes exactly what a person
// ticked.

const idOf = (value: unknown): number | string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "object") return (value as { id?: number | string }).id;
  return value as number | string;
};

/** Every Appearance in this Season for these Players, which is where the
 *  keeping and bowling evidence lives. One query rather than one per player:
 *  this runs on a screen somebody is watching. */
async function seasonEvidence(
  api: string,
  seasonId: number | string,
  playerIds: (number | string)[],
): Promise<Json[]> {
  if (playerIds.length === 0) return [];

  const players = playerIds.map((id) => encodeURIComponent(String(id))).join(",");

  return findAll(
    `${api}/appearances?depth=0&limit=500` +
      `&where[player][in]=${players}` +
      `&where[match.season][equals]=${encodeURIComponent(String(seasonId))}`,
  );
}

/** A role the record suggests for one Player, and what they are set to now.
 *
 *  Worked out here with the same function the Player's own sidebar uses, rather
 *  than by reading that sidebar's sentence back: the panel has to write a value,
 *  and a sentence parsed for one would be a second definition of the rule
 *  waiting to disagree with the first. */
export type Suggested = {
  /** The Player's own id, in the type the record uses it in. Carried rather
   *  than rebuilt from the string this map is keyed by: a relationship field
   *  refuses a numeric id handed to it as a string. */
  playerId: number | string;
  role: PlayingRole;
  summary: string;
  /** What the Player is set to today. `null` for the ordinary case of nobody
   *  having said, which is the only case where accepting is uncontroversial. */
  current: PlayingRole | null;
};

export type ImportProposal = {
  proposal: Proposal;
  /** Keyed by player id, and absent for anybody the rule will not guess at —
   *  under three appearances, or neither batting nor bowling in them. */
  suggestions: Record<string, Suggested>;
};

/**
 * What this import can offer to register, read back from the record itself.
 *
 * Read back rather than carried over from the parse, because the parse says who
 * appeared and the *record* says who is already registered — and the second is
 * the half that decides. It also means a re-import proposes nothing the first
 * one already settled.
 */
export async function proposalFor({
  api,
  matchId,
  seasonId,
  side,
}: {
  api: string;
  matchId: number | string;
  seasonId: number | string;
  side: OurSide;
}): Promise<ImportProposal> {
  const appearances = await findAll(
    `${api}/appearances?depth=1&limit=200&where[match][equals]=${encodeURIComponent(String(matchId))}`,
  );

  // One entry per Player, named. An Appearance without a resolvable player is
  // not a person this can offer to register.
  const players = new Map<
    string,
    { id: number | string; name: string; playingRole: PlayingRole | null }
  >();
  for (const appearance of appearances) {
    const player = appearance.player as {
      id?: number | string;
      name?: string;
      playingRole?: PlayingRole | null;
    } | null;
    if (!player?.id) continue;
    players.set(String(player.id), {
      id: player.id,
      name: player.name ?? String(player.id),
      playingRole: player.playingRole ?? null,
    });
  }

  const ids = [...players.values()].map((one) => one.id);
  if (ids.length === 0) {
    return {
      proposal: { register: [], blocked: [], already: [], keeperCandidates: [] },
      suggestions: {},
    };
  }

  const list = ids.map((id) => encodeURIComponent(String(id))).join(",");

  const [registrations, teams, evidence, career] = await Promise.all([
    findAll(
      `${api}/registrations?depth=0&limit=200` +
        `&where[player][in]=${list}` +
        `&where[season][equals]=${encodeURIComponent(String(seasonId))}`,
    ),
    findAll(`${api}/teams?depth=0&limit=100`),
    seasonEvidence(api, seasonId, ids),
    // Every Appearance these Players have ever made, which is the scope the
    // role rule works over — a season with few wickets does not make somebody
    // stop being a bowler, which is the whole reason it reads a career.
    findAll(
      `${api}/appearances?depth=0&limit=1000&where[player][in]=${list}`,
    ),
  ]);

  const roleOfTeam = new Map(
    teams.map((team) => [String(team.id), team.role as TeamRole]),
  );

  const appeared: Appeared[] = [...players.values()].map((player) => {
    const mine = registrations.filter(
      (one) => String(idOf(one.player)) === String(player.id),
    );

    const here = mine.some(
      (one) => String(idOf(one.team)) === String(side.id),
    );

    // Their *other* registrations this Season, as roles. A registration to a
    // team the record cannot name a role for is dropped rather than guessed:
    // the rule is about what a side is for, and an unknown role is not an
    // answer.
    const elsewhere = mine
      .filter((one) => String(idOf(one.team)) !== String(side.id))
      .map((one) => roleOfTeam.get(String(idOf(one.team))))
      .filter((role): role is TeamRole => Boolean(role));

    const theirs = evidence.filter(
      (one) => String(idOf(one.player)) === String(player.id),
    );

    const fieldingOf = (one: Json) =>
      (one.fielding ?? {}) as { stumpings?: number; caughtBehind?: number };

    return {
      playerId: player.id,
      name: player.name,
      registeredHere: here,
      registeredElsewhere: elsewhere,
      // Positive evidence only, and never its absence (CONTEXT.md —
      // Caught behind).
      kept: theirs.some(
        (one) =>
          (fieldingOf(one).stumpings ?? 0) > 0 ||
          (fieldingOf(one).caughtBehind ?? 0) > 0,
      ),
      bowled: theirs.some((one) => one.bowled === true),
    };
  });

  // The same rule the Player's own sidebar states, over the same career
  // Appearances, so the panel and the record can never offer different answers.
  const suggestions: Record<string, Suggested> = {};
  for (const player of players.values()) {
    const theirs = career.filter(
      (one) => String(idOf(one.player)) === String(player.id),
    );

    const suggestion = suggestedRole(
      theirs.map((one) => {
        const batting = (one.batting ?? {}) as {
          runs?: number;
          notOut?: boolean;
        };
        const bowling = (one.bowling ?? {}) as { overs?: string };
        const fielding = (one.fielding ?? {}) as {
          stumpings?: number;
          caughtBehind?: number;
        };

        return {
          overs: bowling.overs ?? undefined,
          batted: one.batted === true,
          runs: batting.runs ?? undefined,
          notOut: batting.notOut ?? undefined,
          stumpings: fielding.stumpings ?? undefined,
          caughtBehind: fielding.caughtBehind ?? undefined,
        };
      }),
    );

    if (suggestion) {
      suggestions[String(player.id)] = {
        playerId: player.id,
        role: suggestion.role,
        summary: suggestion.summary,
        current: player.playingRole,
      };
    }
  }

  return {
    proposal: proposeRegistrations(appeared, side.role ?? "league"),
    suggestions,
  };
}

/** Register one Player to this Team for this Season, through the collection's
 *  own validation — the eligibility rule included, so a proposal that has gone
 *  stale between reading and clicking is refused here rather than written. */
export async function registerPlayer({
  api,
  playerId,
  teamId,
  seasonId,
}: {
  api: string;
  playerId: number | string;
  teamId: number | string;
  seasonId: number | string;
}): Promise<void> {
  await send(`${api}/registrations`, {
    method: "POST",
    body: { player: playerId, team: teamId, season: seasonId },
  });
}

/** Accept a suggested Playing role, which is the only thing that ever writes
 *  one from a suggestion. Nothing here decides it — a person clicked. */
export async function setPlayingRole({
  api,
  playerId,
  role,
}: {
  api: string;
  playerId: number | string;
  role: PlayingRole;
}): Promise<void> {
  await send(`${api}/players/${playerId}`, {
    method: "PATCH",
    body: { playingRole: role },
  });
}
