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
> a shipping asset. The ribbon lettering is unreadable much below 80px, so a
> simplified navbar mark still has to be drawn from `Cricket logo_final2.ai`.

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

## Still needed from the club

- A simplified navbar mark traced from the `.ai`, since the full crest's ribbon
  lettering dies below ~80px.
- Real content: history copy, committee list, squad, fixtures, training times, photos.
