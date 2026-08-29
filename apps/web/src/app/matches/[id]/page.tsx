// A Match's own page — the scoreline, HKU's full card, the opposition's card
// as display-only detail, and the deep link to CricClubs (docs/PLAN.md, issue
// #12).
//
// Three Matches read as three different, deliberate things (the ticket's own
// visual check): a scored league match carries both cards; the sunday social
// side's matches carry a Result and say plainly that no card exists, because
// that is a normal state and not a broken record (CONTEXT.md — Unscored
// Match); and a fixture not yet played renders as a fixture, with nothing
// pretending to be a result.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { Marginalia } from "@/components/Marginalia";
import { Masthead } from "@/components/Masthead";
import { Scoreline } from "@/components/Scoreline";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { HkuCard } from "@/components/match/HkuCard";
import { OppositionCard } from "@/components/match/OppositionCard";
import { longDate } from "@/lib/dates";
import { facts, isPlayed } from "@/lib/match";
import { allMatchIds, appearancesFor, matchById } from "@/lib/matches";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const ids = await allMatchIds();
  if (ids.length === 0) {
    // Cache Components refuses to build a route whose generateStaticParams
    // returns nothing at all (Next.js: "empty-generate-static-params") — and
    // an empty record is a real, tested state here (docs/cms.md), not a
    // hypothetical one. No id the CMS ever hands out is non-numeric, so this
    // resolves the same way a bad address does: loadMatch's own
    // Number.isInteger check fails it, and the page calls notFound().
    return [{ id: "__placeholder__" }];
  }
  return ids.map((id) => ({ id: String(id) }));
}

async function loadMatch(id: string) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return undefined;
  return matchById(numeric);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const match = await loadMatch((await params).id);
  return { title: match ? `${match.team} v ${match.opponent}` : "Not found" };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const match = await loadMatch((await params).id);
  if (!match) notFound();

  const played = isPlayed(match) ? match : undefined;
  const appearances = played ? await appearancesFor(played.id) : [];
  const oppositionInnings = played?.result.innings?.find(
    (innings) => innings.side !== "HKU",
  );

  return (
    <>
      <a className="skip-link" href="#match">
        Skip to the match
      </a>

      <header>
        <Container>
          <Masthead />
          <SiteNav />
        </Container>
      </header>

      <main id="match">
        <Container>
          <div className={styles.layout}>
            <article>
              <SectionHeading id="match-heading">
                {played ? "v " : "Fixture — v "}
                {match.opponent}
              </SectionHeading>

              {played ? (
                <>
                  <Scoreline
                    result={played.result}
                    team={played.team}
                    opponent={played.opponent}
                    facts={facts(longDate(played.date), played.ground, played.format)}
                  />

                  {appearances.length > 0 ? (
                    <>
                      <HkuCard team={played.team} appearances={appearances} />
                      {oppositionInnings && (
                        <OppositionCard
                          opponent={played.opponent}
                          innings={oppositionInnings}
                        />
                      )}
                    </>
                  ) : match.scorecard ? (
                    <p className={styles.unscored}>
                      A scorecard exists for this match, but its detail has
                      not been entered here yet — the result above is what
                      the club has recorded so far. The link below goes
                      straight to CricClubs for the full card.
                    </p>
                  ) : (
                    <p className={styles.unscored}>
                      No scorecard exists for this match. Not every one of the
                      club&rsquo;s sides is scored — the result above is the
                      whole record this game has (CONTEXT.md — Unscored
                      Match).
                    </p>
                  )}
                </>
              ) : (
                <p className={styles.fixture}>
                  Not yet played. Check back after{" "}
                  {longDate(match.date)}
                  {match.time ? ` at ${match.time}` : ""} for the result.
                </p>
              )}

              {match.scorecard && (
                <p className={styles.deepLink}>
                  <a href={match.scorecard} target="_blank" rel="noreferrer">
                    Full scorecard on CricClubs ↗
                  </a>
                </p>
              )}
            </article>

            <Marginalia labelledBy="match-facts">
              <SectionHeading id="match-facts">Match facts</SectionHeading>
              <dl>
                <dt>Side</dt>
                <dd>{match.team}</dd>
                {match.competition && (
                  <>
                    <dt>Competition</dt>
                    <dd>{match.competition}</dd>
                  </>
                )}
                <dt>Date</dt>
                <dd>
                  {longDate(match.date)}
                  {match.time ? `, ${match.time}` : ""}
                </dd>
                <dt>Ground</dt>
                <dd>{facts(match.ground, match.venue)}</dd>
                {match.format && (
                  <>
                    <dt>Format</dt>
                    <dd>{match.format}</dd>
                  </>
                )}
              </dl>
            </Marginalia>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
