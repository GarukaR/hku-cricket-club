import styles from "./PageTitle.module.css";

/** A standalone page's own heading — Archive, Fixtures, Teams, and so on.
 *
 *  `SectionHeading` is deliberately quiet: a label over content that has its
 *  own display voice, sized so nothing competes with a scoreline. That is
 *  wrong here — on a page with no other heading, the quiet treatment reads as
 *  a seventh item in the nav row sitting directly above it, not a title. This
 *  is the display voice for exactly one heading per page: the first thing
 *  under the nav, and the only thing styled this way.
 *
 *  Still an `h2`, not an `h1` — the Masthead's own name is the page's `h1` on
 *  every route, and a second one here would be a wrong document outline
 *  wearing a different problem than the visual one this fixes. */
export function PageTitle({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className={styles.title}>
      {children}
    </h2>
  );
}
