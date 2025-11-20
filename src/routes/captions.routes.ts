// src/routes/captions.routes.ts
import { Router } from "express";
import { generateCaptions, getCaptionFiles } from "../controllers/captions.controller";

const router = Router();

router.post("/", generateCaptions);
router.get("/:videoId", getCaptionFiles);

export default router;
