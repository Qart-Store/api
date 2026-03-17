import { Request, Response } from "express";
import * as orderModel from "../models/order.model.js";
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

export const createMyOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as CreateOrderInput;

    if (
      !body?.shippingFullName?.trim() ||
      !body?.shippingEmail?.trim() ||
      !body?.shippingLocation?.trim()
    ) {
      throw new AppError(
        "shippingFullName, shippingEmail and shippingLocation are required",
        400,
        "failed",
      );
    }

    let order: OrderEntity;
    try {
      order = await orderModel.createOrderFromCart(authUser.id, body);
    } catch (error) {
      if (error instanceof Error && error.message === "Cart is empty") {
        throw new AppError("Cart is empty", 400, "failed");
      }

      throw error;
    }

    return sendSuccess(res, "Order created", order, 201, "success");
  },
);

export const listMyOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const orders = await orderModel.listOrdersByCustomer(authUser.id);

    return sendSuccess(res, "Orders fetched", orders, 200, "ok");
  },
);

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const authUser = requireAuthUser(req);
  const orderId = toSingleParam(req.params.orderId);

  if (!orderId?.trim()) {
    throw new AppError("orderId is required", 400, "failed");
  }

  const order = await orderModel.getOrderById(authUser.id, orderId);
  if (!order) {
    throw new AppError("Order not found", 404, "error");
  }

  const items = await orderModel.listOrderItems(order.id);

  return sendSuccess(
    res,
    "Order fetched",
    {
      order,
      items,
    },
    200,
    "ok",
  );
});
