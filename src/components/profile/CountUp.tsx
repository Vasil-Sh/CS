import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Animated integer: counts from the previous value (0 on mount) to `value`.
 * Screen readers get the final number only; reduced motion skips the animation.
 */
export default function CountUp({
  value,
  duration = 900,
  locale = "uk-UA",
}: {
  value: number;
  duration?: number;
  locale?: string;
}) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const from = useRef(shown);

  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const startValue = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(startValue + (value - startValue) * eased);
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration]);

  return (
    <>
      <span aria-hidden="true">{shown.toLocaleString(locale)}</span>
      <span className="sr-only">{value.toLocaleString(locale)}</span>
    </>
  );
}
