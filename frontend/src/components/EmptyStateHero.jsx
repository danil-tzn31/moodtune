import { motion, useReducedMotion } from "framer-motion";

/**
 * Idle-state visual for the results panel: a slowly spinning vinyl motif
 * instead of a bare line of text, since the panel now owns real screen
 * real estate on desktop rather than sitting below the fold.
 */
export default function EmptyStateHero() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.div
        className="relative flex h-52 w-52 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] sm:h-64 sm:w-64"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute h-[70%] w-[70%] rounded-full border border-white/10" />
        <div className="absolute h-[45%] w-[45%] rounded-full border border-white/10" />
        <div className="h-3.5 w-3.5 rounded-full bg-white/30" />
      </motion.div>
      <p className="max-w-xs text-sm text-white/40">
        Search for an album or song, or drop in a cover of your own, to generate your first mood board.
      </p>
    </div>
  );
}
