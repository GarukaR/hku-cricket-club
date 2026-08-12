"use client";

// The page that renders when the root layout itself throws, in D2's materials.
//
// Without this file Next serves its own, which ships a `prefers-color-scheme:
// dark` branch — `--next-error-bg: #0a0a0a` — into a site that declares
// `color-scheme: light` and commits to a single light world. A visitor with a
// dark OS met a black page in system fonts. That was issue #24, and issue #22
// before it on the 404; this is the one route that ticket could not reach.
//
// It **replaces the root layout**, so it renders its own <html> and <body> and
// imports everything it needs. Nothing here can lean on layout.tsx.
//
// Deliberately quieter than the 404. That page is a wrong address and can afford
// its wit; this one appears when something is actually broken, and a joke lands
// worse. Single column, no contents line, no marginalia — the letterhead, what
// happened, and the way out.

import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";
import styles from "./global-error.module.css";

// The same three faces layout.tsx loads. Declared again rather than imported
// from it because this file replaces that layout entirely — and self-hosted at
// build time, so the page that renders when everything has failed still does not
// depend on a request to Google.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // The font variables land on <html> for the reason layout.tsx gives: Tailwind
    // declares --font-display on :root, and a var() there resolves only against
    // custom properties that also live on :root.
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <header>
          <Container>
            {/* No standfirst. The club introduces itself on the front page; here
                the letterhead is only saying whose page failed. */}
            <Masthead />
          </Container>
        </header>

        <main>
          <Container>
            <div className={styles.notice}>
              <h2 className={styles.heading}>Play has been suspended.</h2>
              <p className={styles.prose}>
                Something at our end failed while this page was being put
                together — nothing you did, and nothing you can fix from where
                you are standing. Trying again often works; if it does not, the
                front page will still be there.
              </p>

              <div className={styles.controls}>
                <button className={styles.retry} type="button" onClick={reset}>
                  Try again
                </button>
                {/* A plain anchor, not next/link, and the one place in the app
                    where that is right: the router is part of what has just
                    failed, so the way out has to be a fresh request for the
                    document rather than a client-side navigation through the
                    thing that broke. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a className={styles.home} href="/">
                  Return to the front page
                </a>
              </div>

              {error.digest && (
                <p className={styles.digest}>
                  {/* The one fact on this page anybody can act on: it names this
                      failure in the server log. Kept as a standing fact in the
                      club's smallest voice, the way the 404 keeps its status
                      code, rather than set as a hero. */}
                  <span className={styles.digestLabel}>Reference</span>
                  <span className={styles.digestValue}>{error.digest}</span>
                </p>
              )}
            </div>
          </Container>
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
