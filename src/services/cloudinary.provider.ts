// src/services/cloudinary.provider.ts
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer (file) to Cloudinary under folder "videos".
 * Returns {secure_url, public_id, resource_type, bytes, format, ...}
 */
export async function uploadBufferToCloudinary(buffer: Buffer, filename: string) {
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "videos",
        public_id: filename.replace(/\.[^/.]+$/, ""), // remove extension
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Upload a local file path to Cloudinary. (Not used in Part 1, but useful later.)
 */
export async function uploadFilePathToCloudinary(filePath: string, options: any = {}) {
  return cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    folder: "videos",
    ...options,
  });
}

/**
 * Upload any file (image/text) - generic wrapper if needed later.
 */
export async function uploadFile(bufferOrPath: Buffer | string, opts: any = {}) {
  if (Buffer.isBuffer(bufferOrPath)) {
    // stream upload
    return uploadBufferToCloudinary(bufferOrPath, opts.public_id || `upload_${Date.now()}`);
  } else {
    return uploadFilePathToCloudinary(bufferOrPath, opts);
  }
}
