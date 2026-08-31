"use client";

import { useState } from "react";

import { confidenceIn } from "@/lib/confidence";
import type { ParsedMatch } from "@/lib/cricclubs";
import type { Resolution } from "@/lib/names";

import type { Side } from "./ImportPreview";
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
  // Not defaulted. The export says nothing about where the match was played,
  // and a default would be a guess wearing a form control's clothes — wrong
  // half the time, on a page the opposition also read.
  const [venue, setVenue] = useState<"home" | "away" | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SaveOutcome>();
  const [failure, setFailure] = useState<string>();

  if (!side) return null;

  const verdict = confidenceIn(match, resolutions);

  async function save() {
    if (!side || venue === "") return;

    setSaving(true);
    setFailure(undefined);
    try {
      setSaved(
        await saveImport({
          api,
          match,
          side,
          resolutions,
          venue,
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
        <p style={{ ...quiet, marginTop: 0, fontSize: 12 }}>
          A CricClubs export does not say, and this is the one thing the file
          cannot tell us. It is not guessed, because a wrong venue is visibly
          wrong on a page the other club reads too.
        </p>
        {(["home", "away"] as const).map((where) => (
          <label key={where} style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="venue"
              value={where}
              checked={venue === where}
              onChange={() => setVenue(where)}
            />{" "}
            {where === "home" ? "Home — Sandy Bay" : "Away"}
          </label>
        ))}
      </fieldset>

      <p style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || venue === "" || Boolean(saved)}
        >
          {saving
            ? "Saving…"
            : verdict.confident
              ? "Publish this match"
              : "Save as a draft"}
        </button>
        {venue === "" && !saved && (
          <span style={{ ...quiet, marginLeft: 12 }}>
            Home or away first.
          </span>
        )}
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
