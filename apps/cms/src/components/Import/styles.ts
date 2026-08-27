// The import screen's shared inline styles.
//
// Inline rather than a stylesheet because this screen lives inside Payload's
// admin panel and inherits its colours: `currentColor` and `opacity` follow
// whatever theme the editor has chosen, where a hard-coded grey would be
// invisible in one of them. Nothing here belongs to the public site's design —
// that world is D2 and lives in apps/web.

/** Content width, not page width. A scorecard's columns sit next to each other;
 *  stretched across a wide screen a batter's name and his score end up at
 *  opposite edges and the eye cannot carry one to the other. */
export const scorecard: React.CSSProperties = {
  borderCollapse: "collapse",
  fontSize: 13,
};

export const cell: React.CSSProperties = {
  padding: "3px 8px 3px 0",
  textAlign: "left",
  verticalAlign: "top",
};

export const figure: React.CSSProperties = {
  ...cell,
  textAlign: "right",
  paddingRight: 16,
};

export const heading: React.CSSProperties = {
  ...cell,
  borderBottom: "1px solid currentColor",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.7,
};

export const headingRight: React.CSSProperties = {
  ...heading,
  textAlign: "right",
  paddingRight: 16,
};

export const panel: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  border: "1px solid currentColor",
  borderRadius: 4,
  maxWidth: "72ch",
};

export const quiet: React.CSSProperties = { opacity: 0.75, maxWidth: "72ch" };

/** An absent figure, never a zero: a column the scorer left empty says nothing,
 *  and a nought there would say something. */
export const DASH = "–";
