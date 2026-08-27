import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseExport, type ParsedMatch } from "./cricclubs";
import { documentsFor, sameFixture } from "./importing";
import { abbreviates, canonicalName, isOurSide, ourNames } from "./names";

const sample = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../docs/samples/${name}`, import.meta.url)),
    "utf8",
  );

const CHARLIE_BEARS = parseExport(
  sample("saturday-2026-03-21-v-irc-charlie-bears.csv"),
);
const LANCERS = parseExport(sample("saturday-2026-01-03-v-scc-lancers.csv"));
const UCL = parseExport(sample("ucl-2025-03-18-v-combined-unis.csv"));

/**
 * A record that knows every spelling in the file, each as its own Player, with
 * the abbreviations pointed at the same person as the full name.
 *
 * Built from the file rather than written out, so these tests describe what an
 * import *does* rather than re-encoding who these particular cricketers are.
 */
function knowing(match: ParsedMatch, claimed: string[]) {
  const names = ourNames(match, isOurSide(claimed));
  const ids = new Map<string, number>();

  // A full name is a person. Give each one an id, in the order the file names
  // them, which is what creating them from the import screen would do.
  const full = names.filter((name) => name.mayCreate).map((name) => name.spelling);
  full.forEach((spelling, i) => ids.set(canonicalName(spelling), i + 1));

  // An abbreviation joins the full name it shortens — the answer an editor
  // gives once, kept as an Alias.
  for (const { spelling, mayCreate } of names) {
    if (mayCreate) continue;
    const owner = full.find((whole) => abbreviates(spelling, whole));
    if (owner) ids.set(canonicalName(spelling), ids.get(canonicalName(owner))!);
  }

  return (spelling: string) => ids.get(canonicalName(spelling));
}

const importedFrom = (match: ParsedMatch, claimed: string[]) =>
  documentsFor({
    match,
    ours: isOurSide(claimed),
    playerFor: knowing(match, claimed),
    venue: "home",
  });

describe("the Match an export becomes", () => {
  it("records the club's side winning as won, not as the other side losing", () => {
    const { match } = importedFrom(CHARLIE_BEARS, ["HKU CC"]);

    expect(match.result.outcome).toBe("won");
    // As CricClubs spells them, run-on word and all — the record keeps the
    // other club's own name rather than a tidied version of it.
    expect(match.opponent).toBe("IRC Charlie Bears Saturday");
  });

  it("records a defeat from the same header shape", () => {
    // HKU Students lost this one by 79 runs.
    const { match } = importedFrom(UCL, ["HKU Students (UCL)"]);

    expect(match.result.outcome).toBe("lost");
    expect(match.result.margin).toEqual({ value: 79, unit: "runs" });
    expect(match.opponent).toBe("Combined Unis XI (UCL)");
  });

  it("stores each innings total as written, with extras beside it", () => {
    const { match } = importedFrom(UCL, ["HKU Students (UCL)"]);
    const ours = match.result.innings.find((one) => one.side === "hku");

    // 115 as stated, though the batters sum to 114. The total is stored, never
    // summed, which is the whole reason this file is in the samples.
    expect(ours?.runs).toBe(115);
    expect(ours?.wickets).toBe(7);
    expect(ours?.legByes).toBe(2);
    expect(ours?.byes).toBe(0);
  });

  it("marks which innings was ours and which was theirs", () => {
    const { match } = importedFrom(UCL, ["HKU Students (UCL)"]);

    expect(match.result.innings.map((one) => one.side)).toEqual([
      "opponent",
      "hku",
    ]);
  });

  it("leaves the outcome empty rather than invent one it cannot read", () => {
    const unreadable = structuredClone(CHARLIE_BEARS);
    unreadable.winner = undefined;

    const { match } = documentsFor({
      match: unreadable,
      ours: isOurSide(["HKU CC"]),
      playerFor: () => undefined,
      venue: "away",
    });

    expect(match.result.outcome).toBeUndefined();
    expect(match.venue).toBe("away");
  });
});

describe("the Appearances an export becomes", () => {
  it("gives a player who batted their figures", () => {
    const { appearances } = importedFrom(LANCERS, ["HKU CC"]);
    const playerFor = knowing(LANCERS, ["HKU CC"]);

    const jaya = appearances.find(
      (one) => one.player === playerFor("Jaya Ramesh Chaliki"),
    );

    expect(jaya?.batted).toBe(true);
    expect(jaya?.batting?.runs).toBe(47);
    expect(jaya?.batting?.howOut).toBe("b");
    // And he bowled in the same match — one Appearance, both halves.
    expect(jaya?.bowled).toBe(true);
    expect(jaya?.bowling?.wickets).toBe(2);
  });

  it("keeps one Appearance for a man the file spells two ways", () => {
    const { appearances } = importedFrom(CHARLIE_BEARS, ["HKU CC"]);
    const playerFor = knowing(CHARLIE_BEARS, ["HKU CC"]);

    const his = appearances.filter(
      (one) => one.player === playerFor("Jaya Ramesh Chaliki"),
    );

    // `Jaya Ramesh Chaliki` bats and bowls, `Jaya Ramesh C` takes wickets in
    // the dismissal column. One person, one Appearance.
    expect(his).toHaveLength(1);
  });

  it("records a player who was not needed with the bat as having played", () => {
    const { appearances } = importedFrom(CHARLIE_BEARS, ["HKU CC"]);

    const didNotBat = appearances.filter(
      (one) => one.batted === false && one.batting === undefined,
    );

    expect(didNotBat.length).toBeGreaterThan(0);
    // The export pads their figures with zeroes; a nought there would be a duck.
    expect(didNotBat.every((one) => one.batting === undefined)).toBe(true);
  });

  it("credits a catch to the fielder who took it", () => {
    const { appearances } = importedFrom(UCL, ["HKU Students (UCL)"]);
    const playerFor = knowing(UCL, ["HKU Students (UCL)"]);

    // Ruthvik N is the fielder on two of Combined Unis' catches, and Ruthvik
    // Nellore bowled — the abbreviation and the full name are one player.
    const ruthvik = appearances.find(
      (one) => one.player === playerFor("Ruthvik Nellore"),
    );

    expect(ruthvik?.fielding?.catches).toBe(2);
    expect(ruthvik?.bowled).toBe(true);
  });

  it("credits nobody with the catch the scorer gave to the bowler", () => {
    // `Usman Ayub,ct,Jaya Ramesh C,Jaya Ramesh C`. The wicket is his; the catch
    // is not credited to anybody, because a bowler does not catch his own ball.
    const { appearances } = importedFrom(CHARLIE_BEARS, ["HKU CC"]);
    const playerFor = knowing(CHARLIE_BEARS, ["HKU CC"]);

    const jaya = appearances.find(
      (one) => one.player === playerFor("Jaya Ramesh Chaliki"),
    );

    expect(jaya?.bowling?.wickets).toBe(3);
    expect(jaya?.fielding?.catches ?? 0).toBe(0);
  });

  it("never makes an Appearance for the opposition", () => {
    const { appearances } = importedFrom(UCL, ["HKU Students (UCL)"]);

    // Eight of ours batted, six bowled, and the fielders are the same people.
    // Whatever the count, it is not the twenty-odd a whole match contains.
    expect(appearances.length).toBeLessThanOrEqual(10);
  });

  it("makes no Appearance at all for a spelling nobody has answered for", () => {
    const { appearances } = documentsFor({
      match: CHARLIE_BEARS,
      ours: isOurSide(["HKU CC"]),
      playerFor: () => undefined,
      venue: "home",
    });

    // A draft with a partial record is the point; a guessed Player is not.
    expect(appearances).toEqual([]);
  });
});

describe("the same match twice", () => {
  it("recognises a fixture already in the record", () => {
    expect(
      sameFixture(
        { date: "2026-03-21", opponent: "IRC Charlie Bears" },
        { date: "2026-03-21T00:00:00.000Z", opponent: "irc charlie bears" },
      ),
    ).toBe(true);
  });

  it("tells two fixtures apart by their date", () => {
    expect(
      sameFixture(
        { date: "2026-03-21", opponent: "IRC Charlie Bears" },
        { date: "2026-03-28", opponent: "IRC Charlie Bears" },
      ),
    ).toBe(false);
  });

  it("tells two fixtures apart by their opponent", () => {
    expect(
      sameFixture(
        { date: "2026-03-21", opponent: "IRC Charlie Bears" },
        { date: "2026-03-21", opponent: "SCC Lancers" },
      ),
    ).toBe(false);
  });

  it("matches nothing when there is no date to match on", () => {
    expect(sameFixture({ opponent: "SCC Lancers" }, { opponent: "SCC Lancers" })).toBe(
      false,
    );
  });
});
