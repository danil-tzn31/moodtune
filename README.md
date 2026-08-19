# moodtune

Turn a searched or uploaded album cover into a mood board: an extracted color palette, a mood label, and a chain of similar artists and tracks to keep exploring.

## Project layout

```
moodtune/
  backend/    Node + Express API (iTunes search proxy, Last.fm proxy, server-side color extraction)
  frontend/   React + Vite + Tailwind + Framer Motion UI
```

## Getting started

### 1. Get a Last.fm API key

Similar-artist lookups need one — it's free:

1. Go to https://www.last.fm/api/account/create and register an application (any name/description is fine).
2. Copy the API key it gives you.

### 2. Run the backend

```bash
cd backend
cp .env.example .env      # then paste your Last.fm key into LASTFM_API_KEY=
npm install
npm run dev                # http://localhost:5000
```

Visit `http://localhost:5000/api/health` — you should see `{"ok":true,"lastfmConfigured":true}` once the key is in place.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:5000` in dev (see `frontend/vite.config.js`), so no further local configuration is needed. Open `http://localhost:5173`, then search for an album or song, or drag your own cover art onto the upload zone.

## Features

- **Search** — type an artist, album, or song title; results come from the iTunes Search API (no key required), with album and track matches interleaved.
- **Upload** — drag-and-drop your own image; an artist-name prompt appears since an uploaded image has no metadata to key off of.
- **Palette + mood** — the top 8 dominant colors are extracted server-side with `node-vibrant` (avoiding the browser-canvas CORS restriction entirely) and rolled into a short, deterministic mood label via a population-weighted HSL heuristic (`backend/src/services/moodService.js`).
- **Song previews** — hovering the album art on the mood board plays a 30-second iTunes preview clip with a smooth volume fade in/out.
- **Keep exploring** — Last.fm's `artist.getSimilar`, enriched with iTunes thumbnails and a verified representative track per artist. Toggle between an Artists view and a Songs view; clicking either loads it as the new mood board, so browsing chains indefinitely.
- **Click-to-copy** palette swatches, with computed text contrast so labels stay legible against any generated color.

## Environment variables

| File | Variable | Required | Notes |
|---|---|---|---|
| `backend/.env` | `LASTFM_API_KEY` | Yes | Free key from Last.fm (see above). |
| `backend/.env` | `PORT` | No | Defaults to `5000`. |
| `backend/.env` | `CORS_ORIGIN` | No | Defaults to the local Vite dev origin. |
| `frontend/.env` | `VITE_API_BASE_URL` | Only in production | Base URL of the deployed backend; unset in dev since Vite proxies `/api`. |

## Architecture notes

- **Color extraction runs server-side.** Pulling a cross-origin image into a browser `<canvas>` taints it for pixel reads, so the backend fetches the raw image bytes and runs `node-vibrant` there instead — this works identically for searched art and uploaded files.
- **Third-party responses are cached in memory** (`backend/src/lib/cache.js`) with short TTLs to avoid hammering iTunes and Last.fm, both of which apply rate limits. The cache resets on server restart; there's no persistence layer.
- **No database, no auth.** Everything is stateless per request.

## What's not implemented

- Deployment configuration (hosting is left to whoever runs this — see below for the intended targets).
- Export-as-image, theme toggle, and session history are not built.
- No automated test suite yet.

## Deployment

Not yet deployed. The intended shape: the backend as a small Node service (e.g. Render or Railway) with `LASTFM_API_KEY` set as a platform environment variable, and the frontend as a static build (e.g. Vercel or Netlify) with `VITE_API_BASE_URL` pointed at the backend's public URL.
