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

## Credentials

Every service — Render, Neon, Cloudflare — is created under a **dedicated
project identity**, never a personal login, so handing the site to the club is a
credential handover rather than a migration of five services and a database
(PLAN.md, *Handover*).
