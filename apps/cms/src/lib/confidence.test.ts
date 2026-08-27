import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { confidenceIn } from "./confidence";
import { parseExport, type ParsedMatch } from "./cricclubs";
import { isOurSide, ourNames, resolveNames, type KnownPlayer } from "./names";

const sample = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../docs/samples/${name}`, import.meta.url)),
    "utf8",
  );

const CHARLIE_BEARS = parseExport(
  sample("saturday-2026-03-21-v-irc-charlie-bears.csv"),
);
const LANCERS = parseExport(sample("saturday-2026-01-03-v-scc-lancers.csv"));
const UCL = parseExport(sample("ucl-2025-03-18-v-combined-unis.csv"));

/**
 * A record that already knows everybody in this file, under every spelling.
 *
 * The state a club reaches after a season of answering questions, which is the
 * state the gate is designed for: by then an import asks nothing and the only
 * thing left to judge is the scorecard itself.
 */
function recordKnowing(match: ParsedMatch, claimed: string[]): KnownPlayer[] {
  return ourNames(match, isOurSide(claimed)).map((name, i) => ({
    id: i + 1,
    name: name.spelling,
  }));
}

const judge = (match: ParsedMatch, claimed: string[], players: KnownPlayer[]) =>
  confidenceIn(
    match,
    resolveNames(ourNames(match, isOurSide(claimed)), players),
  );

describe("a clean import", () => {
  it("publishes the baseline fixture once every name is known", () => {
    const verdict = judge(
      CHARLIE_BEARS,
      ["HKU CC"],
      recordKnowing(CHARLIE_BEARS, ["HKU CC"]),
    );

    expect(verdict.holds).toEqual([]);
    expect(verdict.confident).toBe(true);
  });

  it("publishes the run-out fixture too", () => {
    // Wickets fallen exceed the bowlers' wickets here, which is an ordinary
    // scorecard rather than a discrepancy. A gate that stopped for it would
    // stop for most of the club's matches.
    const verdict = judge(LANCERS, ["HKU CC"], recordKnowing(LANCERS, ["HKU CC"]));

    expect(verdict.holds).toEqual([]);
    expect(verdict.confident).toBe(true);
  });

  it("says nothing about a bowler taking his own return catch", () => {
    // Caught and bowled is an ordinary dismissal. Remarking on it would train
    // an editor to click past remarks.
    const verdict = judge(
      CHARLIE_BEARS,
      ["HKU CC"],
      recordKnowing(CHARLIE_BEARS, ["HKU CC"]),
    );

    expect(verdict.confident).toBe(true);
    expect(verdict.notes).toEqual([]);
  });
});

describe("an import that stops", () => {
  it("holds the fixture whose batters are a run short of the total", () => {
    // HKU Students make 114 against a stated 115, and 115 is the correct
    // figure. The importer cannot know that, so it asks.
    const verdict = judge(
      UCL,
      ["HKU Students (UCL)"],
      recordKnowing(UCL, ["HKU Students (UCL)"]),
    );

    expect(verdict.confident).toBe(false);
    const arithmetic = verdict.holds.filter((h) => h.about === "arithmetic");
    expect(arithmetic).toHaveLength(1);
    expect(arithmetic[0].message).toContain("HKU Students (UCL)");
    expect(arithmetic[0].message).toContain("115");
  });

  it("holds for a name nobody has answered for, rather than guessing", () => {
    const verdict = judge(CHARLIE_BEARS, ["HKU CC"], []);

    expect(verdict.confident).toBe(false);
    expect(verdict.holds.some((h) => h.about === "names")).toBe(true);
  });

  it("names the one spelling it is waiting on", () => {
    const players = recordKnowing(CHARLIE_BEARS, ["HKU CC"]);
    const verdict = judge(CHARLIE_BEARS, ["HKU CC"], players.slice(1));

    const names = verdict.holds.filter((h) => h.about === "names");
    expect(names).toHaveLength(1);
    expect(names[0].message).toContain(players[0].name);
  });

  it("holds for a dismissal code nothing recognises", () => {
    const invented = structuredClone(CHARLIE_BEARS);
    invented.innings[0].batting[0].howOut = "hw";

    const verdict = judge(
      invented,
      ["HKU CC"],
      recordKnowing(invented, ["HKU CC"]),
    );

    expect(verdict.confident).toBe(false);
    const codes = verdict.holds.filter((h) => h.about === "dismissals");
    expect(codes).toHaveLength(1);
    expect(codes[0].message).toContain("hw");
  });

  it("reports every reason at once, not the first one", () => {
    const invented = structuredClone(UCL);
    invented.innings[0].batting[0].howOut = "hw";

    const verdict = judge(invented, ["HKU Students (UCL)"], []);
    const about = new Set(verdict.holds.map((h) => h.about));

    // A draft that names one problem at a time is a draft somebody opens three
    // times, which is how held matches get forgotten.
    expect(about).toEqual(new Set(["names", "arithmetic", "dismissals"]));
  });
});

describe("what the opposition cannot do", () => {
  it("never holds a match for a name that is not ours", () => {
    // Every one of our players known, none of theirs. The opposition resolve to
    // nobody by design, and that must not read as an unanswered question.
    const verdict = judge(
      CHARLIE_BEARS,
      ["HKU CC"],
      recordKnowing(CHARLIE_BEARS, ["HKU CC"]),
    );

    expect(verdict.confident).toBe(true);
  });
});
