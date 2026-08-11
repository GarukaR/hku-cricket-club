# Deploying

The public site is hosted on **Vercel**, git-connected to
`GarukaR/hku-cricket-club`. There is nothing to run by hand:

| | |
|---|---|
| Push to `main` | Deploys to production |
| Open a pull request | Deploys a preview, commented on the PR |
| Project | `true-theorem/hku-cricket-club` |

The CMS is **not** deployed here — it is a container on Render, and it is off
the request path by design (see [PLAN.md](PLAN.md)). Nothing in this pipeline
depends on it being awake.

## Settings that are not defaults

Only one, and it is the one that matters:

**Root Directory is `apps/web`.** This is a monorepo and Vercel's Next.js
builder looks for `.next` inside the root directory. Pointed at the repo root it
runs `npm run build`, watches the workspace build succeed, then fails with *"The
Next.js output directory `.next` was not found at `/vercel/path0/.next`"* —
which reads like a build failure and is really a path failure. `apps/web` is
where the build output actually lands.

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
so the CMS can be a container that sleeps. CI enforces this with
`scripts/assert-prerendered.mjs`, which reads the build manifests and fails on
any route Next rendered per request instead of ahead of time. A dynamic route
would still deploy and still look correct — it would only cost a function
invocation per view and quietly couple uptime to the CMS — so the build is the
only place this gets caught.

**CI and Vercel build on the same Node.** The workflow pins Node 24 to match the
project's runtime. Bumping one without the other means the check that gates a
merge stops testing what production runs.

## Credentials

The Vercel project belongs to the `true-theorem` team, which is a project
identity rather than anyone's personal login — handing the site to the club is
meant to be a credential handover, not a migration (PLAN.md, *Handover*).
