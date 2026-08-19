import { Router } from "express";
import { getSimilarArtists } from "../services/lastfmService.js";

export const similarRouter = Router();

similarRouter.get("/", async (req, res, next) => {
  try {
    const artist = (req.query.artist || "").toString().trim();
    if (!artist) {
      return res.status(400).json({ error: "Query param 'artist' is required." });
    }
    const results = await getSimilarArtists(artist);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});
