// Reading a CricClubs scorecard export.
//
// The export button on a CricClubs scorecard is the sanctioned way this record
// gets its data — the pages themselves sit behind a Cloudflare challenge their
// owner deliberately switched on, and ADR-0001 says why we do not go near it.
// So this module is the club's only route in, and the format it reads is one
// nobody here controls.
//
// Which is why it reads leniently and states plainly. Every rule below came out
// of three real exports in docs/samples/, and each one exists because a file did
// something a tidier format would not: a competition line with no season in it,
// a roster of eight, an innings whose batters are a run short of a total that is
// nonetheless correct. Nothing here rejects a scorecard for disagreeing with
// itself. It reads what is written, says what it read, and leaves the judging to
// lib/reconciliation and to the person at the screen.
//
// Nothing here resolves a name to a Player either. Scorers spell one person
// three ways inside a single file, and that is its own problem with its own
// ticket; this module hands back the names exactly as the scorer typed them.

import { isRetirement } from "./dismissal";
import { seasonOf } from "./notation";
import type { Extras, InningsToCheck } from "./reconciliation";

/** A file this module cannot read, with the reason in the club's own words.
 *
 *  Thrown rather than returned, unlike everything in lib/reconciliation: a
 *  scorecard that disagrees with itself is still a scorecard and there is a
 *  match to show, whereas a file that is not an export has no match in it and
 *  nothing to preview. The two failures are different and read differently. */
export class ExportProblem extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportProblem";
  }
}

/** One line of a batting table, as the scorer entered it. */
export type ParsedBatter = {
  /** Exactly as typed. The only names in the file that can resolve a Player —
   *  the fall-of-wickets table truncates to eight characters and collides. */
  name: string;
  /** The scorer's code — `b`, `lbw`, `ct`, `ctw`, `st`, `ro`. The list is open,
   *  so it is carried through as written rather than mapped onto anything. */
  howOut?: string;
  fielder?: string;
  /** On a run out, merely who was bowling at the time. They did not take the
   *  wicket and may not appear in the bowling figures at all (CONTEXT.md). */
  bowler?: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  /** Inferred, never stated — see `readBatter`. */
  notOut: boolean;
  /** Inferred, never stated — see `readBatter`. */
  didNotBat: boolean;
};

/** One line of a bowling table. */
export type ParsedBowler = {
  name: string;
  /** Balls notation, kept as written — `3.2` is three overs and two balls. */
  overs?: string;
  maidens?: number;
  runs?: number;
  wickets?: number;
  wides?: number;
  noBalls?: number;
};

/** One side's turn to bat, and the figures of the side that bowled at them. */
export type ParsedInnings = {
  battingTeam: string;
  /** Absent only if the export omits the bowling table, which none of the
   *  samples does — but a half-scored innings is a thing that happens. */
  bowlingTeam?: string;
  batting: ParsedBatter[];
  bowling: ParsedBowler[];
  /** What the scorecard says the side made. Read rather than summed: extras
   *  belong to no batter, and one real export's batters are a run short of a
   *  total that is correct. */
  total?: number;
  wickets?: number;
  overs?: string;
  extras: Extras;
};

export type ParsedMargin = { value: number; unit: "runs" | "wickets" };

export type ParsedMatch = {
  /** The competition as the header names it, without its division or season. */
  competition?: string;
  division?: string;
  /** Worked out from the date, never read from the header — see `seasonOf`. */
  season: string;
  /** ISO, because the header writes it dd/mm/yyyy and nothing else should. */
  date: string;
  /** Both sides, in the order the second line names them. Who batted first is
   *  the order of `innings` rather than this, because the blocks state it and
   *  this line does not. */
  teams: [string, string];
  /** Whichever of `teams` the header says won, when it says so in a form this
   *  recognises. */
  winner?: string;
  margin?: ParsedMargin;
  /** The header's own words for the result, kept whatever happened to the two
   *  fields above. A tie, an abandonment and a concession are outcomes this has
   *  never been shown an example of, and the sentence beats nothing at all. */
  resultLine: string;
  innings: ParsedInnings[];
};

// --- Reading the file --------------------------------------------------------

/** CricClubs quotes nothing and escapes nothing, so a comma is a comma. A name
 *  containing one would break this, and would break the export it came from. */
const cells = (line: string): string[] =>
  line.split(",").map((cell) => cell.trim());

/** Empty means the scorer did not record it, which is not the same as zero. */
const number = (cell: string | undefined): number | undefined => {
  const written = cell?.trim() ?? "";
  if (!/^-?\d+$/.test(written)) return undefined;
  return Number(written);
};

const text = (cell: string | undefined): string | undefined => {
  const written = cell?.trim() ?? "";
  return written === "" ? undefined : written;
};

/** The name with everything a header varies freely taken out of it, so that
 *  `LeagueHKU CC` can be recognised as ending with `HKU CC`. */
const flat = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, " ").trim();

/** `,,,HKU CC Bowling ` and `SCC Lancers Fall of Wickets` are both block
 *  headers; one is prefixed with empty columns and one is not, and the third
 *  file writes "Fall of wickets" in lower case. */
const BLOCK = /^,*\s*(.+?)\s+(Batting|Bowling|Fall of Wickets)\s*$/i;

/** `Byes: 0 , Leg Byes: 3, Wickets : 5  Wides : 15, No Balls: 1 Penalty : 0,138,30.5`
 *
 *  Half key-value soup and half CSV: the labels run across the columns without
 *  regard for them, and only the last two cells — the total and the overs — are
 *  columns in any real sense. So the labels are read out of the whole line, and
 *  the two figures off the end of it. */
const EXTRAS_LINE = /\bByes\s*:/i;

/** "Byes" is a suffix of "Leg Byes", and reading the leg byes as byes puts the
 *  bowlers' figures out by exactly the amount the rule exists to catch. */
const BYES = /(?<!Leg\s{0,3})\bByes\s*:\s*(\d+)/i;
const LEG_BYES = /\bLeg\s*Byes\s*:\s*(\d+)/i;
const WICKETS = /\bWickets\s*:\s*(\d+)/i;
const WIDES = /\bWides\s*:\s*(\d+)/i;
const NO_BALLS = /\bNo\s*Balls\s*:\s*(\d+)/i;
const PENALTY = /\bPenalty\s*:\s*(\d+)/i;

const labelled = (line: string, label: RegExp): number | undefined => {
  const found = label.exec(line);
  return found ? Number(found[1]) : undefined;
};

/**
 * Not out, or did not bat? The export says neither.
 *
 * Both are a blank dismissal, and the only thing separating them is that a
 * player who did not bat faced nothing and scored nothing. So a blank row with a
 * run or a ball against it is a batter still there at the end, and a blank row
 * with neither is a batter never needed — which is a *did not bat* Appearance, a
 * different fact from not playing at all (CONTEXT.md).
 *
 * It reads all six innings in docs/samples correctly, including the one where a
 * not-out batter scored nothing off three balls. The case it cannot see is a
 * batter who came in and faced nothing before the innings ended, which no sample
 * contains and which the preview exists for a person to catch.
 */
function readBatter(row: string[]): ParsedBatter {
  const howOut = text(row[1]);
  const runs = number(row[4]);
  const balls = number(row[5]);
  const faced = (runs ?? 0) > 0 || (balls ?? 0) > 0;

  return {
    name: row[0],
    howOut,
    fielder: text(row[2]),
    bowler: text(row[3]),
    runs,
    balls,
    fours: number(row[6]),
    sixes: number(row[7]),
    // A retirement fills this cell and still leaves the batter not out — they
    // walked off, nobody dismissed them. Counting it as a dismissal would put
    // an extra divisor in their career average, which is the kind of wrong
    // nothing about the figure would show (lib/dismissal).
    notOut: isRetirement(howOut) || (!howOut && faced),
    // Still false for a retirement: they came out and batted, which is what
    // this asks. A *did not bat* Appearance is the batter never needed.
    didNotBat: !howOut && !faced,
  };
}

/** `Bowler,Overs,Madiens,Runs,Wickets,Wides,No Balls,Hattricks,Dot Balls` — the
 *  scorer's own spelling of maidens, and two columns nothing keeps. Dot balls is
 *  zero throughout one whole file, and a hat-trick is in the ball-by-ball the
 *  site links to rather than reproduces. */
function readBowler(row: string[]): ParsedBowler {
  return {
    name: row[0],
    overs: text(row[1]),
    maidens: number(row[2]),
    runs: number(row[3]),
    wickets: number(row[4]),
    wides: number(row[5]),
    noBalls: number(row[6]),
  };
}

/** The competition and its division — and not the season the header claims.
 *
 *  `Saturday Championship - Div 2 - 2025-26` in two files, a bare `University
 *  Cricket League` in the third, so neither the division nor the season can be
 *  required of the format. */
function readCompetition(header: string): {
  competition?: string;
  division?: string;
} {
  const parts = header
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return {};

  return {
    competition: parts[0],
    // Anything after the name that is not the season, which CricClubs writes as
    // `2025-26`. The season comes from the date instead, because the file that
    // does not carry one is the file that needed it.
    division: parts.slice(1).find((part) => !/^\d{4}-\d{2}$/.test(part)),
  };
}

/** dd/mm/yyyy, which is how the header writes it and how nothing else should. */
function readDate(line: string): string | undefined {
  const found = /\((\d{1,2})\/(\d{1,2})\/(\d{4})\)/.exec(line);
  if (!found) return undefined;

  const [, day, month, year] = found;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Which of the two sides the header says won, and by how much.
 *
 * The header glues the format to the winner with no separator — `LeagueHKU CC
 * won by 5 Wickets` — so there is no cutting the name out of it. What can be
 * done is to check the two sides the second line already named against the end
 * of that run-on text, which is unambiguous in a way that guessing where
 * "League" stops is not.
 */
function readWinner(
  phrase: string,
  teams: readonly string[],
): { winner?: string; margin?: ParsedMargin } {
  const found = /^(.*?)\bwon\s+by\s+(\d+)\s+(runs?|wickets?)\b/i.exec(phrase);
  if (!found) return {};

  const [, before, value, unit] = found;
  const claimed = flat(before);

  // Longest first, so a side whose name ends with the other side's name is not
  // mistaken for it.
  const winner = [...teams]
    .sort((one, other) => other.length - one.length)
    .find((team) => claimed.endsWith(flat(team)));

  return {
    winner,
    margin: {
      value: Number(value),
      unit: unit.toLowerCase().startsWith("run") ? "runs" : "wickets",
    },
  };
}

/**
 * A CricClubs export, read into the match it describes.
 *
 * Throws `ExportProblem` — naming what is missing — for a file that is not one
 * of these. It never throws for a scorecard that disagrees with itself.
 */
export function parseExport(source: string): ParsedMatch {
  const lines = source.split(/\r?\n/);

  const first = lines.find((line) => line.trim() !== "");
  if (first === undefined) {
    throw new ExportProblem("There is nothing in this file.");
  }

  const colon = first.indexOf(":");
  const date = readDate(first);
  if (colon === -1 || date === undefined) {
    throw new ExportProblem(
      "This does not look like a CricClubs export. The first line of one names " +
        "the competition, the result and the date — “Saturday Championship - " +
        "Div 2 - 2025-26:  LeagueHKU CC won by 5 Wickets (21/03/2026)”. This " +
        `file starts “${first.trim().slice(0, 80)}”. Use the export button on ` +
        "the scorecard page itself rather than saving the page.",
    );
  }

  const resultLine = first.slice(colon + 1).trim();

  const versus = lines.find((line) => /\s+vs\.?\s+/i.test(line));
  const named = versus?.split(/\s+vs\.?\s+/i).map((side) => side.trim());
  if (!named || named.length !== 2 || named.some((side) => side === "")) {
    throw new ExportProblem(
      "The export names the two sides on its second line, as in “SCC Lancers " +
        "Vs HKU CC”, and this file has no such line. Without it there is no " +
        "saying who played.",
    );
  }
  const teams: [string, string] = [named[0], named[1]];

  // --- The blocks ------------------------------------------------------------

  const innings: ParsedInnings[] = [];
  let mode: "batting" | "bowling" | "elsewhere" = "elsewhere";
  let current: ParsedInnings | undefined;

  for (const line of lines.slice(1)) {
    if (line.trim() === "") continue;

    const block = BLOCK.exec(line.trim());
    if (block) {
      const [, team, kind] = block;

      if (/^batting$/i.test(kind)) {
        current = {
          battingTeam: team.trim(),
          batting: [],
          bowling: [],
          extras: {},
        };
        innings.push(current);
        mode = "batting";
      } else if (/^bowling$/i.test(kind)) {
        // The bowling table belongs to the innings it was bowled in, which is
        // the one immediately above it. Nothing in the file says so beyond the
        // order, and the order is the same in every sample.
        if (current) current.bowlingTeam = team.trim();
        mode = "bowling";
      } else {
        // Fall of wickets, deliberately dropped. Its names truncate to eight
        // characters and collide — "Mohammad" is two different players inside
        // one file — so it can resolve nobody, and the record stores no
        // wicket-by-wicket progression to put it in.
        mode = "elsewhere";
      }
      continue;
    }

    if (!current || mode === "elsewhere") continue;

    const row = cells(line);
    const head = row[0]?.toLowerCase();

    if (mode === "batting") {
      if (head === "batsman") continue;

      if (EXTRAS_LINE.test(line)) {
        current.extras = {
          byes: labelled(line, BYES),
          legByes: labelled(line, LEG_BYES),
          wides: labelled(line, WIDES),
          noBalls: labelled(line, NO_BALLS),
          penalty: labelled(line, PENALTY),
        };
        current.wickets = labelled(line, WICKETS);
        current.total = number(row[row.length - 2]);
        current.overs = text(row[row.length - 1]);
        continue;
      }

      // Eight columns, and a name in the first of them. A shorter row is a
      // separator or a stray, not a batter.
      if (row.length >= 8 && row[0] !== "") current.batting.push(readBatter(row));
      continue;
    }

    if (head === "bowler") continue;
    // `Total, 28.3 ,1,133,10,17,4,0,117` — the bowling table's own footer. Not
    // kept: every figure in it is the sum of the rows above it, and the check
    // worth making is against the innings total rather than against itself.
    if (head === "total") continue;

    if (row.length >= 5 && row[0] !== "") current.bowling.push(readBowler(row));
  }

  if (innings.length === 0) {
    throw new ExportProblem(
      "There is no batting table in this file. A CricClubs export has one for " +
        "each side, headed with the side's name and the word Batting.",
    );
  }
  if (innings.every((one) => one.batting.length === 0)) {
    throw new ExportProblem(
      "The batting tables in this file have no players in them. This is an " +
        "export of a scorecard nobody entered, rather than a scorecard.",
    );
  }

  return {
    ...readCompetition(first.slice(0, colon)),
    season: seasonOf(new Date(`${date}T00:00:00Z`)),
    date,
    teams,
    ...readWinner(resultLine, teams),
    resultLine,
    innings,
  };
}

/**
 * One parsed innings, put in the terms lib/reconciliation checks.
 *
 * The join between reading a file and judging it, and it lives here rather than
 * on the screen because two of its three interesting lines are the rules the
 * samples exist to prove. A batter who did not bat is not a batting innings that
 * ended in a dismissal, and neither is one still there at the end; counting
 * either as one would report a wicket-count error against every scorecard the
 * club has.
 */
export function inningsToCheck(innings: ParsedInnings): InningsToCheck {
  return {
    batterRuns: innings.batting
      .filter((batter) => !batter.didNotBat)
      .map((batter) => batter.runs),
    extras: innings.extras,
    statedTotal: innings.total,
    statedWickets: innings.wickets,
    // A filled How out cell is not by itself a wicket: a retirement fills it
    // and nobody was dismissed, which is why a real scorecard of the club's
    // stated four wickets against five filled cells.
    dismissals: innings.batting.filter(
      (batter) => batter.howOut && !isRetirement(batter.howOut),
    ).length,
    bowlerRuns: innings.bowling.map((bowler) => bowler.runs),
    bowlerWickets: innings.bowling.map((bowler) => bowler.wickets),
  };
}
