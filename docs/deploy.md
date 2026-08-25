# Deploying

The public site is hosted on **Vercel**, git-connected to
`GarukaR/hku-cricket-club`. There is nothing to run by hand:

| | |
|---|---|
| Push to `main` | Deploys to production |
| Open a pull request | Deploys a preview, commented on the PR |
| Project | `HKUCC/hku-cricket-club` — the Hobby team owned by the project identity |

The CMS is **not** deployed here — it is a container on Render, and it is off
the request path by design (see [PLAN.md](PLAN.md), and [cms.md](cms.md) for the
service itself). **No visitor's request ever reaches it.**

A *build*, however, does: the site reads the record from Payload while it
prerenders. See [Reading the record](#reading-the-record) below for what that
costs and what it does not.

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
install`.

An earlier version of this document said a setting called *"Include files
outside the root directory"* had to stay on, because the lockfile and the
`packages/domain` workspace live above `apps/web`. **That toggle no longer
exists.** Vercel detects the monorepo on import, resolves the root directory to
`apps/web` itself, and installs from the workspace root without being asked. It
is recorded here only so the next person does not go looking for it.

### Why there is no `vercel.json`

`vercel.json` cannot express `rootDirectory` — it is read *from* the root
directory, so by the time Vercel finds the file the setting has already been
applied. Committing a `vercel.json` that restated the auto-detected settings
would put the easy half of the configuration in the repo and leave the only
non-obvious half in the dashboard, which is worse than keeping the whole story
in one place. This document is that place.

## Reading the record

The site reads Matches from Payload's REST API, and only ever while it builds.
Two environment variables, both set in the Vercel dashboard:

| | |
|---|---|
| `CMS_URL` | The Render service's origin, e.g. `https://hkucc-cms.onrender.com` |
| `REVALIDATE_SECRET` | Shared with the CMS, which sends it on every publish |

Read access on the record is public, so the build carries no credential. That is
deliberate rather than an oversight — the record *is* the public site, and a
login in front of it would protect nothing while having to be handed to the
build. It is stated once in `apps/cms/src/collections/access.ts`.

### Publishing

Saving a Match in the panel calls `POST /api/revalidate` on the site with that
shared secret. The site drops the pages derived from the record and re-renders
them on the next request — **no redeploy, no git push**. The notice carries no
data: Payload says only that the record changed, and the site re-reads it for
itself, so there is exactly one way into the record.

The pair is optional at both ends. With it unset the CMS still works completely;
the site just shows the record as of its last build, and the day-long cache
lifetime is the safety net if a notice is ever missed.

### When Render is asleep, and when it is down

Render's free tier spins down after about fifteen minutes idle and takes roughly
fifty seconds to wake. That is the *normal* state, not a fault, so the fetch
waits sixty seconds and retries once — a build sits through a cold start rather
than failing on one.

If Render is genuinely down, **the build fails, loudly, and that is correct.**
The alternative — treating an unreachable CMS as an empty record — would ship a
site whose season table is silently blank, and a successful deploy of a broken
page is far worse than a failed deploy of a working one.

What that costs is worth being clear about: **while Render is unreachable,
nothing can be deployed** — not even a change that has nothing to do with match
data. What it does *not* cost is the live site. Vercel keeps the previous
deployment serving, so visitors see the record exactly as before.

This is the accepted trade-off of reading over HTTP rather than going straight to
Neon. Revisit it if it ever actually bites.

## What has to stay true

**Every page is prerendered.** The architecture rests on it: the site is static,
so the CMS can be a container that sleeps. A page that turns dynamic — one
`cookies()`, one uncached `fetch()` — still deploys and still looks correct. It
just starts costing a function invocation per view and quietly couples the site's
uptime to the CMS, which is the whole thing the design avoids. Nothing about the
deployed page shows it, so the build output is the only place it can be caught:

```bash
npm run assert:prerendered   # after a build; CI runs it on every PR
```

If it ever fires, the answer is not to delete the check. A page that genuinely
has to be dynamic is a decision to argue in [PLAN.md](PLAN.md) first.

Route handlers are exempt, and only route handlers: `/api/revalidate` exists to
be called per request. The check tells the two apart by the file each was built
from — `page.tsx` against `route.ts` — rather than by a list of excused paths,
which is a check that stops meaning anything.

## Credentials

Every service this project uses is meant to be owned by one identity — a Gmail
account created for the club, never anyone's personal login — so handing the
site over is a credential handover rather than a migration of five services and
a database (PLAN.md, *Handover*). The address itself is deliberately not written
down here: this repository is public, and an account's login address is half of
its credential. It lives in the password manager with everything else.

Three of the four exist. The table says which, because a plan recorded as an
accomplishment is how a gap survives to the handover:

| | | |
|---|---|---|
| Vercel | `HKUCC` team, Hobby plan | **Done** |
| Neon | the record | **Done** — connection string in the password manager, not yet in any `.env` |
| Render | the CMS container | **Done** — `https://hkucc-cms.onrender.com`, free tier, so it sleeps |
| Cloudflare | R2, the media | **Outstanding** — signup under the project identity could not be completed |

Until R2 exists the media pipeline lands on the far side of that gap, and the
CMS's uploads run against the local stand-in described in [cms.md](cms.md).
Nothing about the public site depends on it.

### The move off the personal account

The site began in a personal `true-theorem` team and was moved before anything
depended on it. That was the cheap moment: no domain attached, no environment
variables set, no traffic. The move cost re-importing the repo and setting the
Node version and deployment protection again — everything in *Settings that live
in the dashboard* above — and lost nine days of deployment history, which was
worth it to make the handover one password instead of two.

The alternative was inviting the project account into the personal team, which
Vercel bills as a second seat. A recurring cost is a worse thing to hand a
student committee than a lost deployment log.

**The old project was deleted before the new one was created**, and that
ordering is the reason the site still answers on its original hostname,
<https://hku-cricket-club.vercel.app/>. The hostname is derived from the
project name and only one project can hold it at a time, so had the two existed
together the new one would have been given a different name and the URL would
have changed for good. Anyone repeating this move on another service should
check for the same trap before assuming an overlap is the safer order.
