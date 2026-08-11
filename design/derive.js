/* Derive AA-compliant palettes anchored to the HKUCC crest hues.
   Method: keep the crest hue (and roughly its saturation), then solve for the
   lightness that clears the required contrast ratio. Crest fidelity by hue,
   accessibility by construction rather than by luck. */

/* ── crest anchors — sampled from design/logo.svg, not eyeballed ──
   Taken by rendering the crest and reading the fill at a known point inside
   each element, so these are the club's actual colours rather than an
   approximation of a photograph of them.

     red      chief and ribbon   (both sample #D82623 — one true club red)
     gold     the HKUCC lettering
     green    shield, dexter
     blue     shield, sinister
     willow   the crossed bats
     leather  bat handles and the ribbon folds

   The earlier screenshot guesses were close on red, blue and gold, but wrong
   on willow (44° -> 34.5°, a warm amber rather than pale cream) and leather
   (20.6° -> 13.2°). d2's paper tint is derived from willow, so that one
   mattered. */
const CREST = {
  red:     '#D82623',
  gold:    '#D8B818',
  green:   '#008F76',
  blue:    '#1C7AB3',
  willow:  '#F8BF72',
  leather: '#67392C',
};

// ── colour maths ──
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();

const lum = h => {
  const c = hex2rgb(h).map(v => v / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function hex2hsl(hex) {
  const [r, g, b] = hex2rgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + 360) % 360;
  const l = (mx + mn) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s * 100, l * 100];
}

function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
          : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgb2hex(t.map(v => (v + m) * 255));
}

/* Solve along a hue for the lightness nearest `preferL` that clears `ratio`
   against `bg`. dir: 'darker' | 'lighter' | 'auto'. */
function solve(anchor, bg, ratio, { sat = null, preferL = null, dir = 'auto' } = {}) {
  const [h, s0, l0] = hex2hsl(anchor);
  const s = sat === null ? s0 : sat;
  const target = preferL === null ? l0 : preferL;
  const bgLum = lum(bg);
  const dirs = dir === 'auto' ? (bgLum > 0.35 ? ['darker'] : ['lighter']) : [dir];
  let best = null;
  for (const d of dirs) {
    for (let step = 0; step <= 100; step += 0.25) {
      const l = d === 'darker' ? target - step : target + step;
      if (l < 0 || l > 100) continue;
      const c = hsl2hex(h, s, l);
      if (cr(c, bg) >= ratio) { best = c; break; }
    }
  }
  return best;
}

// fixed-lightness tint on a crest hue (for surfaces, which carry no text themselves)
const tint = (anchor, l, sat = null) => {
  const [h, s0] = hex2hsl(anchor);
  return hsl2hex(h, sat === null ? s0 : sat, l);
};

const BODY = 4.5, LARGE = 3.0;

// ══ D1 "Matchday" — dark, bold, sports-broadcast ══
const d1 = {};
d1.pitch    = tint(CREST.green, 10, 55);   // page background
d1.pitch2   = tint(CREST.green, 15, 48);   // elevated tiles
d1.bone     = solve(CREST.willow, d1.pitch, BODY, { preferL: 95, sat: 42, dir: 'lighter' });
d1.sand     = solve(CREST.willow, d1.pitch, BODY, { preferL: 80, sat: 50, dir: 'lighter' });
d1.sage     = solve(CREST.green, d1.pitch2, BODY, { preferL: 62, sat: 20, dir: 'lighter' });
d1.ball     = solve(CREST.red, '#FFFFFF', BODY, { dir: 'darker' });   // red fill, white label
d1.ballText = solve(CREST.red, d1.pitch, BODY, { dir: 'lighter' });   // red AS text on pitch
d1.gold     = solve(CREST.gold, d1.pitch, BODY, { dir: 'lighter' });  // gold as text on pitch
d1.goldRule = CREST.gold;                                             // decorative rule only

// ══ D2 "Since 1913" — heritage, printed paper ══
const d2 = {};
d2.paper    = tint(CREST.willow, 91, 40);
d2.paper2   = tint(CREST.willow, 87, 34);
d2.ink      = solve(CREST.leather, d2.paper, 15, { preferL: 12, sat: 12, dir: 'darker' });
d2.ink2     = solve(CREST.leather, d2.paper2, BODY, { preferL: 40, sat: 10, dir: 'darker' });
/* D2 is the heritage direction: solving for the AA *floor* returns vivid,
   modern colours (a #D02218 pillar-box red). Take the crest hues down to
   printed-ink depth instead — still crest-faithful, and far past 4.5:1. */
d2.green    = tint(CREST.green, 22, 80);
d2.oxblood  = tint(CREST.red, 27, 72);
d2.brass    = tint(CREST.gold, 26, 78);   // gold is the weakest hue — needs the most darkening
d2.blue     = tint(CREST.blue, 29, 62);
d2.onGreen  = solve(CREST.willow, d2.green, BODY, { preferL: 90, sat: 40, dir: 'lighter' });
d2.rule     = tint(CREST.leather, 72, 14);

// ══ D3 "The Innings" — editorial, light + dark ══
const d3l = {};
d3l.bg       = tint(CREST.willow, 98, 30);
d3l.surface  = tint(CREST.willow, 94, 30);
d3l.ink      = solve(CREST.green, d3l.bg, 15, { preferL: 10, sat: 10, dir: 'darker' });
d3l.ink2     = solve(CREST.green, d3l.surface, BODY, { preferL: 40, sat: 8, dir: 'darker' });
d3l.rule     = tint(CREST.willow, 84, 22);
d3l.accent   = solve(CREST.green, d3l.bg, BODY, { dir: 'darker' });
d3l.accentSoft = tint(CREST.green, 92, 35);
d3l.onAccent = solve(CREST.willow, d3l.accent, BODY, { preferL: 96, sat: 30, dir: 'lighter' });
d3l.red      = solve(CREST.red, d3l.bg, BODY, { dir: 'darker' });
d3l.redSoft  = tint(CREST.red, 93, 60);
// tag chips sit on the soft tints, which are lighter than the page — the text
// colour has to be solved against the chip, not the page.
d3l.accentOnSoft = solve(CREST.green, d3l.accentSoft, BODY, { dir: 'darker' });
d3l.redOnSoft    = solve(CREST.red, d3l.redSoft, BODY, { dir: 'darker' });

const d3d = {};
d3d.bg       = tint(CREST.green, 7, 20);
d3d.surface  = tint(CREST.green, 11, 16);
d3d.ink      = solve(CREST.willow, d3d.bg, 15, { preferL: 94, sat: 30, dir: 'lighter' });
d3d.ink2     = solve(CREST.green, d3d.surface, BODY, { preferL: 62, sat: 10, dir: 'lighter' });
d3d.rule     = tint(CREST.green, 20, 14);
d3d.accent   = solve(CREST.green, d3d.bg, BODY, { dir: 'lighter' });
d3d.accentSoft = tint(CREST.green, 16, 30);
d3d.onAccent = d3d.bg;
d3d.red      = solve(CREST.red, d3d.bg, BODY, { dir: 'lighter' });
d3d.redSoft  = tint(CREST.red, 17, 35);
d3d.accentOnSoft = solve(CREST.green, d3d.accentSoft, BODY, { dir: 'lighter' });
d3d.redOnSoft    = solve(CREST.red, d3d.redSoft, BODY, { dir: 'lighter' });

// ── report ──
// With --css the only output is the stylesheet, so it can be redirected to a file.
const QUIET = process.argv.includes('--css');
const show = (name, obj) => {
  if (QUIET) return;
  console.log(`\n── ${name} ──`);
  for (const [k, v] of Object.entries(obj)) console.log(`  --${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v};`);
};
show('D1 Matchday', d1); show('D2 Since 1913', d2);
show('D3 Innings — light', d3l); show('D3 Innings — dark', d3d);

// ── verification ──
const pairs = [
  ['D1 bone on pitch', d1.bone, d1.pitch, BODY],
  ['D1 sand on pitch', d1.sand, d1.pitch, BODY],
  ['D1 sage on pitch', d1.sage, d1.pitch, BODY],
  ['D1 sage on pitch-2', d1.sage, d1.pitch2, BODY],
  ['D1 ball-text on pitch', d1.ballText, d1.pitch, BODY],
  ['D1 gold on pitch', d1.gold, d1.pitch, BODY],
  ['D1 white on ball', '#FFFFFF', d1.ball, BODY],
  ['D1 pitch on bone (btn)', d1.pitch, d1.bone, BODY],
  ['D1 gold-rule on pitch (decor)', d1.goldRule, d1.pitch, LARGE],
  ['D2 ink on paper', d2.ink, d2.paper, BODY],
  ['D2 ink-2 on paper', d2.ink2, d2.paper, BODY],
  ['D2 ink-2 on paper-2', d2.ink2, d2.paper2, BODY],
  ['D2 green on paper', d2.green, d2.paper, BODY],
  ['D2 oxblood on paper', d2.oxblood, d2.paper, BODY],
  ['D2 brass on paper', d2.brass, d2.paper, BODY],
  ['D2 blue on paper', d2.blue, d2.paper, BODY],
  ['D2 on-green on green', d2.onGreen, d2.green, BODY],
  ['D3L ink on bg', d3l.ink, d3l.bg, BODY],
  ['D3L ink-2 on bg', d3l.ink2, d3l.bg, BODY],
  ['D3L ink-2 on surface', d3l.ink2, d3l.surface, BODY],
  ['D3L accent on bg', d3l.accent, d3l.bg, BODY],
  ['D3L accent-on-soft on accent-soft', d3l.accentOnSoft, d3l.accentSoft, BODY],
  ['D3L on-accent on accent', d3l.onAccent, d3l.accent, BODY],
  ['D3L red on bg', d3l.red, d3l.bg, BODY],
  ['D3L red-on-soft on red-soft', d3l.redOnSoft, d3l.redSoft, BODY],
  ['D3D ink on bg', d3d.ink, d3d.bg, BODY],
  ['D3D ink-2 on bg', d3d.ink2, d3d.bg, BODY],
  ['D3D ink-2 on surface', d3d.ink2, d3d.surface, BODY],
  ['D3D accent on bg', d3d.accent, d3d.bg, BODY],
  ['D3D accent-on-soft on accent-soft', d3d.accentOnSoft, d3d.accentSoft, BODY],
  ['D3D on-accent on accent', d3d.onAccent, d3d.accent, BODY],
  ['D3D red on bg', d3d.red, d3d.bg, BODY],
  ['D3D red-on-soft on red-soft', d3d.redOnSoft, d3d.redSoft, BODY],
];
if (!QUIET) console.log('\n── contrast verification ──');
let fails = 0;
for (const [n, fg, bg, need] of pairs) {
  const r = cr(fg, bg), ok = r >= need;
  if (!ok) {
    fails++;
    // Loud even when generating CSS — never emit a stylesheet that fails AA.
    if (QUIET) console.error(`FAIL ${r.toFixed(2)}:1 (needs ${need})  ${n}   ${fg} on ${bg}`);
  }
  if (!QUIET) console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}:1  (needs ${need})  ${n}   ${fg} on ${bg}`);
}
if (!QUIET) console.log(`\n${fails} failing pair(s) of ${pairs.length}`);
if (fails) {
  if (QUIET) console.error(`\nRefusing to emit CSS: ${fails} pair(s) fail WCAG AA.`);
  process.exitCode = 1;
}

/* ── emit Tailwind 4 @theme tokens for src/app/globals.css ──
   The site ships D2 "Since 1913". Its material names (paper, oxblood, brass)
   describe the direction; the tokens are published under semantic names so a
   later change of direction does not rename every call site.
   Run: npm run tokens */
const TOKENS = {
  bg:       d2.paper,
  surface:  d2.paper2,
  ink:      d2.ink,
  ink2:     d2.ink2,
  rule:     d2.rule,
  accent:   d2.green,     // the club green — leads
  onAccent: d2.onGreen,
  red:      d2.oxblood,   // signals results; taken to printed-ink depth
  brass:    d2.brass,     // the gilt detail
  blue:     d2.blue,      // crest sinister, used sparingly
};

if (QUIET && !fails) {
  const kebab = k => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  const block = (o, ind = '  ') => Object.entries(o)
    .map(([k, v]) => `${ind}--color-${kebab(k)}: ${v};`).join('\n');
  // "static" matters: Tailwind 4 tree-shakes @theme variables that no utility
  // references, which silently drops any token only reached through an inline
  // style or a var() in hand-written CSS.
  //
  // No dark block, deliberately. D2 is a committed light world — an archival
  // printed record — so there is no dark variant to emit, and globals.css
  // declares `color-scheme: light` so native controls follow.
  console.log(`/* GENERATED by design/derive.js — do not hand-edit.
   Regenerate after updating the CREST anchors:  npm run tokens
   Every pair below is verified >=4.5:1 by the same script.

   D2 "Since 1913" is a committed light world, so there is deliberately no dark
   variant here. See design/README.md. */
@theme static {
${block(TOKENS)}
}`);
}
