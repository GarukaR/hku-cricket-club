import { describe, expect, it } from "vitest";

import { entityNameProblem, sameEntity } from "@/lib/mapping";

describe("sameEntity", () => {
  it("matches a name to itself", () => {
    expect(sameEntity("HKU CC", "HKU CC")).toBe(true);
  });

  it("ignores case and spacing, which scorers vary freely", () => {
    expect(sameEntity("HKU  Belchers CC", "hku belchers cc")).toBe(true);
  });

  // CONTEXT.md writes the student team's entry both ways in the same document,
  // which is exactly how a duplicate mapping would get past a human reader.
  it("ignores the brackets around a division suffix", () => {
    expect(sameEntity("HKU Students (UCL)", "HKU Students UCL")).toBe(true);
  });

  it("does not match two different clubs", () => {
    expect(sameEntity("HKU CC", "HKU Belchers CC")).toBe(false);
  });
});

describe("entityNameProblem", () => {
  const claimed = [
    { team: "league", names: ["HKU CC"] },
    { team: "student", names: ["HKU Students (UCL)"] },
  ];

  it("passes a name no other side has claimed", () => {
    expect(entityNameProblem(["HKU Belchers CC"], claimed)).toBeUndefined();
  });

  // Nothing in a CricClubs export states which of our sides it belongs to. If
  // two Teams claim one entity the importer has no way to choose, and would
  // file a season of matches against whichever it happened to read first.
  it("names the side already holding the entity", () => {
    const problem = entityNameProblem(["HKU CC"], claimed);

    expect(problem).toMatch(/HKU CC/);
    expect(problem).toMatch(/league/);
  });

  it("catches a claim written in a different hand", () => {
    expect(entityNameProblem(["hku students ucl"], claimed)).toMatch(/student/);
  });

  it("catches the same entity listed twice against one side", () => {
    expect(
      entityNameProblem(["HKU Belchers CC", "HKU  belchers  cc"], claimed),
    ).toMatch(/twice|already/i);
  });

  // The sunday social side is scored nowhere at all, and that absence is the
  // record being honest rather than a field somebody forgot.
  it("accepts a side that maps to nothing", () => {
    expect(entityNameProblem([], claimed)).toBeUndefined();
    expect(entityNameProblem(undefined, claimed)).toBeUndefined();
  });

  it("ignores blank rows", () => {
    expect(entityNameProblem(["  ", ""], claimed)).toBeUndefined();
  });
});
