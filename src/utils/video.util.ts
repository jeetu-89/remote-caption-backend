// src/utils/video.util.ts
import { spawn } from "child_process";
import path from "path";

export function getVideoDuration(videoPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    const input = path.resolve(videoPath);
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      input
    ]);

    let output = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.on("close", () => {
      const trimmed = output.trim();
      const val = parseFloat(trimmed);
      if (isNaN(val)) resolve(null);
      else resolve(val);
    });
    proc.on("error", () => resolve(null));
  });
}
