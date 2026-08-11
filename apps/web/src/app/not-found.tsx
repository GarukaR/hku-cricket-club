// The 404, in D2's materials.
//
// Without this file Next serves its own error page, which inlines
// `@media (prefers-color-scheme: dark){body{color:#fff;background:#000}}` into
// the body — an inline rule on the same selector as tokens.css, so it wins, and
// a visitor with a dark OS gets a black page in system fonts on a site that
// commits to a single light world. That was issue #22.
//
// So this page is the club's letterhead and nothing borrowed: same masthead,
// same contents line, same marginalia device as the record. A wrong address is
// still the club's stationery.

import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { navItems } from "@/content/club";
import { builtSections } from "@/lib/nav";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  // Never the whole nav: the pending items are set as plain text there, and a
  // list offered as the way back must not contain anywhere that isn't.
  const sections = builtSections(navItems);

  return (
    <>
      <header>
        <Container>
          {/* No standfirst. The club introduces itself on the front page; here
              the letterhead is only saying whose page you have landed on. */}
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main>
        <Container>
          <div className={styles.miss}>
            <div>
              <h2 className={styles.heading}>Played and missed.</h2>
              <p className={styles.prose}>
                Whatever you were after, it is not at this address. It may have
                been catalogued elsewhere, or it may be one of the many things
                about a hundred and thirteen seasons that nobody has typed up
                yet.
              </p>
              <Link className={styles.back} href="/">
                Return to the front page
              </Link>
            </div>

            <Marginalia labelledBy="in-the-record">
              <h3 id="in-the-record" className={styles.marginHeading}>
                In the record
              </h3>
              <ul className={styles.sections}>
                {sections.map((item) => (
                  <li key={item.label}>
                    <Link className={styles.section} href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <dl>
                <dt>Status</dt>
                {/* The machine's own answer, kept where the club keeps its
                    standing facts rather than set as a hero numeral. It is the
                    one fact on this page a developer came for. */}
                <dd className={styles.status}>404 · not found</dd>
              </dl>
            </Marginalia>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
