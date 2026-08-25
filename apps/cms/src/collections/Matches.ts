import type { Match } from "@hkucc/domain";
import type {
  CollectionConfig,
  FieldHook,
  SelectFieldSingleValidation,
  TextFieldSingleValidation,
} from "payload";

import { matchSummary, oversProblem, startTimeProblem } from "@/lib/notation";
import { announceOnChange, announceOnDelete } from "@/lib/publish";
import { OUTCOMES, resultProblem } from "@/lib/result";
import { standingOf } from "@/lib/standing";

import { publiclyReadable } from "./access";
import { validated } from "./validate";

/** A web address, and one a browser can follow. `URL.canParse` alone accepts
 *  `mailto:` and anything else with a colon in it, which is not what the field
 *  asks for and not something the site could link to. */
const validScorecard: TextFieldSingleValidation = (value) => {
  const written = value?.trim();
  if (!written) return true;

  const url = URL.parse(written);
  return (
    (url?.protocol === "https:" || url?.protocol === "http:") ||
    "Paste the whole address of the scorecard, starting with https://."
  );
};

/**
 * The outcome and the margin have to agree, and only the two of them together
 * can be checked. The complaint is raised on the outcome because that is the
 * field an editor changes first and the one the margin follows from.
 *
 * `siblingData` is the Result group, and Payload types it loosely; naming the
 * generated type here is what makes a later change to these fields a type error
 * rather than a rule that silently stops applying.
 */
const consistentResult: SelectFieldSingleValidation = (_value, { siblingData }) =>
  resultProblem(siblingData as Match["result"]) ?? true;

/** The date and the opponent, which is how an editor recognises a Match.
 *
 *  Built from the record as it will be after the write: an update that changes
 *  only the result carries neither date nor opponent, and rebuilding from that
 *  alone would leave the match nameless in every list. */
const deriveSummary: FieldHook = ({ data, originalDoc }) => {
  const before = (originalDoc ?? {}) as { date?: string; opponent?: string };
  const after = (data ?? {}) as { date?: string; opponent?: string };

  return matchSummary(
    after.date ?? before.date,
    after.opponent ?? before.opponent,
  );
};

/** Where the match stands, worked out on every read.
 *
 *  Never stored. A Match becomes an outstanding result because a day passes,
 *  not because anybody saves it — so there is no write on which a stored column
 *  could be set, and one maintained by a write hook would be right only for the
 *  matches somebody happened to edit after their date. That is exactly the set
 *  that does not need flagging. See lib/standing. */
const deriveStanding: FieldHook = ({ data }) => {
  const doc = (data ?? {}) as {
    date?: string;
    result?: { outcome?: string | null };
  };

  return standingOf({ date: doc.date, outcome: doc.result?.outcome });
};

/**
 * One fixture of one Team, played or still to come (CONTEXT.md).
 *
 * A scheduled fixture and a completed game are **the same record at two points
 * in its life**, never two records: a Match that has not been played simply has
 * no outcome yet. Everything but the four facts that make a fixture a fixture is
 * therefore optional — a CMS that refuses to save half-known history stops being
 * used (docs/PLAN.md), and most of this club's history is half known.
 *
 * Appearances hang off a Match and arrive with the importer. A Match with a
 * result and no Appearances is not an unfinished record: the sunday social
 * side's games are scored nowhere at all.
 */
export const Matches = {
  slug: "matches",
  labels: { singular: "Match", plural: "Matches" },
  // Newest first — the match somebody is here to edit is the one just played.
  defaultSort: "-date",
  admin: {
    components: {
      views: {
        edit: {
          // A tab on the Match rather than a screen of its own, because a
          // scorecard is not a thing in its own right — it is this match, told
          // in more detail. See components/Scorecard.
          scorecard: {
            Component: "@/components/Scorecard#ScorecardView",
            path: "/scorecard",
            tab: { label: "Scorecard", href: "/scorecard" },
          },
        },
      },
    },
    useAsTitle: "summary",
    defaultColumns: ["summary", "standing", "team", "competition", "venue", "season"],
    description:
      "Every fixture the club plays, before and after it is played. Enter it when the fixture is known; add the result afterwards, on the same record.",
    group: "The record",
  },
  access: publiclyReadable,
  // Saving a Match is what makes it appear on the live site — see lib/publish.
  hooks: { afterChange: [announceOnChange], afterDelete: [announceOnDelete] },
  fields: [
    {
      name: "team",
      type: "relationship",
      relationTo: "teams",
      required: true,
      index: true,
      admin: {
        description:
          "Which of the club's sides played it. Not the competition — the challenge league side and the Challenge League Div 3 are different things.",
      },
    },
    {
      name: "season",
      type: "relationship",
      relationTo: "seasons",
      required: true,
      index: true,
    },
    {
      name: "competition",
      type: "relationship",
      relationTo: "competitions",
      index: true,
      admin: {
        description:
          "Leave empty for a friendly. A friendly genuinely has no competition, and the emptiness is the record saying so.",
      },
    },
    {
      name: "date",
      type: "date",
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" },
      },
    },
    {
      name: "startTime",
      type: "text",
      admin: {
        description:
          "24-hour, as in 14:00. Only needed until the match is played, after which the result is what the page prints.",
        placeholder: "14:00",
      },
      validate: validated(startTimeProblem),
    },
    {
      name: "opponent",
      type: "text",
      required: true,
      admin: {
        description: "The other club, as the club itself spells it.",
      },
    },
    {
      name: "venue",
      type: "select",
      required: true,
      options: [
        { value: "home", label: "Home" },
        { value: "away", label: "Away" },
      ],
      admin: {
        description:
          "Home is Sandy Bay. The record prints H or A beside every result.",
      },
    },
    {
      name: "ground",
      type: "text",
      admin: {
        description:
          "Where it was played — Sandy Bay, Mission Road, Yeung King Playground.",
      },
    },
    {
      name: "format",
      type: "text",
      admin: {
        description:
          "How long a game it was — 40 overs, T20. Two sides can meet twice in a season over different distances, and the record should say which was which.",
        placeholder: "40 overs",
      },
    },
    {
      name: "scorecard",
      type: "text",
      admin: {
        description:
          "The CricClubs page for this match. The site links to it rather than reproducing the ball-by-ball detail.",
      },
      validate: validScorecard,
    },
    {
      name: "result",
      type: "group",
      label: "Result",
      admin: {
        description:
          "Fill this in once the match has been played. Until then, leaving the outcome empty is what marks it as a fixture.",
      },
      fields: [
        {
          name: "outcome",
          type: "select",
          options: [...OUTCOMES],
          admin: {
            description:
              "Recorded, never worked out from the scores: a rain-adjusted target, a concession and a tie all look like something else from the totals alone.",
          },
          validate: consistentResult,
        },
        {
          name: "margin",
          type: "group",
          label: "Margin",
          admin: {
            // Only a win and a loss have one, so the question is not asked
            // elsewhere — but a margin already recorded stays visible whatever
            // the outcome now says. A win edited to a tie keeps its 33 runs,
            // and hiding them would leave the editor a validation error about
            // a field they can no longer see, let alone clear.
            condition: (_data, siblingData) =>
              siblingData?.outcome === "won" ||
              siblingData?.outcome === "lost" ||
              siblingData?.margin?.value != null ||
              siblingData?.margin?.unit != null,
            description:
              "As a scorer states it — 33 runs, or 5 wickets. Leave it empty if nobody recorded it; a win with no margin is still a win.",
          },
          fields: [
            {
              type: "row",
              fields: [
                { name: "value", type: "number", label: "By", min: 1 },
                {
                  name: "unit",
                  type: "select",
                  label: " ",
                  options: [
                    { value: "runs", label: "runs" },
                    { value: "wickets", label: "wickets" },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "innings",
          type: "array",
          labels: { singular: "Innings", plural: "Innings" },
          // Two in a limited-overs match, four in a two-innings one.
          maxRows: 4,
          admin: {
            description:
              "One row per team innings, in the order they were batted. Stored rather than added up from the batters: extras belong to no batter, and one real export's batting figures are a run short of a total that is correct.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "side",
                  type: "select",
                  required: true,
                  options: [
                    { value: "hku", label: "HKU" },
                    { value: "opponent", label: "Opponent" },
                  ],
                },
                { name: "runs", type: "number", required: true, min: 0 },
                {
                  name: "wickets",
                  type: "number",
                  min: 0,
                  // Nine, not ten, on purpose: a side ten down is all out, and
                  // a scorecard writes 151 all out as 151, never 151/10. One
                  // fact, one way of writing it — the site reads an empty
                  // wickets column as exactly that.
                  max: 9,
                  admin: {
                    description:
                      "Leave empty if the side was bowled out — 151 all out is written 151, never 151/10.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "overs",
                  type: "text",
                  admin: {
                    description:
                      "Balls, not decimals: 28.3 is 28 overs and 3 balls.",
                    placeholder: "28.3",
                  },
                  validate: validated(oversProblem),
                },
                {
                  name: "extras",
                  type: "number",
                  min: 0,
                  admin: {
                    description:
                      "Byes, leg byes, wides, no balls and penalties — the runs that belong to no batter.",
                  },
                },
              ],
            },
            // Only the two a bowler is *not* charged with are broken out here.
            // Wides, no balls and penalties are inside `extras` and nothing
            // needs them apart, so asking for them separately would be three
            // more fields for no answer.
            {
              type: "row",
              fields: [
                {
                  name: "byes",
                  type: "number",
                  min: 0,
                  admin: {
                    description:
                      "Part of the extras above, repeated on its own. A bowler is not charged with a bye, so the bowlers' figures only add up to the total once byes and leg byes are taken off — the one check that cannot be made from the extras total alone.",
                  },
                },
                { name: "legByes", label: "Leg byes", type: "number", min: 0 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "summary",
      type: "text",
      index: true,
      admin: {
        // The panel's own title for the record. Shown rather than hidden so an
        // editor can see they are on the right match.
        readOnly: true,
        position: "sidebar",
        description: "How this match is listed. Made from the date and opponent.",
      },
      hooks: { beforeChange: [deriveSummary] },
    },
    {
      name: "standing",
      type: "text",
      label: "Standing",
      // Computed on read and held in no column, so this adds no migration and
      // cannot go stale: the answer depends on today's date as much as on the
      // record.
      virtual: true,
      admin: {
        readOnly: true,
        position: "sidebar",
        description:
          "Whether this match still owes a result. A fixture owes nothing yet; once its date has passed and the outcome is still empty, the club has a score to enter.",
      },
      hooks: { afterRead: [deriveStanding] },
    },
  ],
} satisfies CollectionConfig;
