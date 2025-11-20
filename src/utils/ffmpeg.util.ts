import ffmpeg from "ffmpeg-static";
import { spawn } from "child_process";
import path from "path";

export const extractAudio = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = path.resolve(videoPath);

    // Save audio right next to the video file
    const output = path.join(
      path.dirname(input),
      path.basename(input, path.extname(input)) + "_audio.wav"
    );

    console.log("INPUT PATH:", input);
    console.log("OUTPUT PATH:", output);

    const ff = spawn(ffmpeg as string, [
      "-i", input,        // input file
      "-ac", "1",         // mono audio
      "-ar", "16000",     // 16kHz sample rate (best for STT)
      "-vn",              // no video
      output,             // output file
      "-y"                // overwrite if exists
    ]);

    ff.stderr.on("data", (data) => {
      console.log("ffmpeg:", data.toString());
    });

    ff.on("close", (code) => {
      if (code === 0) {
        console.log("Audio extraction complete:", output);
        resolve(output);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
};
