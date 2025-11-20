// src/controllers/captions.controller.ts
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { generateCaptionsForVideo } from "../services/caption.service";

export const generateCaptions = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: "videoId required" });

    const metaPath = path.join("uploads", `${videoId}.json`);
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: "Video metadata not found" });

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const out = await generateCaptionsForVideo(meta);

    return res.json({
      message: "Captions generated",
      files: {
        srt: `/api/download/${path.basename(out.srtPath)}`,
        vtt: `/api/download/${path.basename(out.vttPath)}`,
        json: `/api/download/${path.basename(out.jsonPath)}`
      },
      segmentsCount: out.segments.length
    });
  } catch (err: any) {
    console.error("Caption generation error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getCaptionFiles = (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    if (!videoId) return res.status(400).json({ error: "videoId missing" });

    const base = "uploads";
    const srtPath = path.join(base, `${videoId}.srt`);
    const vttPath = path.join(base, `${videoId}.vtt`);
    const jsonPath = path.join(base, `${videoId}.captions.json`);

    return res.json({
      exists: {
        srt: fs.existsSync(srtPath),
        vtt: fs.existsSync(vttPath),
        json: fs.existsSync(jsonPath),
      },
      files: {
        srt: fs.existsSync(srtPath) ? `/api/download/${videoId}.srt` : null,
        vtt: fs.existsSync(vttPath) ? `/api/download/${videoId}.vtt` : null,
        json: fs.existsSync(jsonPath) ? `/api/download/${videoId}.captions.json` : null,
      }
    });
  } catch (err: any) {
    console.error("Caption status error:", err);
    return res.status(500).json({ error: err.message });
  }
};
