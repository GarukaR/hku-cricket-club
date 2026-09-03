// PROTOTYPE — throwaway. Sample data for comparing mobile record-table
// layouts (issue #68 follow-up). Deliberately varied opponent-name and
// ground-name lengths, so a variant that only looks fine with short strings
// gets caught here rather than on the real record.

import type { Match } from "@/lib/match";

export const sampleMatches: Match[] = [
  {
    id: 1,
    date: "2026-09-12",
    team: "1st XI",
    opponent: "Kowloon Cricket Club",
    ground: "Sandy Bay",
    venue: "Home",
    result: { outcome: "won", margin: "42 runs" },
  },
  {
    id: 2,
    date: "2026-09-05",
    team: "1st XI",
    opponent: "Craigengower Cricket Club",
    ground: "Craigengower",
    venue: "Away",
    result: { outcome: "lost", margin: "6 wickets" },
  },
  {
    id: 3,
    date: "2026-08-29",
    team: "Students",
    opponent: "HKUST",
    ground: "Sandy Bay",
    venue: "Home",
    result: { outcome: "drawn" },
  },
  {
    id: 4,
    date: "2026-08-22",
    team: "1st XI",
    opponent: "Hong Kong Cricket Club",
    ground: "Wong Nai Chung Gap",
    venue: "Away",
    result: { outcome: "won", margin: "6 wickets" },
  },
  {
    id: 5,
    date: "2026-08-15",
    team: "Students",
    opponent: "Kowloon Cricket Club",
    ground: "Sandy Bay",
    venue: "Home",
    result: { outcome: "lost", margin: "33 runs" },
  },
  {
    id: 6,
    date: "2026-08-08",
    team: "1st XI",
    opponent: "United Services Recreation Club",
    ground: "King's Park",
    venue: "Away",
    result: { outcome: "tied" },
  },
  {
    id: 7,
    date: "2026-08-01",
    team: "1st XI",
    opponent: "Hong Kong Football Club",
    ground: "Sandy Bay",
    venue: "Home",
    result: { outcome: "won", margin: "84 runs" },
  },
  {
    id: 8,
    date: "2026-07-25",
    team: "Students",
    opponent: "Chinese Recreation Club",
    ground: "Sports Road",
    venue: "Away",
    result: { outcome: "abandoned" },
  },
];
