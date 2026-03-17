import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import AppError from "../utils/app-error.js";

const uploadRoot = path.resolve(process.cwd(), "uploads");
const productUploadRoot = path.join(uploadRoot, "products");

const productStorage = multer.diskStorage({
  destination: (_req, file, callback) => {
    const targetDir =
      file.fieldname === "banner"
        ? path.join(productUploadRoot, "banners")
        : file.fieldname === "ogBanner"
          ? path.join(productUploadRoot, "og-banners")
          : path.join(productUploadRoot, "images");

    fs.mkdirSync(targetDir, { recursive: true });
    callback(null, targetDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname) || ".bin";
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const imageUploadFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback,
) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new AppError("Only image uploads are allowed", 400, "failed"));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage: productStorage,
  fileFilter: imageUploadFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 22,
  },
});

export const productUploadMiddleware = upload.fields([
  { name: "banner", maxCount: 1 },
  { name: "ogBanner", maxCount: 1 },
  { name: "images", maxCount: 20 },
]);

export function toUploadedFileUrl(file: Express.Multer.File) {
  const relativePath = path.relative(uploadRoot, file.path).replace(/\\/g, "/");
  return `/uploads/${relativePath}`;
}
