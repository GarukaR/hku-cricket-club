// The three faces D2 is set in, vendored and loaded from this repository.
//
// `next/font/google` downloads these at *build time*, so every CI run and every
// deploy depended on fonts.gstatic.com answering. When it did not, the build
// failed naming a module resolution error rather than a fetch, which sent the
// reader to node_modules and the lockfile instead of to the network (#27). A
// project whose architecture is about having no runtime dependencies had a
// build-time one left in it.
//
// The files are the same cuts Google serves, latin subset, so nothing about the
// rendered page changes.
//
// Declared here rather than in layout.tsx because global-error.tsx replaces that
// layout entirely and needs the same faces. One declaration, two importers —
// neither of which imports the other.

import localFont from "next/font/local";

/** Newsreader and Plex Sans are variable: one file spans a weight *range*, which
 *  is why 400 and 500 are not two files. Plex Mono is not, so its two weights
 *  are two files. The ranges are the ones Google reports for these cuts. */
export const newsreader = localFont({
  variable: "--font-newsreader",
  display: "swap",
  src: [
    { path: "./newsreader.woff2", weight: "400 500", style: "normal" },
    // A real italic cut, not a synthesised slant. The 1988 handbook quotation on
    // the homepage is set in it, and a browser-obliqued serif is visible at that
    // size — so this entry is the one thing here not to drop.
    { path: "./newsreader-italic.woff2", weight: "400 500", style: "italic" },
  ],
});

export const plexSans = localFont({
  variable: "--font-plex-sans",
  display: "swap",
  src: [{ path: "./plex-sans.woff2", weight: "400 600", style: "normal" }],
});

export const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [
    { path: "./plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
});
