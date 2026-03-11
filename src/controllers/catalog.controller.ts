import { Request, Response } from "express";
import asyncHandler from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as catalogModel from "../models/catalog.model";

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await catalogModel.listCategories();
    return sendSuccess(
      res,
      "Categories fetched successfully",
      categories,
      200,
      "ok",
    );
  },
);

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await catalogModel.listBrands();
  return sendSuccess(res, "Brands fetched successfully", brands, 200, "ok");
});
