import "dotenv/config";

export const config = {
  port: process.env.PORT || 5000,
  lastfmApiKey: process.env.LASTFM_API_KEY || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

if (!config.lastfmApiKey) {
  // Not fatal — the app still boots so search/upload/palette flows work —
  // but /api/similar will fail until a key is added to backend/.env.
  console.warn(
    "[moodtune] LASTFM_API_KEY is not set. Copy backend/.env.example to backend/.env " +
      "and add a key from https://www.last.fm/api/account/create to enable similar-artist lookups."
  );
}
