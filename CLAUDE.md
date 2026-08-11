# HKU Cricket Club

The official website of the Hong Kong University Cricket Club — founded 1913,
home ground Sandy Bay, motto *IN LUDO SAPIENTIA*.

**Read [docs/PLAN.md](docs/PLAN.md) before starting work.** It records the
settled decisions, the reasoning behind them, and — importantly — the repo's
actual current state, which is not what the file tree suggests. Domain
vocabulary is in [CONTEXT.md](CONTEXT.md); use its terms and avoid the synonyms
it lists.

## Design

The bar is high. This is a portfolio piece as well as a real club's website, so
design work here should be genuinely excellent rather than merely inoffensive.

**Use `/impeccable` for interface work.** It respects a committed visual world,
which is what this project has.

**The visual direction is already chosen and is not open for reinterpretation.**
It is **D2 "Since 1913"** — a printed university record: centred masthead under
a double rule, results as an archive table, marginalia for standing facts,
committed light theme — carrying **d1's scoreline treatment** for the latest
result. Two other directions were designed, prototyped and rejected for reasons
recorded in `docs/PLAN.md` and `design/README.md`.

The design skills vendored in `.agents/skills/` — `design-taste-frontend`,
`high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`,
`redesign-existing-projects` — may inform **craft**: spacing discipline, shadow
and motion quality, and avoiding the defaults that make AI work look generic.

They may **not** redirect the **direction**. Where any of them implies a
different aesthetic — bento grids, brutalist framing, a prescribed font stack, a
"modern SaaS" default — D2 wins, without discussion. If you believe the
direction is genuinely wrong, argue it explicitly; never restyle quietly.

`imagegen-frontend-web` and `brandkit` are fine for *placeholder* imagery while
the club's real photographs are outstanding, provided the output serves D2 and
is clearly marked as placeholder. The navbar mark is **not** a job for them — it
gets traced from `design/Cricket logo_final2.ai`, because it must be the club's
actual crest, not an interpretation of it.

### Colour is generated, never chosen

Every colour descends from the club crest. `design/derive.js` holds each crest
hue — sampled from `design/logo.svg`, not guessed — and solves for the lightness
that clears WCAG AA against the background it actually lands on.

- `apps/web/src/app/tokens.css` is **generated**. Never hand-edit it. Change the `CREST`
  anchors and run `npm run tokens`.
- Style through the tokens (`var(--color-accent)`), never a literal hex.
- The script refuses to emit CSS if any pair fails AA, so a failing palette
  cannot reach the stylesheet.
- There is no dark theme, deliberately. D2 commits to a single light world.

## Agent skills

### Issue tracker

GitHub Issues on `GarukaR/hku-cricket-club`, via the `gh` CLI. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
