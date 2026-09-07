/** PROTOTYPE — throwaway, see /proto/footer. The masthead's mark, taken
 *  verbatim so a prototype is judged on its setting and not on a redrawn
 *  crest. `tone` swaps the outline for a dark ground. */
export function Crest({ size = 34, tone = "ink" }: { size?: number; tone?: "ink" | "paper" }) {
  const outline = tone === "ink" ? "var(--color-ink)" : "var(--color-bg)";
  return (
    <svg width={size} viewBox="0 0 100 112" aria-hidden="true" focusable="false">
      <path d="M8,34 L50,34 L50,104 C22,90 8,74 8,52 L8,34 Z" fill="var(--color-accent)" />
      <path d="M92,34 L50,34 L50,104 C78,90 92,74 92,52 L92,34 Z" fill="var(--color-blue)" />
      <path d="M8,6 L92,6 L92,34 L8,34 Z" fill="var(--color-red)" />
      <line x1="30" y1="98" x2="72" y2="46" stroke="var(--color-brass)" strokeWidth="9" strokeLinecap="round" />
      <line x1="70" y1="98" x2="28" y2="46" stroke="var(--color-brass)" strokeWidth="9" strokeLinecap="round" />
      <circle cx="50" cy="74" r="7" fill="var(--color-red)" stroke={outline} strokeWidth="1.5" />
      <path d="M8,6 L92,6 L92,52 C92,74 78,90 50,104 C22,90 8,74 8,52 Z" fill="none" stroke={outline} strokeWidth="3" />
    </svg>
  );
}
