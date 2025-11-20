import axios from "axios";
import fs from "fs";
import path from "path";

export async function downloadToTmp(url: string, videoId: string): Promise<string> {
  const tmpPath = path.join("/tmp", `${videoId}.mp4`);
  const writer = fs.createWriteStream(tmpPath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(tmpPath));
    writer.on("error", reject);
  });
}
