import { describe, expect, it } from "vitest";

import { playingRoleLabel } from "./squad";

describe("playingRoleLabel", () => {
  it("names every Playing role the record can hold", () => {
    expect(playingRoleLabel("batter")).toBe("Batter");
    expect(playingRoleLabel("bowler")).toBe("Bowler");
    expect(playingRoleLabel("wicketkeeper")).toBe("Wicketkeeper");
    expect(playingRoleLabel("all-rounder")).toBe("All-rounder");
  });

  it("is undefined for a Player nobody has recorded one for", () => {
    expect(playingRoleLabel(undefined)).toBeUndefined();
  });

  it("prints nothing for a stored value it does not recognise, rather than the raw code", () => {
    expect(playingRoleLabel("legspinner")).toBeUndefined();
  });
});
