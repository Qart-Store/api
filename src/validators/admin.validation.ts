import { z } from "zod";

const optionalNullableText = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .optional()
  .nullable();

const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const customerIdParamsSchema = z
  .object({
    customerId: z.string().uuid(),
  })
  .strict();

export const addressIdParamsSchema = z
  .object({
    customerId: z.string().uuid(),
    addressId: z.string().uuid(),
  })
  .strict();

export const customersQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().min(1).max(160).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    isEmailVerified: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const updateCustomerBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: optionalNullableText,
    isActive: z.boolean().optional(),
    isEmailVerified: z.boolean().optional(),
  })
  .strict();

export const createAddressBodySchema = z
  .object({
    label: optionalNullableText,
    recipientName: z.string().trim().min(2).max(120),
    phone: optionalNullableText,
    country: z.string().trim().min(2).max(120).optional(),
    state: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    addressLine1: z.string().trim().min(2).max(240),
    addressLine2: optionalNullableText,
    postalCode: optionalNullableText,
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateAddressBodySchema = z
  .object({
    label: optionalNullableText,
    recipientName: z.string().trim().min(2).max(120).optional(),
    phone: optionalNullableText,
    country: z.string().trim().min(2).max(120).optional(),
    state: z.string().trim().min(2).max(120).optional(),
    city: z.string().trim().min(2).max(120).optional(),
    addressLine1: z.string().trim().min(2).max(240).optional(),
    addressLine2: optionalNullableText,
    postalCode: optionalNullableText,
    isDefault: z.boolean().optional(),
  })
  .strict();

export const productIdParamsSchema = z
  .object({
    productId: z.string().uuid(),
  })
  .strict();

export const productsQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().min(1).max(160).optional(),
    category: z.string().trim().min(1).max(160).optional(),
    brand: z.string().trim().min(1).max(160).optional(),
    status: z
      .enum([
        "available",
        "out-of-stock",
        "discontinued",
        "pre-order",
        "back-order",
        "limited-edition",
        "exclusive",
        "new-arrival",
        "best-seller",
        "clearance",
        "seasonal",
        "bundle",
        "digital",
        "physical",
        "archived",
      ])
      .optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(["createdAt", "price", "name", "rating"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

export const createProductBodySchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.number().min(0),
    status: productsQuerySchema.shape.status,
    stock: z.number().int().min(0).optional(),
    sku: z.string().trim().min(1).max(120).optional().nullable(),
    rating: z.number().min(0).max(5).optional().nullable(),
    imageUrl: z.string().trim().url().optional().nullable(),
    categorySlug: z.string().trim().min(1).max(180).optional().nullable(),
    categoryName: z.string().trim().min(1).max(180).optional().nullable(),
    brandName: z.string().trim().min(1).max(180).optional().nullable(),
    images: z.array(z.string().trim().url()).max(20).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  })
  .strict();

export const updateProductBodySchema = createProductBodySchema
  .partial()
  .strict();

export const categoryIdParamsSchema = z
  .object({
    categoryId: z.string().uuid(),
  })
  .strict();

export const brandIdParamsSchema = z
  .object({
    brandId: z.string().uuid(),
  })
  .strict();

export const createCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    slug: z.string().trim().min(1).max(180).optional(),
    description: z.string().trim().max(1200).optional().nullable(),
  })
  .strict();

export const updateCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    slug: z.string().trim().min(1).max(180).optional(),
    description: z.string().trim().max(1200).optional().nullable(),
  })
  .strict();

export const createBrandBodySchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    slug: z.string().trim().min(1).max(180).optional(),
  })
  .strict();

export const updateBrandBodySchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    slug: z.string().trim().min(1).max(180).optional(),
  })
  .strict();

export const orderIdParamsSchema = z
  .object({
    orderId: z.string().uuid(),
  })
  .strict();

export const ordersQuerySchema = paginationQuerySchema
  .extend({
    status: z
      .enum([
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ])
      .optional(),
    customerId: z.string().uuid().optional(),
  })
  .strict();

export const updateOrderStatusBodySchema = z
  .object({
    status: ordersQuerySchema.shape.status.unwrap(),
  })
  .strict();

export const paymentReferenceParamsSchema = z
  .object({
    reference: z.string().trim().min(6).max(160),
  })
  .strict();

export const paymentsQuerySchema = paginationQuerySchema
  .extend({
    status: z.enum(["pending", "success", "failed", "abandoned"]).optional(),
    customerId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
  })
  .strict();

export const updatePaymentStatusBodySchema = z
  .object({
    status: z.enum(["pending", "success", "failed", "abandoned"]),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const couponIdParamsSchema = z
  .object({
    couponId: z.string().uuid(),
  })
  .strict();

export const createCouponBodySchema = z
  .object({
    code: z.string().trim().min(2).max(80),
    discountPercent: z.number().min(0).max(100),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .strict();

export const updateCouponBodySchema = z
  .object({
    code: z.string().trim().min(2).max(80).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .strict();
