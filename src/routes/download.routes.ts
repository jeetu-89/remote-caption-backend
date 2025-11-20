// src/routes/download.routes.ts
import { Router } from "express";
import { downloadFile } from "../controllers/download.controller";

const router = Router();

router.get("/:file", downloadFile);

export default router;
