import { Request } from "express";
import { resolveUploadedFileUrl } from "../services/cloudinary.service";

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
}

function getUploadedProductFiles(req: Request) {
  const files = req.files as
    | {
        banner?: Express.Multer.File[];
        images?: Express.Multer.File[];
      }
    | undefined;

  return {
    banner: files?.banner?.[0],
    images: files?.images ?? [],
  };
}

export async function buildCreateProductInput(
  req: Request,
): Promise<CreateProductInput> {
  const body = req.body as Record<string, unknown>;
  const uploadedFiles = getUploadedProductFiles(req);
  const imageUrlsFromBody = toStringArray(body.images);
  const uploadedImageUrls = await Promise.all(
    uploadedFiles.images.map(resolveUploadedFileUrl),
  );
  const bannerUrl = uploadedFiles.banner
    ? await resolveUploadedFileUrl(uploadedFiles.banner)
    : toNullableString(body.bannerUrl);

  return {
    name: String(body.name ?? "").trim(),
    description: toNullableString(body.description),
    price: toOptionalNumber(body.price) ?? Number.NaN,
    status: body.status as ProductStatus | undefined,
    stock: toOptionalNumber(body.stock),
    sku: toNullableString(body.sku),
    rating: toOptionalNumber(body.rating),
    bannerUrl,
    categorySlug: toNullableString(body.categorySlug),
    categoryName: toNullableString(body.categoryName),
    brandName: toNullableString(body.brandName),
    images: [...(imageUrlsFromBody ?? []), ...uploadedImageUrls],
    tags: toStringArray(body.tags),
  };
}

export async function buildUpdateProductInput(
  req: Request,
): Promise<UpdateProductInput> {
  const body = req.body as Record<string, unknown>;
  const uploadedFiles = getUploadedProductFiles(req);
  const imageUrlsFromBody = toStringArray(body.images);
  const uploadedImageUrls = await Promise.all(
    uploadedFiles.images.map(resolveUploadedFileUrl),
  );

  const payload: UpdateProductInput = {};

  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.description !== undefined) {
    payload.description = toNullableString(body.description);
  }
  if (body.price !== undefined) payload.price = toOptionalNumber(body.price);
  if (body.status !== undefined) payload.status = body.status as ProductStatus;
  if (body.stock !== undefined) payload.stock = toOptionalNumber(body.stock);
  if (body.sku !== undefined) payload.sku = toNullableString(body.sku);
  if (body.rating !== undefined) payload.rating = toOptionalNumber(body.rating);
  if (body.categorySlug !== undefined) {
    payload.categorySlug = toNullableString(body.categorySlug);
  }
  if (body.categoryName !== undefined) {
    payload.categoryName = toNullableString(body.categoryName);
  }
  if (body.brandName !== undefined) {
    payload.brandName = toNullableString(body.brandName);
  }
  if (body.tags !== undefined) payload.tags = toStringArray(body.tags);

  if (uploadedFiles.banner) {
    payload.bannerUrl = await resolveUploadedFileUrl(uploadedFiles.banner);
  } else if (body.bannerUrl !== undefined) {
    payload.bannerUrl = toNullableString(body.bannerUrl);
  }

  if (body.images !== undefined || uploadedImageUrls.length) {
    payload.images = [...(imageUrlsFromBody ?? []), ...uploadedImageUrls];
  }

  return payload;
}
