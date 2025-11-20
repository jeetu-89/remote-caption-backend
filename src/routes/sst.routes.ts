import { Router } from "express";
import { generateCaptions } from "../controllers/sst.controller";

const router = Router();
router.post("/", generateCaptions);

export default router;
