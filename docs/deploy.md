# Deploying

The public site is hosted on **Vercel**, git-connected to
`GarukaR/hku-cricket-club`. There is nothing to run by hand:

| | |
|---|---|
| Push to `main` | Deploys to production |
| Open a pull request | Deploys a preview, commented on the PR |
| Project | `true-theorem/hku-cricket-club` |

The CMS is **not** deployed here — it is a container on Render, and it is off
the request path by design (see [PLAN.md](PLAN.md), and [cms.md](cms.md) for the
service itself). Nothing in this pipeline depends on it being awake.

One consequence worth knowing: the root `npm install` Vercel runs now installs
the CMS's dependencies too, because npm installs a workspace tree rather than
one workspace. It costs build time and nothing else — the deployed bundle traces
what the site imports, and the site imports none of it.

## Settings that live in the dashboard

Three, none of them expressible in the repo:

**Root Directory is `apps/web`.** This is a monorepo and Vercel's Next.js
builder looks for `.next` inside the root directory. Pointed at the repo root it
runs `npm run build`, watches the workspace build succeed, then fails with *"The
Next.js output directory `.next` was not found at `/vercel/path0/.next`"* —
which reads like a build failure and is really a path failure. `apps/web` is
where the build output actually lands.

**Vercel Authentication protects previews only.** Production is a public club
website and has to be reachable by the public, so the login wall is scoped to
preview deployments — where the record on the page is still invented placeholder
data and nobody outside the project should be reading it. Left at the team
default (*all deployments*) the production URL answers every request with a
Vercel login page, which is the failure this ticket exists to avoid.

**Node 24.** The runtime the project builds on, matched by the CI workflow so the
check that gates a merge runs what production runs. Nothing in the repo pins it —
there is no `engines` field, deliberately, because that would also constrain
local development — so the two move together only by being written down here.
Bump both or neither.

Everything else is left on auto-detection: framework Next.js, `next build`, `npm
install`. **"Include files outside the root directory" must stay on** — the
lockfile and the `packages/domain` workspace live above `apps/web`, and the
install would resolve neither without it.

### Why there is no `vercel.json`

`vercel.json` cannot express `rootDirectory` — it is read *from* the root
directory, so by the time Vercel finds the file the setting has already been
applied. Committing a `vercel.json` that restated the auto-detected settings
would put the easy half of the configuration in the repo and leave the only
non-obvious half in the dashboard, which is worse than keeping the whole story
in one place. This document is that place.

## What has to stay true

**Every route is prerendered.** The architecture rests on it: the site is static,
so the CMS can be a container that sleeps. A route that turns dynamic — one
`cookies()`, one uncached `fetch()` — still deploys and still looks correct. It
just starts costing a function invocation per view and quietly couples the site's
uptime to the CMS, which is the whole thing the design avoids. Nothing about the
deployed page shows it, so the build output is the only place it can be caught:

```bash
npm run assert:prerendered   # after a build; CI runs it on every PR
```

If it ever fires, the answer is not to delete the check. A route that genuinely
has to be dynamic is a decision to argue in [PLAN.md](PLAN.md) first.

## Credentials

The Vercel project belongs to the `true-theorem` team, which is a project
identity rather than anyone's personal login — handing the site to the club is
meant to be a credential handover, not a migration (PLAN.md, *Handover*).
