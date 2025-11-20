// src/services/assembly.provider.ts
import axios from "axios";
import fs from "fs";

export class AssemblyProvider {
  private static baseUrl = "https://api.assemblyai.com/v2";

  static async transcribe(audioFilePath: string): Promise<string> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY missing in .env");

    // Step 1 — UPLOAD audio file
    const uploadRes = await axios({
      method: "post",
      url: `${this.baseUrl}/upload`,
      data: fs.createReadStream(audioFilePath),
      headers: {
        authorization: apiKey,
        "transfer-encoding": "chunked",
      }
    });

    const audioUrl = uploadRes.data.upload_url;

    // Step 2 — CREATE transcription request
    const createRes = await axios.post(
      `${this.baseUrl}/transcript`,
      { audio_url: audioUrl },
      {
        headers: {
          authorization: apiKey,
          "content-type": "application/json",
        },
      }
    );

    const transcriptId = createRes.data.id;

    // Step 3 — POLL until complete
    while (true) {
      const polling = await axios.get(
        `${this.baseUrl}/transcript/${transcriptId}`,
        {
          headers: { authorization: apiKey },
        }
      );

      if (polling.data.status === "completed") {
        return polling.data.text;
      }

      if (polling.data.status === "error") {
        throw new Error("Transcription failed: " + polling.data.error);
      }

      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}
