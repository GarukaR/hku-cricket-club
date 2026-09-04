// PROTOTYPE — throwaway. Floating spacing switcher, gated out of production.
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LABELS: Record<string, string> = {
  live: "Live — 1.4rem",
  A: "A — 0.5rem",
  B: "B — 0.8rem",
  C: "C — 1.1rem",
};

export function PrototypeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const order = ["live", "A", "B", "C"];
  const current = searchParams.get("spacing") ?? "live";

  function go(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "live") {
      params.delete("spacing");
    } else {
      params.set("spacing", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function cycle(delta: number) {
    const index = order.indexOf(current);
    go(order[(index + delta + order.length) % order.length]);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: "1.2rem",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.9rem",
        borderRadius: "999px",
        background: "#111",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.8rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <button
        type="button"
        onClick={() => cycle(-1)}
        aria-label="Previous variant"
        style={{ all: "unset", cursor: "pointer", padding: "0.15rem 0.5rem", fontSize: "1rem" }}
      >
        ←
      </button>
      <span style={{ whiteSpace: "nowrap", minWidth: "9rem", textAlign: "center" }}>
        {LABELS[current] ?? current}
      </span>
      <button
        type="button"
        onClick={() => cycle(1)}
        aria-label="Next variant"
        style={{ all: "unset", cursor: "pointer", padding: "0.15rem 0.5rem", fontSize: "1rem" }}
      >
        →
      </button>
    </div>
  );
}
