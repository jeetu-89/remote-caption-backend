// src/services/caption.service.ts
import fs from "fs";
import path from "path";
import { extractAudio } from "../utils/ffmpeg.util";
import { AssemblyProvider } from "./assembly.provider";
import { CaptionSegment, segmentsToSRT, segmentsToVTT } from "../utils/captions.util";

// YouTube-style segmentation
function groupWordsToYouTubeSegments(words: { text: string; start: number; end: number }[]) {
  const segments: CaptionSegment[] = [];
  if (!words.length) return segments;

  let current: CaptionSegment = {
    start: words[0].start / 1000,
    end: words[0].end / 1000,
    text: words[0].text
  };

  for (let i = 1; i < words.length; i++) {
    const w = words[i];

    const gap = (w.start - words[i - 1].end);           // silence gap in ms
    const segDuration = (w.end / 1000 - current.start); // segment duration in sec
    const longWord = w.text.length > 9;                 // avoid long unreadable lines

    const shouldSplit =
      gap > 800 ||        // long pause → new caption
      segDuration > 3 ||  // YouTube prefers ~3s per caption
      longWord;           // break large words into new captions

    if (shouldSplit) {
      segments.push(current);
      current = {
        start: w.start / 1000,
        end: w.end / 1000,
        text: w.text,
      };
    } else {
      current.text += " " + w.text;
      current.end = w.end / 1000;
    }
  }

  segments.push(current);
  return segments;
}

export async function generateCaptionsForVideo(videoMeta: { videoId: string; path: string }) {
  const { videoId, path: videoPath } = videoMeta;

  const audioPath = await extractAudio(videoPath);

  // REAL word timestamps
  const result = await AssemblyProvider.transcribeAudioFileWithWords(audioPath);
  const words = result.words || [];

  let segments: CaptionSegment[] = [];

  if (words.length) {
    segments = groupWordsToYouTubeSegments(words);
  } else {
    // fallback (very rare)
    segments = [{
      start: 0,
      end: 5,
      text: result.text
    }];
  }

  const uploadDir = "uploads";
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const srtPath = path.join(uploadDir, `${videoId}.srt`);
  const vttPath = path.join(uploadDir, `${videoId}.vtt`);
  const jsonPath = path.join(uploadDir, `${videoId}.captions.json`);

  fs.writeFileSync(srtPath, segmentsToSRT(segments));
  fs.writeFileSync(vttPath, segmentsToVTT(segments));
  fs.writeFileSync(jsonPath, JSON.stringify({ text: result.text, segments }, null, 2));

  return { srtPath, vttPath, jsonPath, segments };
}
