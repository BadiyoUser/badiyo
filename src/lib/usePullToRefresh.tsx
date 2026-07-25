import { useEffect, useRef, useState } from "react";

/**
 * Simple mobile pull-to-refresh gesture. Triggers `onRefresh` when the user
 * drags down from the top of the page past `threshold` pixels.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 70) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if ((window.scrollY || document.documentElement.scrollTop) > 0) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Rubber-band damping.
      const damped = Math.min(120, dy * 0.5);
      setPull(damped);
    };
    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pull >= threshold && !refreshing) {
        setRefreshing(true);
        setPull(60);
        try {
          await onRefreshRef.current();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, threshold]);

  return { pull, refreshing };
}

export function PullToRefreshIndicator({
  pull,
  refreshing,
}: {
  pull: number;
  refreshing: boolean;
}) {
  if (pull <= 0 && !refreshing) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
      style={{ transform: `translateY(${Math.min(pull, 80) - 20}px)` }}
    >
      <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow">
        <div
          className={`h-4 w-4 rounded-full border-2 border-primary border-t-transparent ${
            refreshing ? "animate-spin" : ""
          }`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </div>
    </div>
  );
}
