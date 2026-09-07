/** PROTOTYPE — throwaway, see /proto/footer.
 *
 *  Monoline marks for the club's three channels, drawn rather than pulled from
 *  an icon set: every shipped icon family is a rounded, filled, contemporary
 *  UI voice, and D2 is a printed record. These are hairline strokes in
 *  `currentColor` at the same weight as a rule on the page, so they read as
 *  printer's marks beside letterspaced sans rather than as app furniture. */
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

/** No frame, unlike the other two. Instagram's mark really is a rounded square
 *  and Facebook's really is a disc, but X's is the bare letterform — and a
 *  cross inside a box is the universal close button, which is what the first
 *  draft of this drew. The strokes are set a shade heavier so an unframed mark
 *  holds the same weight on the line as two framed ones. */
export function X({ size = 14 }: { size?: number }) {
  return (
    <svg {...box} width={size} height={size} strokeWidth={1.35}>
      <path d="M2.6 2.4 13.4 13.6M13.4 2.4 2.6 13.6" />
    </svg>
  );
}
