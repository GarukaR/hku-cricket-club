import styles from "./Marginalia.module.css";

/** A note beside the record — the club's standing facts, and the next Match.
 *
 *  Deliberately shared rather than duplicated: the two are meant to read in one
 *  voice, and the moment they are styled separately the fixture starts growing
 *  back into a headline. */
export function Marginalia({
  children,
  labelledBy,
}: {
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <aside className={styles.marginalia} aria-labelledby={labelledBy}>
      {children}
    </aside>
  );
}

/** One row of a `Marginalia`'s `<dl>` — a flat `dt`/`dd` pair, not a wrapped
 *  one, because the marginalia's first-of-type rule (Marginalia.module.css)
 *  depends on the list being flat and a `<div>` between `<dl>` and `<dt>` buys
 *  nothing. Every page with standing facts in its margin uses this one. */
export function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{detail}</dd>
    </>
  );
}
