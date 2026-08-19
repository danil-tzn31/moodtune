# Deploying moodtune

Two-part deploy: the backend (Express) goes to Render, the frontend (Vite/React) goes to Vercel. Deploy the backend first — the frontend needs its URL.

## 1. Push the code to GitHub

In a terminal, on your Mac, inside the project folder:

```bash
cd ~/Downloads/moodtune
```

One cleanup first: delete `moodtune-scaffold.zip` if it's still sitting in that folder — it's a leftover from early setup and isn't part of the actual app, no need to commit it.

```bash
rm moodtune-scaffold.zip   # skip if it's not there

git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Then on github.com: click **New repository**, name it (e.g. `moodtune`), leave "Initialize with README" unchecked (you already have one), create it. GitHub will show you a remote URL — use it here:

```bash
git remote add origin <the URL GitHub gave you>
git push -u origin main
```

## 2. Deploy the backend (Render)

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New +** → **Web Service** → pick the `moodtune` repo.
3. Set:
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Under **Environment Variables**, add `LASTFM_API_KEY` with your key. Leave `CORS_ORIGIN` for now — you'll set it in step 4.
5. Click **Create Web Service** and wait for the first deploy to finish.
6. Visit `https://<your-service-name>.onrender.com/api/health` — you should see `{"ok":true,"lastfmConfigured":true}`. Copy this base URL, you'll need it next.

Free-tier note: the service spins down after 15 minutes idle and takes about a minute to wake back up on the next request. That's expected, not a bug.

## 3. Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import the same `moodtune` repo.
3. During import, set **Root Directory** to `frontend`. Framework preset (Vite) and build/output settings are auto-detected — no changes needed there.
4. Under **Environment Variables**, add `VITE_API_BASE_URL` set to the Render URL from step 2 (no trailing slash), e.g. `https://moodtune-backend.onrender.com`.
5. Click **Deploy** and wait for the build to finish. Open the resulting `*.vercel.app` URL.

## 4. Close the CORS loop

Copy your new Vercel URL (`https://your-app.vercel.app`). Back in the Render dashboard, open the backend service → **Environment** → set `CORS_ORIGIN` to that URL (no trailing slash). Render redeploys automatically when an env var changes.

## 5. Verify

Open the Vercel URL, hard refresh, and search for an artist. Palette/mood extraction and "Keep exploring" both need the backend reachable and CORS configured correctly, so they're the two things to check:

- If search and palette work but "Keep exploring" doesn't → double-check `LASTFM_API_KEY` on Render.
- If you see CORS errors in the browser console → `VITE_API_BASE_URL` (Vercel) and `CORS_ORIGIN` (Render) need to match each other's actual deployed URLs exactly, including `https://` and no trailing slash.

Changing `VITE_API_BASE_URL` later requires a new Vercel deploy — Vite bakes env vars in at build time, they aren't read at runtime.
