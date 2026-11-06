import { useEffect, useState } from "react";
import { Vault } from "@lucasmarkes/hairline/react";
import HairlineCustomFigure from "@/components/HairlineCustomFigure";
import { desk } from "@/lib/hairline/desk";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Hairline line figure for the profile / backup hero.
 * Profile: the custom "desk" figure (headset, keyboard, mouse on a mat).
 * Backup: the package's Vault. Decorative, so hidden from assistive tech.
 */
export default function HeroFigure({ kind }: { kind: "desk" | "vault" }) {
  const reduced = useReducedMotion();
  return (
    <div className={`mqp-hero-figure is-${kind}`} aria-hidden="true">
      {kind === "desk" ? (
        <HairlineCustomFigure figure={desk} theme="light" intensity={0.55} play={!reduced} />
      ) : (
        <Vault theme="light" intensity={0.6} play={!reduced} />
      )}
    </div>
  );
}
