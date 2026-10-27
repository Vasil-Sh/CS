import { forwardRef, useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import HL from "@/lib/hairline/kernel";
import {
  stepsMount,
  stepsRange,
  stepsTour,
  type HairlineFigureHandle,
} from "@/lib/hairline/steps";

export type HairlineOptions = {
  intensity?: number;
  theme?: "auto" | "light" | "dark";
  label?: string;
  onRead?: (text: string) => void;
  play?: boolean;
};

export type StepsFigureProps = HairlineOptions &
  Omit<ComponentPropsWithoutRef<"div">, "children" | keyof HairlineOptions>;

/** intensity (0…1) to the figure's own number, two lines meeting at 0.5. */
function toValue(intensity: number | undefined): number {
  const i =
    typeof intensity === "number" && Number.isFinite(intensity)
      ? Math.min(1, Math.max(0, intensity))
      : 0.5;
  const [lo, mid, hi] = stepsRange;
  const v =
    i <= 0.5
      ? lo + (i / 0.5) * (mid - lo)
      : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}

/**
 * Renders the custom "steps" figure. It mirrors what the package's `make()`
 * does for its thirty-three figures: one host `<div>` at 5:4, the kernel CSS
 * injected once, an svg in a 400×320 viewBox, a read-out, and the running
 * figure plus (optionally) its tour.
 */
const StepsFigure = forwardRef<HTMLDivElement, StepsFigureProps>(
  function StepsFigure(
    { intensity, theme, label, onRead, play, style, ...attrs },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<HairlineFigureHandle | null>(null);
    const tourRef = useRef<{ stop(): void } | null>(null);
    const readRef = useRef(onRead);

    useLayoutEffect(() => {
      readRef.current = onRead;
    });

    useLayoutEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      HL.inject(document);
      host.setAttribute("data-hairline", "steps");
      host.setAttribute("role", "img");
      const svg = HL.mk(
        "svg",
        { viewBox: "0 0 400 320", "aria-hidden": "true" },
        host,
      );
      let text: string | null = null;
      const read = {
        get textContent() {
          return text;
        },
        set textContent(value: unknown) {
          text = value == null ? "" : String(value);
          readRef.current?.(text);
        },
      };
      const engine = stepsMount({ stage: host, svg, read }, toValue(intensity));
      engineRef.current = engine;
      return () => {
        tourRef.current?.stop();
        tourRef.current = null;
        engine.destroy();
        engineRef.current = null;
        svg.remove();
        host.removeAttribute("data-hairline");
        host.removeAttribute("role");
        host.removeAttribute("aria-label");
        host.removeAttribute("data-hairline-theme");
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useLayoutEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      if (theme === "light" || theme === "dark") {
        host.setAttribute("data-hairline-theme", theme);
      } else {
        host.removeAttribute("data-hairline-theme");
      }
      if (typeof label === "string") host.setAttribute("aria-label", label);
      else host.removeAttribute("aria-label");
      engineRef.current?.set(toValue(intensity));
      if (play === true && !tourRef.current)
        tourRef.current = HL.tour(host, stepsTour);
      else if (play !== true && tourRef.current) {
        tourRef.current.stop();
        tourRef.current = null;
      }
    }, [intensity, theme, label, play]);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        style={{ aspectRatio: "5 / 4", ...style }}
        {...attrs}
      />
    );
  },
);

export default StepsFigure;
