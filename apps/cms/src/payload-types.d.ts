// Teaches Payload's own API about this project's collections, so that
// `payload.count({ collection: "users" })` is checked rather than guessed.
//
// Payload generates this block into its types file by default. Here it is
// separated out and the generated half is written to packages/domain instead
// (see `typescript.declare` in payload.config.ts): the shape of a record is
// shared with the public site, but teaching the `payload` module about itself
// only makes sense where `payload` is imported, which is this app alone.

import type { Config } from "@hkucc/domain";

declare module "payload" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface GeneratedTypes extends Config {}
}
