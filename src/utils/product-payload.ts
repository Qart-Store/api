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
        ogBanner?: Express.Multer.File[];
        images?: Express.Multer.File[];
      }
    | undefined;

  return {
    banner: files?.banner?.[0],
    ogBanner: files?.ogBanner?.[0],
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
  const ogImageUrl = uploadedFiles.ogBanner
    ? await resolveUploadedFileUrl(uploadedFiles.ogBanner)
    : toNullableString(body.ogImageUrl);

  return {
    name: String(body.name ?? "").trim(),
    description: toNullableString(body.description),
    seoTitle: String(body.seoTitle ?? "").trim(),
    seoDescription: String(body.seoDescription ?? "").trim(),
    seoKeywords: toStringArray(body.seoKeywords) ?? [],
    canonicalUrl: toNullableString(body.canonicalUrl),
    ogImageUrl,
    price: toOptionalNumber(body.price) ?? Number.NaN,
    status: body.status as ProductStatus | undefined,
    stock: toOptionalNumber(body.stock),
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
  if (body.seoTitle !== undefined) {
    payload.seoTitle = toNullableString(body.seoTitle);
  }
  if (body.seoDescription !== undefined) {
    payload.seoDescription = toNullableString(body.seoDescription);
  }
  if (body.seoKeywords !== undefined) {
    payload.seoKeywords = toStringArray(body.seoKeywords);
  }
  if (body.canonicalUrl !== undefined) {
    payload.canonicalUrl = toNullableString(body.canonicalUrl);
  }
  if (body.ogImageUrl !== undefined) {
    payload.ogImageUrl = toNullableString(body.ogImageUrl);
  }
  if (body.price !== undefined) payload.price = toOptionalNumber(body.price);
  if (body.status !== undefined) payload.status = body.status as ProductStatus;
  if (body.stock !== undefined) payload.stock = toOptionalNumber(body.stock);
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

  if (uploadedFiles.ogBanner) {
    payload.ogImageUrl = await resolveUploadedFileUrl(uploadedFiles.ogBanner);
  }

  if (body.images !== undefined || uploadedImageUrls.length) {
    payload.images = [...(imageUrlsFromBody ?? []), ...uploadedImageUrls];
  }

  return payload;
}
