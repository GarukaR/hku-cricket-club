"use client";

import { useEffect, useState } from "react";

import { PLAYING_ROLES, type PlayingRole } from "@/lib/playingRole";
import type { Appeared } from "@/lib/registering";
import { needsAttention } from "@/lib/registering";
import {
  proposalFor,
  registerPlayer,
  setPlayingRole,
  type ImportProposal,
  type OurSide,
} from "@/lib/saving";

import { panel, quiet } from "./styles";

const label = (role: string): string =>
  PLAYING_ROLES.find((one) => one.value === role)?.label ?? role;

/**
 * What the import can do about registrations, once the match is saved.
 *
 * The record still keeps Registrations as records: they are what make the
 * eligibility rule enforceable before somebody takes the field, and what keeps
 * a player who neither batted nor bowled in the list at all. This only removes
 * the typing — everybody here appeared in the match that was just saved, so
 * offering them is a good guess said out loud.
 *
 * **Nothing on this screen happens without a click.** The proposal is the work;
 * the consent is the point. Registrations the eligibility rule refuses are not
 * offered at all — they are stated as a question, because moving a player
 * between the league and challenge league sides is a real decision about a real
 * person, and not one an import screen should make on the strength of who
 * turned out on Saturday.
 */
export function RegisterPlayers({
  api,
  matchId,
  seasonId,
  side,
  season,
}: {
  api: string;
  matchId: number | string;
  seasonId: number | string;
  side: OurSide & { name: string };
  season: string;
}) {
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState<ImportProposal>();
  /** Could not read what to propose — the panel has nothing to show. */
  const [failure, setFailure] = useState<string>();
  /** Read fine, but a write was refused. The panel stays, because what it is
   *  showing is still true and the counts of what did land matter. */
  const [writeFailure, setWriteFailure] = useState<string>();

  // Ticked by default: every one of these played for this side in this match,
  // which is the best evidence a registration will ever have. Unticking is how
  // an editor says a guest or a ringer is not a squad member.
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  /** The role picked for each Player, by id. Starts at what the record already
   *  holds, or the suggestion where there is one and nobody has said otherwise —
   *  a role set by hand is never pre-filled with something else. */
  const [pick, setPick] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ registered: number; roles: number }>();

  useEffect(() => {
    let live = true;

    void (async () => {
      try {
        const result = await proposalFor({ api, matchId, seasonId, side });
        if (!live) return;

        setFound(result);
        setChosen(
          Object.fromEntries(
            result.proposal.register.map((one) => [String(one.playerId), true]),
          ),
        );
        // Pre-filled only where nobody has said otherwise. A role set by hand
        // is never queued for overwriting by a default.
        setPick(
          Object.fromEntries(
            result.roles.map((one) => [
              String(one.playerId),
              one.current ?? one.suggested?.role ?? "",
            ]),
          ),
        );
      } catch (thrown) {
        if (live) setFailure((thrown as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, [api, matchId, seasonId, side]);

  if (loading) {
    return (
      <p style={{ ...quiet, marginTop: 16 }}>Reading who is already registered…</p>
    );
  }

  if (failure) {
    return (
      <div style={panel}>
        <strong>Could not read the registrations.</strong> {failure}
        <p style={{ ...quiet, marginBottom: 0, fontSize: 12 }}>
          The match itself is saved. Registrations can be entered by hand in the
          Selection group.
        </p>
      </div>
    );
  }

  // Roles count as much as registrations here: by the third match everybody who
  // played is already registered, which is exactly when a suggestion first
  // exists — a panel that measured only registrations would fall silent at the
  // moment it had most to offer.
  if (!found || (!needsAttention(found.proposal) && found.roles.length === 0)) {
    return (
      <p style={{ ...quiet, marginTop: 16 }}>
        Everybody who played is already registered to the {side.name} for{" "}
        {season}, and every role is set. Nothing to do.
      </p>
    );
  }

  const { register, blocked } = found.proposal;

  // The Players themselves rather than the string keys they are ticked by: a
  // relationship field refuses a numeric id handed to it as a string, and the
  // record's refusal ("The following field is invalid: Player") says nothing
  // about which of the two it was.
  const chosenPlayers = register.filter(
    (one) => chosen[String(one.playerId)],
  );

  // Only where the pick actually differs from what the record holds. Pressing
  // the button must never rewrite a value with itself, or the count would
  // report work that did not happen.
  const roleWrites = found.roles.filter((one) => {
    const value = pick[String(one.playerId)] ?? "";
    return value !== "" && value !== (one.current ?? "");
  });

  async function apply() {
    setSaving(true);
    setWriteFailure(undefined);

    let registered = 0;
    let written = 0;

    try {
      // One at a time, and through the collection's own validation — the
      // eligibility rule included, so a proposal that has gone stale between
      // reading and clicking is refused by the record rather than written.
      for (const player of chosenPlayers) {
        await registerPlayer({
          api,
          playerId: player.playerId,
          teamId: side.id,
          seasonId,
        });
        registered += 1;
      }

      for (const one of roleWrites) {
        await setPlayingRole({
          api,
          playerId: one.playerId,
          role: pick[String(one.playerId)] as PlayingRole,
        });
        written += 1;
      }

      setDone({ registered, roles: written });
    } catch (thrown) {
      // Kept apart from the read failure above, and shown *with* the count of
      // what did get written: a partial run is the one case where "it failed"
      // on its own would be actively misleading.
      setWriteFailure((thrown as Error).message);
      setDone({ registered, roles: written });
    } finally {
      setSaving(false);
    }
  }

  const nameOf = (player: Appeared) => player.name;

  return (
    <section style={{ marginTop: 32 }}>
      <h3 style={{ marginBottom: 4 }}>Registering them for {season}</h3>
      <p style={{ ...quiet, marginTop: 0 }}>
        A registration is what the eligibility rule and the {side.name} page are
        both built on, so it stays a record somebody enters on purpose. Everybody
        below played in the match just saved — untick anybody who is not a squad
        member.
      </p>

      {register.length > 0 && (
        <fieldset
          style={{ ...panel, display: "block" }}
          disabled={saving || Boolean(done)}
        >
          <legend style={{ padding: "0 6px" }}>
            {register.length} to register
          </legend>

          {register.map((player) => {
            const id = String(player.playerId);

            return (
              <div key={id} style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(chosen[id])}
                    onChange={(event) =>
                      setChosen((was) => ({ ...was, [id]: event.target.checked }))
                    }
                  />{" "}
                  {nameOf(player)}
                </label>
              </div>
            );
          })}
        </fieldset>
      )}

      {blocked.length > 0 && (
        <div style={panel}>
          <strong>Not offered, because the eligibility rule refuses them.</strong>
          <p style={{ ...quiet, marginTop: 4, fontSize: 12 }}>
            They played, and the record says so — an Appearance is a fact about a
            match, not a claim about a registration. Moving somebody between the
            league and challenge league sides is a decision for a person, in the
            Selection group.
          </p>
          <ul style={{ marginBottom: 0 }}>
            {blocked.map(({ player, problem }) => (
              <li key={String(player.playerId)} style={{ marginTop: 6 }}>
                <strong>{nameOf(player)}</strong> — {problem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {found.roles.length > 0 && (
        <fieldset
          style={{ ...panel, display: "block" }}
          disabled={saving || Boolean(done)}
        >
          <legend style={{ padding: "0 6px" }}>Playing roles</legend>
          <p style={{ ...quiet, marginTop: 0, fontSize: 12 }}>
            Everybody who played, whether or not they are being registered here
            — this is the moment the record first meets most of them, and going
            back later means one Player page at a time. The box is filled in
            with whatever the record can read, so a first import finishes in one
            press; on one or two matches that is a first guess rather than a
            habit, and it says so. Nothing is stuck: a role the figures later
            disagree with comes back here beside the new reading. Correct
            anything that is wrong, and a role already set is left exactly as it
            is unless you change it.
          </p>

          {found.roles.map((one) => {
            const id = String(one.playerId);
            const value = pick[id] ?? "";
            const changed = value !== (one.current ?? "");

            return (
              <div key={id} style={{ marginTop: 10 }}>
                <label>
                  <span style={{ display: "inline-block", minWidth: "18ch" }}>
                    {one.name}
                  </span>{" "}
                  <select
                    value={value}
                    onChange={(event) =>
                      setPick((was) => ({ ...was, [id]: event.target.value }))
                    }
                  >
                    <option value="">— not said —</option>
                    {PLAYING_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ marginLeft: 24, fontSize: 12, opacity: 0.8 }}>
                  {one.suggested && (
                    <>
                      {one.suggested.provisional && <em>A first guess: </em>}
                      {one.suggested.summary}.{" "}
                      {one.suggested.provisional && (
                        <>
                          Too few matches to call it a habit yet, so it comes
                          back to be looked at again once the record can
                          disagree.{" "}
                        </>
                      )}
                    </>
                  )}
                  {one.couldBeKeeper && (
                    <>
                      Has not bowled this season, and nothing in {season}
                      &apos;s scorecards says who kept — a keeper only appears in
                      an export by taking a stumping or a catch standing up.{" "}
                    </>
                  )}
                  {/* Name the role the record reads, not only the figures it
                      read it from: "5.3 overs per match" is the reason, and a
                      row that gives the reason without the conclusion asks the
                      reader to re-derive the rule in their head. */}
                  {one.suggested && one.suggested.role !== one.current && (
                    <strong>
                      The record reads {label(one.suggested.role)}.{" "}
                    </strong>
                  )}
                  {one.current !== null && changed && (
                    <>
                      Currently {label(one.current)}; this replaces it.{" "}
                    </>
                  )}
                  {one.current !== null && !changed && (
                    <>Set to {label(one.current)}, and left alone. </>
                  )}
                </div>
              </div>
            );
          })}
        </fieldset>
      )}

      {!done && (
        <p style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={
              saving || (chosenPlayers.length === 0 && roleWrites.length === 0)
            }
          >
            {saving
              ? "Writing…"
              : chosenPlayers.length > 0
                ? `Register ${chosenPlayers.length} ${chosenPlayers.length === 1 ? "player" : "players"}`
                : "Apply"}
          </button>
        </p>
      )}

      {done && (
        <div style={panel}>
          <strong>
            {done.registered} {done.registered === 1 ? "player" : "players"}{" "}
            registered to the {side.name} for {season}.
          </strong>{" "}
          {done.roles > 0 &&
            `${done.roles} playing ${done.roles === 1 ? "role" : "roles"} set.`}{" "}
          {writeFailure
            ? `Then it stopped: ${writeFailure} Nothing is lost by trying again — a registration already written is not written twice.`
            : "The site re-reads the record within seconds."}
        </div>
      )}
    </section>
  );
}
