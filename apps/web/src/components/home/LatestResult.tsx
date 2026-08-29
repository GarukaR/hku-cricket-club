import { Scoreline } from "@/components/Scoreline";
import { SectionHeading } from "@/components/SectionHeading";
import { longDate } from "@/lib/dates";
import { facts, type PlayedMatch } from "@/lib/match";

/** The club's last result, at display scale — the page's one hero.
 *
 *  Takes a whole Match rather than loose figures, so it reads a Match out of the
 *  CMS unchanged. The scoreline itself is shared with a Match's own page — see
 *  @/components/Scoreline. */
export function LatestResult({ match }: { match: PlayedMatch }) {
  return (
    <section aria-labelledby="latest-result">
      <SectionHeading id="latest-result">
        Last result{match.competition ? ` — ${match.competition}` : ""}
      </SectionHeading>
      <Scoreline
        result={match.result}
        team={match.team}
        opponent={match.opponent}
        facts={facts(longDate(match.date), match.ground, match.format)}
      />
    </section>
  );
}
