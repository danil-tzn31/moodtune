// Deterministic hue/saturation/lightness -> mood-label heuristic.
// No external API needed; same palette always yields the same label.

function hexToHsl(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return { h, s, l };
}

const HUE_WORDS = [
  { max: 15, word: "Fiery" },
  { max: 45, word: "Warm" },
  { max: 70, word: "Sunny" },
  { max: 170, word: "Fresh" },
  { max: 200, word: "Cool" },
  { max: 260, word: "Moody" },
  { max: 290, word: "Dreamy" },
  { max: 330, word: "Mysterious" },
  { max: 361, word: "Romantic" },
];

function hueToWord(h) {
  const band = HUE_WORDS.find((b) => h < b.max);
  return band ? band.word : "Warm";
}

function satLightToWord(s, l) {
  const sat = s < 0.3 ? "low" : s < 0.6 ? "mid" : "high";
  const light = l < 0.35 ? "low" : l < 0.7 ? "mid" : "high";

  const table = {
    "high-low": "Intense",
    "high-mid": "Vibrant",
    "high-high": "Playful",
    "mid-low": "Moody",
    "mid-mid": "Balanced",
    "mid-high": "Airy",
    "low-low": "Brooding",
    "low-mid": "Muted",
    "low-high": "Nostalgic",
  };

  return table[`${sat}-${light}`] ?? "Balanced";
}

/**
 * Turns a palette into a short, evocative two-word mood label, e.g.
 * "Warm & Nostalgic" or "Cool & Moody". Deterministic given the same
 * palette.
 *
 * Accepts either plain hex strings (`["#abcdef", ...]`, each weighted
 * equally) or `{ hex, population }` swatch objects (weighted by how much
 * of the image each color actually covers). The latter matters now that
 * the palette is the raw top-N dominant colors rather than a curated,
 * roughly-balanced set of 6 named roles — without weighting, a sliver of
 * background color would pull the average mood just as hard as the color
 * that fills half the cover.
 */
export function labelPalette(swatches) {
  const valid = swatches.filter((s) => (typeof s === "string" ? s : s?.hex));
  if (valid.length === 0) return "Undefined Mood";

  const weighted = valid.map((s) =>
    typeof s === "string"
      ? { ...hexToHsl(s), weight: 1 }
      : { ...hexToHsl(s.hex), weight: s.population > 0 ? s.population : 1 }
  );

  const totalWeight = weighted.reduce((sum, c) => sum + c.weight, 0);
  const avg = weighted.reduce(
    (acc, c) => ({
      h: acc.h + c.h * c.weight,
      s: acc.s + c.s * c.weight,
      l: acc.l + c.l * c.weight,
    }),
    { h: 0, s: 0, l: 0 }
  );
  const avgHsl = { h: avg.h / totalWeight, s: avg.s / totalWeight, l: avg.l / totalWeight };

  const first = hueToWord(avgHsl.h);
  const second = satLightToWord(avgHsl.s, avgHsl.l);

  return `${first} & ${second}`;
}
