import { describe, expect, it } from "vitest";

import type { Appearance } from "./appearance";
import { battingFigures, bowlingFigures, byTeam, bySeason, fieldingFigures } from "./career";
import type { AppearanceRecord } from "./players";

/** An Appearance with nothing but what one test cares about. */
function appearance(overrides: Partial<Appearance> = {}): Appearance {
  return {
    player: "Garuka Ranasinghe",
    batted: false,
    bowled: false,
    ...overrides,
  };
}

describe("battingFigures", () => {
  it("counts only innings actually batted, never an Appearance with no batting detail", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 20, balls: 30, notOut: false } }),
      appearance({ batted: false }), // did not bat
    ]);
    expect(figures.innings).toBe(1);
  });

  it("sums runs across every innings", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 45, balls: 60 } }),
      appearance({ batted: true, batting: { runs: 12, balls: 20 } }),
    ]);
    expect(figures.runs).toBe(57);
  });

  it("excludes not outs from the average's divisor", () => {
    // 100 runs, one dismissal (the other innings was not out) — average 100,
    // not 50. Excluding not outs from the divisor is why it is recorded
    // rather than inferred from the score (CONTEXT.md — Not out).
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 60, notOut: true } }),
      appearance({ batted: true, batting: { runs: 40, notOut: false } }),
    ]);
    expect(figures.notOuts).toBe(1);
    expect(figures.average).toBe("100.00");
  });

  it("renders an undefined average as an en dash, never zero or a large number", () => {
    // Every innings not out — the divisor is zero (CONTEXT.md — Undefined
    // average).
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 30, notOut: true } }),
      appearance({ batted: true, batting: { runs: 45, notOut: true } }),
    ]);
    expect(figures.average).toBe("–");
  });

  it("is a coherent, empty-but-honest figure for a player with no batting innings at all", () => {
    const figures = battingFigures([]);
    expect(figures).toEqual({
      innings: 0,
      notOuts: 0,
      runs: 0,
      average: "–",
      strikeRate: "–",
      highScore: "–",
      fifties: 0,
      hundreds: 0,
      ducks: 0,
      boundaries: 0,
    });
  });

  it("counts fifties and hundreds by the band the score falls in, not double-counting a hundred as a fifty", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 55 } }),
      appearance({ batted: true, batting: { runs: 102 } }),
      appearance({ batted: true, batting: { runs: 30 } }),
    ]);
    expect(figures.fifties).toBe(1);
    expect(figures.hundreds).toBe(1);
  });

  it("counts a duck only when out for nought, never a not-out nought", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 0, notOut: false } }),
      appearance({ batted: true, batting: { runs: 0, notOut: true } }),
    ]);
    expect(figures.ducks).toBe(1);
  });

  it("marks the high score not out when the highest innings was", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 78, notOut: true } }),
      appearance({ batted: true, batting: { runs: 60, notOut: false } }),
    ]);
    expect(figures.highScore).toBe("78*");
  });

  it("does not mark the high score not out when a higher, dismissed innings beats it", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 78, notOut: true } }),
      appearance({ batted: true, batting: { runs: 90, notOut: false } }),
    ]);
    expect(figures.highScore).toBe("90");
  });

  it("sums fours and sixes into one boundaries count", () => {
    const figures = battingFigures([
      appearance({ batted: true, batting: { runs: 45, fours: 5, sixes: 1 } }),
    ]);
    expect(figures.boundaries).toBe(6);
  });
});

describe("bowlingFigures", () => {
  it("sums deliveries across spells correctly, not as a decimal sum of overs", () => {
    // 4.3 overs (27 balls) + 3.4 overs (22 balls) = 49 balls = 8.1 overs.
    // Summing "4.3" + "3.4" as decimals would give 8.7, which is not a real
    // figure a scorer would write (see apps/cms/src/lib/overs.ts).
    const figures = bowlingFigures([
      appearance({ bowled: true, bowling: { overs: "4.3", runs: 10, wickets: 1 } }),
      appearance({ bowled: true, bowling: { overs: "3.4", runs: 15, wickets: 2 } }),
    ]);
    expect(figures.overs).toBe("8.1");
  });

  it("is a coherent, empty-but-honest figure for a player who has never bowled", () => {
    const figures = bowlingFigures([]);
    expect(figures).toEqual({
      overs: "0",
      maidens: 0,
      runs: 0,
      wickets: 0,
      average: "–",
      economy: "–",
      strikeRate: "–",
      bestFigures: "–",
      threeFors: 0,
      fiveFors: 0,
    });
  });

  it("renders an undefined average and strike rate when no wicket has ever fallen", () => {
    const figures = bowlingFigures([
      appearance({ bowled: true, bowling: { overs: "10", runs: 40, wickets: 0 } }),
    ]);
    expect(figures.average).toBe("–");
    expect(figures.strikeRate).toBe("–");
    // Economy is still defined — it does not depend on a wicket falling.
    expect(figures.economy).toBe("4.00");
  });

  it("counts three-fors and five-fors by band, not double-counting a five-for as a three-for", () => {
    const figures = bowlingFigures([
      appearance({ bowled: true, bowling: { overs: "10", runs: 30, wickets: 3 } }),
      appearance({ bowled: true, bowling: { overs: "9", runs: 40, wickets: 5 } }),
      appearance({ bowled: true, bowling: { overs: "8", runs: 35, wickets: 2 } }),
    ]);
    expect(figures.threeFors).toBe(1);
    expect(figures.fiveFors).toBe(1);
  });

  it("picks the best bowling figures as most wickets, fewest runs breaking a tie", () => {
    const figures = bowlingFigures([
      appearance({ bowled: true, bowling: { overs: "10", runs: 40, wickets: 3 } }),
      appearance({ bowled: true, bowling: { overs: "9", runs: 25, wickets: 3 } }),
      appearance({ bowled: true, bowling: { overs: "8", runs: 60, wickets: 2 } }),
    ]);
    expect(figures.bestFigures).toBe("3/25");
  });
});

/** An AppearanceRecord with nothing but what one test cares about. */
function record(overrides: Partial<AppearanceRecord> = {}): AppearanceRecord {
  return {
    matchId: 1,
    date: "2026-04-25",
    opponent: "PolyU",
    team: "league",
    teamRole: "league",
    season: "2025/26",
    appearance: appearance(),
    ...overrides,
  };
}

describe("byTeam", () => {
  it("rolls up every Appearance under the Team it was played for", () => {
    const splits = byTeam([
      record({ team: "league", appearance: appearance({ batted: true, batting: { runs: 40 } }) }),
      record({ team: "league", appearance: appearance({ batted: true, batting: { runs: 20 } }) }),
      record({ team: "student", appearance: appearance({ batted: true, batting: { runs: 15 } }) }),
    ]);

    const league = splits.find((s) => s.team === "league");
    const student = splits.find((s) => s.team === "student");
    expect(league?.matches).toBe(2);
    expect(league?.batting.runs).toBe(60);
    expect(student?.matches).toBe(1);
    expect(student?.batting.runs).toBe(15);
  });

  it("is empty for a Player with no Appearances at all", () => {
    expect(byTeam([])).toEqual([]);
  });
});

describe("bySeason", () => {
  it("keeps the same Team apart across different Seasons", () => {
    const splits = bySeason([
      record({ team: "league", season: "2025/26" }),
      record({ team: "league", season: "2024/25" }),
    ]);
    expect(splits).toHaveLength(2);
    expect(splits.map((s) => s.season).sort()).toEqual(["2024/25", "2025/26"]);
  });

  it("keeps different Teams apart within the same Season", () => {
    const splits = bySeason([
      record({ team: "league", season: "2025/26" }),
      record({ team: "challenge league", season: "2025/26" }),
    ]);
    expect(splits).toHaveLength(2);
  });

  it("carries each split's own Team role, not the first record's", () => {
    // A call-up's Appearances land under the league Team by role, while the
    // Player is registered to the challenge league one - a page matching a
    // Registration's call-ups up against the right split needs the role on
    // every row, not just the first (CONTEXT.md - Call-up).
    const splits = bySeason([
      record({ team: "league", teamRole: "league", season: "2025/26" }),
      record({ team: "challenge league", teamRole: "challenge-league", season: "2025/26" }),
    ]);
    expect(splits.find((s) => s.team === "league")?.teamRole).toBe("league");
    expect(splits.find((s) => s.team === "challenge league")?.teamRole).toBe(
      "challenge-league",
    );
  });
});

describe("fieldingFigures", () => {
  it("sums fielding counts across every Appearance, batted or not", () => {
    const figures = fieldingFigures([
      appearance({ fielding: { catches: 1 } }),
      appearance({ batted: true, batting: { runs: 10 }, fielding: { catches: 2, runOuts: 1 } }),
      appearance({}),
    ]);
    expect(figures).toEqual({ catches: 3, stumpings: 0, runOuts: 1 });
  });
});
