// The club's full past record, one season at a time — the honest superset of
// the homepage's "Recent record", which only ever shows the current season.

import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { PageTitle } from "@/components/PageTitle";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { RecentRecord } from "@/components/home/RecentRecord";
import { archiveRecord } from "@/lib/matches";
import { seasonSlug } from "@/lib/seasons";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Archive" };

export default async function ArchivePage() {
  const seasons = await archiveRecord();

  return (
    <>
      <a className="skip-link" href="#archive">
        Skip to the archive
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="archive">
        <Container>
          <PageTitle id="archive-heading">Archive</PageTitle>
          {seasons.length > 0 ? (
            seasons.map(({ season, matches }) => (
              <RecentRecord
                key={season}
                matches={matches}
                title={season}
                id={`record-${seasonSlug(season)}`}
              />
            ))
          ) : (
            <p className={styles.empty}>No season has been recorded yet.</p>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
