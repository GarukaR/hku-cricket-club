# The CMS image.
#
# Built from the repo root, not from this directory — the lockfile and the
# `packages/domain` workspace both live above it, and an install that cannot see
# them resolves a different dependency tree from the one CI checked:
#
#   docker build -f apps/cms/Dockerfile -t hkucc-cms .
#
# Three stages, because the thing that ships should contain neither the compiler
# nor the dependencies it needed. The runtime stage carries Next's standalone
# bundle and nothing else: no lockfile, no source, no npm.

# Matched to the Node the repo is checked and deployed on. Bump this, the CI
# workflow and docs/deploy.md together or none of them.
FROM node:24-alpine AS base
# Payload's Postgres adapter and Next's standalone server both read process
# timezones; without tzdata every timestamp in a log is UTC-with-no-name, and
# the club plays in Hong Kong.
RUN apk add --no-cache tzdata

# ---- deps -------------------------------------------------------------------
# Manifests first, source later, so a change to a component does not re-run the
# install. `npm ci` rather than `npm install`: it fails loudly when the lockfile
# and the manifests disagree, which is the only way an image can quietly ship a
# dependency nobody reviewed.
FROM base AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/cms/package.json apps/cms/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
RUN npm ci

# ---- build ------------------------------------------------------------------
FROM base AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
# No secret is present here, and none should be. The config is deliberately
# readable without one (src/lib/env.ts); the environment is checked at start-up,
# so one image runs against any deployment rather than being built per target.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @hkucc/cms

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# `node` is uid 1000 in the official image and owns nothing outside its home.
# Copying as that user rather than root means the running process cannot rewrite
# its own code even if something gets far enough to try.
COPY --from=build --chown=node:node /repo/apps/cms/.next/standalone ./
# Standalone traces the server's imports and stops there; the browser's half of
# the admin panel is not an import of anything, so it has to come across
# separately or every page loads unstyled.
COPY --from=build --chown=node:node /repo/apps/cms/.next/static ./apps/cms/.next/static

USER node
EXPOSE 3000

# What Render gates a deploy on. It reaches past "the port is open" and into the
# database — see src/app/health/route.ts for why that is the useful question.
# `--start-period` covers the first connection to Neon, which on a cold branch
# can take several seconds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/cms/server.js"]
