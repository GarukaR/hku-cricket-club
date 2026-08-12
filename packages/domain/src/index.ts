// The shared domain vocabulary — see CONTEXT.md for the terms themselves.
//
// Nothing is hand-written here. `payload-types.ts` is generated from the CMS's
// collections by `npm run generate:types --workspace @hkucc/cms`, so the public
// site reads a record with the same types the CMS wrote it with, and a field
// renamed in Payload becomes a type error in the site rather than an undefined
// at runtime.
//
// It covers the skeleton of the record — Team, Season, Competition and Match —
// alongside Users and Media. Appearance, the atomic fact every career figure is
// derived from, lands with the importer.

export * from "./payload-types";
