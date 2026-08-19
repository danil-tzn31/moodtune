import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { searchRouter } from "./routes/search.js";
import { paletteRouter } from "./routes/palette.js";
import { similarRouter } from "./routes/similar.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: config.corsOrigin.split(",").map((o) => o.trim()) }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, lastfmConfigured: Boolean(config.lastfmApiKey) });
});

app.use("/api/search", searchRouter);
app.use("/api/palette", paletteRouter);
app.use("/api/similar", similarRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`moodtune backend listening on http://localhost:${config.port}`);
});
