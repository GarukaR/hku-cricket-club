# Design — Phase 0

Homepage mockups for the club website rebuild, in three directions. **No production
code here.** The club picks a direction from these before any of the site is built,
because a change costs minutes in a mockup and days once components exist.

| File | Direction | What it argues |
|---|---|---|
| `d1-matchday.html` | **Matchday** | Broadcast scoreboard. The scoreline is the largest object on the page, fixtures scroll as a rail, one loud colour carries every call to action. Committed dark theme. |
| `d2-since1913.html` | **Since 1913** | A printed university record. Centred masthead under a double rule, results as an archive table, marginalia for standing facts. Committed light theme. |
| `d3-innings.html` | **The Innings** | The club as a publication. The lead match report is the hero rather than a slogan; asymmetric photo grid. Supports both light and dark themes. |

Open any of them directly in a browser — each is a single self-contained file with no
build step and no external requests.

## The palette is generated, not hand-picked

All three take their colours from the club crest:

| Anchor | Hex | Where it is in the crest |
|---|---|---|
| red | `#E63329` | chief, ribbon, ball |
| gold | `#EFC31F` | HKUCC lettering |
| green | `#0F8A6A` | shield, dexter |
| blue | `#2E86C1` | shield, sinister |
| willow | `#EDD9A0` | bats |
| leather | `#7A4B34` | handles, gloves |

> **Sampled, not guessed.** These are read out of `design/logo.svg` by rendering the
> crest and picking the fill at a known point inside each element. The club's motto,
> **IN LUDO SAPIENTIA**, is in the ribbon.
>
> The supplied SVG is an auto-trace rather than a redraw — hundreds of near-identical
> reds and an opaque white background — so it is a reliable source for colour but not
> a shipping asset. The ribbon lettering is unreadable much below 80px, which is why
> the navbar mark (below) is a redraw rather than the crest scaled down — and, as it
> turned out, a redraw of this file rather than of `Cricket logo_final2.ai`.

Used at full strength these four saturated colours read as a fairground, and gold
fails contrast badly on white. So `derive.js` holds each crest **hue** and solves for
the **lightness** that clears WCAG AA against the specific background the colour
actually lands on — crest fidelity by hue, accessibility by construction rather than
by eye.

```bash
node design/derive.js    # prints every token, then verifies all 33 pairs
```

Two things this caught that guesswork would not:

- **A colour solved against the page cannot be reused on a tinted chip.** The soft tag
  backgrounds sit closer in lightness to the accent than the page does, so the accent
  failed at 4.09:1 on its own chip. Chips need separate `--accent-on-soft` /
  `--red-on-soft` tokens.
- **The AA floor is a constraint, not a colour choice.** For the heritage direction the
  solver returned a pillar-box `#D02218` — compliant, and completely wrong for the
  page. Those hues were taken deeper by hand and re-verified.

## Screenshots

```bash
node design/shoot.js     # renders all three at desktop + mobile, both themes for D3
```

Also reports horizontal overflow and any JS errors per page. Output PNGs are not
committed — they are regenerable and run to ~6 MB.

## The navbar mark (#25)

`Cricket logo_final2.ai` turned out to have no embedded PDF-compatible content —
Illustrator's own placeholder text is all any tool here can read from it, and
neither the club nor this project has Illustrator to re-save it with that option
on. So the mark below is hand-redrawn from `design/logo.svg` instead: a
lower-fidelity source than the ticket asked for, but the only one available, and
its colours are already this project's sampled ground truth (see above).

Three candidates were drawn and rendered at the sizes the mark actually has to
work at — 64px masthead, 28px navbar, 16px favicon — on the real paper
background, before anything was committed:

| Candidate | Kept | Dropped | Verdict |
|---|---|---|---|
| **A — chosen** | Shield, chief, green/blue field, crossed bats and ball | HKUCC lettering, motto ribbon | Closest to the original crest in spirit; still reads clearly at 16px. |
| B | Bats and ball only, in a plain roundel | The shield entirely | Simplest and most bulletproof at tiny sizes, but reads as a generic sport mark rather than this club's crest — nothing in it is specific to HKUCC once the shield is gone. |
| C | Shield, chief, green/blue field | Crossed bats and ball | Keeps the one shape no other Hong Kong club shares, but drops the only part of the mark that says "cricket" at a glance. |

The chosen redraw is `design/crest-mark.svg` — the canonical copy, with the
sampled hex values and the reason they are hardcoded (a favicon cannot resolve a
CSS custom property) recorded in its own header comment. `apps/web/src/app/icon.svg`
and `Masthead.tsx` both carry the same shape; keep all three in sync by hand if
it is ever redrawn again.

## Still needed from the club

- Real content: history copy, committee list, squad, fixtures, training times, photos.
