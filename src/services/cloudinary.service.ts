import path from "node:path";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { toUploadedFileUrl } from "../middlewares/upload.middleware";

function getUploadFolder(file: Express.Multer.File) {
  return file.fieldname === "banner"
    ? "qart-store/products/banners"
    : "qart-store/products/images";
}

function getPublicId(file: Express.Multer.File) {
  const fileName = path.basename(file.filename, path.extname(file.filename));
  return `${file.fieldname}-${fileName}`;
}

export async function resolveUploadedFileUrl(file: Express.Multer.File) {
  if (!isCloudinaryConfigured) {
    return toUploadedFileUrl(file);
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: getUploadFolder(file),
      public_id: getPublicId(file),
      resource_type: "image",
      overwrite: false,
      use_filename: false,
    });

    return result.secure_url;
  } catch {
    return toUploadedFileUrl(file);
  }
}
