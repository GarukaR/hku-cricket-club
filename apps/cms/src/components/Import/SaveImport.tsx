"use client";

import { useState } from "react";

import { confidenceIn } from "@/lib/confidence";
import type { ParsedMatch } from "@/lib/cricclubs";
import type { Resolution } from "@/lib/names";

import type { Side } from "./ImportPreview";
import { RegisterPlayers } from "./RegisterPlayers";
import { saveImport, type SaveOutcome } from "@/lib/saving";
import { panel, quiet } from "./styles";

/**
 * The end of the import: publish, or hold and say why.
 *
 * The moment this whole record is built around. A committee that will not
 * administer a website does not need to administer one — a clean export goes
 * from CricClubs to the live site in two clicks, and an export with a question
 * in it stops and states the question rather than filing a guess.
 *
 * The button never changes what gets written, only whether it is live. A held
 * match is a real record of a real game that somebody has a question about, so
 * an editor opening the draft finds the scorecard already there.
 */
/** Suggestions only, offered as a datalist and never enforced — the club plays
 *  wherever it is allocated, and the list of grounds is not the club's to fix.
 *  Anything can be typed over them. */
const GROUNDS = ["Sandy Bay", "Mission Road", "Yeung King Playground"];

export function SaveImport({
  api,
  match,
  side,
  resolutions,
  adminRoute,
}: {
  api: string;
  match: ParsedMatch;
  side: Side | undefined;
  resolutions: Resolution[];
  adminRoute: string;
}) {
  // The export says nothing about where the match was played, so this is the
  // one chance to record it without a second trip to the panel. It does not
  // gate the save: the club plays wherever it is given, and a scorecard often
  // reaches the editor without anyone remembering the ground. Blank is honest.
  const [ground, setGround] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SaveOutcome>();
  const [failure, setFailure] = useState<string>();

  if (!side) return null;

  const verdict = confidenceIn(match, resolutions);

  async function save() {
    if (!side) return;

    setSaving(true);
    setFailure(undefined);
    try {
      setSaved(
        await saveImport({
          api,
          match,
          side,
          resolutions,
          ground,
          confident: verdict.confident,
          holds: verdict.holds,
        }),
      );
    } catch (thrown) {
      setFailure((thrown as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <h3 style={{ marginBottom: 4 }}>
        {verdict.confident
          ? "This is ready to publish"
          : `This will be held — ${verdict.holds.length} ${verdict.holds.length === 1 ? "thing" : "things"} to settle`}
      </h3>

      <p style={{ ...quiet, marginTop: 0 }}>
        {verdict.confident
          ? "Every name resolves, the arithmetic reconciles, and every dismissal code is one the importer knows. Nothing here needs checking against the paper scorecard first."
          : "It will be saved either way, as a draft, with the scorecard already entered. Drafts stay off the public site until somebody publishes them."}
      </p>

      {verdict.holds.length > 0 && (
        <div style={panel}>
          <strong>What this is waiting on.</strong>
          <ul>
            {verdict.holds.map((hold, i) => (
              <li key={`${hold.about}-${i}`} style={{ marginTop: 6 }}>
                {hold.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.notes.length > 0 && (
        <div style={panel}>
          <strong>Worth knowing, and not a reason to stop.</strong>
          <ul>
            {verdict.notes.map((note, i) => (
              <li key={i} style={{ marginTop: 6 }}>
                {note.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset
        style={{ ...panel, display: "block" }}
        disabled={saving || Boolean(saved)}
      >
        <legend style={{ padding: "0 6px" }}>Where was it played?</legend>
        {/* The permission to skip sits outside `quiet` rather than inside it
            as a <strong>: opacity composites the whole subtree, so a child of
            a 0.75 paragraph cannot be brighter than the paragraph. The one
            line an editor must not miss is the one that says they may stop. */}
        <p style={{ marginTop: 0, marginBottom: 4, fontSize: 12 }}>
          <strong>Leave it blank if you do not know.</strong>
        </p>
        <p style={{ ...quiet, marginTop: 0, fontSize: 12 }}>
          A CricClubs export does not say, and this is the one thing the file
          cannot tell us. The club has no home ground and plays wherever it is
          given, so the ground is the whole of the answer — and a blank can be
          filled in later, where a guess is already on a page the other club
          reads too.
        </p>
        <label>
          <input
            type="text"
            name="ground"
            value={ground}
            onChange={(event) => setGround(event.target.value)}
            placeholder="Sandy Bay"
            list="grounds"
            style={{ width: 280 }}
          />
        </label>
        <datalist id="grounds">
          {GROUNDS.map((one) => (
            <option key={one} value={one} />
          ))}
        </datalist>
      </fieldset>

      <p style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || Boolean(saved)}
        >
          {saving
            ? "Saving…"
            : verdict.confident
              ? "Publish this match"
              : "Save as a draft"}
        </button>
      </p>

      {saved && (
        <div style={panel}>
          <strong>
            {saved.updated ? "The match was already here, and is" : "Saved,"}{" "}
            {saved.published ? "on the live site." : "held as a draft."}
          </strong>{" "}
          {saved.appearances}{" "}
          {saved.appearances === 1 ? "appearance" : "appearances"} recorded.{" "}
          {saved.published
            ? "The site re-reads the record within seconds of a publish."
            : "It will not appear on the site until somebody publishes it."}{" "}
          <a href={`${adminRoute}/collections/matches/${saved.matchId}`}>
            Open the match
          </a>
          .
        </div>
      )}

      {/* Only once the match is written: a registration is a Player's binding
          to a Team for a Season, and until the Season exists there is nothing
          to bind them to. Offered after rather than before for the same reason
          the match is saved first — the record is what says who is already
          registered, and a proposal made from the file alone would offer people
          the record settled last week. */}
      {saved && side && (
        <RegisterPlayers
          api={api}
          matchId={saved.matchId}
          seasonId={saved.seasonId}
          side={side}
          season={match.season}
          published={saved.published}
        />
      )}

      {failure && (
        <div style={panel}>
          <strong>Not saved.</strong> {failure}
          <p style={{ ...quiet, marginBottom: 0, fontSize: 12 }}>
            Nothing is lost by pressing the button again — an import writes one
            Match and one Appearance per player however many times it is run.
          </p>
        </div>
      )}
    </section>
  );
}
