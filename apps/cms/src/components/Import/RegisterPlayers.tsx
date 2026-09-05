"use client";

import { useEffect, useState } from "react";

import { PLAYING_ROLES } from "@/lib/playingRole";
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
  const [roles, setRoles] = useState<Record<string, boolean>>({});
  const [keeper, setKeeper] = useState<string>("");

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
        // A suggestion is ticked only where nobody has said otherwise. A role
        // somebody set by hand is never queued for overwriting by a default.
        setRoles(
          Object.fromEntries(
            Object.entries(result.suggestions).map(([id, suggested]) => [
              id,
              suggested.current === null,
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

  if (!found || !needsAttention(found.proposal)) {
    return (
      <p style={{ ...quiet, marginTop: 16 }}>
        Everybody who played is already registered to the {side.name} for{" "}
        {season}. Nothing to do.
      </p>
    );
  }

  const { register, blocked, keeperCandidates } = found.proposal;

  // The Players themselves rather than the string keys they are ticked by: a
  // relationship field refuses a numeric id handed to it as a string, and the
  // record's refusal ("The following field is invalid: Player") says nothing
  // about which of the two it was.
  const chosenPlayers = register.filter(
    (one) => chosen[String(one.playerId)],
  );

  const roleChoices = Object.entries(roles)
    .filter(([id, ticked]) => ticked && found.suggestions[id])
    .map(([id]) => found.suggestions[id]);

  const keeperPick = keeperCandidates.find(
    (one) => String(one.playerId) === keeper,
  );

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

      for (const suggested of roleChoices) {
        await setPlayingRole({
          api,
          playerId: suggested.playerId,
          role: suggested.role,
        });
        written += 1;
      }

      if (keeperPick) {
        await setPlayingRole({
          api,
          playerId: keeperPick.playerId,
          role: "wicketkeeper",
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
            const suggested = found.suggestions[id];

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

                {suggested && (
                  <div style={{ marginLeft: 24, fontSize: 12, opacity: 0.8 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(roles[id])}
                        onChange={(event) =>
                          setRoles((was) => ({ ...was, [id]: event.target.checked }))
                        }
                      />{" "}
                      Set role to <strong>{label(suggested.role)}</strong> —{" "}
                      {suggested.summary}
                      {suggested.current !== null &&
                        suggested.current !== suggested.role && (
                          <>
                            {" "}
                            Currently {label(suggested.current)}; ticking this
                            replaces it.
                          </>
                        )}
                    </label>
                  </div>
                )}
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

      {keeperCandidates.length > 0 && (
        <fieldset
          style={{ ...panel, display: "block" }}
          disabled={saving || Boolean(done)}
        >
          <legend style={{ padding: "0 6px" }}>Who kept wicket?</legend>
          <p style={{ ...quiet, marginTop: 0, fontSize: 12 }}>
            Nothing in {season}&apos;s scorecards says. A keeper only shows up in
            an export by taking a stumping or a catch standing up, and a run of
            matches with neither says nothing about who was behind the stumps.
            These are the players who have not bowled this season, which is the
            one thing the record can narrow it down with — leave it blank if you
            would rather not say.
          </p>

          {keeperCandidates.map((player) => (
            <label key={String(player.playerId)} style={{ marginRight: 16 }}>
              <input
                type="radio"
                name="keeper"
                value={String(player.playerId)}
                checked={keeper === String(player.playerId)}
                onChange={() => setKeeper(String(player.playerId))}
              />{" "}
              {nameOf(player)}
            </label>
          ))}

          {keeper !== "" && (
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
              <button type="button" onClick={() => setKeeper("")}>
                Clear
              </button>
            </p>
          )}
        </fieldset>
      )}

      {!done && (
        <p style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={
              saving ||
              (chosenPlayers.length === 0 &&
                roleChoices.length === 0 &&
                !keeperPick)
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
