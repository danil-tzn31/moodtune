import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { readableTextColor } from "../utils/color.js";

export default function PaletteSwatches({ swatches }) {
  // `active` reveals the hex label immediately on tap/click — this is what
  // makes the hex readable on touch devices, which have no hover state to
  // fall back on. `copied` tracks the clipboard write separately so a slow
  // or failed copy never delays showing the hex itself.
  const [active, setActive] = useState(null);
  const [copied, setCopied] = useState(null);
  const timers = useRef({});

  useEffect(() => {
    return () => {
      clearTimeout(timers.current.active);
      clearTimeout(timers.current.copied);
    };
  }, []);

  async function handleActivate(hex) {
    setActive(hex);
    clearTimeout(timers.current.active);
    timers.current.active = setTimeout(() => setActive((a) => (a === hex ? null : a)), 1600);

    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      clearTimeout(timers.current.copied);
      timers.current.copied = setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1600);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — the hex
      // label still shows either way, just without the copy confirmation.
    }
  }

  return (
    // justify-center so that when swatches wrap to a second row, a
    // shorter trailing row sits centered under the row above it instead
    // of stranded on the left edge.
    <div className="flex flex-wrap justify-center gap-3">
      {swatches.map((s) => {
        const revealed = active === s.hex;
        return (
          <motion.button
            key={s.hex}
            // All swatches animate in together as one group rather than a
            // per-item ripple, which reads as calmer for a set this size.
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleActivate(s.hex)}
            style={{ backgroundColor: s.hex, color: readableTextColor(s.hex) }}
            className="group relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl
                       shadow-lg shadow-black/30 ring-1 ring-white/10 transition-shadow"
            title={`Tap to copy ${s.hex}`}
          >
            <span
              className={`text-[11px] font-medium transition-opacity ${
                revealed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {s.hex}
              {copied === s.hex ? " ✓" : ""}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
