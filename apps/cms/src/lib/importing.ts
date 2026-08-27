// A parsed export, turned into the documents the record stores.
//
// Everything here is a pure transformation: it is handed a match, told which
// side is ours and which Player each spelling belongs to, and hands back the
// Match and the Appearances to write. Nothing in this module talks to a
// database, which is what lets the whole shape of an import be checked against
// the club's three real exports rather than against a mock.
//
// **The Appearance is the atomic fact** (CONTEXT.md). One per player of ours who
// appears anywhere in the file — batting, bowling, or credited with a catch —
// because a player who fielded all day, was not needed with the bat and did not
// bowl still played, and both the call-up rule and the Matches column depend on
// knowing it. A scorecard lists only the players the scorer entered, so this is
// a floor and never the whole XI.
//
// One thing the file does not say, and this does not invent: **venue**. A
// CricClubs export carries no ground and no home-or-away at all, so it is asked
// for once on the import screen rather than guessed — a wrong venue is visibly
// wrong on a page the opposition also read.
//
// The fielder named is credited whoever they turn out to be, **including when
// they are the bowler**. That is caught and bowled, an ordinary dismissal, and
// the bowler earns the catch as well as the wicket.

import type { ParsedBatter, ParsedInnings, ParsedMatch } from "./cricclubs";
import { dismissalOf } from "./dismissal";
import { canonicalName } from "./names";
import { extrasTotal } from "./reconciliation";

/** Which Player a scorer's spelling belongs to, as the screen resolved it. */
export type PlayerFor = (spelling: string) => number | string | undefined;

export type ImportedInnings = {
  side: "hku" | "opponent";
  runs: number;
  wickets?: number;
  overs?: string;
  extras?: number;
  byes?: number;
  legByes?: number;
};

/** A Match as it is about to be written. Ids are the caller's to supply. */
export type ImportedMatch = {
  date: string;
  opponent: string;
  venue: "home" | "away";
  result: {
    outcome?: "won" | "lost" | "drawn" | "tied" | "abandoned" | "conceded";
    margin?: { value: number; unit: "runs" | "wickets" };
    innings: ImportedInnings[];
  };
};

export type ImportedAppearance = {
  player: number | string;
  batted?: boolean;
  batting?: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    notOut?: boolean;
    howOut?: string;
    fielder?: string;
    bowler?: string;
  };
  bowled?: boolean;
  bowling?: {
    overs?: string;
    maidens?: number;
    runs?: number;
    wickets?: number;
    wides?: number;
    noBalls?: number;
  };
  fielding?: { catches?: number; runOuts?: number; stumpings?: number };
};

export type Imported = {
  match: ImportedMatch;
  appearances: ImportedAppearance[];
};

/** Whether our side is the one batting in this innings. */
const weBatted = (innings: ParsedInnings, ours: (e: string) => boolean) =>
  ours(innings.battingTeam);

const weBowled = (innings: ParsedInnings, ours: (e: string) => boolean) =>
  innings.bowlingTeam ? ours(innings.bowlingTeam) : !weBatted(innings, ours);

/**
 * What the club's side did, as an outcome the record stores.
 *
 * Only `won` and `lost` can be read off a header, and only when it says who won
 * in a form the parser recognised. A tie, an abandonment and a concession are
 * outcomes no sample has ever shown, so nothing here invents one: an unreadable
 * result line leaves the outcome empty, the Match is a fixture with a scorecard
 * attached, and an editor states the outcome themselves. That is a gap in the
 * record rather than a wrong entry in it.
 */
function outcomeFor(
  match: ParsedMatch,
  ours: (entity: string) => boolean,
): ImportedMatch["result"]["outcome"] {
  if (!match.winner) return undefined;
  return ours(match.winner) ? "won" : "lost";
}

function inningsFor(
  innings: ParsedInnings,
  ours: (entity: string) => boolean,
): ImportedInnings | undefined {
  // Runs are required on a stored innings, and an innings whose total the
  // scorer never wrote down is not one the record can hold.
  if (innings.total == null) return undefined;

  return {
    side: weBatted(innings, ours) ? "hku" : "opponent",
    runs: innings.total,
    // All out is written as the *absence* of a wickets figure, never as ten:
    // a scorecard says 133, not 133/10 (collections/Matches). CricClubs states
    // the ten, so this is where the two notations meet — and the record refuses
    // the value outright rather than storing a second way of saying one thing.
    wickets:
      innings.wickets != null && innings.wickets >= 10
        ? undefined
        : innings.wickets,
    overs: innings.overs,
    extras: extrasTotal(innings.extras),
    // A column the scorer left empty says nothing, and a null would say
    // something — the record's own distinction between absent and zero.
    byes: innings.extras.byes ?? undefined,
    legByes: innings.extras.legByes ?? undefined,
  };
}

/** The batting half of an Appearance, from one row of a batting table. */
function battingFor(batter: ParsedBatter): ImportedAppearance["batting"] {
  return {
    runs: batter.runs,
    balls: batter.balls,
    fours: batter.fours,
    sixes: batter.sixes,
    notOut: batter.notOut,
    howOut: batter.howOut,
    fielder: batter.fielder,
    bowler: batter.bowler,
  };
}

/**
 * The Match and the Appearances this export becomes.
 *
 * `playerFor` answers with a Player id for a spelling the record knows and
 * `undefined` for one it does not. An unresolved spelling simply produces no
 * Appearance — it never produces a guess — and the confidence gate is what
 * stops such an import publishing in that state (lib/confidence). The two are
 * separate on purpose: this can build a partial record for a draft to hold,
 * which is precisely what a held match is.
 */
export function documentsFor({
  match,
  ours,
  playerFor,
  venue,
}: {
  match: ParsedMatch;
  ours: (entity: string) => boolean;
  playerFor: PlayerFor;
  venue: "home" | "away";
}): Imported {
  const opponent =
    match.teams.find((team) => !ours(team)) ?? match.teams[1] ?? "";

  const appearances = new Map<string, ImportedAppearance>();

  /** One Appearance per Player, however many ways the file names them. */
  const forPlayer = (
    spelling: string | undefined,
  ): ImportedAppearance | undefined => {
    const written = spelling?.trim();
    if (!written) return undefined;

    const id = playerFor(written);
    if (id == null) return undefined;

    const key = String(id);
    const already = appearances.get(key);
    if (already) return already;

    const fresh: ImportedAppearance = { player: id };
    appearances.set(key, fresh);
    return fresh;
  };

  for (const innings of match.innings) {
    if (weBatted(innings, ours)) {
      for (const batter of innings.batting) {
        const appearance = forPlayer(batter.name);
        if (!appearance) continue;

        // A player who did not bat still played, and the export pads their
        // figures with zeroes rather than recording a duck.
        appearance.batted = !batter.didNotBat;
        if (!batter.didNotBat) appearance.batting = battingFor(batter);
      }
    }

    if (!weBowled(innings, ours)) continue;

    for (const bowler of innings.bowling) {
      const appearance = forPlayer(bowler.name);
      if (!appearance) continue;

      appearance.bowled = true;
      appearance.bowling = {
        overs: bowler.overs,
        maidens: bowler.maidens,
        runs: bowler.runs,
        wickets: bowler.wickets,
        wides: bowler.wides,
        noBalls: bowler.noBalls,
      };
    }

    // The other side batting: every dismissal that credits one of ours in the
    // field. The bowler named on a run out took no wicket and is not touched
    // here — his figures come from the bowling table, where they belong.
    for (const batter of innings.batting) {
      const dismissal = dismissalOf(batter.howOut);
      if (!dismissal?.creditsFielder) continue;

      const appearance = forPlayer(batter.fielder);
      if (!appearance) continue;

      const credit = dismissal.creditsFielder;
      const fielding = (appearance.fielding ??= {});
      const field =
        credit === "catch"
          ? "catches"
          : credit === "stumping"
            ? "stumpings"
            : "runOuts";
      fielding[field] = (fielding[field] ?? 0) + 1;
    }
  }

  return {
    match: {
      date: match.date,
      opponent,
      venue,
      result: {
        outcome: outcomeFor(match, ours),
        margin: match.margin,
        innings: match.innings
          .map((innings) => inningsFor(innings, ours))
          .filter((innings): innings is ImportedInnings => Boolean(innings)),
      },
    },
    appearances: [...appearances.values()],
  };
}

/**
 * How to tell whether this match is already in the record.
 *
 * The club's side, the date and the opponent. A CricClubs export carries no id
 * of its own, and the scorecard address is not in the file either, so this is
 * everything available that identifies a fixture — and it is enough: a side
 * does not play the same opponent twice on one day.
 *
 * Matching on it is what makes importing the same file twice safe. Re-importing
 * is a normal thing to want, because a scorer corrects a scorecard after the
 * fact and the whole point of this importer is that re-running it is cheap.
 */
export function sameFixture(
  one: { date?: string | null; opponent?: string | null },
  other: { date?: string | null; opponent?: string | null },
): boolean {
  const day = (value: string | null | undefined): string =>
    value ? new Date(value).toISOString().slice(0, 10) : "";

  return (
    day(one.date) !== "" &&
    day(one.date) === day(other.date) &&
    canonicalName(one.opponent ?? "") === canonicalName(other.opponent ?? "")
  );
}
