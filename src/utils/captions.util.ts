// src/utils/captions.util.ts
export type CaptionSegment = { start: number; end: number; text: string };

/**
 * Format seconds -> "HH:MM:SS,mmm" (SRT)
 */
export function formatTimestampSRT(seconds: number) {
  const hr = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * SRT from segments
 */
export function segmentsToSRT(segments: CaptionSegment[]) {
  return segments
    .map((seg, i) => `${i + 1}\n${formatTimestampSRT(seg.start)} --> ${formatTimestampSRT(seg.end)}\n${seg.text}\n`)
    .join("\n");
}

/**
 * VTT from segments (WEBVTT)
 */
export function segmentsToVTT(segments: CaptionSegment[]) {
  const lines = ["WEBVTT", ""];
  for (const seg of segments) {
    // VTT uses dot milliseconds
    const formatVTT = (s: number) => {
      const hr = Math.floor(s / 3600);
      const min = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.floor((s - Math.floor(s)) * 1000);
      return `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    };
    lines.push(`${formatVTT(seg.start)} --> ${formatVTT(seg.end)}`);
    lines.push(seg.text);
    lines.push("");
  }
  return lines.join("\n");
}
