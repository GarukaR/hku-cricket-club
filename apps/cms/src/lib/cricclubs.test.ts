import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ExportProblem, inningsToCheck, parseExport } from "./cricclubs";
import { economyRate } from "./overs";
import { reconcileInnings, wicketsToNoBowler } from "./reconciliation";

// The three files in docs/samples are the regression suite, not a fixture
// directory: every rule in this module was derived from them, so they are read
// off disk exactly as an editor would upload them. A transcription into a string
// literal here would be a copy that could be quietly corrected until the tests
// passed, which is the one thing they must not be able to do.
const sample = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../docs/samples/${name}`, import.meta.url)),
    "utf8",
  );

const CHARLIE_BEARS = sample("saturday-2026-03-21-v-irc-charlie-bears.csv");
const LANCERS = sample("saturday-2026-01-03-v-scc-lancers.csv");
const UCL = sample("ucl-2025-03-18-v-combined-unis.csv");

describe("the match, as the header states it", () => {
  it("reads the baseline Saturday fixture", () => {
    const match = parseExport(CHARLIE_BEARS);

    expect(match.competition).toBe("Saturday Championship");
    expect(match.division).toBe("Div 2");
    expect(match.date).toBe("2026-03-21");
    expect(match.teams).toEqual(["IRC Charlie Bears Saturday", "HKU CC"]);
    expect(match.winner).toBe("HKU CC");
    expect(match.margin).toEqual({ value: 5, unit: "wickets" });
  });

  it("reads a margin in runs, and the side that is not ours winning", () => {
    const match = parseExport(UCL);

    expect(match.winner).toBe("Combined Unis XI (UCL)");
    expect(match.margin).toEqual({ value: 79, unit: "runs" });
  });

  // The word "League" is glued to the winner's name with no separator in all
  // three files, so the name cannot be cut out of the line — it is recognised by
  // matching the sides the second line already named.
  it("finds the winner through the format glued to the front of it", () => {
    expect(parseExport(LANCERS).resultLine).toMatch(/^LeagueHKU CC won by 2/);
    expect(parseExport(LANCERS).winner).toBe("HKU CC");
  });

  // A bare `University Cricket League:` with no division and no season, against
  // `Saturday Championship - Div 2 - 2025-26:`. Neither can be required.
  it("accepts a competition with no division and no season", () => {
    const match = parseExport(UCL);

    expect(match.competition).toBe("University Cricket League");
    expect(match.division).toBeUndefined();
  });

  // The file with no season in its header is the file from the other season, so
  // a season read off the header would have been missing exactly where it was
  // needed. It comes from the date instead.
  it("works the season out from the date rather than the header", () => {
    expect(parseExport(CHARLIE_BEARS).season).toBe("2025/26");
    expect(parseExport(LANCERS).season).toBe("2025/26"); // January, not 2026/27
    expect(parseExport(UCL).season).toBe("2024/25");
  });
});

describe("the innings", () => {
  it("pairs each batting table with the side that bowled at it", () => {
    const [first, second] = parseExport(CHARLIE_BEARS).innings;

    expect(first.battingTeam).toBe("IRC Charlie Bears Saturday");
    expect(first.bowlingTeam).toBe("HKU CC");
    expect(second.battingTeam).toBe("HKU CC");
    expect(second.bowlingTeam).toBe("IRC Charlie Bears Saturday");
  });

  it("reads the stated total, wickets, overs and every kind of extra", () => {
    const [first, second] = parseExport(CHARLIE_BEARS).innings;

    expect(first.total).toBe(133);
    expect(first.wickets).toBe(10);
    expect(first.overs).toBe("28.3");
    expect(first.extras).toEqual({
      byes: 0,
      legByes: 0,
      wides: 17,
      noBalls: 4,
      penalty: 0,
    });

    expect(second.total).toBe(138);
    expect(second.extras.legByes).toBe(3);
  });

  // "Byes" is a suffix of "Leg Byes". Reading one as the other puts the bowlers'
  // figures out by exactly the amount that rule exists to catch.
  it("does not read the leg byes as byes", () => {
    const [lancers, hku] = parseExport(LANCERS).innings;

    expect(lancers.extras.byes).toBe(0);
    expect(hku.extras.byes).toBe(5);
    expect(hku.extras.legByes).toBe(0);

    const [unis, students] = parseExport(UCL).innings;
    expect(unis.extras.byes).toBe(5);
    expect(unis.extras.legByes).toBe(2);
    expect(students.extras.byes).toBe(0);
    expect(students.extras.legByes).toBe(2);
  });

  it("keeps the roster the scorer entered, which is not reliably eleven", () => {
    expect(
      parseExport(CHARLIE_BEARS).innings.map((i) => i.batting.length),
    ).toEqual([11, 11]);
    // The UCL scorer entered nine and eight. A squad member who neither batted
    // nor bowled can be missing entirely, so matches played is a floor.
    expect(parseExport(UCL).innings.map((i) => i.batting.length)).toEqual([9, 8]);
  });
});

describe("the batting lines", () => {
  it("reads a dismissal with its fielder and its bowler", () => {
    const [first] = parseExport(CHARLIE_BEARS).innings;

    expect(first.batting[0]).toEqual({
      name: "Usman Ayub",
      howOut: "ct",
      fielder: "Jaya Ramesh C",
      bowler: "Jaya Ramesh C",
      runs: 0,
      balls: 3,
      fours: 0,
      sixes: 0,
      notOut: false,
      didNotBat: false,
    });
  });

  // Free text, deliberately: the list of codes is open, and an unrecognised one
  // is a question for a person rather than a value to guess at.
  it("carries the scorer's codes through as written", () => {
    const [lancers, hku] = parseExport(LANCERS).innings;
    const codes = [...lancers.batting, ...hku.batting]
      .map((b) => b.howOut)
      .filter(Boolean);

    expect(new Set(codes)).toEqual(new Set(["ct", "ctw", "lbw", "b", "st", "ro"]));
  });

  // A catch can name no fielder at all, and the export has `ctw` with the
  // fielder equal to the bowler. Both are read, neither is corrected.
  it("accepts a catch with no fielder named", () => {
    const [unis] = parseExport(UCL).innings;
    const aqeel = unis.batting.find((b) => b.name === "Aqeel Mohammad");

    expect(aqeel?.howOut).toBe("ct");
    expect(aqeel?.fielder).toBeUndefined();
    expect(aqeel?.bowler).toBe("Ruthvik N");
  });

  // Both are a blank dismissal, and only the runs and balls separate them.
  it("tells not out from did not bat", () => {
    const [, hku] = parseExport(CHARLIE_BEARS).innings;

    const ashwin = hku.batting.find((b) => b.name === "Ashwin Dokania");
    expect(ashwin).toMatchObject({ runs: 27, notOut: true, didNotBat: false });

    const chamila = hku.batting.find((b) => b.name === "Chamila Panduwawala");
    expect(chamila).toMatchObject({ notOut: false, didNotBat: true });

    expect(hku.batting.filter((b) => b.notOut)).toHaveLength(2);
    expect(hku.batting.filter((b) => b.didNotBat)).toHaveLength(4);
  });

  // The hard case in the samples: nought off three balls, which is a batter at
  // the crease when the innings ended rather than one who never came in.
  it("counts a scoreless batter who faced balls as not out", () => {
    const [unis] = parseExport(UCL).innings;
    const nikhil = unis.batting.find((b) => b.name === "Nikhil Kalasarya");

    expect(nikhil).toMatchObject({ runs: 0, balls: 3, notOut: true, didNotBat: false });
  });
});

describe("the bowling lines", () => {
  it("reads a full bowling figure", () => {
    const [first] = parseExport(CHARLIE_BEARS).innings;

    expect(first.bowling[0]).toEqual({
      name: "Jaya Ramesh Chaliki",
      overs: "6.0",
      maidens: 0,
      runs: 16,
      wickets: 3,
      wides: 5,
      noBalls: 2,
    });
  });

  it("keeps the overs in balls notation, so the economy rate is right", () => {
    const [first] = parseExport(CHARLIE_BEARS).innings;
    const nitesh = first.bowling.find((b) => b.name === "Nitesh Hemlani");

    expect(nitesh?.overs).toBe("5.3");
    expect(economyRate(nitesh?.runs, nitesh?.overs)).toBeCloseTo(2.727, 3);
  });

  it("does not take the bowling table's own total for a bowler", () => {
    const [first, second] = parseExport(CHARLIE_BEARS).innings;

    expect(first.bowling).toHaveLength(6);
    expect(second.bowling).toHaveLength(8);
    expect(
      [...first.bowling, ...second.bowling].map((b) => b.name),
    ).not.toContain("Total");
  });

  // A whole column of zeroes in one file, which is why nothing depends on it.
  it("ignores dot balls", () => {
    const [unis] = parseExport(UCL).innings;
    expect(unis.bowling[0]).not.toHaveProperty("dotBalls");
  });
});

describe("what the arithmetic says about each innings", () => {
  const findings = (source: string) =>
    parseExport(source).innings.map((i) => reconcileInnings(inningsToCheck(i)));

  it("finds nothing wrong with the baseline fixture", () => {
    expect(findings(CHARLIE_BEARS)).toEqual([[], []]);
  });

  // The one the run-out rule exists for: SCC lost 7 wickets while HKU's bowlers
  // took 5, and the gap is exactly the two run-outs. A check asserting those are
  // equal would reject a perfectly valid match.
  it("reports nothing at all for the fixture with run-outs in it", () => {
    expect(findings(LANCERS)).toEqual([[], []]);

    const [lancers] = parseExport(LANCERS).innings;
    expect(wicketsToNoBowler(inningsToCheck(lancers))).toBe(2);
  });

  // The one innings in the samples that does not reconcile. The batters make 114
  // against a stated 115, and 115 is correct — the winning margin and the
  // opposition's bowling figures both confirm it.
  it("reports the one innings that is short by a run, with both numbers", () => {
    const [unis, students] = findings(UCL);

    expect(unis).toEqual([]);
    expect(students).toHaveLength(1);
    expect(students[0].about).toBe("total");
    expect(students[0].by).toBe(1);
    expect(students[0].message).toContain("114");
    expect(students[0].message).toContain("115");
  });

  // Every one of the six innings agrees on this, which is what makes the
  // not-out-versus-did-not-bat reading trustworthy: get it wrong and the wicket
  // count disagrees with the dismissals immediately.
  it("agrees on the wickets in all six innings", () => {
    for (const source of [CHARLIE_BEARS, LANCERS, UCL]) {
      for (const found of findings(source)) {
        expect(found.filter((f) => f.about === "wickets")).toEqual([]);
        expect(found.filter((f) => f.about === "bowlerWickets")).toEqual([]);
      }
    }
  });

  // The bowlers are charged with the total less byes and leg byes, never the
  // total. The Lancers file has byes of 5, which is what makes the rule visible
  // rather than a coincidence of zeroes.
  it("agrees on the bowlers' runs in all six innings", () => {
    for (const source of [CHARLIE_BEARS, LANCERS, UCL]) {
      for (const found of findings(source)) {
        expect(found.filter((f) => f.about === "bowlerRuns")).toEqual([]);
      }
    }
  });
});

describe("a file that is not one of these", () => {
  it("says so, and says what it was given instead", () => {
    expect(() => parseExport("Name,Amount\nRent,8400\n")).toThrow(ExportProblem);
    expect(() => parseExport("Name,Amount\nRent,8400\n")).toThrow(
      /Name,Amount/,
    );
  });

  it("names the export button, because that is the fix", () => {
    expect(() => parseExport("<html><body>Just a saved page</body></html>")).toThrow(
      /export button/,
    );
  });

  it("says an empty file is empty", () => {
    expect(() => parseExport("")).toThrow(/nothing in this file/);
    expect(() => parseExport("   \n\n  \n")).toThrow(/nothing in this file/);
  });

  it("complains about a header with no two sides under it", () => {
    const header = CHARLIE_BEARS.split("\n")[0];
    expect(() => parseExport(header)).toThrow(/two sides/);
  });

  it("complains about an export with the tables cut out of it", () => {
    const [header, sides] = CHARLIE_BEARS.split("\n");
    expect(() => parseExport(`${header}\n${sides}\n`)).toThrow(
      /no batting table/,
    );
  });
});
