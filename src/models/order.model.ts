import { dbQuery } from "../config/db.js";
import {
  getCartItems,
  getCouponDiscountPercent,
  computeCartSummary,
  clearCart,
} from "./cart.model";

function generateOrderNumber() {
  return `QART-${Date.now()}`;
}

export async function createOrderFromCart(
  customerId: string,
  input: CreateOrderInput,
): Promise<OrderEntity> {
  const cartItems = await getCartItems(customerId);
  if (!cartItems.length) {
    throw new Error("Cart is empty");
  }

  const discountPercent = await getCouponDiscountPercent(input.couponCode);
  const summary = computeCartSummary(cartItems, discountPercent);
  const orderNumber = generateOrderNumber();

  const orderResult = await dbQuery<OrderEntity>(
    `
      INSERT INTO orders(
        customer_id, order_number, status, subtotal, delivery_fee, service_fee,
        discount, total, coupon_code, shipping_full_name, shipping_email,
        shipping_phone, shipping_location, shipping_address, notes
      )
      VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
    [
      customerId,
      orderNumber,
      summary.subtotal,
      summary.deliveryFee,
      summary.serviceFee,
      summary.discount,
      summary.total,
      input.couponCode?.trim() || null,
      input.shippingFullName,
      input.shippingEmail,
      input.shippingPhone ?? null,
      input.shippingLocation,
      input.shippingAddress ?? null,
      input.notes ?? null,
    ],
  );

  const order = orderResult.rows[0];

  await Promise.all(
    cartItems.map((item) =>
      dbQuery(
        `
          INSERT INTO order_items(order_id, product_id, product_name, sku, color, size, quantity, unit_price, line_total)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
        `,
        [
          order.id,
          item.productId,
          item.productName,
          null,
          item.color,
          item.size,
          item.quantity,
          item.price,
          item.lineTotal,
        ],
      ),
    ),
  );

  await clearCart(customerId);

  return order;
}

export async function listOrdersByCustomer(
  customerId: string,
): Promise<OrderEntity[]> {
  const result = await dbQuery<OrderEntity>(
    `
      SELECT
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
        updated_at AS "updatedAt"
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC;
    `,
    [customerId],
  );

  return result.rows;
}

export async function getOrderById(
  customerId: string,
  orderId: string,
): Promise<OrderEntity | null> {
  const result = await dbQuery<OrderEntity>(
    `
      SELECT
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
        updated_at AS "updatedAt"
      FROM orders
      WHERE customer_id = $1 AND id = $2
      LIMIT 1;
    `,
    [customerId, orderId],
  );

  return result.rows[0] ?? null;
}

export async function listOrderItems(
  orderId: string,
): Promise<OrderItemEntity[]> {
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
