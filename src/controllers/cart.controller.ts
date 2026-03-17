import { Request, Response } from "express";
import * as cartModel from "../models/cart.model.js";
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

export const getMyCart = asyncHandler(async (req: Request, res: Response) => {
  const authUser = requireAuthUser(req);
  const items = await cartModel.getCartItems(authUser.id);
  const summary = cartModel.computeCartSummary(items, 0);

  return sendSuccess(
    res,
    "Cart fetched",
    {
      items,
      summary,
    },
    200,
    "ok",
  );
});

export const upsertMyCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as {
      productId?: string;
      quantity?: number;
      color?: string | null;
      size?: string | null;
    };

    if (!body?.productId?.trim()) {
      throw new AppError("productId is required", 400, "failed");
    }

    const quantity = Number(body.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError("quantity must be greater than 0", 400, "failed");
    }

    await cartModel.upsertCartItem(
      authUser.id,
      body.productId,
      Math.floor(quantity),
      body.color ?? null,
      body.size ?? null,
    );

    const items = await cartModel.getCartItems(authUser.id);
    return sendSuccess(res, "Cart item saved", { items }, 200, "success");
  },
);

export const removeMyCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const productId = toSingleParam(req.params.productId);

    if (!productId?.trim()) {
      throw new AppError("productId is required", 400, "failed");
    }

    const removed = await cartModel.removeCartItem(authUser.id, productId);
    if (!removed) {
      throw new AppError("Cart item not found", 404, "error");
    }

    return sendSuccess(res, "Cart item removed", { productId }, 200, "success");
  },
);

export const clearMyCart = asyncHandler(async (req: Request, res: Response) => {
  const authUser = requireAuthUser(req);
  await cartModel.clearCart(authUser.id);
  return sendSuccess(res, "Cart cleared", null, 200, "success");
});

export const getMyCartSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as { couponCode?: string | null };

    const items = await cartModel.getCartItems(authUser.id);
    const discountPercent = await cartModel.getCouponDiscountPercent(
      body?.couponCode,
    );

    const summary = {
      ...cartModel.computeCartSummary(items, discountPercent),
      couponCode: body?.couponCode?.trim() || null,
    };

    return sendSuccess(
      res,
      "Cart summary calculated",
      {
        items,
        summary,
      },
      200,
      "ok",
    );
  },
);
