// Small color helpers used to keep the UI legible against a palette that's
// generated from arbitrary user content (album art), not chosen by us.

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

// WCAG relative luminance.
function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Returns '#0b0a10' or '#ffffff' — whichever reads better on top of the
 * given hex background. Used for swatch-chip labels and any text placed
 * directly on a palette color.
 */
export function readableTextColor(hex) {
  if (!hex) return "#ffffff";
  const luminance = relativeLuminance(hexToRgb(hex));
  return luminance > 0.5 ? "#0b0a10" : "#ffffff";
}

/**
 * Builds a soft multi-stop gradient string from a list of hex swatches,
 * for the moodboard's animated background.
 */
export function gradientFromSwatches(hexes) {
  if (!hexes || hexes.length === 0) {
    return "linear-gradient(135deg, #171522, #0b0a10)";
  }
  const stops = hexes.slice(0, 4).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}
