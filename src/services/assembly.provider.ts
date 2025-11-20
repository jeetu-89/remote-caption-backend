import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export class AssemblyProvider {
  private static baseUrl = "https://api.assemblyai.com/v2";

  static async transcribe(audioFilePath: string): Promise<string> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY missing in .env");

    // Step 1 — Upload audio to AssemblyAI
    const uploadUrl = `${this.baseUrl}/upload`;

    const audioStream = fs.createReadStream(audioFilePath);

    const uploadRes = await axios({
      method: "post",
      url: uploadUrl,
      headers: {
        authorization: apiKey,
        "transfer-encoding": "chunked"
      },
      data: audioStream
    });

    const audioUrl = uploadRes.data.upload_url;

    // Step 2 — Request transcription
    const transcribeRes = await axios.post(
      `${this.baseUrl}/transcript`,
      {
        audio_url: audioUrl,
      },
      {
        headers: {
          authorization: apiKey,
          "content-type": "application/json",
        },
      }
    );

    const transcriptId = transcribeRes.data.id;

    // Step 3 — Poll until completed
    while (true) {
      const statusRes = await axios.get(
        `${this.baseUrl}/transcript/${transcriptId}`,
        {
          headers: {
            authorization: apiKey,
          },
        }
      );

      if (statusRes.data.status === "completed") {
        return statusRes.data.text;
      }

      if (statusRes.data.status === "error") {
        throw new Error("Transcription failed: " + statusRes.data.error);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}
