import { cached } from "../lib/cache.js";
import { config } from "../config.js";
import { findArtworkForArtist, findTopTrackForArtist } from "./itunesService.js";

const LASTFM_URL = "http://ws.audioscrobbler.com/2.0/";

// Last.fm stopped hosting real per-artist photos years ago. Instead of an
// empty string, `artist.getSimilar` now returns a URL to this specific
// generic "star" placeholder image for almost every artist. It's a real,
// loadable URL — not a blank string — so a naive "is there a URL" check
// happily accepts it and the iTunes fallback below never runs. Filter it
// out by its filename hash so we actually fall through to iTunes art.
const LASTFM_PLACEHOLDER_IMAGE_ID = "2a96cbd8b46e442fc41c2b86b821562f";

function extractLastfmImage(images) {
  if (!Array.isArray(images)) return null;
  const sized = [...images]
    .reverse() // largest first
    .find((img) => img["#text"] && !img["#text"].includes(LASTFM_PLACEHOLDER_IMAGE_ID));
  return sized?.["#text"] || null;
}

// Enriching each similar artist now does up to two iTunes lookups (artwork
// + a previewable track) instead of one, and iTunes enforces a strict
// undocumented per-IP rate limit (~20 req/min — see itunesSearch). Firing
// all of them at once for a full page of similar artists risks tripping
// that limit in a single burst. Processing a handful at a time keeps the
// peak concurrency down without making the whole list wait on each other
// sequentially. The per-lookup 30min cache (findArtworkForArtist /
// findTopTrackForArtist) means this cost is only paid once per artist
// anyway.
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Fetch artists similar to the given artist from Last.fm, enriched with a
 * thumbnail image (Last.fm's own image if present, otherwise an iTunes
 * lookup) so the UI never has to show a blank card.
 */
export async function getSimilarArtists(artistName, limit = 10) {
  if (!config.lastfmApiKey) {
    throw Object.assign(
      new Error(
        "Last.fm API key is not configured. Add LASTFM_API_KEY to backend/.env."
      ),
      { status: 503 }
    );
  }

  const key = `lastfm:similar:${artistName.toLowerCase()}:${limit}`;
  return cached(key, 15 * 60 * 1000, async () => {
    const url = new URL(LASTFM_URL);
    url.searchParams.set("method", "artist.getsimilar");
    url.searchParams.set("artist", artistName);
    url.searchParams.set("api_key", config.lastfmApiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      // Last.fm error 6 = "artist not found"
      if (data.error === 6) return [];
      throw Object.assign(new Error(data.message || "Last.fm request failed"), {
        status: 502,
      });
    }

    const artists = data.similarartists?.artist ?? [];

    const enriched = await mapWithConcurrency(artists, 3, async (a) => {
      const lastfmImage = extractLastfmImage(a.image);
      const [imageUrl, topTrack] = await Promise.all([
        lastfmImage ? lastfmImage : findArtworkForArtist(a.name).catch(() => null),
        // Powers the "Songs" tab under Keep Exploring — null when no
        // verified, previewable track was found, which the frontend
        // treats as "this artist just doesn't show up in that tab."
        findTopTrackForArtist(a.name).catch(() => null),
      ]);
      return {
        name: a.name,
        match: a.match ? Number(a.match) : null,
        imageUrl,
        topTrack,
      };
    });

    return enriched;
  });
}
