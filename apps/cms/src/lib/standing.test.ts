import { describe, expect, it } from "vitest";

import { FIXTURE, OUTSTANDING, standingOf } from "./standing";

/** A fixed point to measure from: 2026-08-25, 09:00 in Hong Kong. */
const NOW = new Date("2026-08-25T01:00:00.000Z");

describe("standingOf", () => {
  it("shows a recorded outcome as itself", () => {
    expect(standingOf({ date: "2026-07-26", outcome: "won" }, NOW)).toBe("Won");
    expect(standingOf({ date: "2026-07-26", outcome: "lost" }, NOW)).toBe("Lost");
    expect(standingOf({ date: "2026-07-26", outcome: "abandoned" }, NOW)).toBe(
      "Abandoned",
    );
  });

  it("shows a recorded outcome whatever the date, including a future one", () => {
    expect(standingOf({ date: "2027-01-01", outcome: "drawn" }, NOW)).toBe(
      "Drawn",
    );
  });

  it("calls an unplayed match with a date to come a fixture", () => {
    expect(standingOf({ date: "2026-09-12", outcome: null }, NOW)).toBe(FIXTURE);
  });

  it("flags an unplayed match whose date has passed", () => {
    expect(standingOf({ date: "2026-07-31", outcome: null }, NOW)).toBe(
      OUTSTANDING,
    );
  });

  it("counts today as still to come, as nextFixture() does", () => {
    // An evening fixture is not an overdue result at breakfast.
    expect(standingOf({ date: "2026-08-25T10:00:00.000Z" }, NOW)).toBe(FIXTURE);
  });

  it("draws the boundary in Hong Kong, not in UTC", () => {
    // 2026-08-25T23:00Z is still the 25th in UTC but already the 26th in Hong
    // Kong. Measured from a Hong Kong morning, a match dated the 25th has not
    // yet passed — and would read as passed if the comparison were made in UTC
    // from a late-evening `now`.
    const lateInHongKong = new Date("2026-08-25T17:00:00.000Z"); // 26th, 01:00 HKT
    expect(standingOf({ date: "2026-08-25" }, lateInHongKong)).toBe(OUTSTANDING);
    expect(standingOf({ date: "2026-08-26" }, lateInHongKong)).toBe(FIXTURE);
  });

  it("says nothing about a half-filled form", () => {
    expect(standingOf({ outcome: null }, NOW)).toBe("");
    expect(standingOf({ date: null, outcome: null }, NOW)).toBe("");
    expect(standingOf({ date: "not a date" }, NOW)).toBe("");
  });

  it("accepts a Date as well as an ISO string", () => {
    expect(standingOf({ date: new Date("2026-07-31T12:00:00Z") }, NOW)).toBe(
      OUTSTANDING,
    );
  });
});
