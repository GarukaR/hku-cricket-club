import type { Metadata } from "next";
import { newsreader, plexSans, plexMono } from "./fonts";
import "./globals.css";

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
