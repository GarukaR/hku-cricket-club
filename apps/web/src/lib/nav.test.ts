import { describe, expect, it } from "vitest";

import { navItems } from "@/content/club";
import { PENDING, builtSections, isBuilt } from "@/lib/nav";

describe("isBuilt", () => {
  it("is false for an item whose page does not exist yet", () => {
    expect(isBuilt({ label: "Archive", href: PENDING })).toBe(false);
  });

  it("is true for an item that points somewhere", () => {
    expect(isBuilt({ label: "The Club", href: "/#the-club" })).toBe(true);
  });
});

describe("builtSections", () => {
  it("drops the pending items and keeps the rest in order", () => {
    expect(
      builtSections([
        { label: "The Club", href: "/#the-club" },
        { label: "Fixtures", href: PENDING },
        { label: "Records", href: "/#recent-record" },
      ]),
    ).toEqual([
      { label: "The Club", href: "/#the-club" },
      { label: "Records", href: "/#recent-record" },
    ]);
  });
});

// The nav is set on every page, including the 404 — which is reached from any
// address at all. A bare "#the-club" resolves against whatever page is showing,
// so off the homepage it scrolls nowhere and the way back is a dead end. These
// two assertions are about the real nav, not a fixture: they are what stops that
// from coming back.
describe("the club's own nav", () => {
  it("points every built item at an address that resolves from any page", () => {
    for (const item of builtSections(navItems)) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("always offers somewhere to go", () => {
    expect(builtSections(navItems).length).toBeGreaterThan(0);
  });
});
