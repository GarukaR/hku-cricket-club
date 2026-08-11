import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted at build time, so there is no render-blocking request to Google
// and no layout shift when the faces arrive.
// The italic is a real cut, not a synthesised slant: the club handbook quotation
// on the homepage is set in it, and a browser-obliqued serif is visible at that
// size.
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

export const metadata: Metadata = {
  title: {
    default: "Hong Kong University Cricket Club",
    template: "%s · HKU Cricket Club",
  },
  description:
    "The cricket club of the University of Hong Kong, founded 1913. Fixtures, results and how to join.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The font variables must land on <html>, not <body>: Tailwind's @theme
  // declares --font-display etc. on :root, and a var() there can only resolve
  // against custom properties that also exist on :root. On <body> they resolve
  // to nothing and every face silently falls back to system-ui.
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
