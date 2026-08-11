"use client";

// PROTOTYPE — throwaway. Floating variant switcher. Deliberately styled to look
// nothing like the page it sits on, so it is never mistaken for the design.

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function PrototypeSwitcher({
  variants,
  current,
  names,
}: {
  variants: string[];
  current: string;
  names: Record<string, string>;
}) {
  const router = useRouter();
  const i = Math.max(0, variants.indexOf(current));

  const go = useCallback(
    (step: number) => {
      const next = variants[(i + step + variants.length) % variants.length];
      router.replace(`/?variant=${next}`, { scroll: false });
    },
    [i, router, variants],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "#111",
        color: "#fff",
        borderRadius: "999px",
        padding: "0.3rem 0.4rem",
        boxShadow: "0 6px 24px rgba(0,0,0,.35)",
        fontFamily: "var(--font-data), ui-monospace, monospace",
        fontSize: "0.75rem",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <button onClick={() => go(-1)} aria-label="Previous variant" style={btn}>
        ←
      </button>
      <span
        style={{
          padding: "0 0.7rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <strong>{current}</strong>
        <span style={{ opacity: 0.6 }}> — {names[current]}</span>
      </span>
      <button onClick={() => go(1)} aria-label="Next variant" style={btn}>
        →
      </button>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#2b2b2b",
  color: "#fff",
  border: 0,
  borderRadius: "999px",
  width: "1.9rem",
  height: "1.9rem",
  cursor: "pointer",
  fontSize: "0.9rem",
  lineHeight: 1,
};
