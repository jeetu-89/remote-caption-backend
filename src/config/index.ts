import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads"
};
