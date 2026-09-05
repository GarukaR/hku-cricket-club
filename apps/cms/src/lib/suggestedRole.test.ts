import { describe, expect, it } from "vitest";

import {
  BATTING_AVERAGE,
  MINIMUM_APPEARANCES,
  OVERS_PER_MATCH,
  type RoleEvidence,
  suggestedRole,
} from "./suggestedRole";

/** An Appearance that clears neither bar, to be overridden a field at a time. */
const nothing: RoleEvidence = { batted: true, runs: 0, notOut: false };

const repeat = (one: RoleEvidence, times: number): RoleEvidence[] =>
  Array.from({ length: times }, () => ({ ...one }));

describe("suggestedRole", () => {
  it("suggests nothing below the minimum, however plain the record", () => {
    const obvious: RoleEvidence = { overs: "10", batted: true, runs: 80 };

    expect(suggestedRole(repeat(obvious, MINIMUM_APPEARANCES - 1))).toBeUndefined();
    expect(suggestedRole([])).toBeUndefined();
  });

  it("calls a player who clears both bars an all-rounder", () => {
    // 4 overs a match and 40 runs a dismissal — clear of both.
    const both = repeat({ overs: "4", batted: true, runs: 40 }, 5);

    expect(suggestedRole(both)?.role).toBe("all-rounder");
  });

  it("calls a player who only bowls a bowler", () => {
    const bowls = repeat({ overs: "8", batted: true, runs: 2 }, 5);

    expect(suggestedRole(bowls)?.role).toBe("bowler");
  });

  it("calls a player who only bats a batter", () => {
    const bats = repeat({ batted: true, runs: 45 }, 5);

    expect(suggestedRole(bats)?.role).toBe("batter");
  });

  it("counts matches bowled in and matches not, when averaging overs", () => {
    // 12 overs across four matches is three a match — exactly the bar — even
    // though three of the four were spent bowling nothing.
    const spread: RoleEvidence[] = [
      { overs: "12", batted: true, runs: 0 },
      { batted: true, runs: 0 },
      { batted: true, runs: 0 },
      { batted: true, runs: 0 },
    ];

    expect(suggestedRole(spread)?.role).toBe("bowler");
  });

  it("reads overs as a scorer writes them, not as decimals", () => {
    // 2.5 is two overs and five balls — 17 balls — so four of them is 68
    // balls, or 11.33 overs across four matches. Read as a decimal it would be
    // 10 overs, which crosses no bar here but would elsewhere.
    const spelt = repeat({ overs: "2.5", batted: true, runs: 0 }, 4);

    expect(suggestedRole(spelt)?.summary).toMatch(/2\.8 overs per match/);
  });

  it("treats a never-dismissed batter by a floor on their average", () => {
    // 20 runs an innings, never out: the true average is higher still, so the
    // bar is certainly cleared.
    const unbeaten = repeat({ batted: true, runs: 20, notOut: true }, 4);

    expect(suggestedRole(unbeaten)?.role).toBe("batter");
  });

  it("does not credit a batting average to somebody who never batted", () => {
    const fielded = repeat({ batted: false }, 4);

    expect(suggestedRole(fielded)).toBeUndefined();
  });

  it("suggests the nearer of the two when neither bar is cleared", () => {
    // Half the bowling bar, a tenth of the batting one.
    const nearerBowling = repeat({ overs: "1.3", batted: true, runs: 1 }, 4);

    const suggestion = suggestedRole(nearerBowling);
    expect(suggestion?.role).toBe("bowler");
    expect(suggestion?.summary).toMatch(/neither clearly/i);
  });

  it("suggests a keeper on a stumping, whatever the bars say", () => {
    const kept = repeat({ ...nothing, overs: "6" }, 4);
    kept[0] = { ...kept[0], stumpings: 1 };

    expect(suggestedRole(kept)?.role).toBe("wicketkeeper");
  });

  it("suggests a keeper on a catch behind, which an ordinary catch is not", () => {
    const behind = repeat(nothing, 4);
    behind[2] = { ...behind[2], caughtBehind: 1 };

    expect(suggestedRole(behind)?.role).toBe("wicketkeeper");
    // The same evidence without the distinction preserved says nothing about
    // keeping — which is exactly what the import used to throw away.
    expect(suggestedRole(repeat(nothing, 4))?.role).not.toBe("wicketkeeper");
  });

  it("says how it read the record, so the panel can show its working", () => {
    const summary = suggestedRole(repeat({ overs: "4", batted: true, runs: 40 }, 5))
      ?.summary;

    expect(summary).toMatch(/4 overs per match/);
    expect(summary).toMatch(/batting average 40/);
    expect(summary).toMatch(/from 5 appearances/);
  });

  it("states the club's bars as the club settled them", () => {
    expect(MINIMUM_APPEARANCES).toBe(3);
    expect(OVERS_PER_MATCH).toBe(3);
    expect(BATTING_AVERAGE).toBe(15);
  });
});
