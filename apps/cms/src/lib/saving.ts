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

import type { ParsedMatch } from "./cricclubs";
import {
  documentsFor,
  sameFixture,
  type ImportedAppearance,
} from "./importing";
import { isOurSide, type Resolution } from "./names";

/** The club's side that played this match, as the screen identified it. */
export type OurSide = {
  id: number | string;
  cricclubsNames: string[];
};

export type SaveOutcome = {
  /** The Match that was written. */
  matchId: number | string;
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
 * finds the scorecard already there and the question already stated.
 */
export async function saveImport({
  api,
  match,
  side,
  resolutions,
  venue,
  confident,
}: {
  api: string;
  match: ParsedMatch;
  side: OurSide;
  resolutions: Resolution[];
  venue: "home" | "away";
  confident: boolean;
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
    published: confident,
    updated: Boolean(already),
    appearances: appearances.length,
  };
}
