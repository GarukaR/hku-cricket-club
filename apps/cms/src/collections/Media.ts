import type { CollectionConfig } from "payload";

import { signedIn } from "./access";

/**
 * Photographs and documents.
 *
 * The files themselves never touch the container — the S3 adapter in
 * `payload.config.ts` writes them to R2 and hands back a URL on the public
 * bucket, so the site serves them directly and reading a page never wakes the
 * CMS. `upload: true` here declares the collection; where the bytes go is the
 * plugin's business, and the plugin is not optional.
 */
export const Media = {
  slug: "media",
  admin: {
    description:
      "Photographs and documents used on the public site. Everything uploaded here is public the moment it is saved.",
  },
  access: {
    // The public site is static and links straight at R2, so this only governs
    // the API. It is `true` because nothing private belongs in this collection.
    read: () => true,
    create: signedIn,
    update: signedIn,
    delete: signedIn,
  },
  upload: true,
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "What the picture shows, for a reader who cannot see it. Describe the moment — “Sandy Bay, second innings, 2025/26” — not the file.",
      },
    },
  ],
} satisfies CollectionConfig;
