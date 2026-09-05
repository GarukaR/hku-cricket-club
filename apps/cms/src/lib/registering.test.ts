import { describe, expect, it } from "vitest";

import {
  needsAttention,
  proposeRegistrations,
  type Appeared,
} from "./registering";

/** A player who turned out, is registered nowhere, and neither kept nor
 *  bowled — overridden a field at a time. */
const played = (name: string, over: Partial<Appeared> = {}): Appeared => ({
  playerId: name,
  name,
  registeredHere: false,
  registeredElsewhere: [],
  kept: false,
  bowled: false,
  ...over,
});

describe("proposeRegistrations", () => {
  it("offers everybody who played and is not yet registered", () => {
    const proposal = proposeRegistrations(
      [played("Ashwin"), played("Tiran")],
      "league",
    );

    expect(proposal.register.map((one) => one.name)).toEqual(["Ashwin", "Tiran"]);
    expect(proposal.blocked).toEqual([]);
    expect(proposal.already).toEqual([]);
  });

  it("leaves alone somebody already registered to this side", () => {
    const proposal = proposeRegistrations(
      [played("Ashwin", { registeredHere: true }), played("Tiran")],
      "league",
    );

    expect(proposal.already.map((one) => one.name)).toEqual(["Ashwin"]);
    expect(proposal.register.map((one) => one.name)).toEqual(["Tiran"]);
  });

  it("never proposes a registration the exclusivity rule refuses", () => {
    // Registered to the challenge league side this season, and this is the
    // league side. The club may have meant to move him, but that is a decision
    // about a real player and not this screen's to make.
    const proposal = proposeRegistrations(
      [played("Ashwin", { registeredElsewhere: ["challenge-league"] })],
      "league",
    );

    expect(proposal.register).toEqual([]);
    expect(proposal.blocked).toHaveLength(1);
    expect(proposal.blocked[0].player.name).toBe("Ashwin");
    expect(proposal.blocked[0].problem).toMatch(
      /already registered to the challenge league team this season/i,
    );
  });

  it("states the refusal in the record's own words, not this module's", () => {
    // The sentence comes from lib/eligibility, so the panel and a save that
    // hits the collection's validation cannot disagree about why.
    const [blocked] = proposeRegistrations(
      [played("Ashwin", { registeredElsewhere: ["league"] })],
      "challenge-league",
    ).blocked;

    expect(blocked.problem).toMatch(/already registered to the league team/i);
  });

  it("does not block on a registration to a side the rule ignores", () => {
    // The social and student sides are outside the exclusivity rule entirely.
    const proposal = proposeRegistrations(
      [played("Ashwin", { registeredElsewhere: ["social", "student"] })],
      "league",
    );

    expect(proposal.register.map((one) => one.name)).toEqual(["Ashwin"]);
    expect(proposal.blocked).toEqual([]);
  });

  it("has nothing to say about an import where everyone is registered", () => {
    const proposal = proposeRegistrations(
      [played("Ashwin", { registeredHere: true, bowled: true })],
      "league",
    );

    expect(needsAttention(proposal)).toBe(false);
  });
});

describe("who to offer as the keeper", () => {
  it("asks nothing when somebody's scorecards already show them keeping", () => {
    const proposal = proposeRegistrations(
      [played("Ashwin", { kept: true }), played("Tiran")],
      "league",
    );

    expect(proposal.keeperCandidates).toEqual([]);
  });

  it("offers only the players who never bowled", () => {
    // A bowler is not the keeper, which is the one thing a scorecard says
    // plainly enough to narrow the list with.
    const proposal = proposeRegistrations(
      [
        played("Ashwin"),
        played("Tiran", { bowled: true }),
        played("Ben", { bowled: true }),
        played("Reyansh"),
      ],
      "league",
    );

    expect(proposal.keeperCandidates.map((one) => one.name)).toEqual([
      "Ashwin",
      "Reyansh",
    ]);
  });

  it("offers nobody rather than guessing when everybody bowled", () => {
    const proposal = proposeRegistrations(
      [played("Tiran", { bowled: true }), played("Ben", { bowled: true })],
      "league",
    );

    expect(proposal.keeperCandidates).toEqual([]);
  });

  it("asks even about players it cannot register", () => {
    // Being ineligible for *this* side says nothing about who kept wicket in
    // the match that was actually played.
    const proposal = proposeRegistrations(
      [played("Ashwin", { registeredElsewhere: ["challenge-league"] })],
      "league",
    );

    expect(proposal.blocked).toHaveLength(1);
    expect(proposal.keeperCandidates.map((one) => one.name)).toEqual(["Ashwin"]);
    expect(needsAttention(proposal)).toBe(true);
  });
});
