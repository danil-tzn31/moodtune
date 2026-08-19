import { Vibrant } from "node-vibrant/node";
import { cached } from "../lib/cache.js";
import { labelPalette } from "./moodService.js";

// Raw dominant-color count, ordered purely by how much of the image each
// color covers (population). This replaces the older approach of picking
// 6 named "roles" (Vibrant, Muted, etc.) — those are curated for contrast
// and legibility, not frequency, so they'd sometimes surface a color that
// barely appears in the image while skipping one that dominates it. Going
// straight to the quantizer's raw swatches gives a palette that's a more
// honest reflection of what's actually in the artwork.
const SWATCH_COUNT = 8;

/**
 * Extract a color palette + mood label from raw image bytes.
 * Shared by both the URL-based flow (searched album art) and the
 * upload flow (user's own image).
 */
export async function extractPaletteFromBuffer(buffer) {
  // .getPalette() on a Builder only returns the 6 curated named swatches.
  // To get the full raw quantized set we need an actual Vibrant instance
  // (via .build()) and then read its `.result.colors` — the complete
  // Swatch[] the MMCQ quantizer produced, before it's filtered down into
  // named roles.
  const vibrant = Vibrant.from(buffer).build();
  await vibrant.getPalette();
  const colors = vibrant.result?.colors ?? [];

  const swatches = [...colors]
    .sort((a, b) => b.population - a.population)
    .slice(0, SWATCH_COUNT)
    .map((swatch) => ({
      hex: swatch.hex,
      population: swatch.population,
    }));

  if (swatches.length === 0) {
    throw Object.assign(new Error("Could not extract a palette from this image."), {
      status: 422,
    });
  }

  return {
    swatches,
    moodLabel: labelPalette(swatches),
  };
}

/**
 * Fetch an image by URL (e.g. iTunes cover art) and extract its palette.
 * Done server-side deliberately: pulling a cross-origin image into a
 * browser <canvas> taints it for pixel reads, so this can't run client-side
 * without a proxy anyway.
 */
export async function extractPaletteFromUrl(imageUrl) {
  const key = `palette:${imageUrl}`;
  return cached(key, 30 * 60 * 1000, async () => {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw Object.assign(new Error(`Could not fetch image (status ${res.status}).`), {
        status: 422,
      });
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw Object.assign(new Error("URL did not return an image."), { status: 422 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return extractPaletteFromBuffer(buffer);
  });
}
