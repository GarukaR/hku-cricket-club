// PROTOTYPE — throwaway. Three answers to one question: can d1's broadcast
// scoreline live inside d2's printed-record frame?
//
//   A  Interrupts the page  — d1 transplanted whole, full-bleed and dark.
//   B  Becomes the page     — the scoreline redrawn in the document's own ink.
//   C  Sits on the page     — the scorecard as a tipped-in physical object.
//
// The frame is identical in all three (see chrome.tsx). What differs is the
// module and where it falls in the page order.

import {
  Admission,
  ClubSection,
  Foot,
  Lede,
  Masthead,
  Nav,
  Plates,
  RecordTable,
} from "./chrome";
import { lastResult as R, nextFixture as N } from "./data";

export const variantNames: Record<string, string> = {
  A: "Inset plate — d1 transplanted whole",
  B: "Letterpress — scoreline as document",
  C: "Tipped-in card — scorecard as object",
};

/* ══ A ════════════════════════════════════════════════════════════════
   The literal transplant. A dark broadcast band cuts across the paper
   page at full bleed. The honest test of collision: nothing is softened.
   ═════════════════════════════════════════════════════════════════════ */
export function VariantA() {
  return (
    <>
      <p className="flag">
        Variant A · Inset plate — d1&rsquo;s scoreboard transplanted whole
      </p>
      <div className="wrap">
        <Masthead />
        <Nav />
        <Lede />
      </div>

      <section className="a-band">
        <div className="a-grid">
          <div className="a-cell">
            <h2>Last result</h2>
            <div className="a-score">
              <span className="a-side us">{R.us}</span>
              <span className="a-runs">
                {R.usScore}/{R.usWkts}
              </span>
            </div>
            <div className="a-score">
              <span className="a-side them">{R.them}</span>
              <span className="a-runs">{R.themScore} a.o.</span>
            </div>
            <span className="a-verdict">{R.verdict}</span>
            <p className="a-meta">
              {R.date} · {R.ground} · {R.format}
            </p>
          </div>
          <div className="a-cell">
            <h2>Next fixture</h2>
            <span className="a-opp">vs {N.opponent}</span>
            <p className="a-meta">
              {N.date} · {N.time} · {N.ground} · {N.venue}
            </p>
            <div className="a-count">
              {N.countdown.map((c) => (
                <div key={c.unit}>
                  <b>{c.n}</b>
                  <span>{c.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div style={{ paddingTop: "clamp(2rem,5vw,3rem)" }}>
          <RecordTable />
        </div>
        <ClubSection />
        <Plates />
      </div>
      <Admission />
      <Foot note="VARIANT A — the d1 strip is dropped in unmodified: pitch-dark ground, mono figures, ball-red verdict chip, countdown. It keeps every bit of d1's impact, at the cost of reading as a foreign object pasted into the record." />
    </>
  );
}

/* ══ B ════════════════════════════════════════════════════════════════
   No panel. The scoreline leads the document, set in the page's own ink
   at display size — a result announced in print rather than on a screen.
   ═════════════════════════════════════════════════════════════════════ */
export function VariantB() {
  return (
    <>
      <p className="flag">
        Variant B · Letterpress — the scoreline set in the page&rsquo;s own ink
      </p>
      <div className="wrap">
        <Masthead
          standfirst={
            <p className="b-standfirst">
              One hundred and thirteen seasons of cricket on the western shore
              of Hong Kong Island, played by students, staff and graduates of
              the University — and by anyone they can persuade to hold a bat.
            </p>
          }
        />
        <Nav />

        <section className="b-lead">
          <div>
            <h2>Last result — {R.competition}</h2>
            <div className="b-line">
              <span className="b-side">{R.us}</span>
              <span className="b-runs">
                {R.usScore}
                <sup>/{R.usWkts}</sup>
              </span>
            </div>
            <div className="b-line them">
              <span className="b-side">{R.them}</span>
              <span className="b-runs">{R.themScore}</span>
            </div>
            <div className="b-verdict">
              <strong>{R.verdict}</strong>
              <span>
                {R.date} · {R.ground} · {R.format}
              </span>
            </div>
          </div>

          <aside className="b-next">
            <h2>Next fixture</h2>
            <span className="who">{N.opponent}</span>
            <dl>
              <dt>When</dt>
              <dd>
                {N.date}, {N.time}
              </dd>
              <dt>Ground</dt>
              <dd>
                {N.ground} · {N.venue}
              </dd>
              <dt>Format</dt>
              <dd>{N.format}</dd>
            </dl>
          </aside>
        </section>

        <RecordTable />
        <ClubSection proseClass="b-prose" />
        <Plates />
      </div>
      <Admission />
      <Foot note="VARIANT B — the scoreline keeps d1's structure (two sides, oversized figures, verdict, meta) but every material is d2's: serif, oyster paper, oxblood verdict, hairline rules. The lede is folded into the letterhead above the double rule so the result is the page's only hero, and the next fixture takes d2's marginalia voice rather than floating as a third headline. The drop cap moves to The Club, the one place with running prose." />
    </>
  );
}

/* ══ C ════════════════════════════════════════════════════════════════
   The scorecard as an artefact laid onto the page — ruled border, laid
   panel, brass inner rule, with the next fixture as a slip alongside.
   ═════════════════════════════════════════════════════════════════════ */
export function VariantC() {
  return (
    <>
      <p className="flag">
        Variant C · Tipped-in card — the scorecard as a physical object
      </p>
      <div className="wrap">
        <Masthead />
        <Nav />
        <Lede />

        <section className="c-zone">
          <div className="c-card">
            <p className="c-hd">
              <span>Last result</span>
              <em>{R.competition}</em>
            </p>
            <div className="c-row">
              <span className="c-team">{R.us}</span>
              <span className="c-fig">
                {R.usScore}/{R.usWkts}
              </span>
            </div>
            <div className="c-row them">
              <span className="c-team">{R.them}</span>
              <span className="c-fig">{R.themScore}</span>
            </div>
            <div className="c-rule">
              <span className="c-verdict">{R.verdict}</span>
              <p className="c-meta">
                {R.date} · {R.ground} · {R.format}
              </p>
            </div>
          </div>

          <div className="c-slip">
            <p className="c-hd">
              <span>Next fixture</span>
            </p>
            <span className="who">{N.opponent}</span>
            <span className="c-when">
              {N.date} · {N.time}
            </span>
            <span className="c-when">
              {N.ground} · {N.venue} · {N.format}
            </span>
            <p className="c-in">
              In {N.countdown[0].n} days {N.countdown[1].n} hrs
            </p>
          </div>
        </section>

        <RecordTable />
        <ClubSection />
        <Plates />
      </div>
      <Admission />
      <Foot note="VARIANT C — the result is neither dissolved into the page nor pasted over it: it is framed as an inserted artefact, a scorecard laid on the record. Mono figures survive from d1 as a data cue; the brass inner rule and laid panel keep it in d2's world." />
    </>
  );
}
