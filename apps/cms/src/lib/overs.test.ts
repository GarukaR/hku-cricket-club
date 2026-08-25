import { describe, expect, it } from "vitest";

import { ballsBowled, economyRate, oversBowled, oversSpoken } from "./overs";

describe("ballsBowled", () => {
  it("reads the digit after the dot as balls", () => {
    expect(ballsBowled("28.3")).toBe(171);
  });

  it("reads a whole number of overs", () => {
    expect(ballsBowled("6.0")).toBe(36);
    expect(ballsBowled("6")).toBe(36);
  });

  it("reads a single ball", () => {
    // docs/samples/ucl-2025-03-18-v-combined-unis.csv — Harsh Sharma bowled one
    // ball and took a wicket with it.
    expect(ballsBowled("0.1")).toBe(1);
  });

  // A sixth ball completes the over, so there is no such figure. Neither is
  // anything with two digits after the dot, which is a decimal somebody typed.
  it("refuses what no scorer would write", () => {
    expect(ballsBowled("28.6")).toBeUndefined();
    expect(ballsBowled("28.75")).toBeUndefined();
    expect(ballsBowled("-3")).toBeUndefined();
    expect(ballsBowled("twenty")).toBeUndefined();
  });

  it("gives nothing for a figure nobody recorded", () => {
    expect(ballsBowled(undefined)).toBeUndefined();
    expect(ballsBowled("")).toBeUndefined();
  });
});

describe("oversBowled", () => {
  it("writes balls back the way a scorer would", () => {
    expect(oversBowled(171)).toBe("28.3");
    expect(oversBowled(36)).toBe("6");
    expect(oversBowled(1)).toBe("0.1");
  });
});

describe("oversSpoken", () => {
  it("says the notation out loud, which is the whole trap", () => {
    expect(oversSpoken("28.3")).toBe("28 overs and 3 balls");
    expect(oversSpoken("6.0")).toBe("6 overs");
    expect(oversSpoken("0.1")).toBe("0 overs and 1 ball");
    expect(oversSpoken("1.0")).toBe("1 over");
  });
});

describe("economyRate", () => {
  // docs/samples/saturday-2026-03-21-v-irc-charlie-bears.csv — Nitesh Hemlani,
  // 5.3 overs for 15. Thirty-three balls, so 2.73; read as a decimal it comes
  // out at 2.83, which is wrong by an amount nobody would ever notice.
  it("divides by balls, not by the figure as written", () => {
    expect(economyRate(15, "5.3")).toBeCloseTo(2.727, 3);
    expect(economyRate(15, "5.3")).not.toBeCloseTo(15 / 5.3, 3);
  });

  it("is plain division when the overs are whole", () => {
    expect(economyRate(16, "6.0")).toBeCloseTo(2.667, 3);
  });

  it("has no answer without both figures", () => {
    expect(economyRate(15, undefined)).toBeUndefined();
    expect(economyRate(undefined, "5.3")).toBeUndefined();
    expect(economyRate(15, "0")).toBeUndefined();
  });
});
