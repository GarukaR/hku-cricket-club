import { describe, expect, it } from "vitest";

import { longDate, shortDate } from "@/lib/dates";

// These run in America/Los_Angeles (see vitest.config.ts). A date-only value has
// no time zone, so every assertion below must hold in any zone; if the
// implementation stops pinning UTC, the negative offset drops each date to the
// day before and this file goes red.
describe("longDate", () => {
  it("prints the weekday, the day and the month in full", () => {
    expect(longDate("2026-04-25")).toBe("Sat 25 April");
  });

  it("does not shift the date in a zone behind UTC", () => {
    // Midnight UTC is 17:00 the previous day in Los Angeles. Reading the date in
    // local time would report Friday the 24th for a Saturday fixture.
    expect(longDate("2026-05-02")).toBe("Sat 2 May");
  });

  it("holds across a year boundary", () => {
    expect(longDate("2026-01-01")).toBe("Thu 1 January");
  });

  it("keeps a leap day", () => {
    expect(longDate("2028-02-29")).toBe("Tue 29 February");
  });
});

describe("shortDate", () => {
  it("zero-pads the day so the table column stays on one edge", () => {
    // The archive table sets tabular figures; "4 Apr" under "25 Apr" would break
    // the column that the whole treatment exists to hold.
    expect(shortDate("2026-04-04")).toBe("04 Apr");
    expect(shortDate("2026-04-25")).toBe("25 Apr");
  });

  it("abbreviates the month and omits the year", () => {
    // The year belongs to the section heading — "Recent record — 2025/26".
    expect(shortDate("2026-04-25")).toBe("25 Apr");
  });

  it("holds the column to three letters in September", () => {
    // en-GB gives "Sept" for September alone. In a nowrap column of tabular
    // figures that is one character wider than every other row, and the season
    // opens in September.
    expect(shortDate("2026-09-13")).toBe("13 Sep");
    for (const iso of [
      "2026-01-03",
      "2026-02-07",
      "2026-03-07",
      "2026-04-04",
      "2026-05-02",
      "2026-06-06",
      "2026-07-04",
      "2026-08-01",
      "2026-09-05",
      "2026-10-03",
      "2026-11-07",
      "2026-12-05",
    ]) {
      expect(shortDate(iso)).toHaveLength("06 Jun".length);
    }
  });

  it("agrees with longDate about which day it is", () => {
    const iso = "2026-04-18";
    expect(longDate(iso)).toContain("18");
    expect(shortDate(iso)).toBe("18 Apr");
  });
});
