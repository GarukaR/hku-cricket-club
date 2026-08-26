// Turning a scorer's spelling into one of the club's Players.
//
// Scorers type names freely, and one export carries three spellings of one man:
// `Jaya Ramesh Chaliki` in the bowling table, `Jaya Ramesh C` in a dismissal,
// `Jaya Ram` in the fall of wickets. Resolving them is what stops one person
// becoming three entries in the averages (CONTEXT.md, *Alias*).
//
// Nothing here guesses. An abbreviation is offered as a *suggestion* the editor
// confirms, never applied on its own — because the evidence that suggestions are
// not answers is in the same file: `Muhammad` is two different players in the
// UCL sample, and `Mohammad` truncated is a third. What makes this decay toward
// zero is not cleverness but memory: each answer is saved as an Alias, and the
// same spelling never asks twice.
//
// Two kinds of name come out of an export and they are not interchangeable.
//
//   - The **batting and bowling tables** carry full names. These may create a
//     Player, because a full name is the only thing in the file that identifies
//     somebody the club has not met before.
//   - The **fielder and bowler columns of a dismissal** carry abbreviations —
//     `Gohar A`, `Ruthvik N`, `Yash D C`. These may only be matched to a Player
//     who already exists. A new Player minted from `Gohar A` would be a second
//     entry for a man already in the record, spelled worse.
//
// The fall of wickets is not read at all: lib/cricclubs drops it, because its
// names truncate to eight characters and collide.

import { sameEntity } from "./mapping";
import type { ParsedMatch } from "./cricclubs";

/** A Player as resolving needs to know them. */
export type KnownPlayer = {
  id: number | string;
  /** The club's own spelling — the one an averages table prints. */
  name: string;
  /** How scorers have spelled it. Payload hands back nulls in a `hasMany`. */
  aliases?: (string | null)[] | null;
};

/** Where in the export a spelling appeared. */
export type NameSource = "batting" | "bowling" | "fielding" | "dismissal";

/** One distinct spelling from one export, and what may be done with it. */
export type ScorerName = {
  /** Exactly as the scorer typed it, first time it appeared. */
  spelling: string;
  /** Every column it turned up in, so the screen can say why it is asking. */
  sources: NameSource[];
  /** Whether this spelling is allowed to create a Player. True only for a full
   *  name out of a batting or bowling table. */
  mayCreate: boolean;
};

export type Resolution = {
  name: ScorerName;
  /** The Player this spelling belongs to, if the record already knows. */
  player?: KnownPlayer;
  /** How it was recognised. Absent when nothing was. */
  via?: "name" | "alias";
  /** Players this *might* be, best first. Only ever offered, never applied. */
  suggestions: KnownPlayer[];
};

/**
 * The name with everything a scorer varies freely taken out of it: case, the
 * full stops in initials, and run-on spaces.
 *
 * Deliberately no further than that. Reordering `Ranasinghe G` into `G
 * Ranasinghe`, or matching on a surname alone, would resolve names the club has
 * never confirmed — and a wrong resolution is worse than a question, because a
 * question is asked once and a wrong Alias is silent forever.
 */
export function canonicalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const tokens = (name: string): string[] =>
  canonicalName(name).split(" ").filter(Boolean);

/**
 * Whether `short` reads as an abbreviation of `full` — `Jaya Ramesh C` of `Jaya
 * Ramesh Chaliki`, `Yash D C` of `Yash D Chauhan`.
 *
 * Token by token and in order: every token of the short form must begin the
 * token in the same position of the full one, and the short form may stop early
 * but never run past. `Muhammad` abbreviates both `Muhammad Umar` and `Muhammad
 * Abdullah Khan`, which is the point — this decides what to *offer*, and
 * offering two is how the collision becomes visible instead of silent.
 */
export function abbreviates(short: string, full: string): boolean {
  const brief = tokens(short);
  const whole = tokens(full);
  if (brief.length === 0 || brief.length > whole.length) return false;
  return brief.every((part, i) => whole[i].startsWith(part));
}

/** Every spelling the club owns in this export, in the order the file reads.
 *
 *  `ours` answers whether a CricClubs entity name is one of the club's sides —
 *  the mapping recorded on the Team, which is the only thing that knows
 *  (lib/mapping). A match neither of whose sides is ours yields nothing: there
 *  is no one here to resolve, and the opposition are display-only. */
export function ourNames(
  match: ParsedMatch,
  ours: (entity: string) => boolean,
): ScorerName[] {
  if (!match.teams.some(ours)) return [];

  const found = new Map<string, ScorerName>();

  const note = (
    spelling: string | undefined,
    source: NameSource,
    mayCreate: boolean,
  ) => {
    const written = spelling?.trim();
    if (!written) return;

    const key = canonicalName(written);
    if (!key) return;

    const already = found.get(key);
    if (!already) {
      found.set(key, { spelling: written, sources: [source], mayCreate });
      return;
    }
    if (!already.sources.includes(source)) already.sources.push(source);
    // A spelling that reached a batting table anywhere is a full name, whatever
    // else it also appeared as.
    already.mayCreate ||= mayCreate;
  };

  for (const innings of match.innings) {
    const weBatted = ours(innings.battingTeam);
    const weBowled = innings.bowlingTeam
      ? ours(innings.bowlingTeam)
      : !weBatted;

    if (weBatted) {
      for (const batter of innings.batting) note(batter.name, "batting", true);
    }

    if (weBowled) {
      for (const bowler of innings.bowling) note(bowler.name, "bowling", true);

      // The other side batting: the fielder who caught them and the bowler
      // named against the dismissal are both ours. Abbreviated, so neither may
      // mint a Player — and the bowler on a run out merely happened to be
      // bowling, which is a fact about the credit and not about the name.
      for (const batter of innings.batting) {
        note(batter.fielder, "fielding", false);
        note(batter.bowler, "dismissal", false);
      }
    }
  }

  return [...found.values()];
}

/** Which Player a spelling already belongs to, if the record knows. */
function recognise(
  spelling: string,
  players: KnownPlayer[],
): { player: KnownPlayer; via: "name" | "alias" } | undefined {
  const key = canonicalName(spelling);

  const byName = players.find((player) => canonicalName(player.name) === key);
  if (byName) return { player: byName, via: "name" };

  const byAlias = players.find((player) =>
    (player.aliases ?? []).some(
      (alias) => alias != null && canonicalName(alias) === key,
    ),
  );
  return byAlias ? { player: byAlias, via: "alias" } : undefined;
}

/**
 * Every spelling in an export, resolved against the Players the record holds.
 *
 * Order is the file's own, so the screen reads in the order somebody would
 * check it against the paper scorecard.
 */
export function resolveNames(
  names: ScorerName[],
  players: KnownPlayer[],
): Resolution[] {
  return names.map((name) => {
    const known = recognise(name.spelling, players);
    if (known) return { name, ...known, suggestions: [] };

    // Shortest full name first: of the players a spelling could abbreviate, the
    // one with least left over is the likeliest, and the ordering is stable so
    // the same file offers the same list twice.
    const suggestions = players
      .filter(
        (player) =>
          abbreviates(name.spelling, player.name) ||
          (player.aliases ?? []).some(
            (alias) => alias != null && abbreviates(name.spelling, alias),
          ),
      )
      .sort((one, other) => one.name.length - other.name.length);

    return { name, suggestions };
  });
}

/**
 * What is wrong with recording `spelling` as an Alias of `player`, if anything.
 *
 * One spelling, one Player. Two Players claiming `Gohar A` would make every
 * future import of that name unanswerable — and worse, answerable differently
 * on different days, which is the shape of bug that shows up a season later as
 * a batting average nobody can account for.
 */
export function aliasClash(
  spelling: string,
  player: Pick<KnownPlayer, "id">,
  others: KnownPlayer[],
): string | undefined {
  const key = canonicalName(spelling);
  if (!key) return undefined;

  for (const other of others) {
    if (other.id === player.id) continue;

    if (canonicalName(other.name) === key) {
      return `${spelling} is ${other.name}'s own name. A spelling belongs to one Player, or an import cannot say which of them played.`;
    }
    if (
      (other.aliases ?? []).some(
        (alias) => alias != null && canonicalName(alias) === key,
      )
    ) {
      return `${spelling} is already recorded as an alias of ${other.name}. A spelling belongs to one Player, or an import cannot say which of them played.`;
    }
  }

  return undefined;
}

/**
 * What is wrong with a Player's own list of Aliases, if anything.
 *
 * Checks the list against itself and against every other Player. Undefined for
 * a Player with no aliases at all, which is the ordinary state of somebody
 * every scorer happens to have spelled the same way.
 */
export function aliasProblem(
  aliases: (string | null)[] | null | undefined,
  player: Pick<KnownPlayer, "id" | "name">,
  others: KnownPlayer[],
): string | undefined {
  const listed = (aliases ?? [])
    .map((alias) => alias?.trim())
    .filter((alias): alias is string => Boolean(alias));

  const seen = new Set<string>();
  for (const alias of listed) {
    const key = canonicalName(alias);

    if (seen.has(key)) {
      return `${alias} is listed twice. One spelling, one row.`;
    }
    seen.add(key);

    if (canonicalName(player.name) === key) {
      // Harmless rather than wrong, and worth saying: resolution already tries
      // the Player's own name first, so this row does nothing.
      return `${alias} is already this player's name, so it resolves without being listed here.`;
    }

    const clash = aliasClash(alias, player, others);
    if (clash) return clash;
  }

  return undefined;
}

/** Whether an entity name is one of the club's sides, given what the Teams
 *  claim. The shape lib/mapping's `sameEntity` wants, in the form the screens
 *  and the importer both need. */
export function isOurSide(claimed: string[]): (entity: string) => boolean {
  return (entity) => claimed.some((name) => sameEntity(name, entity));
}
