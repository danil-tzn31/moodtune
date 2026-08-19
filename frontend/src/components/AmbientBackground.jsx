import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Idle-state hues — used until a mood board generates real ones.
const DEFAULT_HUES = ["#5b3df5", "#f5507d", "#2fd4c4"];

function Blob({ color, className, duration, delay, reduceMotion }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-2xl ${className}`}
      style={{ background: color, willChange: "transform" }}
      animate={
        reduceMotion
          ? undefined
          : { x: [0, 30, -15, 0], y: [0, -20, 15, 0] }
      }
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/**
 * Full-viewport ambient blobs, softly recolored to match whatever palette
 * is currently on screen — the "mood" concept extends past the card itself
 * rather than living only inside it. Falls back to a fixed idle palette
 * when there's no mood board yet. Respects prefers-reduced-motion.
 *
 * Kept deliberately cheap: only 2 blobs, a lighter blur radius, and
 * position-only animation (no scale, which forces more repainting of an
 * already-blurred layer) to keep this smooth alongside the foreground UI.
 */
export default function AmbientBackground({ hexes }) {
  const reduceMotion = useReducedMotion();

  const colors = useMemo(() => {
    const valid = (hexes || []).filter(Boolean);
    return valid.length >= 2 ? valid : DEFAULT_HUES;
  }, [hexes]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b0a10]">
      <Blob
        color={colors[0]}
        className="left-[-10%] top-[-15%] h-[36vw] w-[36vw] opacity-25"
        duration={26}
        delay={0}
        reduceMotion={reduceMotion}
      />
      <Blob
        color={colors[1] ?? colors[0]}
        className="right-[-15%] bottom-[-15%] h-[34vw] w-[34vw] opacity-20"
        duration={30}
        delay={2}
        reduceMotion={reduceMotion}
      />
      {/* Tints the blobs down uniformly so text stays legible over any hue. */}
      <div className="absolute inset-0 bg-[#0b0a10]/60" />
    </div>
  );
}
