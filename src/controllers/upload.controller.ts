// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import { UploadService } from "../services/upload.service";

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // processFile will upload to Cloudinary and save metadata
    const meta = await UploadService.processFile(req.file);
    return res.status(200).json({
      message: "Upload successful",
      videoId: meta.videoId,
      metadata: meta
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
};
