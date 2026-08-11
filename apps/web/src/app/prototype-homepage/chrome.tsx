// PROTOTYPE — throwaway. The d2 page furniture, shared by all three variants.
//
// Normally variants should be free to throw out the layout. Here the layout is
// precisely the constant under test: the question is whether a broadcast
// scoreline survives *this* frame, so the frame has to be identical in all
// three. What the variants control is the scoreline module itself and where it
// sits in the page order.

import { navItems, plates, record, standingFacts } from "./data";

// `standfirst` pulls the club's opening statement up into the letterhead, so
// the double rule divides identity from content and the page below it has a
// single hero. Variants A and C omit it and keep <Lede /> instead.
export function Masthead({ standfirst }: { standfirst?: React.ReactNode }) {
  return (
    <div className="masthead">
      <div className="arms">
        <b>HKU</b>
      </div>
      <h1>
        The Hong Kong University
        <br />
        Cricket Club
      </h1>
      <p className="lat">Founded MCMXIII · Sandy Bay · Pok Fu Lam</p>
      {standfirst}
      <div className="dbl" />
    </div>
  );
}

export function Nav() {
  return (
    <nav>
      <ul>
        {navItems.map((item) => (
          <li key={item}>
            <a href="#">{item}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Lede() {
  return (
    <section className="lede">
      <p className="est">Est. 1913</p>
      <p className="drop">
        One hundred and thirteen seasons of cricket on the western shore of Hong
        Kong Island, played by students, staff and graduates of the University —
        and by anyone they can persuade to hold a bat.
      </p>
    </section>
  );
}

export function RecordTable() {
  return (
    <section className="record">
      <h2>Recent record — 2025/26</h2>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Ground</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {record.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td className="opp">{r.opp}</td>
                <td>{r.ground}</td>
                <td className={`res ${r.cls}`}>{r.res}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// `proseClass` lets a variant opt this section's first paragraph into the drop
// cap — this is the page's only running prose, so it is where one belongs.
export function ClubSection({ proseClass }: { proseClass?: string }) {
  return (
    <section className="section">
      <h2>The Club</h2>
      <div className="cols">
        <div className={proseClass}>
          <p>
            The Club was formed in 1913, a mere two years after the University
            itself, and has fielded a side in almost every season since. Play is
            at Sandy Bay, the University&rsquo;s ground on the western shore,
            with league fixtures on Saturdays.
          </p>
          <p>
            Membership is open to current students, staff and alumni of the
            University of Hong Kong. Experience is welcome but not required; a
            good number of the present side had never played before joining.
          </p>
          <blockquote>
            A university club is only ever eleven people wide and a hundred
            years deep.
            <cite>Club handbook, 1988</cite>
          </blockquote>
        </div>
        <aside>
          <dl>
            {standingFacts.map(([term, def]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

export function Plates() {
  return (
    <section className="section">
      <h2>Plates</h2>
      <div className="plates">
        {plates.map((caption) => (
          <figure key={caption}>
            <div className="plate" />
            <figcaption>{caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Admission() {
  return (
    <section className="admit">
      <div className="wrap">
        <h2>Admission to the Club</h2>
        <p>
          New members are received throughout the season. Come to a Wednesday
          net, or write to the Secretary.
        </p>
        <a className="btn" href="#">
          Enquire
        </a>
      </div>
    </section>
  );
}

export function Foot({ note }: { note: string }) {
  return (
    <footer className="foot wrap">
      <p>
        The Hong Kong University Cricket Club · Sandy Bay, Pok Fu Lam, Hong Kong
      </p>
      <p className="note">
        {note}
        <br />
        Prototype. Scores, dates and the 1988 quotation are invented sample
        content. Crest hexes remain provisional until the original logo file
        replaces the screenshot they were read from.
      </p>
    </footer>
  );
}
