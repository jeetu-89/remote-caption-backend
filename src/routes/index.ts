import { Router } from "express";
import uploadRoutes from "./upload.routes";
import sttRoutes from "./sst.routes";

const router = Router();

router.use("/upload", uploadRoutes);
router.use("/stt", sttRoutes);

export default router;
