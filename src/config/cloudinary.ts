// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  }
};
