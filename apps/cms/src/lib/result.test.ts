import { describe, expect, it } from "vitest";

import { OUTCOMES, resultProblem } from "@/lib/result";

describe("OUTCOMES", () => {
  // The six the record contains. A win and a loss are not the interesting half:
  // the other four are why the outcome is stored rather than worked out from a
  // pair of totals.
  it("covers every way a match ends", () => {
    expect(OUTCOMES.map((outcome) => outcome.value)).toEqual([
      "won",
      "lost",
      "drawn",
      "tied",
      "abandoned",
      "conceded",
    ]);
  });
});

describe("resultProblem", () => {
  it("accepts a win with its margin", () => {
    expect(
      resultProblem({ outcome: "won", margin: { value: 33, unit: "runs" } }),
    ).toBeUndefined();
  });

  it("accepts a chase completed with wickets in hand", () => {
    expect(
      resultProblem({ outcome: "lost", margin: { value: 5, unit: "wickets" } }),
    ).toBeUndefined();
  });

  // The margin is recorded, never computed, and half the record predates
  // anybody caring — a win whose margin nobody wrote down is still a win.
  it("accepts a win whose margin nobody recorded", () => {
    expect(resultProblem({ outcome: "won" })).toBeUndefined();
  });

  it("accepts an outcome that has no margin to state", () => {
    expect(resultProblem({ outcome: "abandoned" })).toBeUndefined();
    expect(resultProblem({ outcome: "tied" })).toBeUndefined();
    expect(resultProblem({ outcome: "drawn" })).toBeUndefined();
    expect(resultProblem({ outcome: "conceded" })).toBeUndefined();
  });

  // A scheduled fixture and a played match are the same record at two points in
  // its life (CONTEXT.md), so an empty result is the normal state of half of
  // them rather than an unfinished one.
  it("accepts a match that has not been played", () => {
    expect(resultProblem(undefined)).toBeUndefined();
    expect(resultProblem({})).toBeUndefined();
  });

  it("rejects a margin on an outcome that cannot have one", () => {
    expect(
      resultProblem({
        outcome: "tied",
        margin: { value: 3, unit: "runs" },
      }),
    ).toMatch(/tied/i);
  });

  it("rejects a margin on a match with no outcome", () => {
    expect(resultProblem({ margin: { value: 33, unit: "runs" } })).toBeDefined();
  });

  it("rejects half a margin", () => {
    expect(resultProblem({ outcome: "won", margin: { value: 33 } })).toMatch(
      /runs or wickets/i,
    );
    expect(resultProblem({ outcome: "won", margin: { unit: "runs" } })).toMatch(
      /how many/i,
    );
  });

  it("rejects a margin of nothing", () => {
    expect(
      resultProblem({ outcome: "won", margin: { value: 0, unit: "runs" } }),
    ).toBeDefined();
  });

  // Ten wickets is the whole side. Eleven is a typo for one, and would print.
  it("rejects more wickets than a side has", () => {
    expect(
      resultProblem({
        outcome: "won",
        margin: { value: 11, unit: "wickets" },
      }),
    ).toMatch(/ten|10/i);
  });

  it("rejects innings on a match nobody has played", () => {
    expect(
      resultProblem({ innings: [{ side: "hku", runs: 184 }] }),
    ).toBeDefined();
  });

  it("accepts the innings of a match that was abandoned part way", () => {
    expect(
      resultProblem({
        outcome: "abandoned",
        innings: [{ side: "hku", runs: 184, wickets: 6 }],
      }),
    ).toBeUndefined();
  });
});
