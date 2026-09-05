"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a horizontally-scrollable table's `.frame` and marks it with
 * `data-overflow` for as long as there is more to scroll to — the edge fade
 * each caller's own CSS defines on `.frame[data-overflow]::after` lights only
 * then, rather than sitting lit over a table that already fits in full width
 * (see e.g. Squad.module.css's `.frame`).
 *
 * Measures this element's first child — the `.scroll` div every caller
 * already wraps its table in — rather than taking a ref to it directly, so
 * existing call sites only need their outer `div` swapped for this component.
 */
export function ScrollFade({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = ref.current;
    const scroll = frame?.firstElementChild;
    if (!(scroll instanceof HTMLElement)) return;

    const update = () => {
      // +1: rounding in scrollWidth/clientWidth can otherwise flag a table
      // that exactly fits as overflowing by a fraction of a pixel.
      frame!.toggleAttribute("data-overflow", scroll.scrollWidth > scroll.clientWidth + 1);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
