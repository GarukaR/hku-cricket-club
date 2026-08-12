import type { CollectionConfig } from "payload";

import { seasonProblem } from "@/lib/notation";

import { publiclyReadable } from "./access";
import { validated } from "./validate";

/**
 * A playing year — September to May, spanning two calendar years, written
 * `2025/26` (CONTEXT.md).
 *
 * A record rather than a string on each Match, because the season is the axis
 * every figure is sliced by: registrations belong to one, the two-per-season
 * call-up cap counts within one, and every averages table is a season's worth
 * of Appearances. A typo in a free-text year would quietly split a season in
 * two and no page would look broken.
 */
export const Seasons = {
  slug: "seasons",
  // Newest first: the season being edited is almost always the current one.
  defaultSort: "-name",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name"],
    description:
      "The club's playing years. Create the new one in September, before the first fixture is entered.",
    group: "The record",
  },
  access: publiclyReadable,
  fields: [
    {
      name: "name",
      label: "Season",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "Written as the club writes it — 2025/26. Not 2025-26, which is CricClubs' form, and not 2025/2026.",
      },
      validate: validated(seasonProblem),
    },
  ],
} satisfies CollectionConfig;
