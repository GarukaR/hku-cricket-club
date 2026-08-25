import type { CollectionConfig } from "payload";

import { publiclyReadable } from "./access";

/**
 * A person who has been registered to at least one Team in at least one Season
 * (CONTEXT.md).
 *
 * Distinct from a prospective member who has only made an Enquiry: an enquiry
 * is somebody asking, a Player is somebody the club has played. Nothing here is
 * created by the join form.
 *
 * Deliberately thin. Everything a page says about a player — matches, runs,
 * wickets, averages — is derived from their Appearances and never stored
 * (CONTEXT.md, *Derived figures*), so this collection holds only what cannot be
 * worked out: who they are, and what scorers have called them.
 */
export const Players = {
  slug: "players",
  labels: { singular: "Player", plural: "Players" },
  defaultSort: "name",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "aliases"],
    description:
      "Everyone who has played for the club. Their figures are worked out from the matches they appear in, so there is nothing to keep up to date here.",
    group: "The record",
  },
  access: publiclyReadable,
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      index: true,
      admin: {
        description:
          "The club's own spelling of the name — the one that should appear in an averages table. Scorers' spellings go in Aliases below, not here.",
      },
    },
    {
      name: "aliases",
      label: "Aliases",
      type: "text",
      hasMany: true,
      admin: {
        description:
          "How scorers have spelled this person's name — G. Ranasinghe, Garuka R, Ranasinghe G are three aliases of one player. Scorers type names freely, and recording them here is what stops one person becoming three entries in the averages.",
      },
    },
  ],
} satisfies CollectionConfig;
