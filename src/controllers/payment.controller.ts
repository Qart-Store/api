import { Request, Response } from "express";
import * as paymentModel from "../models/payment.model";
import asyncHandler from "../utils/async-handler";
import AppError from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

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

export const initializeMyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as {
      orderId?: string | null;
      amount?: number;
      payload?: Record<string, unknown>;
    };

    const amount = Number(body?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("amount must be greater than 0", 400, "failed");
    }

    const transaction = await paymentModel.initializePayment(
      authUser.id,
      body?.orderId ?? null,
      amount,
      body?.payload,
    );

    return sendSuccess(
      res,
      "Payment initialized",
      {
        transaction,
        authorizationUrl: `https://checkout.paystack.com/${transaction.reference}`,
      },
      201,
      "success",
    );
  },
);

export const verifyMyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    requireAuthUser(req);
    const reference = toSingleParam(req.params.reference);

    if (!reference?.trim()) {
      throw new AppError("reference is required", 400, "failed");
    }

    const transaction = await paymentModel.getPaymentByReference(reference);
    if (!transaction) {
      throw new AppError("Payment not found", 404, "error");
    }

    return sendSuccess(res, "Payment fetched", transaction, 200, "ok");
  },
);

export const paymentWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const event = req.body as {
      reference?: string;
      status?: PaymentTransactionEntity["status"];
      payload?: Record<string, unknown>;
    };

    if (!event?.reference?.trim()) {
      throw new AppError("reference is required", 400, "failed");
    }

    const status: PaymentTransactionEntity["status"] =
      event.status === "success" ||
      event.status === "failed" ||
      event.status === "abandoned"
        ? event.status
        : "pending";

    const transaction = await paymentModel.markPaymentStatus(
      event.reference,
      status,
      event.payload,
    );

    if (!transaction) {
      throw new AppError("Payment not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Webhook received",
      { reference: event.reference, status },
      200,
      "ok",
    );
  },
);
