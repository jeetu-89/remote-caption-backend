import { Request, Response } from "express";
import { UploadService } from "../services/upload.service";

export const uploadVideo = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const meta = UploadService.processFile(req.file);
  return res.status(200).json({
    message: "Upload successful",
    videoId: meta.videoId,
    metadata: meta
  });
};
