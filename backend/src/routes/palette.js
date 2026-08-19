import { Router } from "express";
import multer from "multer";
import { extractPaletteFromUrl, extractPaletteFromBuffer } from "../services/paletteService.js";

export const paletteRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."));
    }
    cb(null, true);
  },
});

// GET /api/palette?imageUrl=...  (for search-flow album art)
paletteRouter.get("/", async (req, res, next) => {
  try {
    const imageUrl = (req.query.imageUrl || "").toString().trim();
    if (!imageUrl) {
      return res.status(400).json({ error: "Query param 'imageUrl' is required." });
    }
    const result = await extractPaletteFromUrl(imageUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/palette/upload  (multipart form field "image", for the upload flow)
paletteRouter.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file was uploaded (field name 'image')." });
    }
    const result = await extractPaletteFromBuffer(req.file.buffer);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
