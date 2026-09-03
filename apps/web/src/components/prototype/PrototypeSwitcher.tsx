// PROTOTYPE — throwaway. Floating variant switcher, gated out of production
// builds. See RecordVariants.tsx for what it's switching between.
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import styles from "./PrototypeSwitcher.module.css";

const LABELS: Record<string, string> = {
  A: "A — Agate line",
  B: "B — Priority columns",
  C: "C — Card stack",
  live: "Live — current table",
};

export function PrototypeSwitcher({ variants }: { variants: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const order = ["live", ...variants];
  const current = searchParams.get("variant") ?? "live";

  function go(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "live") {
      params.delete("variant");
    } else {
      params.set("variant", next);
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
    <div className={styles.bar}>
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous variant">
        ←
      </button>
      <span className={styles.label}>{LABELS[current] ?? current}</span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">
        →
      </button>
    </div>
  );
}
