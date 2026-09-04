import { describe, expect, it } from "vitest";

import {
  inningsSpoken,
  isPlayed,
  resultBadge,
  tone,
  verdict,
  type Match,
  type Outcome,
  type Result,
} from "@/lib/match";

const OUTCOMES: Outcome[] = [
  "won",
  "lost",
  "tied",
  "drawn",
  "abandoned",
  "conceded",
];

describe("verdict", () => {
  it("states the margin the scorer recorded", () => {
    expect(verdict({ outcome: "won", margin: "33 runs" })).toBe(
      "Won by 33 runs",
    );
    expect(verdict({ outcome: "lost", margin: "5 wickets" })).toBe(
      "Lost by 5 wickets",
    );
  });

  it("drops the joiner rather than trailing it when there is no margin", () => {
    // An abandoned match has no margin, and "Abandoned by" is not English.
    expect(verdict({ outcome: "abandoned" })).toBe("Abandoned");
  });

  it("names every outcome the record can hold", () => {
    for (const outcome of OUTCOMES) {
      const stated = verdict({ outcome });
      expect(stated).not.toContain("undefined");
      expect(stated.length).toBeGreaterThan(0);
    }
  });
});

describe("resultBadge", () => {
  it("signs a win's margin and shortens the unit", () => {
    expect(resultBadge({ outcome: "won", margin: "33 runs" })).toBe("Won +33");
    expect(resultBadge({ outcome: "won", margin: "6 wickets" })).toBe("Won +6w");
  });

  it("signs a loss's margin the other way", () => {
    expect(resultBadge({ outcome: "lost", margin: "33 runs" })).toBe("Lost -33");
    expect(resultBadge({ outcome: "lost", margin: "6 wickets" })).toBe("Lost -6w");
  });

  it("gives an outcome with no winning margin no sign at all", () => {
    // Tied, drawn, abandoned and conceded have nothing for a sign to attach to.
    expect(resultBadge({ outcome: "tied" })).toBe("Tied");
    expect(resultBadge({ outcome: "drawn" })).toBe("Drawn");
    expect(resultBadge({ outcome: "abandoned" })).toBe("Abandoned");
    expect(resultBadge({ outcome: "conceded" })).toBe("Conceded");
  });

  it("falls back to the outcome word when the margin doesn't parse", () => {
    // A guess that turns out wrong reads as a bug; saying less is safer than
    // saying something the record never actually stated.
    expect(resultBadge({ outcome: "won", margin: "by a mile" })).toBe("Won");
    expect(resultBadge({ outcome: "won" })).toBe("Won");
  });

  it("says the same thing as the verdict about the outcome itself", () => {
    // Two renderings of one fact. If they ever disagree about who won, the
    // page contradicts itself between the scoreline and the record below it.
    for (const outcome of OUTCOMES) {
      const result: Result = { outcome, margin: "33 runs" };
      const label = resultBadge(result).split(" ")[0];
      expect(verdict(result).startsWith(label)).toBe(true);
    }
  });
});

describe("tone", () => {
  it("reads a concession as a defeat", () => {
    expect(tone("conceded")).toBe("loss");
    expect(tone("lost")).toBe("loss");
  });

  it("never colours a tie, a draw or an abandonment as a defeat", () => {
    // These are ordinary outcomes, not failures. Printing them in the oxblood
    // the record uses for a loss would misstate the club's season.
    expect(tone("tied")).toBe("neutral");
    expect(tone("drawn")).toBe("neutral");
    expect(tone("abandoned")).toBe("neutral");
  });

  it("classifies every outcome", () => {
    for (const outcome of OUTCOMES) {
      expect(["win", "loss", "neutral"]).toContain(tone(outcome));
    }
  });
});

describe("inningsSpoken", () => {
  it("reads a completed innings as runs for wickets", () => {
    expect(inningsSpoken({ side: "HKU", runs: 184, wickets: 6 })).toBe(
      "184 for 6",
    );
  });

  it("reads an absent wicket count as all out, the way a scorecard writes it", () => {
    expect(inningsSpoken({ side: "PolyU", runs: 151 })).toBe("151 all out");
  });

  it("does not call a side that lost no wickets all out", () => {
    // The distinction turns on `undefined`, not on falsiness: nought wickets is a
    // real innings — a ten-wicket win — and the opposite of being bowled out.
    expect(inningsSpoken({ side: "HKU", runs: 152, wickets: 0 })).toBe(
      "152 for 0",
    );
  });

  it("speaks a nought total rather than falling silent", () => {
    expect(inningsSpoken({ side: "HKU", runs: 0, wickets: 3 })).toBe("0 for 3");
  });
});

describe("isPlayed", () => {
  const scheduled: Match = {
    id: 1,
    date: "2026-05-02",
    team: "league",
    opponent: "HKUST",
    ground: "Sandy Bay",
    venue: "Home",
    format: "40 overs",
  };
  const played: Match = { ...scheduled, result: { outcome: "won" } };

  it("keeps a Match out of the record until it has been played", () => {
    // A scheduled fixture and a completed game are the same Match at two points
    // in its life. The record prints only the second.
    expect(isPlayed(scheduled)).toBe(false);
    expect(isPlayed(played)).toBe(true);
  });

  it("narrows a list to what the record can print", () => {
    const record = [played, scheduled].filter(isPlayed);
    expect(record).toHaveLength(1);
    // Typed as present, so this needs no non-null assertion to compile.
    expect(record[0].result.outcome).toBe("won");
  });
});
