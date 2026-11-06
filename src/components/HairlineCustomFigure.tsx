import { forwardRef, useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import HL from "@/lib/hairline/kernel";
import type {
  HairlineFigureDef,
  HairlineFigureHandle,
} from "@/lib/hairline/figure";

export type CustomFigureProps = {
  figure: HairlineFigureDef;
  intensity?: number;
  theme?: "auto" | "light" | "dark";
  label?: string;
  onRead?: (text: string) => void;
  play?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/** intensity (0…1) to the figure's own number, two lines meeting at 0.5. */
function toValue(range: HairlineFigureDef["range"], intensity?: number) {
  const i =
    typeof intensity === "number" && Number.isFinite(intensity)
      ? Math.min(1, Math.max(0, intensity))
      : 0.5;
  const [lo, mid, hi] = range;
  const v =
    i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}

/**
 * Renders any custom figure written by hairline-create, the way the package's
 * `make()` renders its own: a host <div> at 5:4, the kernel CSS injected once,
 * an svg in a 400×320 viewBox, and the running figure plus (optionally) its tour.
 */
const HairlineCustomFigure = forwardRef<HTMLDivElement, CustomFigureProps>(
  function HairlineCustomFigure(
    { figure, intensity, theme, label, onRead, play, style, ...attrs },
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
      host.setAttribute("data-hairline", figure.name);
      host.setAttribute("role", "img");
      const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, host);
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
      const engine = figure.mount({ stage: host, svg, read }, toValue(figure.range, intensity));
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
    }, [figure]);

    useLayoutEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      if (theme === "light" || theme === "dark") host.setAttribute("data-hairline-theme", theme);
      else host.removeAttribute("data-hairline-theme");
      if (typeof label === "string") host.setAttribute("aria-label", label);
      else host.removeAttribute("aria-label");
      engineRef.current?.set(toValue(figure.range, intensity));
      if (play === true && !tourRef.current && figure.tour)
        tourRef.current = HL.tour(host, figure.tour);
      else if (play !== true && tourRef.current) {
        tourRef.current.stop();
        tourRef.current = null;
      }
    }, [figure, intensity, theme, label, play]);

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

export default HairlineCustomFigure;
