DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON payment_transactions;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;

DROP TRIGGER IF EXISTS trg_customer_cart_items_updated_at ON customer_cart_items;

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;

DROP TABLE IF EXISTS payment_transactions;

DROP TABLE IF EXISTS order_items;

DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS customer_wishlist_items;

DROP TABLE IF EXISTS customer_cart_items;

DROP TABLE IF EXISTS coupons;