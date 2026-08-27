"use client";

import { useMemo, useState } from "react";

import type { ParsedMatch } from "@/lib/cricclubs";
import {
  aliasClash,
  isOurSide,
  ourNames,
  resolveNames,
  type KnownPlayer,
  type NameSource,
  type Resolution,
  type ScorerName,
} from "@/lib/names";

import { cell, heading, panel, quiet, scorecard } from "./styles";

/**
 * The one part of this screen that writes to the record.
 *
 * Everything else here is a preview: the file is read in the browser and
 * nothing leaves it. Answering a name is different, and deliberately so — the
 * answer is the whole point. Each one becomes an Alias the moment it is given,
 * so the next export carrying that spelling resolves silently, and by mid-season
 * an import asks nothing at all.
 *
 * It writes through Payload's own REST API with the editor's session, rather
 * than a route of our own. There is one way into this record and it is the one
 * with the collection's validation on it — including the rule that no two
 * Players may claim one spelling, which is the rule this screen is most capable
 * of breaking.
 */

/** How a spelling reached us, in the words of the person checking it. */
const WHERE: Record<NameSource, string> = {
  batting: "batted",
  bowling: "bowled",
  fielding: "took a catch",
  dismissal: "bowled at a dismissal",
};

const sourceLine = (sources: NameSource[]): string =>
  sources.map((source) => WHERE[source]).join(", ");

type Props = {
  match: ParsedMatch;
  /** The CricClubs entities the side that played this match has claimed. */
  claimed: string[];
  /** Every Player the record holds, as the server read them. */
  players: KnownPlayer[];
  /** Payload's API route, `/api` unless the config says otherwise. */
  api: string;
};

export function ResolveNames({ match, claimed, players: known, api }: Props) {
  const [players, setPlayers] = useState<KnownPlayer[]>(known);
  const [busy, setBusy] = useState<string | undefined>();
  const [failure, setFailure] = useState<{ spelling: string; message: string }>();

  const names = useMemo(
    () => ourNames(match, isOurSide(claimed)),
    [match, claimed],
  );
  const resolved = useMemo(
    () => resolveNames(names, players),
    [names, players],
  );

  const answered = resolved.filter((one) => one.player);
  const outstanding = resolved.filter((one) => !one.player);

  /** Payload hands back `{ doc }` on both create and update, and `{ errors }`
   *  with a message worth showing when a collection refuses. */
  async function write(spelling: string, request: () => Promise<Response>) {
    setBusy(spelling);
    setFailure(undefined);
    try {
      const response = await request();
      const body = await response.json();

      if (!response.ok) {
        const [first] = body?.errors ?? [];
        throw new Error(first?.message ?? `The record refused this (${response.status}).`);
      }
      // Replace or add, so a second answer for the same Player sees the first.
      setPlayers((before) => [
        ...before.filter((player) => player.id !== body.doc.id),
        body.doc as KnownPlayer,
      ]);
    } catch (thrown) {
      setFailure({ spelling, message: (thrown as Error).message });
    } finally {
      setBusy(undefined);
    }
  }

  /** Teach an existing Player this spelling. */
  function teach(name: ScorerName, player: KnownPlayer) {
    const clash = aliasClash(name.spelling, player, players);
    if (clash) {
      setFailure({ spelling: name.spelling, message: clash });
      return;
    }

    const aliases = [
      ...(player.aliases ?? []).filter((alias): alias is string => Boolean(alias)),
      name.spelling,
    ];

    void write(name.spelling, () =>
      fetch(`${api}/players/${player.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliases }),
      }),
    );
  }

  /** A name the record has never seen, on somebody it has never met. The
   *  spelling becomes the Player's name rather than an alias of one: it is the
   *  club's only spelling of them so far, and an alias identical to the name
   *  would be a row that does nothing. */
  function create(name: ScorerName) {
    void write(name.spelling, () =>
      fetch(`${api}/players`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.spelling }),
      }),
    );
  }

  if (names.length === 0) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <h3 style={{ marginBottom: 4 }}>The club&apos;s players in this file</h3>
      <p style={{ ...quiet, marginTop: 0 }}>
        {answered.length} of {resolved.length} spellings already resolve.{" "}
        {outstanding.length === 0
          ? "Nothing here needs a decision."
          : "The rest are below. Each answer is saved as an alias, so the same spelling never asks twice."}
      </p>

      {outstanding.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={scorecard}>
            <thead>
              <tr>
                <th style={heading}>As the scorer typed it</th>
                <th style={heading}>Where</th>
                <th style={heading}>Who is this?</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.map((one) => (
                <Unresolved
                  key={one.name.spelling}
                  resolution={one}
                  players={players}
                  busy={busy === one.name.spelling}
                  failure={
                    failure?.spelling === one.name.spelling
                      ? failure.message
                      : undefined
                  }
                  onMatch={(player) => teach(one.name, player)}
                  onCreate={() => create(one.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {answered.length > 0 && (
        <details style={{ marginTop: 16, maxWidth: "72ch" }}>
          <summary style={{ cursor: "pointer" }}>
            {answered.length} resolved without asking
          </summary>
          <table style={{ ...scorecard, marginTop: 8 }}>
            <tbody>
              {answered.map((one) => (
                <tr key={one.name.spelling}>
                  <td style={cell}>{one.name.spelling}</td>
                  <td style={cell}>{one.player?.name}</td>
                  <td style={{ ...cell, opacity: 0.7 }}>
                    {one.via === "name"
                      ? "the club's own spelling"
                      : "a spelling somebody answered before"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <p style={{ ...quiet, fontSize: 12, marginTop: 16 }}>
        Only the club&apos;s own players are here. The opposition&apos;s card is
        shown in full above and none of it becomes a Player, which is what keeps
        this list to a squad rather than a league. An abbreviation out of a
        dismissal column — <em>Gohar A</em>, <em>Yash D C</em> — can be matched
        to somebody but can never create them: a new Player minted from one of
        those would be a second entry for a man already in the record, spelled
        worse. Answers are corrected on the Player itself, under Aliases.
      </p>
    </section>
  );
}

function Unresolved({
  resolution,
  players,
  busy,
  failure,
  onMatch,
  onCreate,
}: {
  resolution: Resolution;
  players: KnownPlayer[];
  busy: boolean;
  failure?: string;
  onMatch: (player: KnownPlayer) => void;
  onCreate: () => void;
}) {
  const { name, suggestions } = resolution;
  const [chosen, setChosen] = useState("");

  // Suggestions first and named as such, then everybody else alphabetically.
  // The order is a convenience and never an answer: `Muhammad` abbreviates two
  // different players in one of the club's own files, and a list that put one
  // of them first would be right about half the time.
  const rest = players
    .filter((player) => !suggestions.some((one) => one.id === player.id))
    .sort((one, other) => one.name.localeCompare(other.name));

  return (
    <tr>
      <td style={cell}>
        <strong>{name.spelling}</strong>
      </td>
      <td style={{ ...cell, opacity: 0.7 }}>{sourceLine(name.sources)}</td>
      <td style={cell}>
        <select
          value={chosen}
          disabled={busy}
          onChange={(e) => {
            const value = e.target.value;
            setChosen(value);
            if (value === "") return;
            if (value === "new") {
              onCreate();
              return;
            }
            const player = players.find((one) => String(one.id) === value);
            if (player) onMatch(player);
          }}
        >
          <option value="">{busy ? "Saving…" : "Choose…"}</option>
          {name.mayCreate && (
            <option value="new">New player — “{name.spelling}”</option>
          )}
          {suggestions.length > 0 && (
            <optgroup label="Could be">
              {suggestions.map((player) => (
                <option key={player.id} value={String(player.id)}>
                  {player.name}
                </option>
              ))}
            </optgroup>
          )}
          {rest.length > 0 && (
            <optgroup label="Everyone else">
              {rest.map((player) => (
                <option key={player.id} value={String(player.id)}>
                  {player.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {!name.mayCreate && players.length === 0 && (
          <p style={{ ...quiet, fontSize: 12, marginBottom: 0 }}>
            There is nobody in the record to match this to yet. Answer the full
            names above first — this abbreviation will resolve once its player
            exists.
          </p>
        )}

        {failure && (
          <div style={{ ...panel, marginTop: 8 }}>
            <strong>Not saved.</strong> {failure}
          </div>
        )}
      </td>
    </tr>
  );
}
