# Plan

The outcome of a design interrogation held before any of the site was built.
Every entry here is a decision that was argued, not an assumption. The domain
vocabulary lives in [CONTEXT.md](../CONTEXT.md); the ingestion decision has its
own record in [ADR-0001](adr/0001-match-data-enters-by-spreadsheet-import.md).

## What this is

The official website of the Hong Kong University Cricket Club — founded 1913,
home ground Sandy Bay, motto *IN LUDO SAPIENTIA*. It shows the club's record,
its players' figures, its history, and how to join.

It is built **portfolio-first**: the goal is a finished, deployed, genuinely
useful site, with adoption by the club as a welcome outcome rather than a
prerequisite. That framing is what unblocked the project — the previous attempt
stalled waiting on a committee.

The hardest real constraint is not technical. **A student committee turns over
every year and will not administer a website.** Most of what follows is
downstream of taking that seriously.

## Architecture

| | |
|---|---|
| Public site | Next.js 16 App Router, statically generated, on Vercel |
| CMS | Payload 3 (needs Next ≥16.2), self-hosted in a container on Render |
| Database | Neon Postgres |
| Media | Cloudflare R2 |
| Cache | `use cache` + `cacheTag`, invalidated on publish by webhook |
| Repo | npm workspaces — `apps/web`, `apps/cms`, `packages/domain` |

**The container holds no state.** Database in Neon, media in R2, nothing durable
on the box. Free-tier fragility therefore stops being a risk and becomes an
inconvenience: if Render changes terms, the same image runs elsewhere behind one
connection string.

**The CMS is off the request path.** The public site is static, so the box being
asleep, wedged or reaped never takes the site down — it only delays publishing.
Render's spin-down is free uptime rather than a defect, because nobody but the
committee ever touches it.

### Rejected

- **Kubernetes and microservices.** Scored zero out of five on independent
  scaling, deploy cadence, failure isolation, runtime diversity and team
  boundaries. For a read-heavy content site with weekly writes it is complexity
  the problem does not have, and it reads as a judgement failure rather than a
  skill signal.
- **Oracle Always Free.** Its idle-reclamation policy targets exactly this
  workload, and the allowance was silently halved in June 2026.
- **Sanity or another hosted CMS.** A self-hosted Payload container earns its
  keep by running scheduled ingestion and holding a cache; the CMS being real
  infrastructure is the point.

## The record

Match data is **imported from CricClubs' own spreadsheet export**, never
scraped — see ADR-0001. An editor downloads the export and uploads it; the
importer builds a draft Match and its Appearances.

- **`Appearance` is the atomic fact**, not a batting or bowling performance. A
  player who fields all day, is not needed with the bat and does not bowl still
  played, and both the call-up rule and the Matches column depend on knowing it.
- **Every career and season figure is derived** from Appearances. Nothing
  aggregate is ever stored.
- **Innings totals are stored, not summed.** Extras belong to no batter. The
  importer reconciles batting + extras against the total and *warns*, never
  blocks — a CMS that refuses to save half-known history stops being used.
- **Result type and margin are recorded explicitly.** Computing a margin
  correctly means handling ties, abandonments, concessions and rain-adjusted
  targets; an editor already knows the answer.
- **Imports publish when confident, draft when not.** The gate: every name
  resolves, the arithmetic reconciles, no unknown dismissal code. Each answered
  question teaches an Alias, so the work decays toward zero.
- **Opposition players are display-only** — full card shown, no Player records,
  no Aliases, no averages. HKU's own players get profiles.

### Coverage is uneven, and the site says so

Scorecards exist for the **league** team (Saturday Championship) and the
**student** team (University Cricket League, listed on CricClubs as *HKU
Students (UCL)*). The **sunday social** side's matches are not scored anywhere.
The **challenge league** side is unconfirmed — its CricClubs page exists but no
results were found under that name.

Teams with scorecards get full figures. Teams without get fixtures and results,
labelled plainly, and every derived figure states what it covers — "figures from
Saturday Championship matches" — because a career total that silently omits a
season of social cricket is wrong rather than merely incomplete.

The club previously scored on **CricHeroes** and has since moved to CricClubs.
CricClubs already spans 2024/25 and 2025/26, which satisfies the backfill target,
so CricHeroes is **out of scope**: a second parser, for a blocked platform, for
history nobody asked for. Revisit only if pre-2024 seasons are ever wanted.

### Traps

Confirmed against three real exports — two Saturday Championship, one University
Cricket League — and encoded in the importer:

- Overs are balls notation — `28.3` is 171 deliveries, not a decimal.
- Bowlers' runs equal the total *minus byes and leg byes*.
- Run-outs are credited to no bowler, so wickets fallen routinely exceeds the
  bowlers' wickets. The bowler named on a run-out row may not have bowled.
- Fall-of-wickets names truncate to 8 characters and collide; they are unusable
  for identity. Only the batting table's full names resolve a Player.
- One file carries three spellings of the same player.
- The competition line varies — `Saturday Championship - Div 2 - 2025-26:` in one
  file, a bare `University Cricket League:` in another. Division and season
  cannot be required, and the season must be derived from the match date.
- A Scorecard lists only the players the scorer entered — eleven in some files,
  eight in others. Matches played is a floor, not a certainty.
- The batting breakdown does not always reconcile. In one real export HKU
  Students' batters sum to 114 against a stated 115, and 115 is correct: both the
  winning margin and the opposition's bowling figures confirm it. This is why the
  total is stored and the mismatch only warns.
- A catch can name no fielder, and `ctw` has been seen with the fielder equal to
  the bowler. Ambiguity is a question for a human, never a guess.
- `Dot Balls` is zero throughout some files. Treat it as optional.

## Design

**D2 "Since 1913"** — a printed university record — carrying **d1's scoreline**
for the latest result. The other two directions were rejected on sustainability:
d3 "The Innings" needs a written match report every week, and a publication with
nothing published looks broken rather than merely stale.

Prototype variant **B (Letterpress)** won: the scoreline keeps d1's structure but
is set entirely in d2's materials. The lede folds into the letterhead above the
double rule so the result is the page's only hero; the drop cap moves to the one
section with running prose; the next fixture takes d2's marginalia voice.

Colour descends from the crest by construction. Anchors are **sampled from
`design/logo.svg`**, `derive.js` solves lightness for WCAG AA, and it refuses to
emit a stylesheet if any pair fails. Tokens publish under semantic names, light
only — d2 is a committed light world.

## v1

Ships with **no dependency on anyone else**, because every external dependency
is somewhere to stall.

**In:** home page, fixtures and results, match pages, squad, player profiles with
derived figures, join enquiry, the CMS, the importer.

**Deferred to v1.1** (all blocked on other people): Facebook, Instagram and
YouTube ingestion, gallery, honours board, committee, real history copy,
photographs, the simplified navbar mark.

**Start the Meta App Review on day one anyway** — it is the longest lead time and
costs nothing to have running in the background.

### Where the repo currently stands

Read this before touching anything, because the working tree is not what it
looks like:

- **`/` is the real homepage.** Variant B is folded in: `apps/web/src/app/page.tsx`
  composes components from `apps/web/src/components/`, and
  `apps/web/src/app/prototype-homepage/` is gone along with the `?variant=`
  switcher. The page is statically prerendered. The earlier foundation status page
  is in commit `e4bf730` and was deliberately not restored — the site now has a
  homepage to be its own status.
- **The homepage reads the real record.** `apps/web/src/content/matches.ts` is
  gone; the page reads Matches out of the CMS. `apps/web/src/lib/match.ts` still
  holds CONTEXT.md's vocabulary as view types, `lib/record.ts` maps Payload's
  stored Match onto them, `lib/cms.ts` fetches, and `lib/matches.ts` caches and
  tags. Two inventions outlive the sample data: the 1988 handbook quotation in
  `TheClub.tsx`, and the plate captions and provisional training time in
  `apps/web/src/content/club.ts`. The footer says so on the page.
- **The homepage's record is club-wide, and every row names its side.** Four
  sides play under one crest, and a table that ran them together silently would
  read as one team's season while being four — the same failure as a career total
  that omits a season. Per-team pages get their own tags when they exist.
- **Three placeholders remain on the page, each marked in code:** the crest in the
  masthead (traced mark still outstanding), the plates (no photographs yet), and
  the Admission button's destination (the enquiry route is its own ticket).
- The **workspaces layout exists**: `apps/web` holds the site, `apps/cms` holds
  Payload, and `packages/domain` now holds Payload's generated types rather than
  nothing. Every root script delegates to a workspace, so `npm run dev`, `build`,
  `lint`, `typecheck` and `tokens` all still run from the root; `dev:cms` and
  `build:cms` are the CMS's.
- **The CMS runs, and holds nothing.** `docker compose up` gives a working admin
  panel at `localhost:3001` against a scratch Postgres and a MinIO standing in
  for R2 — no cloud account needed. The container has a read-only root
  filesystem, so the claim that it keeps no state is enforced rather than
  asserted. Everything about it is in [cms.md](cms.md).
- **The skeleton of the record is in the CMS, and the site reads it.** Team,
  Season, Competition and Match are editable, `packages/domain` exports their
  generated types, and publishing one puts it on the live site within seconds.
  Appearance — the atomic fact everything is derived from — arrives with the
  importer.
- **Every layer is now proven together.** The site reads Payload over HTTP while
  it builds, caches what it rendered under one `record` tag, and a Payload hook
  calls `POST /api/revalidate` on save. Verified rather than assumed: with the
  CMS container stopped, every page still serves the record in full. The cost of
  reading over HTTP is that a build needs Render awake — see
  [deploy.md](deploy.md), *When Render is asleep, and when it is down*.
- `apps/web/src/app/tokens.css` is **generated**. Never hand-edit it; change the
  `CREST` anchors in `design/derive.js` and run `npm run tokens`.

### Build order

1. ~~Restructure to workspaces; fold prototype variant B into real components.~~ Done.
2. ~~Deploy the public site to Vercel, so every later ticket is verifiable in
   production rather than only locally.~~ Done — [docs/deploy.md](deploy.md).
   Deploying first was the point: it proves the pipeline before anything depends
   on it, rather than discovering it at the end.
3. ~~Payload in a container; Dockerfile; Render + Neon + R2.~~ Done —
   [docs/cms.md](cms.md). The collections from CONTEXT.md are step 3a, and are
   their own ticket: getting the box right first meant the schema could then
   change without anything else moving.
4. ~~Real Matches on the live site, invalidated on publish.~~ Done — the
   architecture tracer. Every layer proven together in production before more
   was built on top of it, which is why it came before the importer rather than
   after: a schema is cheap to change while nothing reads it.
5. The importer — parsing, reconciliation, Alias resolution, the confidence gate.
6. Public pages.
7. Derived figures and leaderboards.

## Leaderboards

Aggregates lead and need no qualification. Averages sit in their own table behind
a **stated** threshold — five completed innings, twenty overs — printed beside
it, because an unexplained omission reads as a bug. An undefined average renders
`–`. Leaderboards belong to a Team, never the club; profiles roll up club-wide
with a per-Team split.

## Handover

Guidance lives **inside the CMS**, not in a document beside it: field help text,
a dashboard panel, an import flow whose questions explain themselves. A committee
that will not administer a website will not read its manual. One short page and a
three-minute recording as backup.

Every service is created under a **dedicated project identity**, never a personal
login, so adoption by the club is a credential handover rather than a migration
of five services and a database. Any domain should be registered expecting to
transfer to the club.

## Still needed from the club

- Is the Instagram account **Business or Creator**? Personal accounts have no API
  path at all.
- **Facebook Page admin** authorization for the Meta app.
- **Is the challenge league side scored anywhere?** Its CricClubs page exists but
  nothing was found under that name — and the student team turned out to be
  listed as *HKU Students (UCL)*, so it is worth searching under other names.
  *(Garuka is asking his brother.)*
- Which CricClubs entity is which Team — *HKU CC*, *HKU Belchers CC*, *HKU
  Students (UCL)*.
- **How far back CricClubs goes** for the Saturday team. Two seasons are already
  confirmed; if it starts this season, the second season of backfill has to come
  from CricHeroes and that becomes a real decision rather than a closed one.
- A further export or two covering **retired, hit wicket and caught-and-bowled**,
  so the dismissal codes are known rather than guessed.
- History copy, the honours board, the committee list, training times, photographs.
- The navbar mark, traced from `Cricket logo_final2.ai`.
