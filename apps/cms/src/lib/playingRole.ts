// How a Player is normally selected to contribute (CONTEXT.md — Playing role).
//
// Distinct from a Team's role (lib/eligibility's TEAM_ROLES) — that says what a
// side is *for*; this says what a person does on one. The two share a word by
// accident, not by the club's own usage, so they are kept in separate modules
// and never imported under the same name.

export const PLAYING_ROLES = [
  { value: "batter", label: "Batter" },
  { value: "bowler", label: "Bowler" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
  { value: "all-rounder", label: "All-rounder" },
] as const;

export type PlayingRole = (typeof PLAYING_ROLES)[number]["value"];
