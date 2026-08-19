import { cached } from "../lib/cache.js";

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

// iTunes artwork URLs come back as e.g. ".../100x100bb.jpg" — bump the
// resolution so palette extraction has more pixels to work with and the
// UI doesn't show a blurry cover.
function upscaleArtwork(url, size = 600) {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.jpg$/, `/${size}x${size}bb.jpg`);
}

// Loose equality for artist names: case-insensitive, accents stripped,
// punctuation/whitespace ignored. Good enough to tell "Beyoncé" from
// "Beyoncé Knowles" apart from a same-named-but-different act, without
// being so strict that minor formatting differences cause false negatives.
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Search iTunes for albums matching a free-text query.
 * Returns a normalized, frontend-friendly shape.
 *
 * @param {string} query
 * @param {number} limit
 * @param {{ attribute?: string }} [opts] - pass `attribute: "artistTerm"` to
 *   restrict matching to the artist field specifically, rather than iTunes'
 *   default free-text match across title/artist/description. Free-text
 *   matching is what the user-facing search box wants (they might type an
 *   album title), but it's exactly what causes wrong-artist results when
 *   we're looking up art *for* a known artist name (see findArtworkForArtist).
 */
async function itunesSearch(query, entity, limit, opts = {}) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", query);
  url.searchParams.set("entity", entity);
  url.searchParams.set("limit", String(limit));
  // Pin the store explicitly rather than relying on iTunes' default —
  // the US store has the deepest catalog, so this maximizes hit rate
  // for artists that are missing/sparse in whatever store it'd otherwise
  // infer.
  url.searchParams.set("country", "US");
  if (opts.attribute) {
    url.searchParams.set("attribute", opts.attribute);
  }

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403) {
      // iTunes enforces an undocumented per-IP rate limit (roughly ~20
      // requests per minute) and returns a bare 403 with no JSON body
      // when it's hit — easy to mistake for "no results" if the caller
      // doesn't surface it distinctly.
      throw Object.assign(
        new Error("iTunes is rate-limiting this server right now — wait a minute and try again."),
        { status: 429 }
      );
    }
    throw new Error(`iTunes search failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Search iTunes for albums matching a free-text query.
 * Returns a normalized, frontend-friendly shape.
 *
 * @param {string} query
 * @param {number} limit
 * @param {{ attribute?: string }} [opts] - pass `attribute: "artistTerm"` to
 *   restrict matching to the artist field specifically, rather than iTunes'
 *   default free-text match across title/artist/description. Free-text
 *   matching is what the user-facing search box wants (they might type an
 *   album title), but it's exactly what causes wrong-artist results when
 *   we're looking up art *for* a known artist name (see findArtworkForArtist).
 */
export async function searchAlbums(query, limit = 25, opts = {}) {
  const key = `itunes:search:${query.toLowerCase()}:${limit}:${opts.attribute ?? ""}`;
  return cached(key, 10 * 60 * 1000, async () => {
    const data = await itunesSearch(query, "album", limit, opts);
    return (data.results || [])
      .filter((r) => r.artworkUrl100)
      .map((r) => ({
        id: r.collectionId ?? `${r.artistName}-${r.collectionName}`,
        kind: "album",
        artist: r.artistName,
        album: r.collectionName,
        artworkUrl: upscaleArtwork(r.artworkUrl100),
      }));
  });
}

/**
 * Search iTunes for individual tracks/songs matching a free-text query.
 * A track's artwork is always its parent album/single's cover art (iTunes
 * doesn't have per-track art), so these results plug into the exact same
 * palette/mood pipeline as an album pick — this just makes search work
 * when someone knows a song title but not which album it's on.
 *
 * @param {string} query
 * @param {number} limit
 * @param {{ attribute?: string }} [opts] - pass `attribute: "artistTerm"` to
 *   restrict matching to the artist field, same rationale as searchAlbums.
 */
export async function searchTracks(query, limit = 25, opts = {}) {
  const key = `itunes:search-track:${query.toLowerCase()}:${limit}:${opts.attribute ?? ""}`;
  return cached(key, 10 * 60 * 1000, async () => {
    const data = await itunesSearch(query, "song", limit, opts);
    return (data.results || [])
      .filter((r) => r.artworkUrl100 && r.collectionName)
      .map((r) => ({
        id: r.trackId ?? `${r.artistName}-${r.trackName}`,
        kind: "song",
        artist: r.artistName,
        album: r.collectionName,
        track: r.trackName,
        artworkUrl: upscaleArtwork(r.artworkUrl100),
        // 30-second AAC clip iTunes hosts for most catalog tracks. Not
        // guaranteed present (some territories/tracks omit it), so the
        // frontend treats this as optional and hides the play control
        // when it's missing rather than erroring.
        previewUrl: r.previewUrl ?? null,
      }));
  });
}

function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

/**
 * The actual search-box query: albums and songs, merged and interleaved so
 * both show up near the top of the dropdown rather than songs only
 * appearing once every album match has been exhausted.
 */
export async function searchMusic(query, limitPerType = 15) {
  const [albums, tracks] = await Promise.all([
    searchAlbums(query, limitPerType),
    searchTracks(query, limitPerType),
  ]);
  return interleave(albums, tracks);
}

/**
 * Best-effort lookup of a single representative artwork/album for a given
 * artist name. Used to enrich Last.fm similar-artist results, which don't
 * reliably include images.
 *
 * Deliberately conservative: iTunes' free-text search will happily return
 * an album by a *different* artist if the query text matches its title or
 * description better than it matches the artist actually being searched
 * for. Searching with `attribute: artistTerm` biases toward artist-field
 * matches, and the result's artist name is still verified before it's
 * trusted — returning null (no art) rather than a guess.
 */
export async function findArtworkForArtist(artistName) {
  const key = `itunes:artist-art:${artistName.toLowerCase()}`;
  return cached(key, 30 * 60 * 1000, async () => {
    const results = await searchAlbums(artistName, 5, { attribute: "artistTerm" });
    const target = normalizeName(artistName);
    const match = results.find((r) => normalizeName(r.artist) === target);
    return match?.artworkUrl ?? null;
  });
}

/**
 * Best-effort lookup of a single representative, *previewable* track for a
 * given artist name. Powers the "Songs" tab under Keep Exploring: each
 * similar artist gets one playable clip rather than the app trying to
 * assemble a whole discography.
 *
 * Same conservative pattern as findArtworkForArtist (artist-field search +
 * post-hoc name verification, returning null over a guess), plus one more
 * requirement: the matched track must actually have a previewUrl, since a
 * verified-but-silent match isn't useful for a "hover to preview" feature.
 * iTunes returns results in relevance order, so the first verified match
 * with a preview is a reasonable stand-in for "a well-known track."
 */
export async function findTopTrackForArtist(artistName) {
  const key = `itunes:artist-track:${artistName.toLowerCase()}`;
  return cached(key, 30 * 60 * 1000, async () => {
    const tracks = await searchTracks(artistName, 5, { attribute: "artistTerm" });
    const target = normalizeName(artistName);
    const match = tracks.find((t) => normalizeName(t.artist) === target && t.previewUrl);
    return match ?? null;
  });
}
