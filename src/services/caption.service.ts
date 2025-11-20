// src/services/caption.service.ts
import fs from "fs";
import path from "path";
import { extractAudio } from "../utils/ffmpeg.util";
import { AssemblyProvider } from "./assembly.provider";
import { CaptionSegment, segmentsToSRT, segmentsToVTT } from "../utils/captions.util";
import { getVideoDuration } from "../utils/video.util";

/**
 * Fallback segmentation: split transcript text into timed chunks.
 * (Because we are NOT using AssemblyAI word timestamps anymore)
 */
function fallbackSegmentsFromText(
  text: string,
  duration: number,
  approxSegSeconds = 3
): CaptionSegment[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0)
    return [{ start: 0, end: Math.max(1, duration), text: "" }];

  const totalSegments = Math.max(1, Math.floor(duration / approxSegSeconds));
  const wordsPerSegment = Math.max(1, Math.ceil(words.length / totalSegments));

  const segments: CaptionSegment[] = [];
  let index = 0;

  while (index < words.length) {
    const slice = words.slice(index, index + wordsPerSegment);
    const segStartRatio = index / words.length;
    const segEndRatio = Math.min(
      (index + wordsPerSegment) / words.length,
      1
    );

    segments.push({
      start: segStartRatio * duration,
      end: segEndRatio * duration,
      text: slice.join(" "),
    });

    index += wordsPerSegment;
  }

  return segments;
}

/**
 * Generate captions for a video using AssemblyAI (text-only transcription).
 */
export async function generateCaptionsForVideo(videoMeta: {
  videoId: string;
  path: string;
}) {
  const { videoId, path: videoPath } = videoMeta;

  // 1) Extract audio using FFmpeg
  const audioPath = await extractAudio(videoPath);

  // 2) Transcribe using new SIMPLE AssemblyAI transcription
  const rawText = await AssemblyProvider.transcribe(audioPath);

  if (!rawText.trim()) {
    throw new Error("Transcription returned empty text.");
  }

  // 3) Build segments WITHOUT using timestamps
  const rawDuration = await getVideoDuration(videoPath);
  const duration = rawDuration ?? 1; // fallback to 1 second if duration couldn't be determined

  const segments = fallbackSegmentsFromText(rawText, duration, 3);

  // 4) Save output files
  const uploadsDir = "uploads";
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const srt = segmentsToSRT(segments);
  const vtt = segmentsToVTT(segments);
  const json = JSON.stringify({ text: rawText, segments }, null, 2);

  const srtPath = path.join(uploadsDir, `${videoId}.srt`);
  const vttPath = path.join(uploadsDir, `${videoId}.vtt`);
  const jsonPath = path.join(uploadsDir, `${videoId}.captions.json`);

  fs.writeFileSync(srtPath, srt, "utf-8");
  fs.writeFileSync(vttPath, vtt, "utf-8");
  fs.writeFileSync(jsonPath, json, "utf-8");

  return { srtPath, vttPath, jsonPath, segments };
}
