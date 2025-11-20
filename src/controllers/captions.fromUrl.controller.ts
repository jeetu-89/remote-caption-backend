import { Request, Response } from "express";
import { generateCaptionsFromCloudinaryUrl } from "../services/caption.fromUrl.service";

export const generateCaptionsFromUrl = async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "videoUrl is required" });
    }

    const result = await generateCaptionsFromCloudinaryUrl(videoUrl);

    return res.status(200).json({
      message: "Captions generated successfully",
      ...result
    });
  } catch (err: any) {
    console.error("Caption-from-url error:", err);
    return res.status(500).json({ error: err.message });
  }
};
