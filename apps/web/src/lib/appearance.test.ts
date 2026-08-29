import { describe, expect, it } from "vitest";

import {
  ballsBowled,
  dismissal,
  economyRate,
  oversBowled,
  strikeRate,
  type Batting,
  type Bowling,
} from "./appearance";

describe("dismissal", () => {
  it("reads not out first, whatever howOut holds", () => {
    expect(dismissal({ notOut: true, howOut: "b" })).toBe("not out");
  });

  it("states bowled and lbw against the bowler", () => {
    expect(dismissal({ howOut: "b", bowler: "Smith" })).toBe("b Smith");
    expect(dismissal({ howOut: "lbw", bowler: "Smith" })).toBe("lbw b Smith");
  });

  it("states a catch against the fielder and the bowler", () => {
    expect(dismissal({ howOut: "ct", fielder: "Jones", bowler: "Smith" })).toBe(
      "c Jones b Smith",
    );
  });

  it("reads a catch by the wicketkeeper the same way a catch reads", () => {
    expect(dismissal({ howOut: "ctw", fielder: "Jones", bowler: "Smith" })).toBe(
      "c Jones b Smith",
    );
  });

  it("states caught and bowled without repeating the name", () => {
    expect(dismissal({ howOut: "ct", fielder: "Smith", bowler: "Smith" })).toBe(
      "c & b Smith",
    );
  });

  it("states a stumping against the keeper and the bowler", () => {
    expect(dismissal({ howOut: "st", fielder: "Jones", bowler: "Smith" })).toBe(
      "st Jones b Smith",
    );
  });

  it("names the fielder on a run out, crediting no bowler", () => {
    expect(dismissal({ howOut: "ro", fielder: "Jones" })).toBe("run out (Jones)");
    expect(dismissal({ howOut: "ro" })).toBe("run out");
  });

  it("prints a code nothing here recognises plainly, rather than guessing", () => {
    expect(dismissal({ howOut: "hw", bowler: "Smith" })).toBe("hw");
  });

  it("is blank for an Appearance with no batting detail at all", () => {
    expect(dismissal(undefined)).toBe("");
  });
});

describe("strikeRate", () => {
  it("is runs per hundred balls, to one decimal place", () => {
    const batting: Batting = { runs: 45, balls: 30 };
    expect(strikeRate(batting)).toBe("150.0");
  });

  it("is undefined when there is nothing to divide by", () => {
    expect(strikeRate({ runs: 12 })).toBe("–");
    expect(strikeRate(undefined)).toBe("–");
  });
});

describe("economyRate", () => {
  it("reads the balls-notation overs correctly, not as a decimal", () => {
    // 28.3 is 171 deliveries. Read as a decimal (28.3 overs) this would come to
    // a different, silently wrong figure.
    const bowling: Bowling = { runs: 114, overs: "28.3" };
    expect(economyRate(bowling)).toBe((114 / (171 / 6)).toFixed(1));
  });

  it("is undefined for a spell with no overs recorded", () => {
    expect(economyRate({ runs: 20 })).toBe("–");
    expect(economyRate(undefined)).toBe("–");
  });
});

describe("ballsBowled", () => {
  it("reads balls notation as deliveries, not as a decimal", () => {
    // 28.3 is 28 overs and 3 balls — 171 deliveries. Read as a decimal this
    // would come to 170.3, and every figure built on it would be wrong.
    expect(ballsBowled("28.3")).toBe(171);
  });

  it("reads a whole number of overs with no remainder", () => {
    expect(ballsBowled("10")).toBe(60);
    expect(ballsBowled("0")).toBe(0);
  });

  it("is undefined for anything no scorer would have written", () => {
    expect(ballsBowled(undefined)).toBeUndefined();
    expect(ballsBowled("")).toBeUndefined();
    // A sixth ball completes the over, so .6 cannot occur.
    expect(ballsBowled("10.6")).toBeUndefined();
  });
});

describe("oversBowled", () => {
  it("is the reverse of ballsBowled", () => {
    expect(oversBowled(171)).toBe("28.3");
    expect(oversBowled(60)).toBe("10");
  });

  it("reads a total with no partial over as a whole number, never a trailing .0", () => {
    expect(oversBowled(0)).toBe("0");
    expect(oversBowled(36)).toBe("6");
  });
});
