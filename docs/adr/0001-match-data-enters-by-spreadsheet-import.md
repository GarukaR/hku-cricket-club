# Match data enters by spreadsheet import, never by scraping

Cricket Hong Kong publishes every HKUCC scorecard on CricClubs, and it is
tempting to fetch those pages on a schedule. We will not: CricClubs sits behind
Cloudflare's bot challenge (`Cf-Mitigated: challenge`), which is an access
control its owner deliberately switched on, and defeating it would breach their
terms and break without warning. Instead we use the **export button CricClubs
already offers on each scorecard**: an editor downloads the match spreadsheet
and uploads it to the CMS, which parses it into a draft Match and its
Appearances for review.

## Considered options

- **Poll or scrape the CricClubs pages** — rejected. Blocked by Cloudflare, very
  likely against CricClubs' terms, and its failure mode is a site that silently
  stops updating, which is precisely the fate this rebuild exists to avoid.
- **A CricClubs or Cricket Hong Kong API** — no public API exists. Worth asking
  the governing body for, and if access is ever granted an ingestion worker can
  sit behind the same domain model without changing a single entity. Until then
  it is not something to build against.
- **Typing every scorecard by hand** — remains the fallback and is what the CMS
  must support anyway, but it costs 3–4 minutes and a transcription risk per
  match, which a rotating student committee will not sustain.

## Consequences

- The importer depends on a file format we do not control. This is acceptable
  because a parser failure surfaces immediately to the person doing the upload,
  rather than failing silently in a background job.
- Manual entry stays a first-class path, not a legacy one. Historic matches,
  friendlies and anything the league did not score will only ever arrive that
  way.
- Scorer-entered player names vary between matches, so the importer needs
  Aliases to resolve them to Players (see CONTEXT.md).
