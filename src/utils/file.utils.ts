// src/utils/file.utils.ts
import fs from "fs";
import path from "path";
import { config } from "../config";

export const ensureUploadDir = () => {
  if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  }
};

export const saveMetadata = (meta: any) => {
  const metaPath = path.join(config.UPLOAD_DIR, `${meta.videoId}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
};
