import { dbQuery } from "../config/db.js";

export async function addWishlistItem(customerId: string, productId: string) {
  await dbQuery(
    `
      INSERT INTO customer_wishlist_items(customer_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (customer_id, product_id) DO NOTHING;
    `,
    [customerId, productId],
  );
}

export async function removeWishlistItem(
  customerId: string,
  productId: string,
) {
  const result = await dbQuery(
    `DELETE FROM customer_wishlist_items WHERE customer_id = $1 AND product_id = $2;`,
    [customerId, productId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getWishlistItems(
  customerId: string,
): Promise<WishlistProductEntity[]> {
  const result = await dbQuery<WishlistProductEntity>(
    `
      SELECT
        w.product_id AS "productId",
        p.name,
        COALESCE(
          (
            SELECT pi.url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.position ASC, pi.id ASC
            LIMIT 1
          ),
          p.banner_url
        ) AS "imageUrl",
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
