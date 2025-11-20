import { Router } from "express";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "API is working!" });
});

router.use("/upload", uploadRoutes);

export default router;
