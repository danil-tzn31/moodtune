import { Router } from "express";
import { searchMusic } from "../services/itunesService.js";

export const searchRouter = Router();

searchRouter.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) {
      return res.status(400).json({ error: "Query param 'q' is required." });
    }
    // Merged album + track results — see searchMusic for why both matter.
    const results = await searchMusic(q);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});
