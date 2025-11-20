// src/services/upload.service.ts
import path from "path";
import crypto from "crypto";
import { UploadedVideoMeta } from "../utils/types";
import { saveMetadata } from "../utils/file.utils";
import { uploadBufferToCloudinary } from "./cloudinary.provider";

export class UploadService {
  static async processFile(file: Express.Multer.File): Promise<UploadedVideoMeta> {
    // generate id for internal referencing
    const videoId = crypto.randomBytes(8).toString("hex");

    // derive a filename for Cloudinary public_id (keep extension removed)
    const ext = path.extname(file.originalname) || ".mp4";
    const publicId = `${videoId}`; // simple — use videoId as public_id

    // upload buffer to Cloudinary
    const result = await uploadBufferToCloudinary(file.buffer, `${publicId}${ext}`);

    const meta: UploadedVideoMeta = {
      videoId,
      originalName: file.originalname,
      storedName: result.public_id,    // cloudinary public_id
      path: result.secure_url,         // remote URL
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    // save metadata locally (small JSON) so captions controller can look up cloud URL by videoId
    saveMetadata(meta);

    return meta;
  }
}
