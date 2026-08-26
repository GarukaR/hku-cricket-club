# The CMS

Payload 3, in a container on **Render**, with **Neon** for the database and
**Cloudflare R2** for media. It is where the club's record is edited. It is not
where the public site is served from, and the two are only loosely joined on
purpose — see [PLAN.md](PLAN.md).

| | |
|---|---|
| Admin panel | `/admin` on the Render service |
| Health | `/health` — Render gates a deploy on it |
| Local | `docker compose up`, then http://localhost:3001/admin |
| Image | `apps/cms/Dockerfile`, built from the repo root |
| Blueprint | [`render.yaml`](../render.yaml) |
| Variables | [`.env.example`](../.env.example) |

## The one rule

**Nothing durable is written to the container.** Records go to Neon, files go to
R2, and the box keeps neither. Everything else here follows from it.

It is what makes the hosting choice reversible: the same image runs anywhere
behind one connection string, so Render changing its free-tier terms is an
inconvenience rather than an incident. It is also what makes Render's spin-down
free uptime instead of a defect — the container being reaped costs nothing,
because there was nothing on it.

The rule is enforced rather than asserted. `docker-compose.yml` runs the service
with a **read-only root filesystem**, with `/tmp` and Next's cache directory as
memory that vanishes with the container. A change that starts writing something
to the box fails locally, on the first run, rather than in production on the day
the instance is replaced.

## Reading the site never wakes the CMS

The public site is static and links **straight at R2's public URL** for every
photograph. Payload would ordinarily serve uploads through `/api/media/file/…`
on this container, which would quietly make every image on the site depend on a
service designed to be asleep. `disablePayloadAccessControl` and
`generateFileURL` in `payload.config.ts` are what prevent that, and they are not
optional decoration.

Hence two separate variables that look like duplicates and are not:

- `R2_ENDPOINT` — where uploads are **written**, over the S3 API.
- `R2_PUBLIC_URL` — where they are **read**, by a browser, from the public site.

## Running it locally

```bash
docker compose up --build      # admin panel at http://localhost:3001/admin
```

No cloud account is needed. Compose brings up Postgres for Neon and **MinIO for
R2** — MinIO speaks the same S3 API, so the path exercised locally (upload,
store, serve from a public URL on another host) is the path production takes.
Pointing compose at real Neon and real R2 would test less and cost more.

Nothing in that file is a secret; every value in it is a local development
value, which is why they are written out rather than read from a `.env` that
nobody would have.

```bash
docker compose down -v         # reset the scratch database and bucket
```

The first person to open the admin panel is asked to create an account. Payload
allows that only while the users collection is empty — which is also true of the
production service on the day it first deploys, so **claim it promptly**.

To run the admin panel from source instead, against your own Neon branch and R2
bucket, copy `.env.example` to `apps/cms/.env` and:

```bash
npm run dev --workspace @hkucc/cms      # http://localhost:3001/admin
```

## What it holds

The skeleton of the record, in the vocabulary of [CONTEXT.md](../CONTEXT.md):

| | |
|---|---|
| **Team** | The four sides the club fields, and which CricClubs entity is which |
| **Season** | A playing year, written `2025/26` |
| **Competition** | An external league or cup, with its division |
| **Match** | One fixture of one Team, before and after it is played |

Four decisions in there are load-bearing, and each is enforced rather than
merely intended:

- **A Match points at a Competition optionally.** A friendly has none, and the
  emptiness is the record saying so — there is deliberately no "Friendly" row to
  create. The Team it belongs to is required, and is not the same kind of thing:
  *challenge league* is a Team, the *Challenge League Div 3* is a Competition.
- **A Competition carries no Season.** The Match already states one, and a
  second could disagree with it. A side promoted out of Div 2 gets a new
  Competition rather than an edited one, so every Match keeps pointing at the
  division it was actually played in.
- **No two Teams may claim the same CricClubs entity.** Nothing in an export
  says which of our sides an entry belongs to, so the mapping recorded on the
  Team is the only thing that knows. Two claims would not fail the import — it
  would file a season of matches against whichever side it read first.
- **Outcome and margin are both stored**, and checked against each other: a tie
  cannot carry a margin, a chase cannot be won by eleven wickets. Innings totals
  are stored per innings with Extras beside them, because extras belong to no
  batter and a total can never be got by summing the batting figures.

Nearly everything else is optional on purpose. Most of the club's history is
half known, and a CMS that refuses to save it stops being used. The rules above
are the few places where a wrong value would be worse than a missing one.

All four are **world-readable and committee-writable**. The record *is* the
public site: the site is statically generated and reads these collections while
it builds, and nothing here is unpublished the moment it is saved. A login in
front of them would protect nothing and would have to be handed to the build.

Each rule lives in a plain function under `apps/cms/src/lib/`, tested there, and
is wired into the field it guards — `notation.ts` for the forms the club writes
things in, `result.ts` for outcome and margin, `mapping.ts` for the CricClubs
names.

## Saving a Match publishes it

Saving anything the record's pages are built from — a Match, and also the Team,
Season or Competition named on one — calls the site's `/api/revalidate` with a
shared secret. The site drops the pages derived from the record and re-renders
them on the next request. **No redeploy, no git push**; the editor sees their
change within seconds.

The notice carries no data. Payload says only that the record changed and the
site re-reads it, so there remains exactly one way into the record rather than a
second, unvalidated one arriving by webhook.

Two variables, in `apps/cms/src/lib/publish.ts`:

| | |
|---|---|
| `SITE_REVALIDATE_URL` | The site's address plus `/api/revalidate` |
| `REVALIDATE_SECRET` | The same string the site is given |

**Both or neither.** A URL with no secret is refused on every publish; a secret
with no URL is a webhook that silently never fires. Each looks like working
software right up until somebody publishes and the site does not change, so
start-up rejects half a pair.

Setting neither is a perfectly good configuration, and the normal one locally: a
container with no deployed site to tell is a working CMS, and it says so in the
log rather than failing. The site then shows the record as of its last build.

**This can never fail a save.** An editor entering Saturday's result must not be
stopped because Vercel is unreachable, so every failure is logged and swallowed.
A missed notice costs at most a day, which is how long the site's cached copy
lives before it re-reads the record anyway.

## Screens that are not collections

Two screens in this panel are ours rather than Payload's: the **Scorecard** tab
on a Match, and **Import a scorecard** at `/admin/import`. The first is a
document view and Payload treats it like any other; the second is a **custom
root view**, and those come with a trap that cost a day to find.

**Payload does not guard a custom root view.** `isCustomAdminView` in
`@payloadcms/next` is documented as returning the views *"marked with `public:
true`"*, and its implementation returns true for every custom view that has a
path. `RootPage` uses it to skip the redirect that sends anonymous visitors to
the login screen, so a custom root view is public unless it says otherwise.

**And it can arrive without its user even when somebody is signed in.** A
top-level navigation that reaches the panel `Sec-Fetch-Site: cross-site` — a link
from another site, a pasted address, a restored tab — carries the session cookie,
and Payload's CSRF check in `extractJWT` discards it, because a cookie is not
evidence of intent when the request came from somewhere else. That is the rule
working correctly. The RSC requests that follow are same-origin and do
authenticate, which is the confusing part: the page renders with no user while
the client in the same tab shows the account avatar. On Payload's own screens the
redirect hides all of this; on a custom root view there is no redirect, so the
screen renders signed-out.

The symptom to recognise: **the nav loses "Users"** — the one collection whose
`read` requires being signed in — while every other collection stays, and the
account avatar disappears.

So any custom root view added here must redirect for itself:

```ts
if (!permissions?.canAccessAdmin) {
  redirect(loginUrl(adminRoute, adminPath(adminRoute, segments) + queryString(searchParams)))
}
```

`apps/cms/src/lib/login.ts` holds the helpers and the reasoning. The question is
`canAccessAdmin` rather than "is anybody signed in": they are not the same
question, and Payload asks this one on every screen it guards. Everyone with an
account here is a committee member today, so the two agree — but that is a fact
about the club's access rules, not something a screen should depend on.

Redirecting is the cure rather than a workaround: the login screen is
same-origin, so the journey back through it authenticates normally, and an editor
who is already signed in is bounced straight through without typing anything.

One consequence worth knowing when testing by hand: **a non-browser client cannot
authenticate against this panel.** `curl` sends no `Origin` and no
`Sec-Fetch-Site`, so `POST /api/users/login` succeeds and the next request with
that cookie still reports no user. That is the CSRF rule, not a broken session —
use a browser, or an API key.

That is also the answer to the `/admin/account` trouble that
`apps/cms/.env.development.local` was written to debug: **`/admin/account` is not
broken.** It behaves correctly on a signed-in, same-origin visit, and every way
of reaching it that appeared to fail — a pasted address, a `curl` — is the same
CSRF rule discarding the cookie. The note in that file can go, but the file
should stay: it is what points local development at the docker-compose database
and MinIO, and deleting it aims `npm run dev` at production Neon and R2. It is
gitignored, so it is a local tidy-up rather than a change anybody else sees.

## Who a name belongs to

Scorers type names freely. One export in `docs/samples/` carries a man three
ways — `Jaya Ramesh Chaliki` in the bowling table, `Jaya Ramesh C` in a
dismissal, `Jaya Ram` in the fall of wickets — and across the University Cricket
League file twelve spellings stand for eight players. Resolving them is what
stops one person becoming three entries in the averages.

The import screen does it by **asking, once**. A spelling it recognises resolves
silently; one it does not is put to the editor with the Players it could be, and
the answer is written straight back as an Alias on the Player. The next export
carrying that spelling resolves without asking, so early imports ask a lot and by
mid-season they ask nothing. The rule is `apps/cms/src/lib/names.ts`, tested
against the three real exports.

Four things it will not do, each for a reason a file in `docs/samples/` proves:

- **It never guesses.** `Gohar A` is *offered* as possibly `Gohar Ali`, never
  applied. `Muhammad` abbreviates two different players inside one file, so a
  list that picked one would be right about half the time.
- **Only a full name may create a Player** — a name out of a batting or bowling
  table. An abbreviation from a dismissal column can be matched to somebody who
  exists but can never mint them, because a Player made from `Yash D C` is a
  second entry for a man already in the record, spelled worse.
- **No two Players may claim one spelling.** Enforced on the Aliases field
  itself, so it holds whether the spelling arrives from the import screen or is
  typed in by hand. Two claims would make a later import unanswerable — and,
  worse, answerable differently on different days.
- **The opposition are never resolved.** Their card is shown in full and none of
  it becomes a Player, which is what keeps the record a squad rather than a
  league.

The fall of wickets is not read at all: those names truncate to eight characters
and collide — `Mohammad` is two different players in a single file.

**A wrong answer is corrected on the Player**, under Aliases. Remove the spelling
and the next import asks about it again.

## Changing the collections

The database schema is pushed automatically in development and **migrated** in
production — Payload ignores `push` whenever `NODE_ENV` is production, which is
what the container sets.

So, having changed a collection:

```bash
npm run migrate:create --workspace @hkucc/cms -- <name>
npm run generate:types --workspace @hkucc/cms
```

Commit both. The migration is imported by `payload.config.ts` as
`prodMigrations` and applied as the container initialises, so the schema arrives
with the deploy that needs it. **Without it, production does not learn about the
change** — and the failure will be a column that does not exist, in the admin
panel, in front of a committee member.

`generate:types` writes into `packages/domain`, which the public site reads. A
field renamed in Payload therefore becomes a type error in the site rather than
an `undefined` at runtime, which is the entire reason that package exists.

## Deploying it

`render.yaml` is a Blueprint: point Render at the repo and it creates the
service, the Dockerfile path and the health check. What it deliberately does not
carry is any value marked `sync: false` — those are set in the dashboard.

Four are secrets:

| | |
|---|---|
| `DATABASE_URL` | Neon → project → connection string, **pooled** |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → API token, Object Read & Write |
| `R2_SECRET_ACCESS_KEY` | shown once, when the token is created |

Three are merely deployment-specific — `PAYLOAD_PUBLIC_SERVER_URL`,
`R2_ENDPOINT`, `R2_PUBLIC_URL` — and are unsynced so a second environment cannot
inherit production's by accident.

Put the Neon project in the **same region as the Render service** (Singapore is
the nearest Render offers to Hong Kong). Every keystroke in the admin panel is a
round trip to the database, and across an ocean the panel feels broken rather
than slow.

The R2 bucket needs **public read access** — an r2.dev URL, or a custom domain
in front of it. That URL is `R2_PUBLIC_URL`.

### If a deploy fails immediately

Read the first lines of the log. A container with a hole in its environment
refuses to start and says exactly which variables are missing, all of them at
once, before it does anything else. That is `apps/cms/src/instrumentation.ts`
doing its job — the alternative is a service that starts, looks healthy, and
fails weeks later when somebody uploads a photograph.

## The CMS in continuous integration

Every pull request starts one. The public site's build reads the record over
HTTP, so a check that builds the site needs something to read from, and CI
brings up Postgres as a service container and runs the CMS from its standalone
bundle — the same artefact Render runs — for the length of the job.

Deliberately a real CMS and not a fixture. The site's build is a client of
Payload's REST API, and the failure worth catching is the two disagreeing: a
renamed field, a changed `depth`, a query answering with something other than
what `apps/web/src/lib/record.ts` expects. A committed fixture is the site's own
idea of the CMS's answers and drifts in the very commit that breaks production,
so it cannot catch that at all.

It runs with `NODE_ENV=production`, which is what makes Payload apply
`prodMigrations` as it initialises rather than pushing the schema. So the
migration committed alongside a collection change is exercised on every pull
request, and a collection changed without one fails there rather than on the
deploy.

Its record is empty, and that is a check rather than a gap: every component that
reads the record collapses to nothing when it has nothing, so an empty CMS
proves the homepage still renders between seasons. What the shapes *mean* is
covered by the unit tests, which is the cheaper place for it.

## Credentials

Every service — Render, Neon, Cloudflare — is created under a **dedicated
project identity**, never a personal login, so handing the site to the club is a
credential handover rather than a migration of five services and a database
(PLAN.md, *Handover*).

Neon and Render exist; the CMS runs at `https://hkucc-cms.onrender.com` on the
free tier, so it sleeps after about fifteen minutes idle. Cloudflare R2 has not
been created under that identity, which is why uploads still run against
`docker compose` and its local stand-in rather than the real thing. Current
state, and what the gap costs, are in [deploy.md](deploy.md) under
*Credentials*.
