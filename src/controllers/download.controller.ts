// src/controllers/download.controller.ts
import path from "path";
import fs from "fs";

export const downloadFile = (req: any, res: any) => {
  try {
    const { file } = req.params;

    if (!file) {
      return res.status(400).json({ error: "Filename required" });
    }

    const filePath = path.join("uploads", file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.download(filePath);
  } catch (err: any) {
    console.error("Download error:", err);
    return res.status(500).json({ error: "Download failed" });
  }
};
