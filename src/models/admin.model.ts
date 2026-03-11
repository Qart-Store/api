import { dbQuery } from "../config/db";
import slugify from "../utils/slugify";

function toPagination(page?: number, limit?: number) {
  const safePage = Math.max(1, Number(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Number(limit ?? 20)));
  const offset = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, offset };
}

export async function getAdminDashboardSummary() {
  const [customers, products, orders, payments, revenue, pendingOrders] =
    await Promise.all([
      dbQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM customers;`,
      ),
      dbQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM products;`,
      ),
      dbQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM orders;`),
      dbQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM payment_transactions;`,
      ),
      dbQuery<{ revenue: string }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS revenue FROM payment_transactions WHERE status = 'success';`,
      ),
      dbQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM orders WHERE status IN ('pending', 'paid', 'processing');`,
      ),
    ]);

  return {
    customers: Number(customers.rows[0]?.count ?? 0),
    products: Number(products.rows[0]?.count ?? 0),
    orders: Number(orders.rows[0]?.count ?? 0),
    payments: Number(payments.rows[0]?.count ?? 0),
    successfulRevenue: Number(revenue.rows[0]?.revenue ?? 0),
    pendingOrders: Number(pendingOrders.rows[0]?.count ?? 0),
  };
}

type AdminCustomerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export async function listCustomersAdmin(filters: AdminCustomerFilters) {
  const { page, limit, offset } = toPagination(filters.page, filters.limit);
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    where.push(
      `(c.first_name ILIKE $${values.length} OR c.last_name ILIKE $${values.length} OR c.email ILIKE $${values.length} OR COALESCE(c.phone,'') ILIKE $${values.length})`,
    );
  }

  if (typeof filters.isActive === "boolean") {
    values.push(filters.isActive);
    where.push(`c.is_active = $${values.length}`);
  }

  if (typeof filters.isEmailVerified === "boolean") {
    values.push(filters.isEmailVerified);
    where.push(`c.is_email_verified = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await dbQuery<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM customers c ${whereSql};`,
    values,
  );

  values.push(limit, offset);

  const result = await dbQuery<
    CustomerEntity & { orderCount: number; totalSpend: number }
  >(
    `
      SELECT
        c.id,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.email,
        c.phone,
        c.is_active AS "isActive",
        c.is_email_verified AS "isEmailVerified",
        c.last_login_at AS "lastLoginAt",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COUNT(DISTINCT o.id)::int AS "orderCount",
        COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0)::float8 AS "totalSpend"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      LEFT JOIN payment_transactions p ON p.customer_id = c.id
      ${whereSql}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length};
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getCustomerAdmin(customerId: string) {
  const result = await dbQuery<CustomerEntity>(
    `
      SELECT
        c.id,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.email,
        c.phone,
        c.is_active AS "isActive",
        c.is_email_verified AS "isEmailVerified",
        c.last_login_at AS "lastLoginAt",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM customers c
      WHERE c.id = $1
      LIMIT 1;
    `,
    [customerId],
  );

  return result.rows[0] ?? null;
}

export async function deleteCustomerAdmin(customerId: string) {
  const result = await dbQuery(`DELETE FROM customers WHERE id = $1;`, [
    customerId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listCustomerCartAdmin(customerId: string) {
  const result = await dbQuery<CartProductItem>(
    `
      SELECT
        ci.customer_id AS "customerId",
        ci.product_id AS "productId",
        ci.quantity,
        ci.color,
        ci.size,
        p.name AS "productName",
        p.image_url AS "imageUrl",
        p.price::float8 AS price,
        p.stock,
        p.status,
        (p.price * ci.quantity)::float8 AS "lineTotal"
      FROM customer_cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.customer_id = $1
      ORDER BY ci.created_at DESC;
    `,
    [customerId],
  );

  return result.rows;
}

export async function clearCustomerCartAdmin(customerId: string) {
  await dbQuery(`DELETE FROM customer_cart_items WHERE customer_id = $1;`, [
    customerId,
  ]);
}

export async function listCustomerWishlistAdmin(customerId: string) {
  const result = await dbQuery<WishlistProductEntity>(
    `
      SELECT
        w.product_id AS "productId",
        p.name,
        p.image_url AS "imageUrl",
        p.price::float8 AS price,
        p.status,
        w.created_at AS "createdAt"
      FROM customer_wishlist_items w
      JOIN products p ON p.id = w.product_id
      WHERE w.customer_id = $1
      ORDER BY w.created_at DESC;
    `,
    [customerId],
  );

  return result.rows;
}

export async function clearCustomerWishlistAdmin(customerId: string) {
  await dbQuery(`DELETE FROM customer_wishlist_items WHERE customer_id = $1;`, [
    customerId,
  ]);
}

type AdminOrderFilters = {
  page?: number;
  limit?: number;
  status?: OrderEntity["status"];
  customerId?: string;
};

export async function listOrdersAdmin(filters: AdminOrderFilters) {
  const { page, limit, offset } = toPagination(filters.page, filters.limit);
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    where.push(`o.status = $${values.length}`);
  }

  if (filters.customerId) {
    values.push(filters.customerId);
    where.push(`o.customer_id = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await dbQuery<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM orders o ${whereSql};`,
    values,
  );

  values.push(limit, offset);

  const result = await dbQuery<OrderEntity>(
    `
      SELECT
        o.id,
        o.customer_id AS "customerId",
        o.order_number AS "orderNumber",
        o.status,
        o.subtotal::float8 AS subtotal,
        o.delivery_fee::float8 AS "deliveryFee",
        o.service_fee::float8 AS "serviceFee",
        o.discount::float8 AS discount,
        o.total::float8 AS total,
        o.coupon_code AS "couponCode",
        o.shipping_full_name AS "shippingFullName",
        o.shipping_email AS "shippingEmail",
        o.shipping_phone AS "shippingPhone",
        o.shipping_location AS "shippingLocation",
        o.shipping_address AS "shippingAddress",
        o.notes,
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt"
      FROM orders o
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length};
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getOrderAdmin(orderId: string) {
  const result = await dbQuery<OrderEntity>(
    `
      SELECT
        o.id,
        o.customer_id AS "customerId",
        o.order_number AS "orderNumber",
        o.status,
        o.subtotal::float8 AS subtotal,
        o.delivery_fee::float8 AS "deliveryFee",
        o.service_fee::float8 AS "serviceFee",
        o.discount::float8 AS discount,
        o.total::float8 AS total,
        o.coupon_code AS "couponCode",
        o.shipping_full_name AS "shippingFullName",
        o.shipping_email AS "shippingEmail",
        o.shipping_phone AS "shippingPhone",
        o.shipping_location AS "shippingLocation",
        o.shipping_address AS "shippingAddress",
        o.notes,
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt"
      FROM orders o
      WHERE o.id = $1
      LIMIT 1;
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}

export async function listOrderItemsAdmin(orderId: string) {
  const result = await dbQuery<OrderItemEntity>(
    `
      SELECT
        id,
        order_id AS "orderId",
        product_id AS "productId",
        product_name AS "productName",
        sku,
        color,
        size,
        quantity,
        unit_price::float8 AS "unitPrice",
        line_total::float8 AS "lineTotal",
        created_at AS "createdAt"
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC;
    `,
    [orderId],
  );

  return result.rows;
}

export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderEntity["status"],
) {
  const result = await dbQuery<OrderEntity>(
    `
      UPDATE orders
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        customer_id AS "customerId",
        order_number AS "orderNumber",
        status,
        subtotal::float8 AS subtotal,
        delivery_fee::float8 AS "deliveryFee",
        service_fee::float8 AS "serviceFee",
        discount::float8 AS discount,
        total::float8 AS total,
        coupon_code AS "couponCode",
        shipping_full_name AS "shippingFullName",
        shipping_email AS "shippingEmail",
        shipping_phone AS "shippingPhone",
        shipping_location AS "shippingLocation",
        shipping_address AS "shippingAddress",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [orderId, status],
  );

  return result.rows[0] ?? null;
}

export async function deleteOrderAdmin(orderId: string) {
  const result = await dbQuery(`DELETE FROM orders WHERE id = $1;`, [orderId]);
  return (result.rowCount ?? 0) > 0;
}

type AdminPaymentFilters = {
  page?: number;
  limit?: number;
  status?: PaymentTransactionEntity["status"];
  customerId?: string;
  orderId?: string;
};

export async function listPaymentsAdmin(filters: AdminPaymentFilters) {
  const { page, limit, offset } = toPagination(filters.page, filters.limit);
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    where.push(`p.status = $${values.length}`);
  }

  if (filters.customerId) {
    values.push(filters.customerId);
    where.push(`p.customer_id = $${values.length}`);
  }

  if (filters.orderId) {
    values.push(filters.orderId);
    where.push(`p.order_id = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await dbQuery<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM payment_transactions p ${whereSql};`,
    values,
  );

  values.push(limit, offset);

  const result = await dbQuery<PaymentTransactionEntity>(
    `
      SELECT
        p.id,
        p.customer_id AS "customerId",
        p.order_id AS "orderId",
        p.reference,
        p.provider,
        p.status,
        p.amount::float8 AS amount,
        p.currency,
        p.payload,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt"
      FROM payment_transactions p
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length};
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getPaymentByReferenceAdmin(reference: string) {
  const result = await dbQuery<PaymentTransactionEntity>(
    `
      SELECT
        p.id,
        p.customer_id AS "customerId",
        p.order_id AS "orderId",
        p.reference,
        p.provider,
        p.status,
        p.amount::float8 AS amount,
        p.currency,
        p.payload,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt"
      FROM payment_transactions p
      WHERE p.reference = $1
      LIMIT 1;
    `,
    [reference],
  );

  return result.rows[0] ?? null;
}

export async function updatePaymentStatusAdmin(
  reference: string,
  status: PaymentTransactionEntity["status"],
  payload?: Record<string, unknown>,
) {
  const result = await dbQuery<PaymentTransactionEntity>(
    `
      UPDATE payment_transactions
      SET status = $2, payload = COALESCE($3, payload)
      WHERE reference = $1
      RETURNING
        id,
        customer_id AS "customerId",
        order_id AS "orderId",
        reference,
        provider,
        status,
        amount::float8 AS amount,
        currency,
        payload,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [reference, status, payload ?? null],
  );

  return result.rows[0] ?? null;
}

export async function deletePaymentByReferenceAdmin(reference: string) {
  const result = await dbQuery(
    `DELETE FROM payment_transactions WHERE reference = $1;`,
    [reference],
  );
  return (result.rowCount ?? 0) > 0;
}

interface CouponEntity {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCouponsAdmin() {
  const result = await dbQuery<CouponEntity>(
    `
      SELECT
        id,
        code,
        discount_percent::float8 AS "discountPercent",
        is_active AS "isActive",
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM coupons
      ORDER BY created_at DESC;
    `,
  );

  return result.rows;
}

export async function getCouponAdmin(couponId: string) {
  const result = await dbQuery<CouponEntity>(
    `
      SELECT
        id,
        code,
        discount_percent::float8 AS "discountPercent",
        is_active AS "isActive",
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM coupons
      WHERE id = $1
      LIMIT 1;
    `,
    [couponId],
  );

  return result.rows[0] ?? null;
}

export async function createCouponAdmin(input: {
  code: string;
  discountPercent: number;
  isActive?: boolean;
  expiresAt?: string | null;
}) {
  const result = await dbQuery<CouponEntity>(
    `
      INSERT INTO coupons(code, discount_percent, is_active, expires_at)
      VALUES(UPPER($1), $2, $3, $4)
      RETURNING
        id,
        code,
        discount_percent::float8 AS "discountPercent",
        is_active AS "isActive",
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      input.code.trim(),
      input.discountPercent,
      input.isActive ?? true,
      input.expiresAt ?? null,
    ],
  );

  return result.rows[0];
}

export async function updateCouponAdmin(
  couponId: string,
  input: {
    code?: string;
    discountPercent?: number;
    isActive?: boolean;
    expiresAt?: string | null;
  },
) {
  const existing = await getCouponAdmin(couponId);
  if (!existing) return null;

  const result = await dbQuery<CouponEntity>(
    `
      UPDATE coupons
      SET
        code = UPPER($2),
        discount_percent = $3,
        is_active = $4,
        expires_at = $5
      WHERE id = $1
      RETURNING
        id,
        code,
        discount_percent::float8 AS "discountPercent",
        is_active AS "isActive",
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      couponId,
      input.code?.trim() ?? existing.code,
      input.discountPercent ?? existing.discountPercent,
      input.isActive ?? existing.isActive,
      input.expiresAt !== undefined ? input.expiresAt : existing.expiresAt,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteCouponAdmin(couponId: string) {
  const result = await dbQuery(`DELETE FROM coupons WHERE id = $1;`, [
    couponId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listCategoriesAdmin() {
  const result = await dbQuery<CategoryEntity>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COUNT(p.id)::int AS "productCount"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `,
  );

  return result.rows;
}

export async function getCategoryAdmin(categoryId: string) {
  const result = await dbQuery<CategoryEntity>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM categories c
      WHERE c.id = $1
      LIMIT 1;
    `,
    [categoryId],
  );

  return result.rows[0] ?? null;
}

export async function createCategoryAdmin(input: {
  name: string;
  slug?: string;
  description?: string | null;
}) {
  const finalSlug = input.slug?.trim() || slugify(input.name);

  const result = await dbQuery<CategoryEntity>(
    `
      INSERT INTO categories(name, slug, description)
      VALUES($1, $2, $3)
      RETURNING
        id,
        name,
        slug,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [input.name.trim(), finalSlug, input.description ?? null],
  );

  return result.rows[0];
}

export async function updateCategoryAdmin(
  categoryId: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
  },
) {
  const existing = await getCategoryAdmin(categoryId);
  if (!existing) return null;

  const name = input.name?.trim() || existing.name;
  const slug =
    input.slug?.trim() || (input.name ? slugify(name) : existing.slug);

  const result = await dbQuery<CategoryEntity>(
    `
      UPDATE categories
      SET name = $2, slug = $3, description = $4
      WHERE id = $1
      RETURNING
        id,
        name,
        slug,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      categoryId,
      name,
      slug,
      input.description !== undefined
        ? input.description
        : existing.description,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteCategoryAdmin(categoryId: string) {
  const result = await dbQuery(`DELETE FROM categories WHERE id = $1;`, [
    categoryId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listBrandsAdmin() {
  const result = await dbQuery<BrandEntity>(
    `
      SELECT
        b.id,
        b.name,
        b.slug,
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt",
        COUNT(p.id)::int AS "productCount"
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC;
    `,
  );

  return result.rows;
}

export async function getBrandAdmin(brandId: string) {
  const result = await dbQuery<BrandEntity>(
    `
      SELECT
        b.id,
        b.name,
        b.slug,
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt"
      FROM brands b
      WHERE b.id = $1
      LIMIT 1;
    `,
    [brandId],
  );

  return result.rows[0] ?? null;
}

export async function createBrandAdmin(input: { name: string; slug?: string }) {
  const finalSlug = input.slug?.trim() || slugify(input.name);

  const result = await dbQuery<BrandEntity>(
    `
      INSERT INTO brands(name, slug)
      VALUES($1, $2)
      RETURNING
        id,
        name,
        slug,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [input.name.trim(), finalSlug],
  );

  return result.rows[0];
}

export async function updateBrandAdmin(
  brandId: string,
  input: { name?: string; slug?: string },
) {
  const existing = await getBrandAdmin(brandId);
  if (!existing) return null;

  const name = input.name?.trim() || existing.name;
  const slug =
    input.slug?.trim() || (input.name ? slugify(name) : existing.slug);

  const result = await dbQuery<BrandEntity>(
    `
      UPDATE brands
      SET name = $2, slug = $3
      WHERE id = $1
      RETURNING
        id,
        name,
        slug,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [brandId, name, slug],
  );

  return result.rows[0] ?? null;
}

export async function deleteBrandAdmin(brandId: string) {
  const result = await dbQuery(`DELETE FROM brands WHERE id = $1;`, [brandId]);
  return (result.rowCount ?? 0) > 0;
}
