import { dbQuery } from "../config/db";

export async function upsertCartItem(
  customerId: string,
  productId: string,
  quantity: number,
  color?: string | null,
  size?: string | null,
) {
  await dbQuery(
    `
      INSERT INTO customer_cart_items(customer_id, product_id, quantity, color, size)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (customer_id, product_id)
      DO UPDATE SET quantity = EXCLUDED.quantity, color = EXCLUDED.color, size = EXCLUDED.size;
    `,
    [customerId, productId, quantity, color ?? null, size ?? null],
  );
}

export async function removeCartItem(customerId: string, productId: string) {
  const result = await dbQuery(
    `DELETE FROM customer_cart_items WHERE customer_id = $1 AND product_id = $2;`,
    [customerId, productId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function clearCart(customerId: string) {
  await dbQuery(`DELETE FROM customer_cart_items WHERE customer_id = $1;`, [
    customerId,
  ]);
}

export async function getCartItems(
  customerId: string,
): Promise<CartProductItem[]> {
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

export async function getCouponDiscountPercent(
  couponCode?: string | null,
): Promise<number> {
  if (!couponCode?.trim()) return 0;

  const result = await dbQuery<{ discountPercent: number }>(
    `
      SELECT discount_percent::float8 AS "discountPercent"
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1;
    `,
    [couponCode.trim()],
  );

  return result.rows[0]?.discountPercent ?? 0;
}

export function computeCartSummary(
  items: CartProductItem[],
  discountPercent = 0,
): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = subtotal > 250000 ? 0 : items.length ? 12500 : 0;
  const serviceFee = items.length ? 1500 : 0;
  const discount = subtotal * (discountPercent / 100);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  return {
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    total,
    couponCode: null,
  };
}
