import path from "path";
import crypto from "crypto";
import { UploadedVideoMeta } from "../utils/types";
import { saveMetadata } from "../utils/file.utils";

export class UploadService {
  static processFile(file: Express.Multer.File): UploadedVideoMeta {
    const videoId = crypto.randomBytes(8).toString("hex");

    const meta: UploadedVideoMeta = {
      videoId,
      originalName: file.originalname,
      storedName: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    saveMetadata(meta);

    return meta;
  }
}
