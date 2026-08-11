// The shared domain vocabulary — see CONTEXT.md for the terms themselves.
//
// Nothing is hand-written here. `payload-types.ts` is generated from the CMS's
// collections by `npm run generate:types --workspace @hkucc/cms`, so the public
// site reads a record with the same types the CMS wrote it with, and a field
// renamed in Payload becomes a type error in the site rather than an undefined
// at runtime.
//
// The collections it covers are still only Users and Media; the record itself —
// Team, Season, Competition, Match, Appearance — lands with #6.

export * from "./payload-types";
