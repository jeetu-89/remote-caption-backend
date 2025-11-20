import fs from "fs";
import path from "path";
import { extractAudio } from "../utils/ffmpeg.util";
import { STTService } from "../services/sst.service";

export const generateCaptions = async (req: any, res: any) => {
  try {
    const { videoId } = req.body;

    const metadataPath = path.join("uploads", `${videoId}.json`);
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: "Video metadata not found" });
    }

    const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    const videoPath = meta.path;

    // Extract audio from video
    const audioPath = await extractAudio(videoPath);

    // Transcribe using AssemblyAI
    const text = await STTService.transcribe(audioPath, "assembly");

    return res.json({
      message: "Transcription successful",
      text,
    });
  } catch (err: any) {
    console.error("STT Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
