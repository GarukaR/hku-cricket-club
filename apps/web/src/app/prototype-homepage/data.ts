// PROTOTYPE — throwaway sample data. Opponents and grounds are real Hong Kong
// university/club sides; the scores, dates and the 1988 quotation are invented.

export const lastResult = {
  us: "HKU",
  usScore: "184",
  usWkts: "6",
  them: "PolyU",
  themScore: "151",
  themWkts: "all out",
  verdict: "Won by 33 runs",
  won: true,
  date: "Sat 25 July",
  ground: "Yeung King Playground",
  format: "40 overs",
  competition: "CHK Saturday League · Round 4",
};

export const nextFixture = {
  opponent: "HKUST",
  date: "Sat 8 August",
  time: "13:30",
  ground: "Sandy Bay",
  venue: "Home",
  format: "40 overs",
  countdown: [
    { n: "05", unit: "days" },
    { n: "11", unit: "hrs" },
    { n: "42", unit: "min" },
  ],
};

export const record = [
  { date: "25 Jul", opp: "PolyU", ground: "Yeung King", res: "Won · 33 runs", cls: "w" },
  { date: "18 Jul", opp: "CityU", ground: "Sandy Bay", res: "Won · 5 wkts", cls: "w" },
  { date: "11 Jul", opp: "HKUST", ground: "DB North", res: "Lost · 21 runs", cls: "l" },
  { date: "04 Jul", opp: "Kowloon CC", ground: "Sandy Bay", res: "Abandoned", cls: "d" },
];

export const navItems = [
  "The Club",
  "Fixtures",
  "Records",
  "Members",
  "Archive",
  "Admission",
];

export const standingFacts: [string, string][] = [
  ["Founded", "1913"],
  ["Ground", "Sandy Bay, Pok Fu Lam"],
  ["Competitions", "CHK Saturday League · University Cricket League"],
  ["Season", "September – May"],
  ["Training", "Wednesdays, 18:30"],
];

export const plates = [
  "First XI, Sandy Bay",
  "v PolyU, July",
  "Nets, Wednesday",
];
