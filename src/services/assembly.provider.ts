// src/services/assembly.provider.ts
import axios from "axios";
import fs from "fs";
import path from "path";

export interface AssemblyWord {
  text: string;
  start: number; // ms
  end: number;   // ms
  confidence?: number;
  speaker?: string | null;
}

export interface AssemblyResult {
  text: string;
  words?: AssemblyWord[];
  raw?: any;
}

export class AssemblyProvider {
  private static baseUrl = "https://api.assemblyai.com/v2";

  /**
   * Upload local audio file to AssemblyAI. Returns the publicly-available upload_url returned by AssemblyAI.
   */
  static async uploadAudioFile(audioFilePath: string, apiKey: string): Promise<string> {
    if (!fs.existsSync(audioFilePath)) throw new Error(`Audio file not found: ${audioFilePath}`);

    const stat = fs.statSync(audioFilePath);
    const readStream = fs.createReadStream(audioFilePath);

    // Use axios to stream binary to /upload endpoint
    const uploadUrl = `${this.baseUrl}/upload`;

    // headers: authorization + chunked; content-type can be application/octet-stream
    const res = await axios.post(uploadUrl, readStream, {
      headers: {
        authorization: apiKey,
        "transfer-encoding": "chunked",
        "content-type": "application/octet-stream",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (!res?.data?.upload_url) throw new Error("AssemblyAI upload did not return upload_url: " + JSON.stringify(res?.data));
    return res.data.upload_url;
  }

  /**
   * Create a transcript job (valid, minimal schema).
   * IMPORTANT: only include documented fields. A 400 typically means your body contained an unknown/deprecated field.
   */
  static async createTranscriptJob(audioUrl: string, apiKey: string) {
    // NOTE: Use documented language_code values like "en_us" (not "en") if specifying language_code.
    const body = {
      audio_url: audioUrl,
      // choose "best" or "universal" depending on your account and budget; "best" is recommended for quality.
      speech_model: "best",
      // optional formatting/punctuation flags - these are valid fields per docs
      format_text: true,
      punctuate: true,
      // if specifying language, use documented codes (e.g. en_us). Omit to let AssemblyAI auto-detect.
      // language_code: "en_us",
    };

    // log request body locally for debug (remove in prod)
    // console.log("Creating transcript with body:", JSON.stringify(body));

    const res = await axios.post(`${this.baseUrl}/transcript`, body, {
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
      },
    });

    return res.data; // contains id
  }

  /**
   * Poll transcript until completed (or error). Returns the final transcript object from AssemblyAI.
   */
  static async pollTranscript(transcriptId: string, apiKey: string, pollIntervalMs = 1500) {
    while (true) {
      const statusRes = await axios.get(`${this.baseUrl}/transcript/${transcriptId}`, {
        headers: { authorization: apiKey },
      });

      const data = statusRes.data;
      if (data.status === "completed") return data;
      if (data.status === "error") throw new Error("AssemblyAI transcription failed: " + (data.error || JSON.stringify(data)));
      // still processing
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  /**
   * High-level: upload & transcribe an audio file, returning { text, words[] }.
   * Throws with AssemblyAI error responses (and surfaces their JSON).
   */
  static async transcribeAudioFileWithWords(audioFilePath: string): Promise<AssemblyResult> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY missing in .env");

    try {
      // Step 1: upload
      const audioUrl = await this.uploadAudioFile(audioFilePath, apiKey);

      // Step 2: create transcript job (minimal allowed schema)
      const create = await this.createTranscriptJob(audioUrl, apiKey);
      const transcriptId = create.id;
      if (!transcriptId) throw new Error("No transcript id returned from AssemblyAI: " + JSON.stringify(create));

      // Step 3: poll
      const final = await this.pollTranscript(transcriptId, apiKey);

      // final may include `words` array (each has text,start,end,confidence) — use if present
      const words = Array.isArray(final.words)
        ? final.words.map((w: any) => ({
            text: w.text,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
            speaker: w.speaker ?? null,
          }))
        : undefined;

      return { text: final.text || "", words, raw: final };
    } catch (err: any) {
      // If axios error with response from AssemblyAI, include response data for quick debugging
      if (err?.response?.data) {
        const body = err.response.data;
        // throw a clearer error so you see AssemblyAI's message in server logs / Postman
        throw new Error("AssemblyAI error: " + JSON.stringify(body, null, 2));
      }
      throw err;
    }
  }
}
