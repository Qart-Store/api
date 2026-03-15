import { Request, Response } from "express";
import * as paymentModel from "../models/payment.model";
import {
  initializePaystackTransaction,
  mapPaystackStatusToPaymentStatus,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from "../services/paystack.service";
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

function toHeaderString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
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

    const paystackTransaction = await initializePaystackTransaction({
      email: authUser.email,
      amount: Math.round(amount * 100),
      reference: transaction.reference,
      metadata: {
        customerId: authUser.id,
        orderId: body?.orderId ?? null,
        ...(body?.payload ?? {}),
      },
    });

    return sendSuccess(
      res,
      "Payment initialized",
      {
        transaction,
        authorizationUrl: paystackTransaction.authorization_url,
        accessCode: paystackTransaction.access_code,
        reference: paystackTransaction.reference,
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

    const paystackVerification = await verifyPaystackTransaction(reference);
    const status = mapPaystackStatusToPaymentStatus(
      paystackVerification.status,
    );

    const updatedTransaction = await paymentModel.markPaymentStatus(
      reference,
      status,
      {
        provider: "paystack",
        verification: paystackVerification as unknown as Record<
          string,
          unknown
        >,
      },
    );

    return sendSuccess(
      res,
      "Payment fetched",
      {
        transaction: updatedTransaction ?? transaction,
        verification: paystackVerification,
      },
      200,
      "ok",
    );
  },
);

export const paymentWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const rawBody = req.rawBody ?? "";
    const signature = toHeaderString(req.headers["x-paystack-signature"]);
    const isValidSignature = verifyPaystackWebhookSignature(rawBody, signature);

    if (!isValidSignature) {
      throw new AppError("Invalid paystack webhook signature", 401, "failed");
    }

    const event = req.body as
      | {
          reference?: string;
          status?: PaymentTransactionEntity["status"];
          payload?: Record<string, unknown>;
        }
      | {
          event?: string;
          data?: {
            reference?: string;
            status?: string;
          } & Record<string, unknown>;
        };

    const defaultEvent =
      "data" in event
        ? undefined
        : (event as {
            reference?: string;
            status?: PaymentTransactionEntity["status"];
          });
    const paystackEvent = "data" in event ? event.data : undefined;
    const reference = paystackEvent?.reference ?? defaultEvent?.reference ?? "";

    if (!reference.trim()) {
      throw new AppError("reference is required", 400, "failed");
    }

    const incomingStatus = String(
      paystackEvent?.status ?? defaultEvent?.status ?? "pending",
    );

    const status = mapPaystackStatusToPaymentStatus(incomingStatus);

    const transaction = await paymentModel.markPaymentStatus(
      reference,
      status,
      {
        provider: "paystack",
        webhook: event as unknown as Record<string, unknown>,
      },
    );

    if (!transaction) {
      throw new AppError("Payment not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Webhook received",
      { reference, status },
      200,
      "ok",
    );
  },
);
