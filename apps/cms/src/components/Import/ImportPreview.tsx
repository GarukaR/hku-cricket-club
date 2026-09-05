"use client";

import { useMemo, useState } from "react";

import {
  ExportProblem,
  inningsToCheck,
  parseExport,
  type ParsedInnings,
  type ParsedMatch,
} from "@/lib/cricclubs";
import type { TeamRole } from "@/lib/eligibility";
import { sameEntity } from "@/lib/mapping";
import { competitionLabel } from "@/lib/notation";
import { ballsBowled, economyRate, oversSpoken } from "@/lib/overs";
import {
  isOurSide,
  ourNames,
  resolveNames,
  type KnownPlayer,
} from "@/lib/names";
import {
  extrasTotal,
  reconcileInnings,
  wicketsToNoBowler,
  type Finding,
} from "@/lib/reconciliation";

import { ResolveNames } from "./ResolveNames";
import { SaveImport } from "./SaveImport";
import {
  cell,
  DASH,
  figure,
  heading,
  headingRight,
  panel,
  quiet,
  scorecard,
} from "./styles";

/** One of the club's sides and the CricClubs entries it has claimed. Nothing in
 *  an export says which of our four sides it belongs to, so this is the only
 *  thing that knows (CONTEXT.md, lib/mapping). */
export type Side = {
  id: number | string;
  name: string;
  cricclubsNames: string[];
  role?: TeamRole;
};

/** Which of the club's sides played this match, if any of them has said so. */
export function ourSide(match: ParsedMatch, sides: Side[]): Side | undefined {
  return sides.find((side) =>
    (side.cricclubsNames ?? []).some((entity) =>
      match.teams.some((played) => sameEntity(entity, played)),
    ),
  );
}

const show = (n: number | null | undefined): string =>
  n == null ? DASH : String(n);

/** 21 March 2026. Fixed to UTC because the date came out of the file as a day
 *  rather than a moment, and a browser east of here would print the one before. */
function printed(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** `133 all out`, `138 for 5`. A side ten down is written without the ten, which
 *  is how a scorer writes it and how the record stores it (collections/Matches). */
function score(innings: ParsedInnings): string {
  if (innings.total == null) return "No total stated";
  if (innings.wickets == null) return String(innings.total);
  return innings.wickets >= 10
    ? `${innings.total} all out`
    : `${innings.total} for ${innings.wickets}`;
}

function Findings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p style={quiet}>
        The batters, the extras, the wickets and the bowlers all agree with the
        stated total.
      </p>
    );
  }

  return (
    <div style={panel}>
      <strong>Worth checking against the scorecard.</strong>
      <ul>
        {findings.map((found) => (
          <li key={found.about} style={{ marginTop: 6 }}>
            {found.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Innings({ innings, order }: { innings: ParsedInnings; order: number }) {
  const findings = reconcileInnings(inningsToCheck(innings));
  const noBowler = wicketsToNoBowler(inningsToCheck(innings));
  // Said out loud only when the notation could be misread — "20.0 overs — 20
  // overs" teaches nobody anything and makes the line that matters, the one with
  // a part-over in it, look like more of the same.
  const balls = ballsBowled(innings.overs);
  const spoken = balls != null && balls % 6 !== 0 ? oversSpoken(innings.overs) : undefined;

  return (
    <section style={{ marginTop: 40 }}>
      <h3 style={{ marginBottom: 4 }}>
        {innings.battingTeam} — {score(innings)}
      </h3>
      <p style={{ ...quiet, marginTop: 0 }}>
        {order === 1 ? "Batted first" : `Innings ${order}`}
        {innings.overs && (
          <>
            {" · "}
            {innings.overs} overs
            {spoken && ` — ${spoken}`}
          </>
        )}
        {innings.bowlingTeam && ` · bowled by ${innings.bowlingTeam}`}
      </p>

      <p style={quiet}>
        Extras {extrasTotal(innings.extras)} — byes {show(innings.extras.byes)},
        leg byes {show(innings.extras.legByes)}, wides {show(innings.extras.wides)},
        no balls {show(innings.extras.noBalls)}, penalty{" "}
        {show(innings.extras.penalty)}. They belong to no batter, which is why
        the total is read off the scorecard rather than added up.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={scorecard}>
          <thead>
            <tr>
              <th style={heading}>Batter</th>
              <th style={heading}>How out</th>
              <th style={heading}>Fielder</th>
              <th style={heading}>Bowler</th>
              <th style={headingRight}>R</th>
              <th style={headingRight}>B</th>
              <th style={headingRight}>4s</th>
              <th style={headingRight}>6s</th>
            </tr>
          </thead>
          <tbody>
            {innings.batting.map((batter, i) => (
              <tr key={`${batter.name}-${i}`} style={{ opacity: batter.didNotBat ? 0.6 : 1 }}>
                <td style={cell}>{batter.name}</td>
                <td style={cell}>
                  {batter.howOut ?? (batter.didNotBat ? "did not bat" : "not out")}
                </td>
                <td style={cell}>{batter.fielder ?? ""}</td>
                <td style={cell}>{batter.bowler ?? ""}</td>
                {/* A player who did not bat has no figures. The export writes
                    them as zeroes, which is the file padding its columns rather
                    than the scorer recording a duck. */}
                <td style={figure}>{batter.didNotBat ? DASH : show(batter.runs)}</td>
                <td style={figure}>{batter.didNotBat ? DASH : show(batter.balls)}</td>
                <td style={figure}>{batter.didNotBat ? DASH : show(batter.fours)}</td>
                <td style={figure}>{batter.didNotBat ? DASH : show(batter.sixes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ ...quiet, fontSize: 12 }}>
        A scorecard lists only the players the scorer entered, so this is who
        played at most rather than the whole XI. Neither <em>not out</em> nor{" "}
        <em>did not bat</em> is stated in the export: a blank dismissal with no
        runs and no balls against it is read as did not bat. Those two are worth
        a glance.
      </p>

      {innings.bowling.length > 0 && (
        <>
          <h4 style={{ marginBottom: 4 }}>
            {innings.bowlingTeam ?? "The other side"} bowling
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={scorecard}>
              <thead>
                <tr>
                  <th style={heading}>Bowler</th>
                  <th style={headingRight}>O</th>
                  <th style={headingRight}>M</th>
                  <th style={headingRight}>R</th>
                  <th style={headingRight}>W</th>
                  <th style={headingRight}>Econ</th>
                  <th style={headingRight}>wd</th>
                  <th style={headingRight}>nb</th>
                </tr>
              </thead>
              <tbody>
                {innings.bowling.map((bowler, i) => {
                  const economy = economyRate(bowler.runs, bowler.overs);
                  return (
                    <tr key={`${bowler.name}-${i}`}>
                      <td style={cell}>{bowler.name}</td>
                      {/* Balls, not decimals. The gloss is on the figure itself
                          so that nobody has to have been told. */}
                      <td style={figure} title={oversSpoken(bowler.overs)}>
                        {bowler.overs ?? DASH}
                      </td>
                      <td style={figure}>{show(bowler.maidens)}</td>
                      <td style={figure}>{show(bowler.runs)}</td>
                      <td style={figure}>{show(bowler.wickets)}</td>
                      <td style={figure}>{economy == null ? DASH : economy.toFixed(2)}</td>
                      <td style={figure}>{show(bowler.wides)}</td>
                      <td style={figure}>{show(bowler.noBalls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ ...quiet, fontSize: 12 }}>
            Overs are balls: 28.3 is twenty-eight overs and three balls, and the
            economy rates are worked out from the balls rather than from the
            figure as written.
          </p>
        </>
      )}

      {noBowler != null && noBowler > 0 && (
        <p style={quiet}>
          {noBowler === 1
            ? "1 wicket here is credited to no bowler"
            : `${noBowler} wickets here are credited to no bowler`}{" "}
          — run outs, normally. That is an ordinary scorecard rather than a
          discrepancy.
        </p>
      )}

      <Findings findings={findings} />
    </section>
  );
}

/** Which of the club's sides played this, if any of them has said so.
 *
 *  A match neither of whose sides is recorded against a Team is not an error in
 *  the file — it is a mapping nobody has entered yet, and the difference matters
 *  because one is fixed on the Team and the other is not fixable at all. */
function Ours({ match, sides }: { match: ParsedMatch; sides: Side[] }) {
  const side = ourSide(match, sides);

  if (side) {
    const played = match.teams.find((team) =>
      side.cricclubsNames.some((entity) => sameEntity(entity, team)),
    );
    const other = match.teams.find((team) => team !== played);
    return (
      <p style={quiet}>
        <strong>{played}</strong> is the club&apos;s{" "}
        <strong>{side.name}</strong> side. {other} is the opposition, and their
        players are shown in full here without becoming Players in the record.
      </p>
    );
  }

  return (
    <div style={panel}>
      <strong>Neither side is recorded against one of the club&apos;s teams.</strong>{" "}
      Nothing in an export says which of our four sides an entry belongs to, so
      the mapping is only what somebody has written down. Add “{match.teams[0]}”
      or “{match.teams[1]}” to the right Team&apos;s CricClubs entity names, and
      this match will know where it belongs.
    </div>
  );
}

export function ImportPreview({
  sides,
  players: known,
  api,
  adminRoute,
}: {
  sides: Side[];
  players: KnownPlayer[];
  api: string;
  adminRoute: string;
}) {
  const [match, setMatch] = useState<ParsedMatch | undefined>();
  // Held here rather than inside the name resolver, because the step after it
  // needs the same answer: whether every name resolved is one of the three
  // things the confidence gate turns on.
  const [players, setPlayers] = useState<KnownPlayer[]>(known);
  const [problem, setProblem] = useState<string | undefined>();
  const [file, setFile] = useState<string | undefined>();

  /** Read in the browser, on purpose. The file never leaves this screen: there
   *  is nothing to preview *before saving* about a file that has already been
   *  uploaded somewhere, and an editor who changes their mind should be able to
   *  close the tab and have left nothing behind. */
  async function read(chosen: File | undefined) {
    setMatch(undefined);
    setProblem(undefined);
    setFile(chosen?.name);
    if (!chosen) return;

    try {
      setMatch(parseExport(await chosen.text()));
    } catch (thrown) {
      setProblem(
        thrown instanceof ExportProblem
          ? thrown.message
          : `Could not read ${chosen.name}. ${(thrown as Error).message}`,
      );
    }
  }

  const competition = match
    ? competitionLabel(match.competition, match.division)
    : "";

  const side = match ? ourSide(match, sides) : undefined;
  const resolutions = useMemo(
    () =>
      match && side
        ? resolveNames(
            ourNames(match, isOurSide(side.cricclubsNames)),
            players,
          )
        : [],
    [match, side, players],
  );

  return (
    <div className="gutter--left gutter--right" style={{ paddingBottom: 64 }}>
      <h1>Import a scorecard</h1>
      <p style={quiet}>
        Open the match on CricClubs, press its own export button, and choose the
        file here. The club never scrapes those pages — the export is the
        sanctioned way in, and the only one that keeps working.
      </p>
      <p style={quiet}>
        The file is never uploaded. It is read here, in this browser, so that
        the match can be checked against the paper scorecard before any of it
        reaches the record. The one thing that <em>is</em> saved is an answer:
        naming the player behind a scorer&apos;s spelling writes an alias
        straight away, so the next export carrying it resolves without asking.
      </p>

      <p style={{ marginTop: 24 }}>
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </p>

      {problem && (
        <div style={panel}>
          <strong>{file ? `${file} could not be read.` : "This file could not be read."}</strong>
          <p style={{ marginBottom: 0 }}>{problem}</p>
        </div>
      )}

      {match && (
        <>
          <h2 style={{ marginTop: 32, marginBottom: 4 }}>
            {match.teams[0]} v {match.teams[1]}
          </h2>
          <p style={{ ...quiet, marginTop: 0 }}>
            {[
              competition || "No competition named",
              match.season,
              printed(match.date),
            ].join(" · ")}
            {file && ` · from ${file}`}
          </p>

          <p style={quiet}>
            {match.winner && match.margin
              ? `${match.winner} won by ${match.margin.value} ${match.margin.unit}.`
              : `The header says: “${match.resultLine}”. This is not a result in a
                 form the importer recognises, so it is shown as written.`}{" "}
            The season is worked out from the date rather than read from the
            header, because one of these files carries no season at all.
          </p>

          <Ours match={match} sides={sides} />

          {match.innings.map((innings, i) => (
            <Innings key={i} innings={innings} order={i + 1} />
          ))}

          <ResolveNames
            resolutions={resolutions}
            players={players}
            api={api}
            onPlayer={(written) =>
              setPlayers((before) => [
                ...before.filter((player) => player.id !== written.id),
                written,
              ])
            }
          />

          <SaveImport
            api={api}
            match={match}
            side={side}
            resolutions={resolutions}
            adminRoute={adminRoute}
          />
        </>
      )}
    </div>
  );
}
