// Thin fetch wrapper around the moodtune backend. All calls go through
// '/api/...' which Vite proxies to the backend in dev (see vite.config.js);
// in production, set VITE_API_BASE_URL to the deployed backend's origin.

const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Returns a merged list of album and track matches (each tagged `kind`),
// since a song's artwork is always its parent album/single's cover — see
// backend/src/services/itunesService.js#searchMusic.
export function searchMusic(query) {
  return request(`/api/search?q=${encodeURIComponent(query)}`).then((d) => d.results);
}

export function getPaletteForUrl(imageUrl) {
  return request(`/api/palette?imageUrl=${encodeURIComponent(imageUrl)}`);
}

export async function getPaletteForFile(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE}/api/palette/upload`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data;
}

export function getSimilarArtists(artist) {
  return request(`/api/similar?artist=${encodeURIComponent(artist)}`).then((d) => d.results);
}
