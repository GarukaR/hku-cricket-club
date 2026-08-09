# Hong Kong University Cricket Club

The official website of the cricket club of the University of Hong Kong, founded 1913.
Home ground Sandy Bay, Pok Fu Lam.

**Status: foundation.** The stack, the design tokens and the build pipeline are in
place. The visual direction is not yet chosen and there is no real content, so this
is not ready to show the public. See [Where this is going](#where-this-is-going).

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build; must pass clean before pushing
npm run lint
```

Node 22 or later.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind 4 — CSS-first, so there is **no `tailwind.config.js`** |
| Fonts | Newsreader / IBM Plex Sans / IBM Plex Mono, self-hosted at build time via `next/font` |
| Hosting | Vercel (planned) |
| CMS | Sanity (planned) |

## Colour is generated, not chosen

Every colour comes from the club crest. `design/derive.js` holds each crest **hue** and
solves for the **lightness** that clears WCAG AA against the specific background the
colour lands on, then writes `src/app/tokens.css`:

```bash
npm run tokens       # regenerate src/app/tokens.css
node design/derive.js  # human-readable report + contrast table
```

`src/app/tokens.css` is generated — **do not hand-edit it.** Change the `CREST` anchors
in `design/derive.js` and re-run. The script refuses to emit CSS if any pair fails AA,
so a failing palette cannot reach the stylesheet.

Style components through the tokens (`var(--color-accent)`), never a literal hex, so
both themes keep working.

Three things here are easy to get wrong and are worth knowing about:

- **Tokens are declared `@theme static`.** Tailwind 4 tree-shakes `@theme` variables no
  utility references, which silently drops any token only reached through an inline
  style or hand-written `var()`. That is how `--color-red` first went missing.
- **The `next/font` variables belong on `<html>`, not `<body>`.** Tailwind's `@theme`
  declares `--font-display` on `:root`; a `var()` there can only resolve against
  properties that also exist on `:root`. On `<body>` every face silently falls back to
  system-ui and the build still passes.
- **Chips need their own token.** A colour solved against the page background does not
  clear AA on a tinted chip, which sits closer to it in lightness. Hence
  `--color-accent-on-soft` and `--color-red-on-soft`.

### The crest hexes are provisional

They were read off a phone screenshot of the logo with black letterboxing, so they are
close but not exact. Getting the original vector (or a clean transparent PNG) is
[tracked](#where-this-is-going) — update `CREST`, run `npm run tokens`, done.

## Design

`design/` holds the Phase 0 work: three homepage directions as single self-contained
HTML files, plus the palette and screenshot tooling. See [design/README.md](design/README.md).

## Where this is going

Blocked on the club, not on code:

- [ ] **Committee picks a direction** — nothing above the foundation can be built until then
- [ ] **The logo as an original file**, so the crest hexes can be sampled exactly and the
      navbar mark traced (the full crest's ribbon lettering is unreadable below ~80px)
- [ ] **Real content** — history, committee, squad, fixtures, training times, photographs

Then, in order: Sanity CMS and schemas → fixtures and results → the join enquiry form
→ gallery → squad and news → SEO, sitemap and an editor guide for whoever inherits this.

The editor guide matters more than usual here. A student committee turns over every
year, so whoever takes this on has to be able to run it without reading code and
without being able to ask the person who built it.
