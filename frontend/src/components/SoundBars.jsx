import { motion } from "framer-motion";

/**
 * Tiny animated "now playing" equalizer — three bars bouncing at slightly
 * offset speeds. Purely a status indicator, not a control.
 */
export default function SoundBars({ reduceMotion, className = "h-4" }) {
  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-white"
          initial={{ height: "35%" }}
          animate={reduceMotion ? { height: "70%" } : { height: ["35%", "100%", "45%", "80%", "35%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
