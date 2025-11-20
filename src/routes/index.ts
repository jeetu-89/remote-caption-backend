import { Router } from "express";
import uploadRoutes from "./upload.routes";
// import sttRoutes from "./sst.routes";
import captionsRoutes from "./captions.routes";
import downloadRoutes from "./download.routes";
import captionsFromUrlRoutes from "./captions.fromUrl.routes";




const router = Router();

router.use("/upload", uploadRoutes);
// router.use("/stt", sttRoutes);
router.use("/captions", captionsRoutes);
router.use("/download", downloadRoutes);
router.use("/captions/from-url", captionsFromUrlRoutes);

export default router;
