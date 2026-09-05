import type { CollectionConfig } from "payload";

import { oversProblem } from "@/lib/notation";
import { announceOnChange, announceOnDelete } from "@/lib/publish";

import { publiclyReadable } from "./access";
import { validated } from "./validate";

/**
 * The record that a Player was selected in a Team's XI for a Match — the atomic
 * fact of the whole record (CONTEXT.md).
 *
 * **Not a batting or bowling performance.** A player who fields all day, is not
 * needed with the bat and does not bowl still played, and that Appearance is
 * what a matches-played figure counts. Batting detail is present only if they
 * batted, bowling detail only if they bowled, fielding counts always.
 *
 * The distinction the whole collection turns on:
 *
 * - **Did not bat** is an Appearance with `batted` unticked. The player was
 *   there; the innings ended before they were needed.
 * - **Did not play** is the absence of an Appearance entirely.
 *
 * Only the second means the player was not there, and conflating them is how a
 * career record quietly acquires matches nobody played.
 *
 * Every career and season figure — runs, wickets, averages, matches played — is
 * derived from these and never stored. Nothing in this collection is a total.
 */
export const Appearances = {
  slug: "appearances",
  labels: { singular: "Appearance", plural: "Appearances" },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["player", "match", "batted", "bowled"],
    description:
      "Who played, and what they did. One record per player per match — a player who neither batted nor bowled still gets one, because they still played.",
    group: "The record",
  },
  access: publiclyReadable,
  // Every career and season figure the site prints is derived from these on
  // read — see lib/publish.
  hooks: { afterChange: [announceOnChange], afterDelete: [announceOnDelete] },
  fields: [
    {
      name: "match",
      type: "relationship",
      relationTo: "matches",
      required: true,
      index: true,
    },
    {
      name: "player",
      type: "relationship",
      relationTo: "players",
      required: true,
      index: true,
    },

    // --- Batting -----------------------------------------------------------
    {
      name: "batted",
      type: "checkbox",
      admin: {
        description:
          "Leave this unticked for did not bat — the player was in the XI but the innings ended before they were needed. That is a different thing from not playing, which is having no appearance here at all.",
      },
    },
    {
      name: "batting",
      type: "group",
      label: "Batting",
      admin: { condition: (_data, sibling) => Boolean(sibling?.batted) },
      fields: [
        {
          type: "row",
          fields: [
            { name: "runs", type: "number", min: 0 },
            { name: "balls", type: "number", min: 0 },
            { name: "fours", type: "number", min: 0 },
            { name: "sixes", type: "number", min: 0 },
          ],
        },
        {
          name: "notOut",
          type: "checkbox",
          admin: {
            description:
              "Recorded rather than worked out from the score, because it is what excludes this innings from the divisor when a batting average is taken.",
          },
        },
        {
          name: "howOut",
          type: "text",
          admin: {
            condition: (_data, sibling) => !sibling?.notOut,
            description:
              "The scorer's code — b, lbw, ct, ctw (caught behind), st, ro (run out). Free text on purpose: the list is open, and an unrecognised code is a question for a human rather than a value to guess at.",
          },
        },
        {
          type: "row",
          admin: {
            condition: (_data, sibling) => !sibling?.notOut,
          },
          fields: [
            { name: "fielder", type: "text" },
            {
              name: "bowler",
              type: "text",
              admin: {
                description:
                  "On a run out this is merely who was bowling at the time. They did not take the wicket and may not appear in the bowling figures at all.",
              },
            },
          ],
        },
      ],
    },

    // --- Bowling -----------------------------------------------------------
    {
      name: "bowled",
      type: "checkbox",
      admin: { description: "Tick if this player bowled at all." },
    },
    {
      name: "bowling",
      type: "group",
      label: "Bowling",
      admin: { condition: (_data, sibling) => Boolean(sibling?.bowled) },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "overs",
              type: "text",
              admin: {
                description:
                  "As a scorer writes it — 7.0, or 3.2 for three overs and two balls.",
              },
              validate: validated(oversProblem),
            },
            { name: "maidens", type: "number", min: 0 },
            { name: "runs", type: "number", min: 0 },
            {
              name: "wickets",
              type: "number",
              min: 0,
              admin: {
                description:
                  "Only wickets credited to this bowler. A run out belongs to nobody, which is why the bowlers' wickets routinely add up to less than the wickets that fell.",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "wides", type: "number", min: 0 },
            { name: "noBalls", type: "number", min: 0 },
          ],
        },
      ],
    },

    // --- Fielding ----------------------------------------------------------
    {
      name: "fielding",
      type: "group",
      label: "Fielding",
      admin: {
        description:
          "Always recorded, because fielding is the one thing every player in the XI does.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "catches", type: "number", min: 0 },
            { name: "runOuts", type: "number", min: 0 },
            { name: "stumpings", type: "number", min: 0 },
          ],
        },
      ],
    },
  ],
} satisfies CollectionConfig;
