import { z } from "zod";

const optionalNullableText = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .optional()
  .nullable();

export const cartItemBodySchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99).default(1),
    color: optionalNullableText,
    size: optionalNullableText,
  })
  .strict();

export const cartItemParamsSchema = z
  .object({
    productId: z.string().uuid(),
  })
  .strict();

export const cartSummaryBodySchema = z
  .object({
    couponCode: z.string().trim().min(1).max(40).optional().nullable(),
  })
  .strict();

export const wishlistItemBodySchema = z
  .object({
    productId: z.string().uuid(),
  })
  .strict();

export const orderCreateBodySchema = z
  .object({
    couponCode: z.string().trim().min(1).max(40).optional().nullable(),
    shippingFullName: z.string().trim().min(2).max(120),
    shippingEmail: z.string().trim().email().max(160),
    shippingPhone: z.string().trim().min(5).max(40).optional().nullable(),
    shippingLocation: z.string().trim().min(2).max(120),
    shippingAddress: z.record(z.string(), z.unknown()).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

export const orderIdParamsSchema = z
  .object({
    orderId: z.string().uuid(),
  })
  .strict();

export const paymentInitializeBodySchema = z
  .object({
    orderId: z.string().uuid().optional().nullable(),
    amount: z.number().positive(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const paymentVerifyParamsSchema = z
  .object({
    reference: z.string().trim().min(6).max(120),
  })
  .strict();

export const paymentWebhookBodySchema = z
  .object({
    reference: z.string().trim().min(6).max(120),
    status: z.enum(["pending", "success", "failed", "abandoned"]).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
