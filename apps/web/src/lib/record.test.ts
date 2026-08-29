import type { Appearance as StoredAppearance, Match as Stored } from "@hkucc/domain";
import { describe, expect, it } from "vitest";

import { asAppearance, asMatch } from "./record";

/** A stored Match with everything the CMS requires and nothing it does not, so
 *  each test states only the field it is about. */
function stored(overrides: Partial<Stored> = {}): Stored {
  return {
    id: 1,
    team: { id: 1, name: "league", slug: "league", updatedAt: "", createdAt: "" },
    season: { id: 1, name: "2025/26", updatedAt: "", createdAt: "" },
    date: "2026-04-25T00:00:00.000Z",
    opponent: "PolyU",
    venue: "away",
    updatedAt: "",
    createdAt: "",
    ...overrides,
  } as Stored;
}

describe("asMatch", () => {
  it("carries the id every Match page is addressed by", () => {
    expect(asMatch(stored({ id: 42 })).id).toBe(42);
  });

  it("carries the CricClubs scorecard link when one is entered", () => {
    expect(asMatch(stored()).scorecard).toBeUndefined();
    expect(
      asMatch(stored({ scorecard: "https://cricclubs.com/x" })).scorecard,
    ).toBe("https://cricclubs.com/x");
  });

  it("reads a day-only date as an ISO date, without applying a time zone", () => {
    // Midnight UTC, so nothing here may shift it back to the 24th.
    expect(asMatch(stored()).date).toBe("2026-04-25");
  });

  it("names the side, because the homepage's record is club-wide", () => {
    expect(asMatch(stored()).team).toBe("league");
  });

  it("prints the venue as the record does", () => {
    expect(asMatch(stored({ venue: "home" })).venue).toBe("Home");
    expect(asMatch(stored({ venue: "away" })).venue).toBe("Away");
  });

  describe("a fixture", () => {
    it("has no result at all when nobody has entered an outcome", () => {
      expect(asMatch(stored()).result).toBeUndefined();
    });

    it("is still a fixture when a result group exists but is empty", () => {
      // Payload writes the group whether or not it was filled in, so an empty
      // one must not read as a played match with no outcome.
      expect(asMatch(stored({ result: {} })).result).toBeUndefined();
    });

    it("carries its start time", () => {
      expect(asMatch(stored({ startTime: "13:30" })).time).toBe("13:30");
    });
  });

  describe("the margin", () => {
    const withMargin = (value?: number | null, unit?: "runs" | "wickets" | null) =>
      asMatch(stored({ result: { outcome: "won", margin: { value, unit } } }))
        .result?.margin;

    it("is stated as a scorer would", () => {
      expect(withMargin(33, "runs")).toBe("33 runs");
      expect(withMargin(5, "wickets")).toBe("5 wickets");
    });

    it("goes singular at one, because 'by 1 wickets' reads as a bug", () => {
      expect(withMargin(1, "wickets")).toBe("1 wicket");
      expect(withMargin(1, "runs")).toBe("1 run");
    });

    it("is absent when nobody recorded it — a win with no margin is a win", () => {
      expect(withMargin(undefined, undefined)).toBeUndefined();
      expect(withMargin(33, undefined)).toBeUndefined();
      expect(withMargin(undefined, "runs")).toBeUndefined();
    });
  });

  describe("the innings", () => {
    const scored = (
      rows: NonNullable<NonNullable<Stored["result"]>["innings"]>,
    ) => asMatch(stored({ result: { outcome: "won", innings: rows } })).result;

    it("names the sides — HKU, and the opponent by its own name", () => {
      expect(
        scored([
          { side: "hku", runs: 184, wickets: 6 },
          { side: "opponent", runs: 151 },
        ])?.innings,
      ).toEqual([
        { side: "HKU", runs: 184, wickets: 6 },
        { side: "PolyU", runs: 151 },
      ]);
    });

    it("reads no wickets as bowled out, never as nought for nought", () => {
      const [first] = scored([
        { side: "hku", runs: 151, wickets: null },
        { side: "opponent", runs: 152, wickets: 4 },
      ])!.innings!;
      expect(first.wickets).toBeUndefined();
    });

    it("keeps a genuine nought for nought", () => {
      const [first] = scored([
        { side: "hku", runs: 0, wickets: 0 },
        { side: "opponent", runs: 1, wickets: 0 },
      ])!.innings!;
      expect(first).toEqual({ side: "HKU", runs: 0, wickets: 0 });
    });

    it("drops a scoreline it cannot set, rather than setting a broken one", () => {
      // The scoreline is a two-line device. A two-innings game has four, and a
      // result whose scores nobody entered has none; both are real, and both
      // print their verdict without a scoreline.
      expect(scored([])?.innings).toBeUndefined();
      expect(scored([{ side: "hku", runs: 184 }])?.innings).toBeUndefined();
      expect(
        scored([
          { side: "hku", runs: 184 },
          { side: "opponent", runs: 151 },
          { side: "hku", runs: 90 },
          { side: "opponent", runs: 95 },
        ])?.innings,
      ).toBeUndefined();
    });

    it("still states the outcome when there is no scoreline", () => {
      expect(scored([])?.outcome).toBe("won");
    });
  });

  describe("what the record may not hold", () => {
    it("leaves out a friendly's competition rather than inventing one", () => {
      expect(asMatch(stored({ competition: null })).competition).toBeUndefined();
    });

    it("leaves out a ground and a format nobody recorded", () => {
      const match = asMatch(stored({ ground: null, format: null }));
      expect(match.ground).toBeUndefined();
      expect(match.format).toBeUndefined();
    });

    it("drops a relationship the query did not populate", () => {
      // An id arriving where a name was asked for means the query changed. The
      // page prints nothing rather than printing a database id at the reader.
      expect(asMatch(stored({ competition: 7 })).competition).toBeUndefined();
      expect(asMatch(stored({ team: 3 })).team).toBe("");
    });
  });
});

/** A stored Appearance with everything the collection requires. */
function storedAppearance(
  overrides: Partial<StoredAppearance> = {},
): StoredAppearance {
  return {
    id: 1,
    match: 1,
    player: { id: 1, name: "Garuka Ranasinghe", updatedAt: "", createdAt: "" },
    updatedAt: "",
    createdAt: "",
    ...overrides,
  } as StoredAppearance;
}

describe("asAppearance", () => {
  it("names the player, from the populated relation", () => {
    expect(asAppearance(storedAppearance()).player).toBe("Garuka Ranasinghe");
  });

  it("reads an unticked batted as did not bat, not as an absent Appearance", () => {
    // Did not bat and did not play must never be conflated (CONTEXT.md). This
    // is the first: the Appearance exists, batted is false, and there is no
    // batting detail to go with it.
    const appearance = asAppearance(storedAppearance({ batted: false }));
    expect(appearance.batted).toBe(false);
    expect(appearance.batting).toBeUndefined();
  });

  it("carries batting detail only when the player actually batted", () => {
    const appearance = asAppearance(
      storedAppearance({ batted: true, batting: { runs: 45, balls: 30 } }),
    );
    expect(appearance.batted).toBe(true);
    expect(appearance.batting).toEqual({ runs: 45, balls: 30, notOut: false });
  });

  it("keeps a nought maidens rather than reading it as absent", () => {
    const appearance = asAppearance(
      storedAppearance({ bowled: true, bowling: { overs: "7.0", maidens: 0 } }),
    );
    expect(appearance.bowling?.maidens).toBe(0);
  });

  it("carries fielding counts even for a player who neither batted nor bowled", () => {
    const appearance = asAppearance(
      storedAppearance({ fielding: { catches: 1 } }),
    );
    expect(appearance.batted).toBe(false);
    expect(appearance.bowled).toBe(false);
    expect(appearance.fielding).toEqual({ catches: 1, runOuts: undefined, stumpings: undefined });
  });
});
