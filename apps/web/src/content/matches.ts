// SAMPLE CONTENT — invented, and the only invented thing left on the homepage.
//
// Opponents, grounds and competitions are real Hong Kong university and club
// sides; the scores, dates and margins are made up. Real Matches arrive from the
// CMS via the CricClubs importer (docs/PLAN.md, build order step 3), at which
// point this file is deleted rather than edited — the components already read the
// types the importer will produce.
//
// The dates fall on Saturdays inside the 2025/26 season on purpose: a fixture
// list that lands on a Wednesday is the kind of detail that makes sample data
// read as broken rather than as placeholder.

import type { Match, ScoredMatch } from "@/lib/match";

const CHAMPIONSHIP = "Saturday Championship Div 2";

/** The most recent played Match — the one the scoreline leads with, and the top
 *  row of the record. Held as its own binding so the two can never drift. */
export const latestResult: ScoredMatch = {
  date: "2026-04-25",
  opponent: "PolyU",
  ground: "Yeung King Playground",
  venue: "Away",
  format: "40 overs",
  competition: CHAMPIONSHIP,
  result: {
    outcome: "won",
    margin: "33 runs",
    innings: [
      { side: "HKU", runs: 184, wickets: 6 },
      // No wickets: bowled out, as a scorecard writes it.
      { side: "PolyU", runs: 151 },
    ],
  },
};

/** Newest first — the order the archive table prints them in. */
export const recentRecord: Match[] = [
  latestResult,
  {
    date: "2026-04-18",
    opponent: "CityU",
    ground: "Sandy Bay",
    venue: "Home",
    format: "40 overs",
    competition: CHAMPIONSHIP,
    result: { outcome: "won", margin: "5 wickets" },
  },
  {
    date: "2026-04-11",
    opponent: "HKUST",
    ground: "Discovery Bay North",
    venue: "Away",
    format: "40 overs",
    competition: CHAMPIONSHIP,
    result: { outcome: "lost", margin: "21 runs" },
  },
  {
    date: "2026-04-04",
    opponent: "Kowloon CC",
    ground: "Sandy Bay",
    venue: "Home",
    format: "40 overs",
    competition: CHAMPIONSHIP,
    // Abandoned carries no margin, which is why margin is optional.
    result: { outcome: "abandoned" },
  },
];

/** The next Match — a Match with no Result yet, not a separate kind of thing. */
export const nextMatch: Match = {
  date: "2026-05-02",
  time: "13:30",
  opponent: "HKUST",
  ground: "Sandy Bay",
  venue: "Home",
  format: "40 overs",
  competition: CHAMPIONSHIP,
};

/** The Season these figures cover, as the club writes it. */
export const season = "2025/26";
