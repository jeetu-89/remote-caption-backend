import crypto from "crypto";
import path from "path";
import { downloadToTmp } from "../utils/download.util";
import { extractAudio } from "../utils/ffmpeg.util";
import { AssemblyProvider } from "./assembly.provider";
import { CaptionSegment, segmentsToSRT, segmentsToVTT } from "../utils/captions.util";
import { uploadFilePathToCloudinary } from "./cloudinary.provider";
import fs from "fs";

function groupWordsToSegments(words: any[]): CaptionSegment[] {
  if (!words.length) return [];
  
  const segments: CaptionSegment[] = [];
  let current = {
    start: words[0].start / 1000,
    end: words[0].end / 1000,
    text: words[0].text
  };

  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const gap = w.start - words[i - 1].end;
    const duration = (w.end / 1000) - current.start;

    if (gap > 800 || duration > 3 || w.text.length > 9) {
      segments.push(current);
      current = {
        start: w.start / 1000,
        end: w.end / 1000,
        text: w.text
      };
    } else {
      current.text += " " + w.text;
      current.end = w.end / 1000;
    }
  }

  segments.push(current);
  return segments;
}

export async function generateCaptionsFromCloudinaryUrl(videoUrl: string) {
  const videoId = crypto.randomBytes(8).toString("hex");

  // 1. Download video to /tmp
  const localVideoPath = await downloadToTmp(videoUrl, videoId);

  // 2. Extract audio
  const audioPath = await extractAudio(localVideoPath);

  // 3. Transcribe
  const result = await AssemblyProvider.transcribeAudioFileWithWords(audioPath);
  const words = result.words || [];

  const segments = words.length
    ? groupWordsToSegments(words)
    : [{ start: 0, end: 5, text: result.text }];

  // 4. Prepare output files
  const srtPath = path.join("/tmp", `${videoId}.srt`);
  const vttPath = path.join("/tmp", `${videoId}.vtt`);
  const jsonPath = path.join("/tmp", `${videoId}.json`);

  fs.writeFileSync(srtPath, segmentsToSRT(segments));
  fs.writeFileSync(vttPath, segmentsToVTT(segments));
  fs.writeFileSync(jsonPath, JSON.stringify({ text: result.text, segments }, null, 2));

  // 5. Upload caption files to Cloudinary
  const srtUpload = await uploadFilePathToCloudinary(srtPath, {
    public_id: `captions/${videoId}_captions_srt`,
    resource_type: "raw"
  });

  const vttUpload = await uploadFilePathToCloudinary(vttPath, {
    public_id: `captions/${videoId}_captions_vtt`,
    resource_type: "raw"
  });

  const jsonUpload = await uploadFilePathToCloudinary(jsonPath, {
    public_id: `captions/${videoId}_captions_json`,
    resource_type: "raw"
  });

  return {
    videoId,
    srtUrl: srtUpload.secure_url,
    vttUrl: vttUpload.secure_url,
    jsonUrl: jsonUpload.secure_url,
    segmentsCount: segments.length
  };
}
