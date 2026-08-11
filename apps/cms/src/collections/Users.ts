import type { CollectionConfig } from "payload";

import { signedIn } from "./access";

/**
 * Who may edit the club's record.
 *
 * Payload lets the first user be created without authentication when the
 * collection is empty, and refuses once it is not — which is how a freshly
 * deployed container is claimed, and why claiming it promptly matters.
 */
export const Users = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email"],
    description:
      "Committee members with access to this admin panel. The committee turns over every year — remove the outgoing members when you add the incoming ones.",
  },
  // Nothing here is public. Media is the only collection the outside world reads.
  access: {
    read: signedIn,
    create: signedIn,
    update: signedIn,
    delete: signedIn,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description:
          "The name shown next to anything this account edits. A person, not a role — “Club Secretary” outlives the person holding it and makes the history unreadable.",
      },
    },
  ],
} satisfies CollectionConfig;
