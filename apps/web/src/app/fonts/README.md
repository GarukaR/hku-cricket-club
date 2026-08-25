# The vendored faces

D2 is set in three families. They live here rather than being fetched from
Google at build time — see [#27](https://github.com/GarukaR/hku-cricket-club/issues/27)
for what that cost: an intermittently failing build that named a module
resolution error when what had actually happened was a failed download.

`index.ts` declares them with `next/font/local`. Nothing else should load a
face.

## What is here

| File | Family | Weights | Style |
|---|---|---|---|
| `newsreader.woff2` | Newsreader | 400–500 (variable) | roman |
| `newsreader-italic.woff2` | Newsreader | 400–500 (variable) | **real italic** |
| `plex-sans.woff2` | IBM Plex Sans | 400–600 (variable) | roman |
| `plex-mono-400.woff2` | IBM Plex Mono | 400 | roman |
| `plex-mono-500.woff2` | IBM Plex Mono | 500 | roman |

Newsreader and Plex Sans are **variable** fonts: one file spans a weight range,
which is why 400 and 500 are not two files. Plex Mono is not variable, so its
two weights are two files.

The italic is a genuine cut and not a synthesised slant. The 1988 handbook
quotation on the homepage is set in it, and a browser-obliqued serif is visible
at that size. If these are ever regenerated, that is the one thing not to lose.

## Regenerating them

These are the latin subset, exactly as Google serves it. A `Chrome/62` user
agent is deliberate — it supports `woff2` but predates variable-font support, so
the API returns files sliced to the requested range rather than the full axis.

```
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
(KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'

curl -A "$UA" 'https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400..500;1,400..500'
curl -A "$UA" 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400..600'
curl -A "$UA" 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500'
```

Take the `/* latin */` block from each and download its `src` URL.

After regenerating, check the rendered homepage against the current one before
committing. D2 is a committed visual world (CLAUDE.md) and a font change must be
invisible to a reader.

## Licences

Both families are under the SIL Open Font License 1.1.

- `OFL-Newsreader.txt` — Newsreader, © 2020 The Newsreader Project Authors
- `OFL-IBM-Plex.txt` — IBM Plex Sans and Mono, © 2017 IBM Corp.
