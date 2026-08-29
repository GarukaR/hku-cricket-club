import { describe, expect, it } from "vitest";

import { seasonFromSlug, seasonSlug } from "./seasons";

describe("seasonSlug", () => {
  it("turns the club's written form into one URL segment", () => {
    expect(seasonSlug("2025/26")).toBe("2025-26");
  });
});

describe("seasonFromSlug", () => {
  it("is the reverse of seasonSlug", () => {
    expect(seasonFromSlug("2025-26")).toBe("2025/26");
  });

  it("rolls over the century the same way the club's own seasons do", () => {
    expect(seasonSlug("1999/00")).toBe("1999-00");
    expect(seasonFromSlug("1999-00")).toBe("1999/00");
  });
});
