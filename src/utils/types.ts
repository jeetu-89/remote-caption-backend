// src/utils/types.ts
export interface UploadedVideoMeta {
  videoId: string;
  originalName: string;
  storedName: string; // cloudinary public_id
  path: string;       // secure_url on Cloudinary
  size: number;
  mimeType: string;
  uploadedAt: string;
}
