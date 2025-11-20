import { Router } from "express";
import multer from "multer";
import path from "path";
import { ensureUploadDir } from "../utils/file.utils";
import { uploadVideo } from "../controllers/upload.controller";

ensureUploadDir();

const router = Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

// File validation
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype !== "video/mp4") {
    return cb(new Error("Only MP4 videos are allowed"), false);
  }
  cb(null, true);
};

// 100 MB limit (modify as needed)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.post("/", upload.single("video"), uploadVideo);

export default router;
