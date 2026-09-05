import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseExport } from "./cricclubs";
import {
  abbreviates,
  aliasClash,
  aliasProblem,
  canonicalName,
  isOurSide,
  ourNames,
  resolveNames,
  type KnownPlayer,
} from "./names";

// The same exports the parser is tested against, read off disk for the
// same reason: the alias problem is not a hypothetical shape, it is what these
// particular scorers actually typed. A transcription here could be quietly
// tidied until the tests passed.
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

/** The two entities the club's sides claim in these files. */
const HKU_CC = isOurSide(["HKU CC"]);
const HKU_STUDENTS = isOurSide(["HKU Students (UCL)"]);

const spellings = (names: { spelling: string }[]) =>
  names.map((name) => name.spelling);

describe("canonical form", () => {
  it("ignores what a scorer varies freely", () => {
    expect(canonicalName("G. Ranasinghe")).toBe(canonicalName("g ranasinghe"));
    expect(canonicalName("  Jaya   Ramesh  ")).toBe("jaya ramesh");
  });

  it("does not reorder, because reordering would be a guess", () => {
    expect(canonicalName("Ranasinghe G")).not.toBe(
      canonicalName("G Ranasinghe"),
    );
  });
});

describe("abbreviation", () => {
  it("recognises the shortened forms these files actually use", () => {
    expect(abbreviates("Jaya Ramesh C", "Jaya Ramesh Chaliki")).toBe(true);
    expect(abbreviates("Yash D C", "Yash D Chauhan")).toBe(true);
    expect(abbreviates("Gohar A", "Gohar Ali")).toBe(true);
    expect(abbreviates("Ruthvik N", "Ruthvik Nellore")).toBe(true);
  });

  it("will not run past the name it is meant to be shortening", () => {
    expect(abbreviates("Gohar Ali Khan", "Gohar Ali")).toBe(false);
    expect(abbreviates("Ali", "Gohar Ali")).toBe(false);
  });

  it("matches more than one player, which is why it only ever suggests", () => {
    expect(abbreviates("Muhammad", "Muhammad Umar")).toBe(true);
    expect(abbreviates("Muhammad", "Muhammad Abdullah Khan")).toBe(true);
  });
});

describe("whose names an export contains", () => {
  it("takes our batters, our bowlers, and the fielders we credited", () => {
    const ours = spellings(ourNames(UCL, HKU_STUDENTS));

    // Batting table — full names.
    expect(ours).toContain("Yash D Chauhan");
    expect(ours).toContain("Mishra Shuvam");
    // Bowling table, under the innings the opposition batted.
    expect(ours).toContain("Divyansh Tulsyan");
    // The abbreviations in the opposition's dismissal columns are ours too.
    expect(ours).toContain("Ruthvik N");
    expect(ours).toContain("Yash D C");
    expect(ours).toContain("Gohar A");
  });

  it("never takes the opposition's, however they were spelled", () => {
    const ours = spellings(ourNames(UCL, HKU_STUDENTS));

    expect(ours).not.toContain("Muhammad Abdullah Khan");
    expect(ours).not.toContain("Aqeel Mohammad");
    // The fielder who caught one of ours is one of theirs.
    expect(ours).not.toContain("Tushar B");
    expect(ours).not.toContain("Harsh S");
  });

  it("takes nothing at all from a match neither of our sides played", () => {
    expect(ourNames(UCL, isOurSide(["HKU CC"]))).toEqual([]);
    expect(ourNames(UCL, isOurSide([]))).toEqual([]);
  });

  it("lets a full name create a Player and an abbreviation not", () => {
    const ours = ourNames(UCL, HKU_STUDENTS);
    const may = (spelling: string) =>
      ours.find((name) => name.spelling === spelling)?.mayCreate;

    expect(may("Gohar Ali")).toBe(true);
    expect(may("Gohar A")).toBe(false);
  });

  it("keeps one entry for a spelling that appears in several columns", () => {
    const ours = ourNames(UCL, HKU_STUDENTS);
    const saraj = ours.filter((name) => name.spelling === "Saraj");

    // Batting table, bowling table, and the fielder on a catch.
    expect(saraj).toHaveLength(1);
    expect(saraj[0].sources).toContain("batting");
    expect(saraj[0].sources).toContain("bowling");
    expect(saraj[0].mayCreate).toBe(true);
  });

  it("keeps a man's two spellings apart, because they are two questions", () => {
    const ours = spellings(ourNames(CHARLIE_BEARS, HKU_CC));

    expect(ours).toContain("Jaya Ramesh Chaliki");
    expect(ours).toContain("Jaya Ramesh C");
  });

  it("never reads the fall of wickets, where the names collide", () => {
    // `Jaya Ram` is only ever in the fall-of-wickets table, which the parser
    // drops before this module ever sees it.
    expect(spellings(ourNames(LANCERS, HKU_CC))).not.toContain("Jaya Ram");
  });
});

describe("resolving against the record", () => {
  const JAYA: KnownPlayer = { id: 1, name: "Jaya Ramesh Chaliki" };
  const GOHAR: KnownPlayer = { id: 2, name: "Gohar Ali", aliases: ["Gohar A"] };

  it("resolves the club's own spelling without asking", () => {
    const [resolved] = resolveNames(
      [{ spelling: "Jaya Ramesh Chaliki", sources: ["batting"], mayCreate: true }],
      [JAYA],
    );

    expect(resolved.player).toBe(JAYA);
    expect(resolved.via).toBe("name");
  });

  it("resolves a spelling somebody has already answered for", () => {
    const [resolved] = resolveNames(
      [{ spelling: "Gohar A", sources: ["fielding"], mayCreate: false }],
      [GOHAR],
    );

    expect(resolved.player).toBe(GOHAR);
    expect(resolved.via).toBe("alias");
  });

  it("asks about an abbreviation nobody has answered for, and suggests", () => {
    const [resolved] = resolveNames(
      [{ spelling: "Jaya Ramesh C", sources: ["dismissal"], mayCreate: false }],
      [JAYA, GOHAR],
    );

    expect(resolved.player).toBeUndefined();
    expect(resolved.suggestions).toEqual([JAYA]);
  });

  it("offers both when an abbreviation could be either", () => {
    const umar: KnownPlayer = { id: 3, name: "Muhammad Umar" };
    const abdullah: KnownPlayer = { id: 4, name: "Muhammad Abdullah Khan" };

    const [resolved] = resolveNames(
      [{ spelling: "Muhammad", sources: ["fielding"], mayCreate: false }],
      [abdullah, umar],
    );

    expect(resolved.player).toBeUndefined();
    // Shortest first: least left over is the likeliest.
    expect(resolved.suggestions).toEqual([umar, abdullah]);
  });

  it("puts a whole export's worth of one man onto one Player", () => {
    // What the ticket is for: two spellings in one file, one answer already
    // taught, and both rows now point at the same person.
    const taught: KnownPlayer = {
      id: 1,
      name: "Jaya Ramesh Chaliki",
      aliases: ["Jaya Ramesh C"],
    };

    const resolved = resolveNames(ourNames(CHARLIE_BEARS, HKU_CC), [taught]);
    const his = resolved.filter((one) => one.player?.id === taught.id);

    expect(spellings(his.map((one) => one.name)).sort()).toEqual([
      "Jaya Ramesh C",
      "Jaya Ramesh Chaliki",
    ]);
  });

  it("asks about everybody when the record holds nobody", () => {
    const resolved = resolveNames(ourNames(UCL, HKU_STUDENTS), []);

    expect(resolved.every((one) => one.player === undefined)).toBe(true);
    expect(resolved.every((one) => one.suggestions.length === 0)).toBe(true);
  });
});

describe("one spelling, one Player", () => {
  const players: KnownPlayer[] = [
    { id: 1, name: "Gohar Ali", aliases: ["Gohar A"] },
    { id: 2, name: "Ruthvik Nellore" },
  ];

  it("refuses a spelling another Player already answers to", () => {
    expect(aliasClash("Gohar A", { id: 2 }, players)).toMatch(/Gohar Ali/);
  });

  it("refuses a spelling that is another Player's own name", () => {
    expect(aliasClash("Ruthvik Nellore", { id: 1 }, players)).toMatch(
      /own name/,
    );
  });

  it("allows a Player to keep the alias they already hold", () => {
    expect(aliasClash("Gohar A", { id: 1 }, players)).toBeUndefined();
  });

  it("allows a spelling nobody has claimed", () => {
    expect(aliasClash("Ruthvik N", { id: 2 }, players)).toBeUndefined();
  });

  it("catches a list that repeats itself", () => {
    expect(
      aliasProblem(
        ["Gohar A", "gohar a."],
        { id: 1, name: "Gohar Ali" },
        players,
      ),
    ).toMatch(/listed twice/);
  });

  it("says so when an alias is only the player's own name again", () => {
    expect(
      aliasProblem(["Gohar Ali"], { id: 1, name: "Gohar Ali" }, players),
    ).toMatch(/already this player's name/);
  });

  it("passes a Player with no aliases at all", () => {
    expect(
      aliasProblem(undefined, { id: 2, name: "Ruthvik Nellore" }, players),
    ).toBeUndefined();
  });
});
