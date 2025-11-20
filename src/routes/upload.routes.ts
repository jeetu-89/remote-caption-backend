// src/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import { uploadVideo } from "../controllers/upload.controller";

const router = Router();

// Use memory storage so we can upload to Cloudinary directly
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype !== "video/mp4") {
    return cb(new Error("Only MP4 videos are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

router.post("/", upload.single("video"), uploadVideo);

export default router;
