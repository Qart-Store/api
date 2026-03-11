import { Request, Response } from "express";
import * as productModel from "../models/product.model";
import asyncHandler from "../utils/async-handler";
import AppError from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

function toSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const filters: ProductListFilters = {
      page: toNumber(req.query.page),
      limit: toNumber(req.query.limit),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      category:
        typeof req.query.category === "string" ? req.query.category : undefined,
      brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
      status:
        typeof req.query.status === "string"
          ? (req.query.status as ProductStatus)
          : undefined,
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      sortBy:
        typeof req.query.sortBy === "string"
          ? (req.query.sortBy as ProductListFilters["sortBy"])
          : undefined,
      sortOrder:
        typeof req.query.sortOrder === "string"
          ? (req.query.sortOrder as ProductListFilters["sortOrder"])
          : undefined,
    };

    const result = await productModel.listProducts(filters);
    return sendSuccess(res, "Products fetched successfully", result, 200, "ok");
  },
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = toSingleParam(req.params.id);
    const product = await productModel.getProductById(productId);

    if (!product) {
      throw new AppError("Product not found", 404, "error");
    }

    return sendSuccess(res, "Product fetched successfully", product, 200, "ok");
  },
);

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateProductInput;

    if (!body?.name?.trim()) {
      throw new AppError("name is required", 400, "failed");
    }

    if (
      typeof body.price !== "number" ||
      Number.isNaN(body.price) ||
      body.price < 0
    ) {
      throw new AppError(
        "price must be a valid non-negative number",
        400,
        "failed",
      );
    }

    const payload: CreateProductInput = {
      ...body,
      images: toStringArray(body.images),
      tags: toStringArray(body.tags),
    };

    const product = await productModel.createProduct(payload);
    return sendSuccess(
      res,
      "Product created successfully",
      product,
      201,
      "success",
    );
  },
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = toSingleParam(req.params.id);
    const body = req.body as UpdateProductInput;

    if (
      body.price !== undefined &&
      (typeof body.price !== "number" ||
        Number.isNaN(body.price) ||
        body.price < 0)
    ) {
      throw new AppError(
        "price must be a valid non-negative number",
        400,
        "failed",
      );
    }

    const payload: UpdateProductInput = {
      ...body,
      images: toStringArray(body.images),
      tags: toStringArray(body.tags),
    };

    const updated = await productModel.updateProduct(productId, payload);
    if (!updated) {
      throw new AppError("Product not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Product updated successfully",
      updated,
      200,
      "success",
    );
  },
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = toSingleParam(req.params.id);
    const deleted = await productModel.deleteProduct(productId);

    if (!deleted) {
      throw new AppError("Product not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Product deleted successfully",
      { id: productId },
      200,
      "success",
    );
  },
);
