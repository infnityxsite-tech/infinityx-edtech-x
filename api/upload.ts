// server/routes/upload.ts
import multer from "multer";
import express, { Request, Response, NextFunction } from "express";

// Define a custom interface for requests that have a file attached by multer
interface MulterRequest extends Request {
  file: Express.Multer.File;
}
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Ensure uploads directory exists (synchronously before use)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ✅ Configure multer with limits and image-only filter
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only image files are allowed."));
  },
});

// ✅ Upload route
router.post("/", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      // Always respond with JSON even when file missing
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const url = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error("❌ Upload error:", err);
    // Always send valid JSON, never leave response empty
    return res.status(500).json({
      success: false,
      error: err?.message || "Unexpected upload error",
    });
  }
});

// ✅ Error handler to catch Multer + other errors
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 20MB.",
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err) {
    console.error("❌ General error:", err);
    return res.status(400).json({
      success: false,
      error: err.message || "Unexpected server error",
    });
  }

  next();
});

export default router;
