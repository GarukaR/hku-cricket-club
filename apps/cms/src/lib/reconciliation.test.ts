import { describe, expect, it } from "vitest";

import {
  extrasTotal,
  reconcileInnings,
  wicketsToNoBowler,
} from "./reconciliation";

// Every innings below is transcribed from a real export in docs/samples/. The
// numbers are not invented, because the rules were derived from these files and
// a rule tested against made-up figures is a rule tested against itself.

/** docs/samples/saturday-2026-01-03-v-scc-lancers.csv — SCC Lancers batting.
 *  Two run-outs, so the bowlers' wickets are two short of the wickets fallen. */
const LANCERS = {
  batterRuns: [5, 7, 68, 0, 76, 31, 1, 8, 2, 0, 0], // 198
  extras: { byes: 0, legByes: 0, wides: 19, noBalls: 1, penalty: 0 }, // 20
  statedTotal: 218,
  statedWickets: 7,
  dismissals: 7,
  bowlerRuns: [45, 17, 34, 33, 55, 34], // 218
  bowlerWickets: [2, 0, 1, 0, 0, 2], // 5 — the other two were run out
};

/** The same match, HKU CC batting. Byes of 5, which is what makes the
 *  bowlers'-runs rule visible rather than a coincidence of zeroes. */
const HKU = {
  batterRuns: [28, 0, 4, 28, 47, 44, 20, 11, 4, 11, 0], // 197
  extras: { byes: 5, legByes: 0, wides: 17, noBalls: 0, penalty: 0 }, // 22
  statedTotal: 219,
  statedWickets: 8,
  dismissals: 8,
  bowlerRuns: [45, 32, 41, 35, 37, 24], // 214 = 219 − 5 byes
  bowlerWickets: [2, 1, 0, 2, 0, 2], // 7 — one run out
};

/** docs/samples/ucl-2025-03-18-v-combined-unis.csv — HKU Students batting.
 *  The one innings in the samples that does not reconcile: the batters make
 *  114 against a stated 115, and 115 is the correct figure. */
const STUDENTS = {
  batterRuns: [9, 62, 4, 2, 11, 13, 0, 1], // 102
  extras: { byes: 0, legByes: 2, wides: 9, noBalls: 1, penalty: 0 }, // 12
  statedTotal: 115,
  statedWickets: 7,
  dismissals: 7,
};

describe("extrasTotal", () => {
  it("adds the five kinds", () => {
    expect(extrasTotal(LANCERS.extras)).toBe(20);
    expect(extrasTotal(HKU.extras)).toBe(22);
  });

  it("treats a missing kind as none rather than as unknown", () => {
    expect(extrasTotal({ byes: 4 })).toBe(4);
    expect(extrasTotal({})).toBe(0);
  });
});

describe("reconcileInnings — the innings that agree", () => {
  it("finds nothing wrong with the Lancers innings", () => {
    expect(reconcileInnings(LANCERS)).toEqual([]);
  });

  it("finds nothing wrong with the HKU innings, byes and all", () => {
    expect(reconcileInnings(HKU)).toEqual([]);
  });

  it("does not mistake run-outs for a discrepancy", () => {
    // The rule CONTEXT.md warns about: the Lancers' bowlers took 5 of the 7
    // wickets, and asserting those are equal would reject a valid match.
    const findings = reconcileInnings(LANCERS);
    expect(findings.filter((f) => f.about === "bowlerWickets")).toEqual([]);
  });

  it("charges the bowlers the total less byes, not the total", () => {
    // HKU's bowlers conceded 214 against a total of 219 with 5 byes. Comparing
    // against 219 would report a discrepancy of exactly the byes.
    expect(
      reconcileInnings(HKU).filter((f) => f.about === "bowlerRuns"),
    ).toEqual([]);
  });
});

describe("reconcileInnings — the innings that does not agree", () => {
  const findings = reconcileInnings(STUDENTS);

  it("reports the one-run discrepancy", () => {
    const total = findings.find((f) => f.about === "total");
    expect(total).toBeDefined();
    expect(total?.by).toBe(1);
  });

  it("names both numbers, so the editor can see which to trust", () => {
    const total = findings.find((f) => f.about === "total");
    expect(total?.message).toContain("114");
    expect(total?.message).toContain("115");
  });

  it("reports nothing else — only the total is out", () => {
    expect(findings.map((f) => f.about)).toEqual(["total"]);
  });
});

describe("reconcileInnings — what it declines to guess", () => {
  it("skips the total check when no total was stated", () => {
    // Incomplete, not wrong. Comparing against nothing would report a
    // discrepancy the size of the innings.
    expect(reconcileInnings({ ...STUDENTS, statedTotal: null })).toEqual([]);
  });

  it("skips the wicket check when either number is missing", () => {
    const noWickets = reconcileInnings({
      ...LANCERS,
      statedWickets: null,
      bowlerWickets: undefined,
    });
    expect(noWickets.filter((f) => f.about === "wickets")).toEqual([]);
  });

  it("skips the bowling check when nobody bowled on the record", () => {
    const noBowlers = reconcileInnings({ ...HKU, bowlerRuns: [] });
    expect(noBowlers.filter((f) => f.about === "bowlerRuns")).toEqual([]);
  });
});

describe("reconcileInnings — how it reads", () => {
  it("says one batter, not one batters", () => {
    // These sentences are read by somebody checking a scorecard against a
    // screen. "1 batters are recorded as out" reads like a bug in the thing
    // reporting the bug.
    const one = reconcileInnings({ ...STUDENTS, dismissals: 1, statedWickets: 7 });
    expect(one.find((f) => f.about === "wickets")?.message).toContain(
      "1 batter is recorded as out",
    );
  });

  it("says two batters", () => {
    const two = reconcileInnings({ ...STUDENTS, dismissals: 2, statedWickets: 7 });
    expect(two.find((f) => f.about === "wickets")?.message).toContain(
      "2 batters are recorded as out",
    );
  });

  it("says one wicket fell, not one wickets", () => {
    const one = reconcileInnings({ ...STUDENTS, dismissals: 3, statedWickets: 1 });
    expect(one.find((f) => f.about === "wickets")?.message).toContain(
      "1 wicket fell",
    );
  });
});

describe("reconcileInnings — the impossible direction", () => {
  it("flags bowlers credited with more wickets than fell", () => {
    const findings = reconcileInnings({
      ...LANCERS,
      statedWickets: 4,
      dismissals: 4,
      bowlerWickets: [2, 0, 1, 0, 0, 2], // 5 > 4
    });
    const wickets = findings.find((f) => f.about === "bowlerWickets");
    expect(wickets?.by).toBe(1);
    expect(wickets?.message).toMatch(/cannot take a wicket that did not fall/i);
  });
});

describe("wicketsToNoBowler", () => {
  it("counts the two run-outs in the Lancers innings", () => {
    expect(wicketsToNoBowler(LANCERS)).toBe(2);
  });

  it("counts the one in the HKU innings", () => {
    expect(wicketsToNoBowler(HKU)).toBe(1);
  });

  it("says nothing when there is nothing to work it out from", () => {
    expect(wicketsToNoBowler({ statedWickets: 7 })).toBeUndefined();
    expect(wicketsToNoBowler({ bowlerWickets: [1] })).toBeUndefined();
  });
});
