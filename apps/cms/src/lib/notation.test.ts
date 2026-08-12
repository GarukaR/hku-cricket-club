import { describe, expect, it } from "vitest";

import {
  competitionLabel,
  matchSummary,
  oversProblem,
  seasonProblem,
  slugProblem,
  startTimeProblem,
} from "@/lib/notation";

describe("seasonProblem", () => {
  it("accepts a season written as the club writes it", () => {
    expect(seasonProblem("2025/26")).toBeUndefined();
  });

  it("accepts a season spanning the turn of a century", () => {
    expect(seasonProblem("1999/00")).toBeUndefined();
  });

  it("rejects a season written out in full", () => {
    expect(seasonProblem("2025/2026")).toMatch(/2025\/26/);
  });

  it("rejects the hyphen CricClubs uses", () => {
    expect(seasonProblem("2025-26")).toMatch(/2025\/26/);
  });

  // A season spans two consecutive years by definition, so 2025/27 is not a
  // season written oddly — it is not a season.
  it("rejects two years that are not consecutive", () => {
    expect(seasonProblem("2025/27")).toMatch(/consecutive|2025\/26/);
  });

  it("rejects a single calendar year", () => {
    expect(seasonProblem("2025")).toBeDefined();
  });

  it("rejects blank", () => {
    expect(seasonProblem("")).toBeDefined();
    expect(seasonProblem(undefined)).toBeDefined();
  });

  it("ignores surrounding whitespace", () => {
    expect(seasonProblem("  2025/26 ")).toBeUndefined();
  });
});

describe("oversProblem", () => {
  it("accepts whole overs", () => {
    expect(oversProblem("40")).toBeUndefined();
  });

  it("accepts a part over", () => {
    expect(oversProblem("28.3")).toBeUndefined();
  });

  it("accepts none bowled", () => {
    expect(oversProblem("0")).toBeUndefined();
  });

  // The trap the whole field exists for: 28.3 is 171 deliveries, not 28.5 of
  // them. A sixth ball is a completed over, so .6 cannot occur.
  it("rejects a sixth ball", () => {
    expect(oversProblem("28.6")).toMatch(/balls/i);
  });

  it("rejects a decimal fraction of an over", () => {
    expect(oversProblem("28.75")).toMatch(/balls/i);
  });

  it("rejects a negative figure", () => {
    expect(oversProblem("-3")).toBeDefined();
  });

  it("rejects text", () => {
    expect(oversProblem("twenty")).toBeDefined();
  });

  // Optional everywhere it is used: a match whose overs nobody recorded is a
  // normal half-known record, not an invalid one.
  it("accepts nothing at all", () => {
    expect(oversProblem(undefined)).toBeUndefined();
    expect(oversProblem("")).toBeUndefined();
  });

  it("ignores surrounding whitespace", () => {
    expect(oversProblem(" 28.3 ")).toBeUndefined();
  });
});

describe("startTimeProblem", () => {
  it("accepts an afternoon start", () => {
    expect(startTimeProblem("14:00")).toBeUndefined();
    expect(startTimeProblem("09:30")).toBeUndefined();
    expect(startTimeProblem("00:00")).toBeUndefined();
  });

  // Only a Match still to be played has one — a result never says when the
  // game began.
  it("accepts nothing at all", () => {
    expect(startTimeProblem(undefined)).toBeUndefined();
    expect(startTimeProblem("")).toBeUndefined();
  });

  it("rejects the twelve-hour clock", () => {
    expect(startTimeProblem("2:00pm")).toBeDefined();
    expect(startTimeProblem("2:00")).toBeDefined();
  });

  it("rejects a time that is not one", () => {
    expect(startTimeProblem("24:00")).toBeDefined();
    expect(startTimeProblem("14:60")).toBeDefined();
  });
});

describe("slugProblem", () => {
  it("accepts a lower-case hyphenated name", () => {
    expect(slugProblem("challenge-league")).toBeUndefined();
  });

  it("accepts a single word", () => {
    expect(slugProblem("league")).toBeUndefined();
  });

  it("rejects capitals", () => {
    expect(slugProblem("Challenge-League")).toBeDefined();
  });

  it("rejects spaces", () => {
    expect(slugProblem("challenge league")).toBeDefined();
  });

  it("rejects a leading, trailing or doubled hyphen", () => {
    expect(slugProblem("-league")).toBeDefined();
    expect(slugProblem("league-")).toBeDefined();
    expect(slugProblem("challenge--league")).toBeDefined();
  });

  it("rejects blank", () => {
    expect(slugProblem("")).toBeDefined();
    expect(slugProblem(undefined)).toBeDefined();
  });
});

describe("competitionLabel", () => {
  it("joins a competition to its division the way the club says it", () => {
    expect(competitionLabel("Saturday Championship", "Div 2")).toBe(
      "Saturday Championship Div 2",
    );
  });

  // Not every competition has one — the University Cricket League is entered
  // as a single undivided competition, and a trailing space would show.
  it("leaves a competition without a division alone", () => {
    expect(competitionLabel("University Cricket League", undefined)).toBe(
      "University Cricket League",
    );
    expect(competitionLabel("University Cricket League", "  ")).toBe(
      "University Cricket League",
    );
  });

  it("trims both parts", () => {
    expect(competitionLabel("  Challenge League ", " Div 3 ")).toBe(
      "Challenge League Div 3",
    );
  });

  it("says nothing when there is nothing to say", () => {
    expect(competitionLabel(undefined, "Div 2")).toBe("");
  });
});

describe("matchSummary", () => {
  // Payload stores a date as a timestamp; the label wants the day.
  it("names a match by its date and its opponent", () => {
    expect(matchSummary("2026-04-25T00:00:00.000Z", "PolyU")).toBe(
      "2026-04-25 v PolyU",
    );
  });

  it("holds together while the record is still being typed", () => {
    expect(matchSummary("2026-04-25", undefined)).toBe("2026-04-25");
    expect(matchSummary(undefined, "PolyU")).toBe("v PolyU");
    expect(matchSummary(undefined, undefined)).toBe("");
  });
});
