/** The three channels' marks.
 *
 *  Monoline marks for the club's three channels, drawn rather than pulled from
 *  an icon set: every shipped icon family is a rounded, filled, contemporary
 *  UI voice, and D2 is a printed record. These are hairline strokes in
 *  `currentColor` at the same weight as a rule on the page, so they read as
 *  printer's marks beside letterspaced sans rather than as app furniture.
 *
 *  All three are framed, because all three real marks are: a rounded square, a
 *  disc, and a rounded rectangle. */
const box = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  "aria-hidden": true,
  focusable: "false",
} as const;

export function Instagram({ size = 14 }: { size?: number }) {
  return (
    <svg {...box} width={size} height={size}>
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.6" />
      <circle cx="8" cy="8" r="3.4" />
      <circle cx="11.9" cy="4.1" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Facebook({ size = 14 }: { size?: number }) {
  return (
    <svg {...box} width={size} height={size}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M10 5.2H9.05a1.35 1.35 0 0 0-1.35 1.35V14.4M6.1 8.5h3.5" />
    </svg>
  );
}

/** YouTube's badge is a rounded rectangle with a play triangle in it, so it
 *  lands wider than it is tall. Drawn to the same 16-unit box as the other two
 *  and inset vertically rather than scaled down, which keeps all three marks
 *  optically the same size on the line instead of mathematically the same. */
export function YouTube({ size = 14 }: { size?: number }) {
  return (
    <svg {...box} width={size} height={size}>
      <rect x="0.9" y="3.2" width="14.2" height="9.6" rx="2.9" />
      {/* Filled, because a 3px outlined triangle at 14px closes up into a
          smudge. It is the one solid in the set and it is the right one — the
          play button is a solid everywhere it is drawn. */}
      <path d="M6.6 6.1 10.4 8 6.6 9.9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
