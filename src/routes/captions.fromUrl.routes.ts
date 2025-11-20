import { Router } from "express";
import { generateCaptionsFromUrl } from "../controllers/captions.fromUrl.controller";

const router = Router();

router.post("/", generateCaptionsFromUrl);

export default router;
