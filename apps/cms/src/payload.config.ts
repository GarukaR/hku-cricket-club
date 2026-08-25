import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Appearances } from "./collections/Appearances";
import { Competitions } from "./collections/Competitions";
import { Matches } from "./collections/Matches";
import { Media } from "./collections/Media";
import { Players } from "./collections/Players";
import { Registrations } from "./collections/Registrations";
import { Seasons } from "./collections/Seasons";
import { Teams } from "./collections/Teams";
import { Users } from "./collections/Users";
import { readEnvUnchecked } from "./lib/env";
import { migrations } from "./migrations";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Unchecked on purpose — see the note on `readEnvUnchecked`. The image is built
// without secrets and `next build` imports this file; the environment is checked
// at start-up, in instrumentation.ts, where the real values are.
const env = readEnvUnchecked(process.env);

export default buildConfig({
  serverURL: env.serverUrl,

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname, "..") },
    meta: {
      titleSuffix: " — HKU Cricket Club",
    },
    components: {
      views: {
        // Importing a scorecard has no record to hang off — the file is the
        // first this record hears of the match — so it is a screen of its own
        // rather than a tab, unlike the Scorecard on a Match. See
        // components/Import.
        import: {
          Component: "@/components/Import#ImportView",
          path: "/import",
        },
      },
      // Payload's nav lists collections, and an import is not one. Without a
      // link it is a screen at an address nobody would type.
      afterNavLinks: ["@/components/Import#ImportLink"],
    },
  },

  // The record first, in the order an editor fills it in — a Match needs the
  // Team, Season and Competition it belongs to to exist already.
  collections: [
    Teams,
    Seasons,
    Competitions,
    Matches,
    Players,
    Registrations,
    Appearances,
    Users,
    Media,
  ],

  editor: lexicalEditor(),

  secret: env.payloadSecret,

  // Neon. The only durable thing the CMS has, and it is not on the box: the
  // container can be reaped, redeployed or moved to another host behind the same
  // connection string without losing a record.
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },

    // Development only — Payload ignores this whenever NODE_ENV is production.
    // While the collections are still being built out (#6 onwards) a field is
    // added and renamed several times an hour, and a migration per attempt would
    // be noise. Having changed one, run:
    //
    //     npm run migrate:create --workspace @hkucc/cms -- <name>
    //
    // and commit what it writes, or production will not know about the change.
    push: true,

    // Production. Payload applies anything unapplied as it initialises, so the
    // schema arrives with the deploy that needs it and there is no second
    // command anybody has to remember to run against a database they cannot see.
    //
    // Passed as imported code rather than read from `src/migrations` at runtime:
    // the runtime image is Next's standalone bundle, which contains what the
    // server imports and nothing else — a directory read there would find no
    // directory.
    prodMigrations: migrations,
  }),

  // R2, through its S3-compatible API.
  //
  // `disablePayloadAccessControl` and `generateFileURL` together are the load-
  // bearing part: without them Payload serves every image through
  // `/api/media/file/…` on this container, and the public site — which is static
  // precisely so that it does not depend on the CMS being awake — would end up
  // with every photograph pointing at a box that sleeps.
  plugins: [
    s3Storage({
      collections: {
        // Spelled out rather than `[Media.slug]`: a computed key loses the
        // contextual type, and with it the checking of everything inside.
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            [env.media.publicUrl, prefix, encodeURIComponent(filename)]
              .filter(Boolean)
              .join("/"),
        },
      },
      bucket: env.media.bucket,
      config: {
        endpoint: env.media.endpoint,
        // R2 is single-region and ignores this, but the S3 client requires it.
        region: "auto",
        // The S3 client defaults to putting the bucket in the hostname —
        // `hkucc-media.<account>.r2.cloudflarestorage.com` — which R2 does not
        // answer to and which does not resolve at all. R2's own endpoint takes
        // the bucket as the first path segment, and so does the MinIO that
        // stands in for it locally.
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.media.accessKeyId,
          secretAccessKey: env.media.secretAccessKey,
        },
      },
    }),
  ],

  // Resizing happens here rather than in the browser; the club's photographs
  // arrive straight off a phone and are several megabytes each.
  sharp,

  // Written into the shared workspace, so the public site reads a Match with the
  // same types the CMS wrote it with (packages/domain, docs/PLAN.md).
  typescript: {
    outputFile: path.resolve(
      dirname,
      "../../../packages/domain/src/payload-types.ts",
    ),
    // Payload normally ends the file with `declare module 'payload'`. A module
    // augmentation is only legal in a compilation that already contains the
    // module it augments, and packages/domain deliberately contains no runtime
    // and imports nothing — so there it is an error rather than a convenience.
    // The augmentation lives in this app instead, as payload-types.d.ts, which
    // is where `payload` is actually imported and where the typing helps.
    declare: false,
  },

  // The admin panel is the only thing that talks to this server, and it is
  // served from it. Nothing else is granted an origin until something needs one.
  cors: [env.serverUrl],
  csrf: [env.serverUrl],
});
