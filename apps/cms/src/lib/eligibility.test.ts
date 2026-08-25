import { describe, expect, it } from "vitest";

import {
  CALL_UP_CAP,
  callUpProblem,
  callUpsStanding,
  isCallUp,
  registrationProblem,
} from "./eligibility";

describe("registrationProblem", () => {
  it("refuses the challenge league team to a league-registered player", () => {
    expect(registrationProblem("challenge-league", ["league"])).toMatch(
      /already registered to the league team this season/i,
    );
  });

  it("refuses the league team to a challenge-league-registered player", () => {
    // Symmetric, unlike the call-up cap.
    expect(registrationProblem("league", ["challenge-league"])).toMatch(
      /already registered to the challenge league team this season/i,
    );
  });

  it("allows re-registering to the same side", () => {
    expect(registrationProblem("league", ["league"])).toBeUndefined();
  });

  it("leaves the social and student sides out of it", () => {
    expect(registrationProblem("social", ["league"])).toBeUndefined();
    expect(registrationProblem("student", ["challenge-league"])).toBeUndefined();
    expect(registrationProblem("league", ["social", "student"])).toBeUndefined();
  });

  it("says nothing about a player with no other registration", () => {
    expect(registrationProblem("league", [])).toBeUndefined();
    expect(registrationProblem("challenge-league", [])).toBeUndefined();
  });
});

describe("isCallUp", () => {
  it("counts a challenge league player appearing for the league team", () => {
    expect(isCallUp("challenge-league", "league")).toBe(true);
  });

  it("does not count the reverse — the rule is one-directional", () => {
    expect(isCallUp("league", "challenge-league")).toBe(false);
  });

  it("does not count a player appearing for their own side", () => {
    expect(isCallUp("challenge-league", "challenge-league")).toBe(false);
    expect(isCallUp("league", "league")).toBe(false);
  });

  it("does not count the social or student sides either way", () => {
    expect(isCallUp("challenge-league", "social")).toBe(false);
    expect(isCallUp("social", "league")).toBe(false);
    expect(isCallUp("student", "league")).toBe(false);
  });

  it("does not count an unregistered player", () => {
    expect(isCallUp(undefined, "league")).toBe(false);
  });
});

describe("callUpsStanding", () => {
  it("reports used of two", () => {
    expect(callUpsStanding(0).summary).toBe("0 of 2 call-ups used this season");
    expect(callUpsStanding(1).summary).toBe("1 of 2 call-ups used this season");
  });

  it("counts down what is left", () => {
    expect(callUpsStanding(0).remaining).toBe(CALL_UP_CAP);
    expect(callUpsStanding(1).remaining).toBe(1);
    expect(callUpsStanding(2).remaining).toBe(0);
  });

  it("is exhausted at the cap, not past it", () => {
    expect(callUpsStanding(1).exhausted).toBe(false);
    expect(callUpsStanding(2).exhausted).toBe(true);
  });

  it("floors at none left rather than going negative", () => {
    // Over the cap is a problem to state, not a negative allowance.
    expect(callUpsStanding(3).remaining).toBe(0);
    expect(callUpsStanding(3).exhausted).toBe(true);
  });
});

describe("callUpProblem", () => {
  it("says nothing while the player is still eligible", () => {
    expect(callUpProblem(0)).toBeUndefined();
    expect(callUpProblem(1)).toBeUndefined();
  });

  it("states the position once the cap is reached", () => {
    expect(callUpProblem(2)).toMatch(/not eligible for the league team again/i);
  });

  it("makes clear it has not refused the save", () => {
    // The record must be able to hold what actually happened, and the count is
    // a floor rather than a certainty.
    expect(callUpProblem(2)).toMatch(/saved anyway/i);
    expect(callUpProblem(3)).toMatch(/saved anyway/i);
  });
});
