import { Router } from "express";
import uploadRoutes from "./upload.routes";
// import sttRoutes from "./sst.routes";
import captionsRoutes from "./captions.routes";

const router = Router();

router.use("/upload", uploadRoutes);
// router.use("/stt", sttRoutes);
router.use("/captions", captionsRoutes);

export default router;
