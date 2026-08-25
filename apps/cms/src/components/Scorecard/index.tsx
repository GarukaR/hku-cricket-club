import type { DocumentViewServerProps } from "payload";

import { ScorecardEditor } from "./ScorecardEditor";

/**
 * The scorecard entry screen, as a tab on the Match.
 *
 * Manual entry is not a legacy path. The sunday social side is scored nowhere —
 * its Team carries no CricClubs names at all — so for those matches this screen
 * is the only route into the record. Entering twenty-odd Appearances through
 * Payload's one-record-at-a-time form is the thing this exists to avoid: nobody
 * will do that twenty times a season, and a record too tedious to enter does not
 * get entered.
 *
 * This half runs on the server and does the fetching: the Match, the players
 * who could plausibly have played in it, and any Appearances already entered.
 * The grid itself has to be interactive, so it is a client component.
 */
export async function ScorecardView(props: DocumentViewServerProps) {
  const { doc, payload } = props;

  const matchId = doc?.id as number | undefined;
  if (!matchId) {
    return <div className="gutter--left gutter--right">No match to score yet — save the fixture first.</div>;
  }

  const teamId = typeof doc?.team === "object" ? doc?.team?.id : doc?.team;
  const seasonId = typeof doc?.season === "object" ? doc?.season?.id : doc?.season;

  // Who could have played: everyone registered to this side this season. A
  // starting point rather than a restriction — a guest or an unregistered
  // student turns out often enough that the grid must not refuse them.
  const registrations = await payload.find({
    collection: "registrations",
    depth: 1,
    pagination: false,
    where: { team: { equals: teamId }, season: { equals: seasonId } },
  });

  const registered = registrations.docs
    .map((r) => (typeof r.player === "object" ? r.player : undefined))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ id: p.id as number, name: p.name as string }));

  // Everyone else, so a guest can be picked without leaving the screen.
  const allPlayers = await payload.find({
    collection: "players",
    depth: 0,
    pagination: false,
    sort: "name",
  });

  // Oldest first, which is the order they were entered and therefore the
  // batting order. A scorecard read out of order is hard to check against the
  // paper one, and Payload's default is newest first.
  const existing = await payload.find({
    collection: "appearances",
    depth: 0,
    pagination: false,
    sort: "id",
    where: { match: { equals: matchId } },
  });

  return (
    <ScorecardEditor
      matchId={matchId}
      summary={(doc?.summary as string) ?? "This match"}
      registered={registered}
      players={allPlayers.docs.map((p) => ({ id: p.id as number, name: p.name as string }))}
      innings={((doc?.result as { innings?: unknown[] })?.innings ?? []) as Record<string, unknown>[]}
      hasOutcome={Boolean((doc?.result as { outcome?: string })?.outcome)}
      appearances={existing.docs as never[]}
    />
  );
}

export default ScorecardView;
