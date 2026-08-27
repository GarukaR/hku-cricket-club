import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseExport } from "./cricclubs";
import { dismissalOf, unknownDismissals } from "./dismissal";

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

describe("what a code credits", () => {
  it("gives the bowler the wicket for the ways a bowler takes one", () => {
    for (const code of ["b", "lbw", "ct", "ctw", "st"]) {
      expect(dismissalOf(code)?.creditsBowler).toBe(true);
    }
  });

  it("gives a run out to no bowler at all", () => {
    // The rule that makes wickets fallen exceed the bowlers' wickets in an
    // ordinary scorecard. The bowler on the row was merely bowling.
    expect(dismissalOf("ro")?.creditsBowler).toBe(false);
    expect(dismissalOf("ro")?.creditsFielder).toBe("runOut");
  });

  it("separates a catch from a stumping", () => {
    expect(dismissalOf("ct")?.creditsFielder).toBe("catch");
    expect(dismissalOf("ctw")?.creditsFielder).toBe("catch");
    expect(dismissalOf("st")?.creditsFielder).toBe("stumping");
  });

  it("credits nobody in the field for a bowled or an lbw", () => {
    expect(dismissalOf("b")?.creditsFielder).toBeUndefined();
    expect(dismissalOf("lbw")?.creditsFielder).toBeUndefined();
  });

  it("reads a code however the scorer cased or spaced it", () => {
    expect(dismissalOf(" CT ")?.code).toBe("ct");
  });

  it("knows nothing about a code nobody has taught it", () => {
    expect(dismissalOf("hw")).toBeUndefined();
    expect(dismissalOf("retired hurt")).toBeUndefined();
    expect(dismissalOf(undefined)).toBeUndefined();
    expect(dismissalOf("")).toBeUndefined();
  });
});

describe("codes an export contains", () => {
  it("recognises every code in all three real exports", () => {
    // Six codes across six innings. If CricClubs ever writes a seventh this
    // fails here, which is the whole point of the list being closed.
    expect(unknownDismissals(CHARLIE_BEARS)).toEqual([]);
    expect(unknownDismissals(LANCERS)).toEqual([]);
    expect(unknownDismissals(UCL)).toEqual([]);
  });

  it("names an unrecognised code rather than guessing at it", () => {
    const invented = structuredClone(CHARLIE_BEARS);
    invented.innings[0].batting[0].howOut = "hw";
    invented.innings[0].batting[1].howOut = "hw";
    invented.innings[1].batting[0].howOut = "obs";

    expect(unknownDismissals(invented)).toEqual(["hw", "obs"]);
  });

  it("says nothing about a batter who was not out", () => {
    const notOut = structuredClone(CHARLIE_BEARS);
    for (const batter of notOut.innings[0].batting) batter.howOut = undefined;

    expect(unknownDismissals(notOut)).toEqual([]);
  });
});

describe("caught and bowled", () => {
  it("is an ordinary dismissal and not a contradiction", () => {
    // `Usman Ayub,ct,Jaya Ramesh C,Jaya Ramesh C` — the bowler took the return
    // catch off his own delivery, which happens every week. An earlier version
    // of this module treated it as impossible and withheld the catch.
    const caught = CHARLIE_BEARS.innings
      .flatMap((innings) => innings.batting)
      .filter(
        (batter) =>
          batter.howOut === "ct" &&
          batter.fielder != null &&
          batter.fielder === batter.bowler,
      );

    expect(caught).toHaveLength(1);
    expect(caught[0].name).toBe("Usman Ayub");
    // Nothing here treats it specially: the code credits a catch, full stop.
    expect(dismissalOf(caught[0].howOut)?.creditsFielder).toBe("catch");
    expect(dismissalOf(caught[0].howOut)?.creditsBowler).toBe(true);
  });
});
