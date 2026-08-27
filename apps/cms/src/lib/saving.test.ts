import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { parseExport } from "./cricclubs";
import { isOurSide, ourNames, resolveNames, type KnownPlayer } from "./names";
import { saveImport } from "./saving";

const sample = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../docs/samples/${name}`, import.meta.url)),
    "utf8",
  );

const CHARLIE_BEARS = parseExport(
  sample("saturday-2026-03-21-v-irc-charlie-bears.csv"),
);
const UCL = parseExport(sample("ucl-2025-03-18-v-combined-unis.csv"));

const SIDE = { id: 7, cricclubsNames: ["HKU CC"] };
const STUDENTS = { id: 8, cricclubsNames: ["HKU Students (UCL)"] };

/**
 * A record that answers like Payload's REST API, and remembers what was
 * written to it.
 *
 * Standing in for the server rather than for the rules: everything about *what*
 * an import becomes is tested in importing.test.ts against the real files. What
 * is checked here is the sequencing — how many Matches exist afterwards, which
 * status they carry, and whether running the same import twice does it all
 * again. Those are the failures a person would only find in production.
 */
function fakeRecord({ matches = [] as Record<string, unknown>[] } = {}) {
  const wrote: { method: string; url: string; body?: Record<string, unknown> }[] =
    [];
  const appearances: Record<string, unknown>[] = [];
  let nextId = 100;

  const json = (body: unknown) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response);

  const fetcher = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : undefined;
    wrote.push({ method, url, body });

    if (method === "GET") {
      if (url.includes("/matches")) return json({ docs: matches });
      if (url.includes("/appearances")) return json({ docs: appearances });
      // No Season and no Competition on record until one is made.
      return json({ docs: [] });
    }

    const id = nextId++;
    if (url.includes("/appearances")) {
      const doc = { id, ...body };
      appearances.push(doc);
      return json({ doc });
    }
    if (url.includes("/matches") && method === "POST") {
      const doc = { id, ...body };
      matches.push(doc);
      return json({ doc });
    }
    // A PATCH answers with the document it just changed.
    const existing = url.match(/\/matches\/(\d+)/);
    if (existing) {
      return json({ doc: { id: Number(existing[1]), ...body } });
    }
    return json({ doc: { id, ...body } });
  });

  return { fetcher, wrote, appearances, matches };
}

/** Everyone in the file, under every spelling — a record after a full season. */
function knowingEverybody(
  match: Parameters<typeof ourNames>[0],
  claimed: string[],
): KnownPlayer[] {
  return ourNames(match, isOurSide(claimed)).map((name, i) => ({
    id: i + 1,
    name: name.spelling,
  }));
}

const resolutionsFor = (
  match: Parameters<typeof ourNames>[0],
  claimed: string[],
  players: KnownPlayer[],
) => resolveNames(ourNames(match, isOurSide(claimed)), players);

afterEach(() => vi.unstubAllGlobals());

const run = (options: Parameters<typeof saveImport>[0]) => saveImport(options);

describe("a confident import", () => {
  it("writes the match published, with no review step in between", async () => {
    const record = fakeRecord();
    vi.stubGlobal("fetch", record.fetcher);

    const outcome = await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: resolutionsFor(
        CHARLIE_BEARS,
        SIDE.cricclubsNames,
        knowingEverybody(CHARLIE_BEARS, SIDE.cricclubsNames),
      ),
      venue: "home",
      confident: true,
    });

    expect(outcome.published).toBe(true);
    expect(outcome.updated).toBe(false);

    const written = record.wrote.find(
      (one) => one.method === "POST" && one.url.includes("/matches"),
    );
    expect(written?.body?._status).toBe("published");
    expect(written?.body?.team).toBe(SIDE.id);
    expect(written?.body?.venue).toBe("home");
  });

  it("records an Appearance for every player it resolved", async () => {
    const record = fakeRecord();
    vi.stubGlobal("fetch", record.fetcher);

    const outcome = await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: resolutionsFor(
        CHARLIE_BEARS,
        SIDE.cricclubsNames,
        knowingEverybody(CHARLIE_BEARS, SIDE.cricclubsNames),
      ),
      venue: "home",
      confident: true,
    });

    expect(outcome.appearances).toBeGreaterThan(0);
    expect(record.appearances).toHaveLength(outcome.appearances);
    // Every one hangs off the Match that was just written.
    expect(
      record.appearances.every((one) => one.match === outcome.matchId),
    ).toBe(true);
  });

  it("makes the Season the record has never seen", async () => {
    const record = fakeRecord();
    vi.stubGlobal("fetch", record.fetcher);

    await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: [],
      venue: "away",
      confident: true,
    });

    const season = record.wrote.find(
      (one) => one.method === "POST" && one.url.includes("/seasons"),
    );
    // Worked out from the date, never read from the header.
    expect(season?.body?.name).toBe(CHARLIE_BEARS.season);
  });
});

describe("an import that is not confident", () => {
  it("holds the match as a draft rather than refusing to save it", async () => {
    const record = fakeRecord();
    vi.stubGlobal("fetch", record.fetcher);

    const outcome = await run({
      api: "/api",
      match: UCL,
      side: STUDENTS,
      resolutions: resolutionsFor(
        UCL,
        STUDENTS.cricclubsNames,
        knowingEverybody(UCL, STUDENTS.cricclubsNames),
      ),
      venue: "away",
      confident: false,
    });

    expect(outcome.published).toBe(false);

    const written = record.wrote.find(
      (one) => one.method === "POST" && one.url.includes("/matches"),
    );
    expect(written?.body?._status).toBe("draft");
    // The scorecard is written all the same — a held match is a real record of
    // a real game with a question about it, not a queue of unread files.
    expect(record.appearances.length).toBeGreaterThan(0);
  });
});

describe("the same file twice", () => {
  it("updates the match already in the record instead of making a second", async () => {
    const already = {
      id: 55,
      date: "2026-03-21T00:00:00.000Z",
      opponent: "IRC Charlie Bears Saturday",
    };
    const record = fakeRecord({ matches: [already] });
    vi.stubGlobal("fetch", record.fetcher);

    const outcome = await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: [],
      venue: "home",
      confident: true,
    });

    expect(outcome.updated).toBe(true);
    expect(outcome.matchId).toBe(55);
    expect(
      record.wrote.some(
        (one) => one.method === "POST" && one.url.endsWith("/matches"),
      ),
    ).toBe(false);
    expect(record.matches).toHaveLength(1);
  });

  it("brings an Appearance up to date rather than adding another", async () => {
    const already = {
      id: 55,
      date: "2026-03-21T00:00:00.000Z",
      opponent: "IRC Charlie Bears Saturday",
    };
    const record = fakeRecord({ matches: [already] });
    // One Appearance already on record for the first player in the file.
    record.appearances.push({ id: 900, match: 55, player: 1 });
    vi.stubGlobal("fetch", record.fetcher);

    await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: resolutionsFor(
        CHARLIE_BEARS,
        SIDE.cricclubsNames,
        knowingEverybody(CHARLIE_BEARS, SIDE.cricclubsNames),
      ),
      venue: "home",
      confident: true,
    });

    const patched = record.wrote.filter(
      (one) => one.method === "PATCH" && one.url.includes("/appearances/900"),
    );
    expect(patched).toHaveLength(1);
  });

  it("does not mistake a different fixture for the same one", async () => {
    const anotherDay = {
      id: 55,
      date: "2026-03-28T00:00:00.000Z",
      opponent: "IRC Charlie Bears Saturday",
    };
    const record = fakeRecord({ matches: [anotherDay] });
    vi.stubGlobal("fetch", record.fetcher);

    const outcome = await run({
      api: "/api",
      match: CHARLIE_BEARS,
      side: SIDE,
      resolutions: [],
      venue: "home",
      confident: true,
    });

    expect(outcome.updated).toBe(false);
    expect(record.matches).toHaveLength(2);
  });
});

describe("when the record refuses", () => {
  it("says what the record said, rather than a status code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              errors: [{ message: "You are not allowed to perform this action." }],
            }),
        } as Response),
      ),
    );

    await expect(
      run({
        api: "/api",
        match: CHARLIE_BEARS,
        side: SIDE,
        resolutions: [],
        venue: "home",
        confident: true,
      }),
    ).rejects.toThrow("You are not allowed to perform this action.");
  });
});
