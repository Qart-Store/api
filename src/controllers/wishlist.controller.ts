import { Request, Response } from "express";
import * as wishlistModel from "../models/wishlist.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";

function toSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function requireAuthUser(req: Request) {
  if (!req.authUser?.id) {
    throw new AppError("Authentication required", 401, "failed");
  }

  return req.authUser;
}

export const listMyWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const items = await wishlistModel.getWishlistItems(authUser.id);

    return sendSuccess(res, "Wishlist fetched", items, 200, "ok");
  },
);

export const addMyWishlistItem = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as { productId?: string };

    if (!body?.productId?.trim()) {
      throw new AppError("productId is required", 400, "failed");
    }

    await wishlistModel.addWishlistItem(authUser.id, body.productId);

    return sendSuccess(
      res,
      "Wishlist item added",
      { productId: body.productId },
      201,
      "success",
    );
  },
);

export const removeMyWishlistItem = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const productId = toSingleParam(req.params.productId);

    if (!productId?.trim()) {
      throw new AppError("productId is required", 400, "failed");
    }

    const removed = await wishlistModel.removeWishlistItem(
      authUser.id,
      productId,
    );

    if (!removed) {
      throw new AppError("Wishlist item not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Wishlist item removed",
      { productId },
      200,
      "success",
    );
  },
);
