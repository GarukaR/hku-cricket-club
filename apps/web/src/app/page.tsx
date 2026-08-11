// The homepage — D2 "Since 1913" carrying d1's scoreline, as prototype variant B
// settled it (docs/PLAN.md, design/README.md).
//
// The page's whole argument is the order: letterhead, then the result at display
// scale, then the record, then the club. Everything above the double rule is who
// the club is; everything below it is what happened. That is why the opening
// statement is a standfirst inside the Masthead rather than a lede of its own —
// it leaves the scoreline as the only hero on the page.

import { Container } from "@/components/Container";
import { Masthead } from "@/components/Masthead";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Admission } from "@/components/home/Admission";
import { LeadStory } from "@/components/home/LeadStory";
import { Plates } from "@/components/home/Plates";
import { RecentRecord } from "@/components/home/RecentRecord";
import { TheClub } from "@/components/home/TheClub";
import { latestResult, nextMatch, recentRecord, season } from "@/content/matches";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#record">
        Skip to the record
      </a>

      <header>
        <Container>
          <Masthead
            standfirst={
              <>
                One hundred and thirteen seasons of cricket on the western shore
                of Hong Kong Island, played by students, staff and graduates of
                the University — and by anyone they can persuade to hold a bat.
              </>
            }
          />
          <SiteNav />
        </Container>
      </header>

      <main id="record">
        <Container>
          <LeadStory latest={latestResult} next={nextMatch} />
          <RecentRecord matches={recentRecord} season={season} />
          <TheClub />
          <Plates />
        </Container>
        <Admission />
      </main>

      <SiteFooter
        note={
          <>
            Sample content. The scores, dates, margins and the 1988 handbook
            quotation are invented, and stand in until match data is imported
            from CricClubs. The club&rsquo;s photographs and the crest mark are
            still to come.
          </>
        }
      />
    </>
  );
}
