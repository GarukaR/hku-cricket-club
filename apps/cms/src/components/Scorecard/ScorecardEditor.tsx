"use client";

import { useMemo, useState } from "react";

import { reconcileInnings, wicketsToNoBowler } from "@/lib/reconciliation";

type Player = { id: number; name: string };

/** One row of the grid — one player, and therefore one Appearance.
 *
 *  One row per player rather than one per innings, because an Appearance spans
 *  both: a player bats in ours and bowls in theirs. A per-innings screen would
 *  be editing half a record from two different places. */
type Row = {
  appearanceId?: number;
  playerId?: number;
  batted: boolean;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  notOut: boolean;
  howOut: string;
  fielder: string;
  bowler: string;
  bowled: boolean;
  overs: string;
  maidens: string;
  bowlRuns: string;
  wickets: string;
  catches: string;
  runOuts: string;
  stumpings: string;
};

/** One team innings as the scorecard states it. Stated rather than added up:
 *  extras belong to no batter, and one real export's batting figures are a run
 *  short of a total that is nonetheless correct. */
type Totals = {
  total: string;
  wickets: string;
  byes: string;
  legByes: string;
  other: string;
};

const NO_TOTALS: Totals = {
  total: "",
  wickets: "",
  byes: "",
  legByes: "",
  other: "",
};

const BLANK: Row = {
  batted: false,
  runs: "",
  balls: "",
  fours: "",
  sixes: "",
  notOut: false,
  howOut: "",
  fielder: "",
  bowler: "",
  bowled: false,
  overs: "",
  maidens: "",
  bowlRuns: "",
  wickets: "",
  catches: "",
  runOuts: "",
  stumpings: "",
};

/** Empty means "not recorded", not zero. A blank balls-faced column is a scorer
 *  who did not count them, and storing 0 would assert something the scorecard
 *  does not say. */
const num = (s: string): number | undefined => {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string => (v == null ? "" : String(v));

/** Whatever is already stored for one side, so re-opening the screen shows what
 *  was entered rather than five empty boxes. `other` is the remainder: extras
 *  less byes and leg byes, which is what the panel asks for. */
function totalsFor(
  innings: Record<string, unknown>[],
  side: "hku" | "opponent",
): Totals {
  const found = innings.find((i) => i.side === side);
  if (!found) return { ...NO_TOTALS };

  const extras = Number(found.extras ?? 0);
  const byes = Number(found.byes ?? 0);
  const legByes = Number(found.legByes ?? 0);
  const rest = extras - byes - legByes;

  return {
    total: str(found.runs),
    wickets: str(found.wickets),
    byes: str(found.byes),
    legByes: str(found.legByes),
    other: found.extras == null ? "" : String(rest < 0 ? 0 : rest),
  };
}

const FIELD: React.CSSProperties = {
  width: "100%",
  minWidth: 92,
  padding: "4px 6px",
};

/** One innings' stated figures. Two of these on the screen, because a match has
 *  two innings and our batters and our bowlers appear in different ones. */
function TotalsPanel({
  title,
  note,
  totals,
  onChange,
}: {
  title: string;
  note: string;
  totals: Totals;
  onChange: (t: Totals) => void;
}) {
  const field = (label: string, key: keyof Totals) => (
    <label key={key} style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
        {label}
      </span>
      <input
        style={FIELD}
        value={totals[key]}
        inputMode="numeric"
        onChange={(e) => onChange({ ...totals, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <>
      <h3>{title}</h3>
      <p style={{ maxWidth: "62ch", opacity: 0.8 }}>{note}</p>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}
      >
        {field("Total", "total")}
        {field("Wickets", "wickets")}
        {field("Byes", "byes")}
        {field("Leg byes", "legByes")}
        {field("Other extras", "other")}
      </div>
    </>
  );
}

/** Findings, stated plainly and never in the way of the save button. */
function Warnings({ findings }: { findings: { about: string; message: string }[] }) {
  if (findings.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        border: "1px solid currentColor",
        borderRadius: 4,
        maxWidth: "72ch",
      }}
    >
      <strong>Worth checking. None of this stops you saving.</strong>
      <ul>
        {findings.map((f) => (
          <li key={f.about} style={{ marginTop: 6 }}>
            {f.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScorecardEditor({
  matchId,
  summary,
  registered,
  players,
  innings,
  appearances,
  hasOutcome,
}: {
  matchId: number;
  summary: string;
  registered: Player[];
  players: Player[];
  innings: Record<string, unknown>[];
  appearances: Record<string, unknown>[];
  hasOutcome: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => {
    if (appearances.length > 0) {
      return appearances.map((a) => {
        const bat = (a.batting ?? {}) as Record<string, unknown>;
        const bowl = (a.bowling ?? {}) as Record<string, unknown>;
        const field = (a.fielding ?? {}) as Record<string, unknown>;
        return {
          ...BLANK,
          appearanceId: a.id as number,
          playerId: (typeof a.player === "object"
            ? (a.player as Player).id
            : a.player) as number,
          batted: Boolean(a.batted),
          runs: str(bat.runs),
          balls: str(bat.balls),
          fours: str(bat.fours),
          sixes: str(bat.sixes),
          notOut: Boolean(bat.notOut),
          howOut: str(bat.howOut),
          fielder: str(bat.fielder),
          bowler: str(bat.bowler),
          bowled: Boolean(a.bowled),
          overs: str(bowl.overs),
          maidens: str(bowl.maidens),
          bowlRuns: str(bowl.runs),
          wickets: str(bowl.wickets),
          catches: str(field.catches),
          runOuts: str(field.runOuts),
          stumpings: str(field.stumpings),
        };
      });
    }
    // A fresh scorecard opens with the registered side already listed: that is
    // who probably played, and correcting one name is quicker than choosing
    // eleven from a dropdown.
    return registered.slice(0, 11).map((p) => ({ ...BLANK, playerId: p.id }));
  });

  // Two innings, not one. Our batters reconcile against the innings *we* batted;
  // our bowlers reconcile against the innings *they* batted, because that is the
  // innings their figures are from. Holding one set of totals for both compares
  // our bowlers' wickets against our own wickets lost, which is nonsense that
  // looks plausible.
  const [ours, setOurs] = useState<Totals>(() => totalsFor(innings, "hku"));
  const [theirs, setTheirs] = useState<Totals>(() => totalsFor(innings, "opponent"));

  // The innings array is stored in the order they were batted, and nothing on a
  // scorecard export states which side that was — it is only implied by which
  // block comes first. So it is asked rather than guessed.
  const [weBattedFirst, setWeBattedFirst] = useState(
    () => (innings[0] as { side?: string } | undefined)?.side === "hku",
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  // Recomputed as you type, so a mismatch shows while the scorecard is still in
  // front of you. Neither gates the save — see lib/reconciliation.
  const ourFindings = useMemo(
    () =>
      reconcileInnings({
        batterRuns: rows.filter((r) => r.batted).map((r) => num(r.runs)),
        extras: {
          byes: num(ours.byes),
          legByes: num(ours.legByes),
          wides: num(ours.other),
        },
        statedTotal: num(ours.total),
        statedWickets: num(ours.wickets),
        dismissals: rows.filter(
          (r) => r.batted && !r.notOut && r.howOut.trim() !== "",
        ).length,
      }),
    [rows, ours],
  );

  // Our bowlers, against the innings they bowled in. No batting figures here —
  // the opposition's individual scores are not the club's record to keep, and
  // the site links to the Scorecard rather than reproducing it (CONTEXT.md).
  const theirFindings = useMemo(
    () =>
      reconcileInnings({
        batterRuns: [],
        extras: {
          byes: num(theirs.byes),
          legByes: num(theirs.legByes),
          wides: num(theirs.other),
        },
        statedTotal: num(theirs.total),
        statedWickets: num(theirs.wickets),
        bowlerRuns: rows.filter((r) => r.bowled).map((r) => num(r.bowlRuns)),
        bowlerWickets: rows.filter((r) => r.bowled).map((r) => num(r.wickets)),
      }).filter((f) => f.about !== "total"),
    [rows, theirs],
  );

  // Against *their* wickets, because our bowlers took them.
  const noBowler = wicketsToNoBowler({
    statedWickets: num(theirs.wickets),
    bowlerWickets: rows.filter((r) => r.bowled).map((r) => num(r.wickets)),
  });

  async function save() {
    setSaving(true);
    setError(undefined);
    setSaved(undefined);

    try {
      const written: Row[] = [];

      for (const r of rows) {
        if (!r.playerId) continue;

        const body = {
          match: matchId,
          player: r.playerId,
          batted: r.batted,
          batting: r.batted
            ? {
                runs: num(r.runs),
                balls: num(r.balls),
                fours: num(r.fours),
                sixes: num(r.sixes),
                notOut: r.notOut,
                howOut: r.notOut ? undefined : r.howOut || undefined,
                fielder: r.notOut ? undefined : r.fielder || undefined,
                bowler: r.notOut ? undefined : r.bowler || undefined,
              }
            : undefined,
          bowled: r.bowled,
          bowling: r.bowled
            ? {
                overs: r.overs || undefined,
                maidens: num(r.maidens),
                runs: num(r.bowlRuns),
                wickets: num(r.wickets),
              }
            : undefined,
          fielding: {
            catches: num(r.catches),
            runOuts: num(r.runOuts),
            stumpings: num(r.stumpings),
          },
        };

        const res = await fetch(
          r.appearanceId
            ? "/api/appearances/" + r.appearanceId
            : "/api/appearances",
          {
            method: r.appearanceId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          },
        );

        if (!res.ok) {
          const j = (await res.json()) as {
            errors?: { message: string }[];
          };
          throw new Error(
            j?.errors?.[0]?.message ?? "Could not save one of the appearances.",
          );
        }

        const j = (await res.json()) as { doc?: { id: number } };
        written.push({ ...r, appearanceId: j.doc?.id ?? r.appearanceId });
      }

      // The team totals live on the Match, not on any Appearance — extras
      // belong to no batter, so there is no player row that could hold them.
      const asInnings = (t: Totals, side: "hku" | "opponent") => {
        if (t.total.trim() === "") return undefined;
        const byes = num(t.byes) ?? 0;
        const legByes = num(t.legByes) ?? 0;
        const other = num(t.other) ?? 0;
        return {
          side,
          runs: num(t.total),
          wickets: num(t.wickets),
          byes: num(t.byes),
          legByes: num(t.legByes),
          extras: byes + legByes + other,
        };
      };

      const both = weBattedFirst
        ? [asInnings(ours, "hku"), asInnings(theirs, "opponent")]
        : [asInnings(theirs, "opponent"), asInnings(ours, "hku")];
      const stated = both.filter(Boolean);

      // Innings belong to a match that was played, and a match is played when it
      // has an outcome — `resultProblem` says so, and it is right. So the totals
      // wait for the outcome rather than the rule being bent to let them in.
      // The appearances above are already saved either way: who played is known
      // before anybody works out the margin.
      if (stated.length > 0 && hasOutcome) {
        // Merged, not replaced. `result` is one group, so sending it with only
        // innings in it wipes the outcome and margin — and then the rule that
        // keeps those two agreeing rejects the save, naming a field this screen
        // never showed. Read what is there, change the one part this screen owns.
        const current = (await fetch("/api/matches/" + matchId + "?depth=0", {
          credentials: "include",
        }).then((r) => r.json())) as { result?: Record<string, unknown> };

        const res = await fetch("/api/matches/" + matchId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            result: { ...(current.result ?? {}), innings: stated },
          }),
        });
        if (!res.ok) {
          const j = (await res.json()) as { errors?: { message: string }[] };
          throw new Error(
            j?.errors?.[0]?.message ?? "Saved the players, but not the totals.",
          );
        }
      }

      // Keep the ids, so saving twice updates rather than duplicating.
      setRows((rs) => {
        let n = 0;
        return rs.map((r) => (r.playerId ? written[n++] ?? r : r));
      });
      setSaved(
        written.length === 1
          ? "1 appearance saved."
          : written.length + " appearances saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const cell: React.CSSProperties = { padding: "2px 4px", textAlign: "left" };
  const input: React.CSSProperties = {
    width: "100%",
    minWidth: 46,
    padding: "4px 6px",
  };
  const wide: React.CSSProperties = { ...input, minWidth: 120 };

  return (
    <div className="gutter--left gutter--right" style={{ paddingBottom: 48 }}>
      <h2>Scorecard — {summary}</h2>
      <p style={{ maxWidth: "62ch", opacity: 0.8 }}>
        One row per player, because one row is one appearance. A player who
        neither batted nor bowled still gets a row: leaving both boxes unticked
        is <em>did not bat</em>, which is a different thing from not playing at
        all.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              <th style={cell}>Player</th>
              <th style={cell}>Bat</th>
              <th style={cell}>How out</th>
              <th style={cell}>Fielder</th>
              <th style={cell}>Bowler</th>
              <th style={cell}>R</th>
              <th style={cell}>B</th>
              <th style={cell}>4s</th>
              <th style={cell}>6s</th>
              <th style={cell}>NO</th>
              <th style={cell}>Bowl</th>
              <th style={cell}>O</th>
              <th style={cell}>M</th>
              <th style={cell}>R</th>
              <th style={cell}>W</th>
              <th style={cell}>Ct</th>
              <th style={cell}>RO</th>
              <th style={cell}>St</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={cell}>
                  <select
                    style={wide}
                    value={r.playerId ?? ""}
                    onChange={(e) =>
                      set(i, { playerId: Number(e.target.value) || undefined })
                    }
                  >
                    <option value="">—</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={cell}>
                  <input
                    type="checkbox"
                    checked={r.batted}
                    onChange={(e) => set(i, { batted: e.target.checked })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    disabled={!r.batted || r.notOut}
                    value={r.howOut}
                    placeholder="ct"
                    onChange={(e) => set(i, { howOut: e.target.value })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    disabled={!r.batted || r.notOut}
                    value={r.fielder}
                    onChange={(e) => set(i, { fielder: e.target.value })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    disabled={!r.batted || r.notOut}
                    value={r.bowler}
                    onChange={(e) => set(i, { bowler: e.target.value })}
                  />
                </td>
                {(["runs", "balls", "fours", "sixes"] as const).map((k) => (
                  <td key={k} style={cell}>
                    <input
                      style={input}
                      disabled={!r.batted}
                      value={r[k]}
                      inputMode="numeric"
                      onChange={(e) =>
                        set(i, { [k]: e.target.value } as Partial<Row>)
                      }
                    />
                  </td>
                ))}
                <td style={cell}>
                  <input
                    type="checkbox"
                    disabled={!r.batted}
                    checked={r.notOut}
                    onChange={(e) => set(i, { notOut: e.target.checked })}
                  />
                </td>
                <td style={cell}>
                  <input
                    type="checkbox"
                    checked={r.bowled}
                    onChange={(e) => set(i, { bowled: e.target.checked })}
                  />
                </td>
                {(["overs", "maidens", "bowlRuns", "wickets"] as const).map(
                  (k) => (
                    <td key={k} style={cell}>
                      <input
                        style={input}
                        disabled={!r.bowled}
                        value={r[k]}
                        onChange={(e) =>
                          set(i, { [k]: e.target.value } as Partial<Row>)
                        }
                      />
                    </td>
                  ),
                )}
                {(["catches", "runOuts", "stumpings"] as const).map((k) => (
                  <td key={k} style={cell}>
                    <input
                      style={input}
                      value={r[k]}
                      inputMode="numeric"
                      onChange={(e) =>
                        set(i, { [k]: e.target.value } as Partial<Row>)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { ...BLANK }])}
        >
          Add a player
        </button>
      </p>

      {!hasOutcome && (
        <div
          style={{
            marginTop: 24,
            padding: 12,
            border: "1px solid currentColor",
            borderRadius: 4,
            maxWidth: "72ch",
          }}
        >
          <strong>This match has no outcome yet.</strong> A match with no
          outcome has not been played, so it cannot carry innings — set the
          result on the <em>Edit</em> tab and the totals below will save. The
          players and their figures save regardless: who played is known well
          before anybody works out the margin.
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <label>
          <input
            type="checkbox"
            checked={weBattedFirst}
            onChange={(e) => setWeBattedFirst(e.target.checked)}
          />{" "}
          We batted first
        </label>{" "}
        <span style={{ opacity: 0.7 }}>
          — the innings are stored in the order they were batted, and nothing in
          a scorecard export states which side that was.
        </span>
      </p>

      <TotalsPanel
        title="Our innings, as the scorecard states it"
        note="Stated rather than added up. Extras belong to no batter, and one real export in docs/samples has batting figures a run short of a total that is nonetheless correct."
        totals={ours}
        onChange={setOurs}
      />
      <Warnings findings={ourFindings} />

      <TotalsPanel
        title="Their innings — the one our bowlers bowled in"
        note="Our bowlers' figures come from this innings, so this is what they reconcile against. Their batters are not recorded: the club's record is its own players, and the site links to the scorecard rather than reproducing it."
        totals={theirs}
        onChange={setTheirs}
      />
      <Warnings findings={theirFindings} />

      {noBowler != null && noBowler > 0 && (
        <p style={{ opacity: 0.8, maxWidth: "62ch" }}>
          {noBowler === 1
            ? "1 of their wickets is credited to no bowler"
            : noBowler + " of their wickets are credited to no bowler"}{" "}
          — run outs, normally. That is an ordinary scorecard rather than a
          discrepancy.
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save the scorecard"}
        </button>
        {saved && <span style={{ marginLeft: 12 }}>{saved}</span>}
        {error && <span style={{ marginLeft: 12 }}>Could not save: {error}</span>}
      </p>
    </div>
  );
}
