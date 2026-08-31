import { describe, expect, it } from "vitest";

import type { Appearance } from "./appearance";
import { computeLeaderboards, QUALIFICATION, type PlayerAppearances } from "./leaderboards";

/** An Appearance with nothing but what one test cares about. */
function appearance(overrides: Partial<Appearance> = {}): Appearance {
  return {
    player: "Player",
    batted: false,
    bowled: false,
    ...overrides,
  };
}

function player(
  playerId: number,
  player: string,
  appearances: Appearance[],
): PlayerAppearances {
  return { playerId, player, appearances };
}

describe("computeLeaderboards — aggregates", () => {
  it("ranks most runs with no qualification, one dismissed innings included", () => {
    const board = computeLeaderboards([
      player(1, "Big Innings", [
        appearance({ batted: true, batting: { runs: 80, notOut: false } }),
      ]),
      player(2, "Steady Bat", [
        appearance({ batted: true, batting: { runs: 30, notOut: false } }),
        appearance({ batted: true, batting: { runs: 25, notOut: false } }),
      ]),
    ]);

    expect(board.runs.map((r) => r.player)).toEqual(["Big Innings", "Steady Bat"]);
    expect(board.runs[0]).toMatchObject({ innings: 1, runs: 80 });
  });

  it("excludes a player who never batted from the runs table", () => {
    const board = computeLeaderboards([
      player(1, "Specialist Bowler", [
        appearance({ batted: false, bowled: true, bowling: { overs: "10", wickets: 2, runs: 30 } }),
      ]),
    ]);
    expect(board.runs).toHaveLength(0);
  });

  it("ranks most wickets with no qualification", () => {
    const board = computeLeaderboards([
      player(1, "One Over", [
        appearance({ bowled: true, bowling: { overs: "1", wickets: 1, runs: 4 } }),
      ]),
      player(2, "Workhorse", [
        appearance({ bowled: true, bowling: { overs: "10", wickets: 3, runs: 40 } }),
      ]),
    ]);
    expect(board.wickets.map((w) => w.player)).toEqual(["Workhorse", "One Over"]);
  });

  it("excludes a player who never bowled from the wickets table", () => {
    const board = computeLeaderboards([
      player(1, "Pure Bat", [appearance({ batted: true, batting: { runs: 10 } })]),
    ]);
    expect(board.wickets).toHaveLength(0);
  });

  it("breaks a tie alphabetically by name, not by insertion order", () => {
    const board = computeLeaderboards([
      player(2, "Zara", [appearance({ batted: true, batting: { runs: 50 } })]),
      player(1, "Amir", [appearance({ batted: true, batting: { runs: 50 } })]),
    ]);
    expect(board.runs.map((r) => r.player)).toEqual(["Amir", "Zara"]);
  });
});

describe("computeLeaderboards — batting average", () => {
  it("keeps a not-out 40 in one innings out of the averages table entirely", () => {
    // The exact scenario the ticket names: without a threshold, one not-out
    // 40 is a defined, finite average that would top the table forever.
    const board = computeLeaderboards([
      player(1, "One Innings", [
        appearance({ batted: true, batting: { runs: 40, notOut: true } }),
      ]),
    ]);
    expect(board.battingAverage).toHaveLength(0);
    expect(board.runs).toHaveLength(1); // still counted in the aggregate
  });

  it("admits a player at exactly the qualifying number of innings", () => {
    const appearances = Array.from({ length: QUALIFICATION.battingInnings }, () =>
      appearance({ batted: true, batting: { runs: 20, notOut: false } }),
    );
    const board = computeLeaderboards([player(1, "Qualifier", appearances)]);
    expect(board.battingAverage).toHaveLength(1);
    expect(board.battingAverage[0].average).toBe("20.00");
  });

  it("drops a qualifying player whose average is still undefined", () => {
    // Five not-out innings clears the innings floor without ever producing a
    // number to rank by (CONTEXT.md — Undefined average).
    const appearances = Array.from({ length: QUALIFICATION.battingInnings }, () =>
      appearance({ batted: true, batting: { runs: 20, notOut: true } }),
    );
    const board = computeLeaderboards([player(1, "Never Out", appearances)]);
    expect(board.battingAverage).toHaveLength(0);
  });

  it("sorts by average descending — the higher average wins", () => {
    const five = (runs: number) =>
      Array.from({ length: QUALIFICATION.battingInnings }, () =>
        appearance({ batted: true, batting: { runs, notOut: false } }),
      );
    const board = computeLeaderboards([
      player(1, "Lower", five(10)),
      player(2, "Higher", five(50)),
    ]);
    expect(board.battingAverage.map((r) => r.player)).toEqual(["Higher", "Lower"]);
  });
});

describe("computeLeaderboards — bowling average", () => {
  it("keeps a bowler below the overs threshold out of the averages table", () => {
    const board = computeLeaderboards([
      player(1, "One Over", [
        appearance({ bowled: true, bowling: { overs: "1", wickets: 1, runs: 0 } }),
      ]),
    ]);
    expect(board.bowlingAverage).toHaveLength(0);
    expect(board.wickets).toHaveLength(1); // still counted in the aggregate
  });

  it("admits a bowler at exactly the qualifying number of overs", () => {
    const board = computeLeaderboards([
      player(1, "Workhorse", [
        appearance({
          bowled: true,
          bowling: { overs: String(QUALIFICATION.bowlingOvers), wickets: 4, runs: 40 },
        }),
      ]),
    ]);
    expect(board.bowlingAverage).toHaveLength(1);
    expect(board.bowlingAverage[0].average).toBe("10.00");
  });

  it("drops a qualifying bowler who has taken no wicket", () => {
    const board = computeLeaderboards([
      player(1, "Wicketless", [
        appearance({
          bowled: true,
          bowling: { overs: String(QUALIFICATION.bowlingOvers), wickets: 0, runs: 60 },
        }),
      ]),
    ]);
    expect(board.bowlingAverage).toHaveLength(0);
  });

  it("sorts by average ascending — fewer runs per wicket wins", () => {
    const spell = (runs: number) => ({
      overs: String(QUALIFICATION.bowlingOvers),
      wickets: 5,
      runs,
    });
    const board = computeLeaderboards([
      player(1, "Expensive", [appearance({ bowled: true, bowling: spell(100) })]),
      player(2, "Economical", [appearance({ bowled: true, bowling: spell(20) })]),
    ]);
    expect(board.bowlingAverage.map((r) => r.player)).toEqual(["Economical", "Expensive"]);
  });
});
