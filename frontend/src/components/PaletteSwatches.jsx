import { useState } from "react";
import { motion } from "framer-motion";
import { readableTextColor } from "../utils/color.js";

export default function PaletteSwatches({ swatches }) {
  const [copied, setCopied] = useState(null);

  async function copy(hex) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context); fail quietly.
    }
  }

  return (
    // justify-center so that when swatches wrap to a second row, a
    // shorter trailing row sits centered under the row above it instead
    // of stranded on the left edge.
    <div className="flex flex-wrap justify-center gap-3">
      {swatches.map((s) => (
        <motion.button
          key={s.hex}
          // All swatches animate in together as one group rather than a
          // per-item ripple, which reads as calmer for a set this size.
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.06, y: -2 }}
          onClick={() => copy(s.hex)}
          style={{ backgroundColor: s.hex, color: readableTextColor(s.hex) }}
          className="group relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl
                     shadow-lg shadow-black/30 ring-1 ring-white/10 transition-shadow"
          title={`Click to copy ${s.hex}`}
        >
          <span className="text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
            {copied === s.hex ? "Copied!" : s.hex}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
